import { Response } from "express";
import Class from "../models/Class";
import ResultPublication, { ResultStatus } from "../models/ResultPublication";
import Student from "../models/Student";
import Subject from "../models/Subject";
import Score from "../models/Score";
import ReportCardRemark from "../models/ReportCardRemark";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

const canManageClass = async (req: AuthRequest, classId: string) => {
  if (req.user?.role === "super_admin") return true;

  const [user, classDoc] = await Promise.all([
    User.findById(req.user?.id),
    Class.findById(classId),
  ]);
  if (!user || !classDoc) return false;

  return (
    req.user?.role === "branch_admin" &&
    !!user.branch &&
    user.branch.toString() === classDoc.branch.toString()
  );
};

// GET /api/result-publications?class=<classId>&term=<termId>
export const getResultPublication = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, term } = req.query;
    if (!term) {
      return res.status(400).json({ message: "term is required" });
    }

    if (classId) {
      const publication = await ResultPublication.findOne({
        class: classId as any,
        term: term as any,
      })
        .populate("publishedBy", "name email")
        .populate("lockedBy", "name email");

      return res
        .status(200)
        .json(publication || { class: classId, term, status: "draft" });
    }

    // Return list for all accessible classes
    let classFilter: any = {};
    if (req.user?.role === "branch_admin") {
      const user = await User.findById(req.user.id);
      if (user?.branch) {
        const branchClasses = await Class.find({ branch: user.branch }).select("_id");
        classFilter = { _id: { $in: branchClasses.map((c) => c._id) } };
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User.findById(req.user.id);
      classFilter = { _id: { $in: teacher?.classes || [] } };
    }

    const classes = await Class.find(classFilter).select("_id name arm branch");
    const classIds = classes.map((c) => c._id);

    const publications = await ResultPublication.find({
      class: { $in: classIds },
      term: term as any,
    })
      .populate("publishedBy", "name email")
      .populate("lockedBy", "name email");

    const pubMap = new Map<string, any>();
    publications.forEach((p) => pubMap.set(p.class.toString(), p));

    const result = classes.map((c) => {
      const pub = pubMap.get(c._id.toString());
      return (
        pub || {
          class: c._id,
          term,
          status: "draft" as ResultStatus,
        }
      );
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/result-publications/overview?term=<termId>&branch=<branchId>
export const getResultOverview = async (req: AuthRequest, res: Response) => {
  try {
    const { term, branch } = req.query;
    if (!term) {
      return res.status(400).json({ message: "term is required" });
    }

    let classFilter: any = {};
    if (req.user?.role === "branch_admin") {
      const user = await User.findById(req.user.id);
      if (user?.branch) {
        classFilter.branch = user.branch;
      }
    } else if (branch) {
      classFilter.branch = branch;
    }

    const classes = await Class.find(classFilter)
      .populate("branch", "name code")
      .sort({ name: 1, arm: 1 });

    const classIds = classes.map((c) => c._id);

    // Fetch publications, students, subjects, scores, remarks in parallel
    const [publications, allStudents, allSubjects, allScores, allRemarks] =
      await Promise.all([
        ResultPublication.find({ class: { $in: classIds }, term: term as any })
          .populate("publishedBy", "name email")
          .populate("lockedBy", "name email"),
        Student.find({ class: { $in: classIds } }).select("_id name numberInClass class"),
        Subject.find({ class: { $in: classIds } }).select("_id nameEnglish class"),
        Score.find({ term: term as any }).select("student subject ca exam total"),
        ReportCardRemark.find({ term: term as any }).select(
          "student classTeacherCommentEn classTeacherCommentId principalCommentEn principalCommentId"
        ),
      ]);

    const pubMap = new Map<string, any>();
    publications.forEach((p) => pubMap.set(p.class.toString(), p));

    const scoresByStudent = new Set<string>();
    allScores.forEach((sc) => {
      scoresByStudent.add(`${sc.student.toString()}-${sc.subject.toString()}`);
    });

    const remarksByStudent = new Map<string, any>();
    allRemarks.forEach((rm) => {
      remarksByStudent.set(rm.student.toString(), rm);
    });

    const classOverviews = classes.map((cls) => {
      const cid = cls._id.toString();
      const studentsInClass = allStudents.filter((s) => s.class.toString() === cid);
      const subjectsInClass = allSubjects.filter((s) => s.class.toString() === cid);
      const pub = pubMap.get(cid);

      const totalStudents = studentsInClass.length;
      const totalSubjects = subjectsInClass.length;
      const expectedScores = totalStudents * totalSubjects;

      let enteredScores = 0;
      let studentsWithMissingScores = 0;
      let classTeacherRemarksCount = 0;
      let principalRemarksCount = 0;

      studentsInClass.forEach((st) => {
        const sid = st._id.toString();
        let studentScoresCount = 0;
        subjectsInClass.forEach((sb) => {
          if (scoresByStudent.has(`${sid}-${sb._id.toString()}`)) {
            studentScoresCount++;
          }
        });
        enteredScores += studentScoresCount;
        if (studentScoresCount < totalSubjects) {
          studentsWithMissingScores++;
        }

        const rm = remarksByStudent.get(sid);
        if (rm) {
          if (rm.classTeacherCommentEn || rm.classTeacherCommentId) {
            classTeacherRemarksCount++;
          }
          if (rm.principalCommentEn || rm.principalCommentId) {
            principalRemarksCount++;
          }
        }
      });

      const scoreCompletionRate =
        expectedScores > 0 ? Math.round((enteredScores / expectedScores) * 100) : 100;
      const isReadyToPublish =
        totalStudents > 0 &&
        totalSubjects > 0 &&
        enteredScores >= expectedScores &&
        classTeacherRemarksCount >= totalStudents;

      const missingScoresCount = Math.max(0, expectedScores - enteredScores);
      const remarksPercent =
        totalStudents > 0 ? Math.round((classTeacherRemarksCount / totalStudents) * 100) : 100;
      const missingTeacherRemarksCount = Math.max(0, totalStudents - classTeacherRemarksCount);
      const missingPrincipalRemarksCount = Math.max(0, totalStudents - principalRemarksCount);

      return {
        classId: cls._id,
        className: cls.name,
        arm: cls.arm,
        branch: cls.branch,
        branchName: (cls.branch as any)?.name || "",
        totalStudents,
        studentCount: totalStudents,
        totalSubjects,
        subjectCount: totalSubjects,
        expectedScores,
        enteredScores,
        scoreCompletionRate,
        scoresPercent: scoreCompletionRate,
        missingScoresCount,
        studentsWithMissingScores,
        classTeacherRemarksCount,
        principalRemarksCount,
        remarksPercent,
        missingTeacherRemarksCount,
        missingPrincipalRemarksCount,
        isReadyToPublish,
        isFullyReady: isReadyToPublish,
        status: (pub?.status || "draft") as ResultStatus,
        publishedBy: pub?.publishedBy || null,
        publishedAt: pub?.publishedAt || null,
        lockedBy: pub?.lockedBy || null,
        lockedAt: pub?.lockedAt || null,
      };
    });

    const totalClasses = classOverviews.length;
    const publishedCount = classOverviews.filter((c) => c.status === "published").length;
    const lockedCount = classOverviews.filter((c) => c.status === "locked").length;
    const draftCount = classOverviews.filter((c) => c.status === "draft").length;
    const readyCount = classOverviews.filter(
      (c) => c.status === "draft" && c.isReadyToPublish
    ).length;

    const totalStudents = classOverviews.reduce((sum, c) => sum + c.totalStudents, 0);
    const totalExpectedScores = classOverviews.reduce((sum, c) => sum + c.expectedScores, 0);
    const totalEnteredScores = classOverviews.reduce((sum, c) => sum + c.enteredScores, 0);
    const overallScoreRate =
      totalExpectedScores > 0
        ? Math.round((totalEnteredScores / totalExpectedScores) * 100)
        : 100;

    res.status(200).json({
      summary: {
        totalClasses,
        publishedCount,
        lockedCount,
        draftCount,
        readyCount,
        totalStudents,
        overallScoreRate,
      },
      classes: classOverviews,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/result-publications/audit?class=<classId>&term=<termId>
export const getClassAuditDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, term } = req.query;
    if (!classId || !term) {
      return res.status(400).json({ message: "class and term are required" });
    }

    const [classDoc, students, subjects, scores, remarks, publication] =
      await Promise.all([
        Class.findById(classId).populate("branch", "name code"),
        Student.find({ class: classId as any }).sort({ numberInClass: 1, name: 1 }),
        Subject.find({ class: classId as any }).sort({ nameEnglish: 1 }),
        Score.find({ term: term as any }),
        ReportCardRemark.find({ term: term as any }),
        ResultPublication.findOne({ class: classId as any, term: term as any })
          .populate("publishedBy", "name email")
          .populate("lockedBy", "name email"),
      ]);

    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }

    const scoreMap = new Map<string, boolean>();
    scores.forEach((sc) => {
      scoreMap.set(`${sc.student.toString()}-${sc.subject.toString()}`, true);
    });

    const remarkMap = new Map<string, any>();
    remarks.forEach((rm) => {
      remarkMap.set(rm.student.toString(), rm);
    });

    const studentAudits = students.map((st) => {
      const sid = st._id.toString();
      const missingSubjects = subjects.filter(
        (sb) => !scoreMap.has(`${sid}-${sb._id.toString()}`)
      );
      const remark = remarkMap.get(sid);
      const hasClassTeacherRemark = !!(
        remark?.classTeacherCommentEn || remark?.classTeacherCommentId
      );
      const hasPrincipalRemark = !!(
        remark?.principalCommentEn || remark?.principalCommentId
      );

      return {
        studentId: st._id,
        name: st.name,
        numberInClass: st.numberInClass,
        missingSubjects: missingSubjects.map((s) => ({
          _id: s._id,
          nameEnglish: s.nameEnglish,
        })),
        missingScoreCount: missingSubjects.length,
        isComplete: missingSubjects.length === 0,
        hasClassTeacherRemark,
        hasPrincipalRemark,
      };
    });

    res.status(200).json({
      class: {
        _id: classDoc._id,
        name: classDoc.name,
        arm: classDoc.arm,
        branch: classDoc.branch,
      },
      publication: publication || { class: classId, term, status: "draft" },
      totalStudents: students.length,
      totalSubjects: subjects.length,
      students: studentAudits,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PUT /api/result-publications
// body: { class, term, status: "published" | "locked" | "draft" }
export const setResultPublication = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, term, status } = req.body as {
      class?: string;
      term?: string;
      status?: ResultStatus;
    };
    if (!classId || !term || !["draft", "published", "locked"].includes(status || "")) {
      return res.status(400).json({ message: "class, term, and a valid status are required" });
    }
    if (!(await canManageClass(req, classId))) {
      return res.status(403).json({ message: "You cannot manage results for this class" });
    }

    const now = new Date();
    const update: Record<string, unknown> = { status };
    if (status === "published") {
      update.publishedBy = req.user!.id;
      update.publishedAt = now;
      update.lockedBy = null;
      update.lockedAt = null;
    } else if (status === "locked") {
      update.lockedBy = req.user!.id;
      update.lockedAt = now;
    } else {
      update.publishedBy = null;
      update.publishedAt = null;
      update.lockedBy = null;
      update.lockedAt = null;
    }

    const publication = await ResultPublication.findOneAndUpdate(
      { class: classId as any, term: term as any },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
      .populate("publishedBy", "name email")
      .populate("lockedBy", "name email");

    res.status(200).json(publication);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/result-publications/batch
// body: { classIds: string[], term: string, status: "draft" | "published" | "locked" }
export const batchSetResultPublication = async (req: AuthRequest, res: Response) => {
  try {
    const { classIds, term, status } = req.body as {
      classIds?: string[];
      term?: string;
      status?: ResultStatus;
    };

    if (!Array.isArray(classIds) || classIds.length === 0 || !term || !["draft", "published", "locked"].includes(status || "")) {
      return res.status(400).json({ message: "classIds (array), term, and valid status are required" });
    }

    // Filter to classes the user can manage
    const allowedClassIds: string[] = [];
    for (const cid of classIds) {
      if (await canManageClass(req, cid)) {
        allowedClassIds.push(cid);
      }
    }

    if (allowedClassIds.length === 0) {
      return res.status(403).json({ message: "You are not authorized to manage any of the specified classes" });
    }

    const now = new Date();
    const update: Record<string, unknown> = { status };
    if (status === "published") {
      update.publishedBy = req.user!.id;
      update.publishedAt = now;
      update.lockedBy = null;
      update.lockedAt = null;
    } else if (status === "locked") {
      update.lockedBy = req.user!.id;
      update.lockedAt = now;
    } else {
      update.publishedBy = null;
      update.publishedAt = null;
      update.lockedBy = null;
      update.lockedAt = null;
    }

    const operations = allowedClassIds.map((cid) => ({
      updateOne: {
        filter: { class: cid, term },
        update: { $set: update },
        upsert: true,
      },
    }));

    await ResultPublication.bulkWrite(operations);

    const updatedPublications = await ResultPublication.find({
      class: { $in: allowedClassIds },
      term: term as any,
    })
      .populate("publishedBy", "name email")
      .populate("lockedBy", "name email");

    res.status(200).json({
      message: `Updated status to '${status}' for ${allowedClassIds.length} classes`,
      publications: updatedPublications,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const isStudentResultPublished = async (studentId: string, termId: string) => {
  const student = await Student.findById(studentId).select("class");
  if (!student) return false;
  const publication = await ResultPublication.findOne({ class: student.class as any, term: termId as any });
  return publication?.status === "published" || publication?.status === "locked";
};

export const isClassResultLocked = async (classId: string, termId: string) => {
  const publication = await ResultPublication.findOne({ class: classId as any, term: termId as any });
  return publication?.status === "locked";
};

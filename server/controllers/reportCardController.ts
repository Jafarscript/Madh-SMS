import { Response } from "express";
import mongoose from "mongoose";
import Student from "../models/Student";
import ClassModel from "../models/Class";
import Subject from "../models/Subject";
import Score from "../models/Score";
import Term from "../models/Term";
import GradingScale from "../models/GradingScale";
import { AuthRequest } from "../middleware/auth";
import { getClassCumulativePositions } from "./broadsheetController";
import { foldCascade } from "../utils/cascadeAverage";
import ReportCardRemark from "../models/ReportCardRemark";
import Attendance from "../models/Attendance";
import AttendanceSetting from "../models/AttendanceSetting";
import ReportCardSetting from "../models/ReportCardSetting";
import User from "../models/User";
import { isElementaryClass, ensureElementarySubjectsForClass } from "./classController";
import { ELEMENTARY_FIXED_SUBJECTS } from "../constants/elementarySubjects";

// Returns the full report card data object, or null if the student/term
// can't be found. No `req`/`res` here on purpose — this is a plain function
// so both getReportCard (JSON) and the PDF controllers can reuse it.
export const buildReportCardData = async (
  studentId: string,
  termId: string,
  scaleId?: string,
) => {
  if (!studentId || !termId) {
    return null;
  }

  const student = await Student.findById(studentId).populate("class");
  if (!student) return null;

  const currentTerm = await Term.findById(termId);
  if (!currentTerm) return null;

  // every term in the same session up to and including the current one,
  // in chronological order — this order matters now, since the cascade
  // must fold term 1 → term 2 → term 3, not just average them all at once
  const priorTerms = await Term.find({
    session: currentTerm.session,
    termNumber: { $lte: currentTerm.termNumber },
  }).sort({ termNumber: 1 });

  const priorTermIds = priorTerms.map((t) => t._id);

  let classDoc = student.class as any;
  if (!classDoc || !classDoc.name) {
    const rawClassId = classDoc?._id || classDoc || (student as any).class;
    if (rawClassId) {
      try {
        classDoc = await ClassModel.findById(rawClassId);
      } catch {
        // ignore
      }
    }
  }

  const classId = classDoc?._id || (student as any).class;
  const className = classDoc?.name || "";
  const rawCategory = classDoc?.category;
  const isElementary =
    rawCategory === "elementary" ||
    isElementaryClass(className, rawCategory);
  const classCategory: "secondary" | "elementary" = isElementary ? "elementary" : "secondary";

  if (isElementary && classId) {
    await ensureElementarySubjectsForClass(classId.toString());
  }

  const subjects = await Subject.find({
    class: classId,
  }).sort({
    order: 1,
    nameEnglish: 1,
  });

  const scoresBySubject = await Score.find({
    student: studentId,
    subject: { $in: subjects.map((s) => s._id) },
    term: { $in: priorTermIds },
  });

  // group raw totals by subject, keyed by term, so we can look each
  // term up in chronological order below (priorTerms is already sorted
  // ascending) rather than however scoresBySubject happens to return
  const scoresBySubjectMap = new Map<string, Map<string, number>>(); // subjectId -> termId -> total
  scoresBySubject.forEach((sc) => {
    const subjectKey = sc.subject.toString();
    if (!scoresBySubjectMap.has(subjectKey))
      scoresBySubjectMap.set(subjectKey, new Map());
    scoresBySubjectMap.get(subjectKey)!.set(sc.term.toString(), sc.total);
  });

  let gradingScale: any = null;
  if (scaleId && scaleId !== "undefined" && scaleId !== "null" && mongoose.Types.ObjectId.isValid(scaleId)) {
    try {
      gradingScale = await GradingScale.findById(scaleId);
    } catch {
      gradingScale = null;
    }
  }
  if (!gradingScale) {
    gradingScale =
      (await GradingScale.findOne({ name: "التقدير" })) ||
      (await GradingScale.findOne());
  }
  if (!gradingScale) {
    try {
      const { ensureDefaultGradingScale } = await import("./gradingScaleController");
      gradingScale = await ensureDefaultGradingScale();
    } catch {
      // Fallback
    }
  }

  const getGradeRemark = (scorePercentage: number) => {
    if (gradingScale && gradingScale.bands && gradingScale.bands.length > 0) {
      const sortedBands = [...gradingScale.bands].sort((a, b) => b.minScore - a.minScore);
      let band = sortedBands.find(
        (b) => scorePercentage >= b.minScore && (b.maxScore === undefined || b.maxScore === null || scorePercentage <= b.maxScore + 0.09)
      );
      if (!band) {
        band = sortedBands.find((b) => scorePercentage >= b.minScore);
      }
      if (!band && sortedBands.length > 0) {
        band = sortedBands[sortedBands.length - 1];
      }
      if (band) {
        return {
          grade: band.grade,
          remark: band.remark,
          remarkArabic: band.remarkArabic,
        };
      }
    }

    // Default standard scale (التقدير):
    // 85 – 100%: A1 — Excellent / ممتاز
    // 75 – 84.9%: B2 — Very Good / جيد جدا
    // 60 – 74.9%: C4 — Good / جيد
    // 50 – 59.9%: D7 — Pass / مقبول
    // 0 – 49.9%: F9 — Fail / راسب
    if (scorePercentage >= 85) return { grade: "A1", remark: "Excellent", remarkArabic: "ممتاز" };
    if (scorePercentage >= 75) return { grade: "B2", remark: "V.Good", remarkArabic: "جيد جدا" };
    if (scorePercentage >= 60) return { grade: "C4", remark: "Good", remarkArabic: "جيد" };
    if (scorePercentage >= 50) return { grade: "D7", remark: "Pass", remarkArabic: "مقبول" };
    return { grade: "F9", remark: "Fail", remarkArabic: "راسب" };
  };

  const studentEnrolledTerms: number[] =
    student.enrolledTerms && Array.isArray(student.enrolledTerms) && student.enrolledTerms.length > 0
      ? student.enrolledTerms
      : student.joinedTerm
        ? [1, 2, 3].filter((t) => t >= student.joinedTerm!)
        : [1, 2, 3];

  const isEnrolledInCurrentTerm = studentEnrolledTerms.includes(currentTerm.termNumber);

  // Applicable prior terms for this student (only terms where student was actually enrolled/present):
  const applicablePriorTerms = priorTerms.filter((t) =>
    studentEnrolledTerms.includes(t.termNumber)
  );

  const subjectResults = subjects.map((subject) => {
    const subjectKey = subject._id.toString();
    const termScoreMap = scoresBySubjectMap.get(subjectKey) || new Map();

    // pull this subject's raw totals in chronological order, based ONLY on
    // terms where the student was enrolled — this ensures prior terms when the
    // student wasn't around are not aggregated or counted as 0!
    const rawScoresAscending = applicablePriorTerms
      .map((t) => termScoreMap.get(t._id.toString()))
      .filter((v): v is number => v !== undefined);

    const { priorPeriodValue, finalValue: cumulativeAverage } =
      foldCascade(rawScoresAscending);

    const currentTermScore = isEnrolledInCurrentTerm ? (termScoreMap.get(termId) ?? null) : null;
    const currentTermScoreDoc = isEnrolledInCurrentTerm
      ? scoresBySubject.find(
          (sc) =>
            sc.subject.toString() === subjectKey && sc.term.toString() === termId,
        )
      : null;
    const combinedTotal =
      priorPeriodValue !== null && currentTermScore !== null
        ? priorPeriodValue + currentTermScore
        : null;

    let grade = null;
    let remark = null;
    let remarkArabic = null;

    const scoreForGrading = isElementary ? currentTermScore : cumulativeAverage;
    if (scoreForGrading !== null && scoreForGrading !== undefined) {
      if (isElementary) {
        if (scoreForGrading >= 85) {
          grade = "Excellent";
          remark = "Excellent";
          remarkArabic = "ممتاز";
        } else if (scoreForGrading >= 75) {
          grade = "V.Good";
          remark = "V. Good";
          remarkArabic = "جيد جداً";
        } else if (scoreForGrading >= 65) {
          grade = "Good";
          remark = "Good";
          remarkArabic = "جيد";
        } else if (scoreForGrading >= 50) {
          grade = "Fair";
          remark = "Fair";
          remarkArabic = "مقبول";
        } else {
          grade = "Fail";
          remark = "Fail";
          remarkArabic = "راسب";
        }
      } else {
        const band = getGradeRemark(scoreForGrading);
        grade = band.grade;
        remark = band.remark;
        remarkArabic = band.remarkArabic;
      }
    }

    return {
      subject: subject._id,
      nameEnglish: subject.nameEnglish,
      nameArabic: subject.nameArabic,
      ca: currentTermScoreDoc?.ca ?? null,
      exam: currentTermScoreDoc?.exam ?? null,
      currentTermScore,
      // only present when there was a valid prior enrolled term cascade
      priorPeriodValue:
        priorPeriodValue !== null
          ? Math.round(priorPeriodValue * 100) / 100
          : null,
      combinedTotal: combinedTotal !== null ? Math.round(combinedTotal * 100) / 100 : null,
      cumulativeAverage:
        cumulativeAverage !== null
          ? Math.round(cumulativeAverage * 100) / 100
          : null,
      grade,
      remark,
      remarkArabic,
    };
  });

  const totalSubjectsCount = subjects.length;
const overallTotal = subjectResults.reduce(
  (sum, s) => sum + (s.cumulativeAverage ?? 0),
  0
);
const overallPercentage =
  totalSubjectsCount > 0 ? overallTotal / totalSubjectsCount : 0;

  const classIdStr = classId ? classId.toString() : "";
  const positionMap = await getClassCumulativePositions(classIdStr, termId);
  const position = positionMap.get(studentId) ?? null;

  const totalStudentsInClass = await Student.countDocuments({ class: classId });

  const remarkDoc = await ReportCardRemark.findOne({
  student: studentId,
  term: termId,
});

const classTeacherComment =
  remarkDoc && (remarkDoc.classTeacherCommentEn || remarkDoc.classTeacherCommentAr || remarkDoc.classTeacherCommentId)
    ? {
        id: remarkDoc.classTeacherCommentId || "",
        en: remarkDoc.classTeacherCommentEn || "",
        ar: remarkDoc.classTeacherCommentAr || "",
      }
    : null;

const principalComment =
  remarkDoc && (remarkDoc.principalCommentEn || remarkDoc.principalCommentAr || remarkDoc.principalCommentId)
    ? {
        id: remarkDoc.principalCommentId || "",
        en: remarkDoc.principalCommentEn || "",
        ar: remarkDoc.principalCommentAr || "",
      }
    : null;

  const allTermsInSession = await Term.find({
    session: currentTerm.session,
  }).sort({ termNumber: 1 });

  const termAverages = [1, 2, 3].map((termNum) => {
    const isEnrolled = studentEnrolledTerms.includes(termNum);
    const termDoc = allTermsInSession.find((t) => t.termNumber === termNum);

    if (!isEnrolled || termNum > currentTerm.termNumber || !termDoc) {
      return {
        termNumber: termNum,
        average: null,
        isEnrolled: isEnrolled && termNum <= currentTerm.termNumber,
      };
    }

    const termScoresThisTerm: number[] = [];

    subjects.forEach((subject) => {
      const subjectKey = subject._id.toString();
      const termScoreMap = scoresBySubjectMap.get(subjectKey) || new Map();
      const rawScoreInTerm = termScoreMap.get(termDoc._id.toString());
      if (rawScoreInTerm !== undefined && rawScoreInTerm !== null) {
        termScoresThisTerm.push(rawScoreInTerm);
      }
    });

    const average =
      termScoresThisTerm.length > 0
        ? Math.round((termScoresThisTerm.reduce((a, b) => a + b, 0) / termScoresThisTerm.length) * 100) / 100
        : null;

    return {
      termNumber: termNum,
      average,
      isEnrolled: true,
    };
  });

  const validTermAverages = termAverages
    .filter((t) => t.average !== null && t.average !== undefined)
    .map((t) => t.average as number);

  const overallTermAverage =
    validTermAverages.length > 0
      ? Math.round((validTermAverages.reduce((sum, v) => sum + v, 0) / validTermAverages.length) * 100) / 100
      : (isEnrolledInCurrentTerm ? Math.round(overallPercentage * 100) / 100 : 0);

  const classBranchId = (student.class as any)?.branch;
  const [attSettingClass, attSettingBranch, attSettingGlobal, attDoc, templateSetting] =
    await Promise.all([
      AttendanceSetting.findOne({ class: classId, term: termId }),
      classBranchId
        ? AttendanceSetting.findOne({
            branch: classBranchId,
            term: termId,
            class: { $exists: false },
          })
        : null,
      AttendanceSetting.findOne({
        term: termId,
        class: { $exists: false },
        branch: { $exists: false },
      }),
      Attendance.findOne({ student: studentId, term: termId }),
      ReportCardSetting.findOne(),
    ]);

  const activeAttSetting = attSettingClass || attSettingBranch || attSettingGlobal;
  const timesSchoolOpened =
    activeAttSetting?.timesSchoolOpened !== undefined && activeAttSetting?.timesSchoolOpened !== null
      ? activeAttSetting.timesSchoolOpened
      : (currentTerm as any).timesSchoolOpened ?? null;

  const dateResumed = activeAttSetting?.dateResumed || (currentTerm as any).dateResumed || "";
  const dateClosed = activeAttSetting?.dateClosed || (currentTerm as any).dateClosed || "";
  const nextResumption = activeAttSetting?.nextResumption || (currentTerm as any).nextResumption || "";

  const timesPresent =
    attDoc?.timesPresent !== undefined && attDoc?.timesPresent !== null
      ? attDoc.timesPresent
      : null;
  const timesAbsent =
    attDoc?.timesAbsent !== undefined && attDoc?.timesAbsent !== null
      ? attDoc.timesAbsent
      : null;

  // For elementary, per-term calculations:
  let elementaryOverallTotal = 0;
  let elementarySubjectCount = 0;
  if (isElementary && isEnrolledInCurrentTerm) {
    subjectResults.forEach((s) => {
      if (s.currentTermScore !== null && s.currentTermScore !== undefined) {
        elementaryOverallTotal += s.currentTermScore;
        elementarySubjectCount += 1;
      }
    });
  }
  const effectiveOverallTotal = isElementary
    ? (isEnrolledInCurrentTerm ? elementaryOverallTotal : 0)
    : (isEnrolledInCurrentTerm ? Math.round(overallTotal * 100) / 100 : 0);

  const effectiveOverallPercentage = isElementary
    ? (elementarySubjectCount > 0
        ? Math.round((elementaryOverallTotal / elementarySubjectCount) * 100) / 100
        : 0)
    : (isEnrolledInCurrentTerm ? Math.round(overallPercentage * 100) / 100 : 0);

  const overallGradeRemark = isEnrolledInCurrentTerm
    ? (isElementary
        ? (effectiveOverallPercentage >= 85
            ? { grade: "Excellent", remark: "Excellent", remarkArabic: "ممتاز" }
            : effectiveOverallPercentage >= 75
            ? { grade: "V.Good", remark: "V. Good", remarkArabic: "جيد جداً" }
            : effectiveOverallPercentage >= 65
            ? { grade: "Good", remark: "Good", remarkArabic: "جيد" }
            : effectiveOverallPercentage >= 50
            ? { grade: "Fair", remark: "Fair", remarkArabic: "مقبول" }
            : { grade: "Poor", remark: "Poor", remarkArabic: "ضعيف" })
        : getGradeRemark(effectiveOverallPercentage))
    : { grade: "—", remark: "Not Enrolled", remarkArabic: "لم يلتحق" };

  return {
    isElementary,
    classCategory,
    student: {
      id: student._id,
      name: student.name,
      gender: student.gender,
      numberInClass: student.numberInClass,
      class: className || (student.class as any)?.name || "",
      arm: classDoc?.arm || (student.class as any)?.arm || null,
      enrolledTerms: studentEnrolledTerms,
      joinedTerm: student.joinedTerm || 1,
      isEnrolledInCurrentTerm,
    },
    term: {
      session: currentTerm.session,
      termNumber: currentTerm.termNumber,
    },
    subjects: subjectResults,
    overallTotal: effectiveOverallTotal,
    overallPercentage: effectiveOverallPercentage,
    cumulativeAverage: isElementary ? effectiveOverallPercentage : overallTermAverage,
    overallAverage: isElementary ? effectiveOverallPercentage : overallTermAverage,
    grade: overallGradeRemark.grade,
    remark: overallGradeRemark.remark,
    remarkArabic: overallGradeRemark.remarkArabic,
    position: isEnrolledInCurrentTerm ? position : null,
    result: !isEnrolledInCurrentTerm
      ? "Not Enrolled"
      : effectiveOverallPercentage >= 50
        ? "Pass"
        : "Fail",
    totalStudentsInClass,
    termAverages,
    attendance: {
      timesSchoolOpened,
      timesPresent,
      timesAbsent,
      dateResumed,
      dateClosed,
      nextResumption,
      schoolDays: timesSchoolOpened,
      presentDays: timesPresent,
      absentDays: timesAbsent,
    },
    classTeacherComment,   // { id, en, ar } | null
    principalComment,
    templateSettings: templateSetting
      ? {
          schoolNameArabic: templateSetting.schoolNameArabic,
          schoolNameEnglish: templateSetting.schoolNameEnglish,
          address: templateSetting.address,
          logoBase64: templateSetting.logoBase64,
          primaryColor: templateSetting.primaryColor,
          headerColor: templateSetting.headerColor,
          showPrincipalSignature: templateSetting.showPrincipalSignature,
          principalSignatureBase64: templateSetting.principalSignatureBase64,
          showStamp: templateSetting.showStamp,
          stampBase64: templateSetting.stampBase64,
          watermarkText: templateSetting.watermarkText,
        }
      : null,
    affectiveScores: (() => {
      const defaultAffective: Record<string, number> = {
        "Punctuality": 5,
        "Neatness": 4,
        "Attitude to sch. Work": 5,
        "Attentiveness": 4,
        "Speaking Habit/Writing": 4,
        "Verbal Fluency": 5,
        "Games / Sports": 4,
      };
      const saved = remarkDoc?.affectiveScores;
      if (saved && typeof saved === "object") {
        return { ...defaultAffective, ...saved };
      }
      return defaultAffective;
    })(),
  };
};

// GET /api/report-card?student=<id>&term=<termId>&gradingScale=<scaleId>
export const getReportCard = async (req: AuthRequest, res: Response) => {
  try {
    const { student, term, gradingScale } = req.query;

    if (!student || !term) {
      return res.status(400).json({ message: "student and term are required" });
    }

    const studentDoc = await Student.findById(student).select("class branch");
    if (!studentDoc) return res.status(404).json({ message: "Student not found" });

    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (studentDoc.branch && studentDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Student is not in your branch" });
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User.findById(req.user.id);
      const isAssigned = (teacher?.classes || []).some((c) => c.toString() === studentDoc.class.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: "Forbidden: You are not assigned to this student's class" });
      }
    }

    const data = await buildReportCardData(
      student as string,
      term as string,
      gradingScale as string,
    );
    if (!data)
      return res.status(404).json({ message: "Student or term not found" });
    res.status(200).json(data);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

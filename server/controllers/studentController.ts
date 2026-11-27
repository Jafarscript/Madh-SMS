import { Response } from "express";
import mongoose from "mongoose";
import Student from "../models/Student";
import Class from "../models/Class";
import Subject from "../models/Subject";
import { AuthRequest } from "../middleware/auth";
import Score from "../models/Score";
import Attendance from "../models/Attendance";
import ReportCardRemark from "../models/ReportCardRemark";
import User from "../models/User";
import Term from "../models/Term";
import {
  isClassGraduatingDoc,
  isSuperAdmin,
  getAllGraduatingClassIds,
  sortGraduatingStudents,
} from "../utils/graduatingAccess";

const renumberClass = async (classId: string) => {
  const [classDoc, students] = await Promise.all([
    Class.findById(classId).select("name isGraduating").lean(),
    Student.find({ class: classId, status: "active" }),
  ]);

  const hasSeatNumbers = students.some((s) => Boolean(s.seatNumber && s.seatNumber.trim()));
  const useSeatOrder = isClassGraduatingDoc(classDoc) || hasSeatNumbers;

  let sorted: typeof students;
  if (useSeatOrder) {
    sorted = sortGraduatingStudents(students, "asc");
  } else {
    const collator = new Intl.Collator("ar");
    sorted = [...students].sort((a, b) => {
      if (a.gender !== b.gender) {
        return a.gender === "M" ? -1 : 1;
      }
      return collator.compare(a.name, b.name);
    });
  }

  await Promise.all(
    sorted.map((student, index) =>
      Student.findByIdAndUpdate(student._id, { numberInClass: index + 1 })
    )
  );
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    let {
      name,
      gender,
      class: classId,
      branch,
      admissionNumber,
      seatNumber,
      sourceSchool,
      resultModeOverride,
      excludedSubjects,
      parentPhone,
      parentEmail,
    } = req.body;

    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    if (isClassGraduatingDoc(classDoc) && !isSuperAdmin(req)) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can add students to graduating classes.",
      });
    }

    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (classDoc.branch && classDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Class does not belong to your branch" });
      }
      branch = req.user.branch;
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User.findById(req.user.id);
      const isAssigned = (teacher?.classes || []).some((c) => c.toString() === classId.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: "Forbidden: You can only add students to your assigned classes" });
      }
      branch = classDoc.branch;
    }

    const cleanSeat = typeof seatNumber === "string" && seatNumber.trim() ? seatNumber.trim() : undefined;
    const countInClass = await Student.countDocuments({ class: classId });
    const admNum =
      admissionNumber?.trim() ||
      cleanSeat ||
      `IAIS/${new Date().getFullYear()}/${String(countInClass + 1).padStart(3, "0")}`;

    const validExcluded = Array.isArray(excludedSubjects)
      ? excludedSubjects.filter((id: any) => mongoose.Types.ObjectId.isValid(String(id)))
      : [];

    const student = await Student.create({
      name: name.trim(),
      gender: gender || "M",
      class: classId,
      branch: branch || classDoc.branch,
      admissionNumber: admNum,
      studentCode: admNum,
      seatNumber: cleanSeat,
      sourceSchool:
        typeof sourceSchool === "string" && sourceSchool.trim()
          ? sourceSchool.trim()
          : classDoc.sourceSchool || undefined,
      resultModeOverride:
        resultModeOverride && ["default", "current_only", "combine_1st_and_3rd"].includes(resultModeOverride)
          ? resultModeOverride
          : "default",
      excludedSubjects: validExcluded,
      parentPhone: parentPhone?.trim(),
      parentEmail: parentEmail?.trim()?.toLowerCase(),
      numberInClass: 0,
      status: "active",
      joinedTerm: ((Number(req.body.joinedTerm) || 1) as 1 | 2 | 3),
      enrolledTerms:
        req.body.enrolledTerms && Array.isArray(req.body.enrolledTerms) && req.body.enrolledTerms.length > 0
          ? req.body.enrolledTerms
          : req.body.joinedTerm
            ? [1, 2, 3].filter((t) => t >= Number(req.body.joinedTerm))
            : [1, 2, 3],
    });

    await renumberClass(classId);

    const updated = await Student.findById(student?._id).populate(
      "class",
      "name arm isGraduating category sourceSchool secondaryResultMode graduatingLevel"
    );
    res.status(201).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/students/bulk
export const bulkCreateStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { class: defaultClassId, branch: defaultBranchId, students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "students array is required" });
    }

    const userIsSuperAdmin = isSuperAdmin(req);

    // Pre-fetch classes and branches for name matching
    const allClasses = await Class.find().populate("branch");
    const classMapById = new Map<string, any>();
    const classMapByName: Record<string, any> = {};
    allClasses.forEach((c) => {
      classMapById.set(c._id.toString(), c);
      const armSuffix = c.arm ? ` ${c.arm}` : "";
      const fullName = `${c.name}${armSuffix}`.toLowerCase().trim();
      classMapByName[fullName] = c;
      if (!classMapByName[c.name.toLowerCase().trim()]) {
        classMapByName[c.name.toLowerCase().trim()] = c;
      }
    });

    if (defaultClassId) {
      const defCls = classMapById.get(defaultClassId.toString());
      if (defCls && isClassGraduatingDoc(defCls) && !userIsSuperAdmin) {
        return res.status(403).json({
          message: "Forbidden: Only Super Admin can bulk upload into graduating classes.",
        });
      }
    }

    const affectedClassIds = new Set<string>();
    const toInsert = [];
    const importErrors: Array<{ row: number; name?: string; error: string }> = [];

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const rowNum = i + 1;
      const rawName = String(s.name || s.Name || s.fullName || "").trim();
      const rawGender = String(s.gender || s.Gender || "M").trim().toUpperCase();
      const gender: "M" | "F" =
        rawGender === "F" || rawGender === "FEMALE" || rawGender === "أنثى" ? "F" : "M";
      const rawClass = String(s.class || s.Class || s.className || "").trim().toLowerCase();
      const seatNumber = String(
        s.seatNumber ||
          s.SeatNumber ||
          s.seatNo ||
          s.SeatNo ||
          s.sitNumber ||
          s.SitNumber ||
          s["Seat Number"] ||
          s["رقم الجلوس"] ||
          ""
      ).trim();
      const sourceSchool = String(
        s.sourceSchool || s.SourceSchool || s.school || s.School || s["Source School"] || ""
      ).trim();
      const admissionNum = String(
        s.admissionNumber || s.AdmissionNumber || s.admNo || s.studentId || seatNumber || ""
      ).trim();
      const parentPhone = String(s.parentPhone || s.ParentPhone || s.phone || "").trim();
      const parentEmail = String(s.parentEmail || s.ParentEmail || s.email || "").trim().toLowerCase();

      if (!rawName) {
        importErrors.push({ row: rowNum, error: "Student name is missing" });
        continue;
      }

      // Determine target class
      let targetClassId = defaultClassId;
      let targetBranchId = defaultBranchId;
      let matchedClassDoc = defaultClassId ? classMapById.get(defaultClassId.toString()) : null;

      if (rawClass && classMapByName[rawClass]) {
        const matched = classMapByName[rawClass];
        matchedClassDoc = matched;
        targetClassId = matched._id.toString();
        targetBranchId = matched.branch?._id || matched.branch || defaultBranchId;
      }

      if (!targetClassId) {
        importErrors.push({
          row: rowNum,
          name: rawName,
          error: `No valid class assigned or matched for class '${rawClass || "None"}'`,
        });
        continue;
      }

      if (matchedClassDoc && isClassGraduatingDoc(matchedClassDoc) && !userIsSuperAdmin) {
        importErrors.push({
          row: rowNum,
          name: rawName,
          error: "Only Super Admin can import into graduating classes",
        });
        continue;
      }

      affectedClassIds.add(targetClassId);

      const generatedAdm =
        admissionNum ||
        `IAIS/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

      toInsert.push({
        name: rawName,
        gender,
        class: targetClassId,
        branch: targetBranchId || matchedClassDoc?.branch?._id || matchedClassDoc?.branch,
        admissionNumber: generatedAdm,
        studentCode: generatedAdm,
        seatNumber: seatNumber || undefined,
        sourceSchool: sourceSchool || matchedClassDoc?.sourceSchool || undefined,
        parentPhone: parentPhone || undefined,
        parentEmail: parentEmail || undefined,
        numberInClass: 0,
        status: "active",
      });
    }

    if (toInsert.length === 0) {
      return res.status(400).json({
        message: "No valid students could be imported. Please check your data format.",
        errors: importErrors,
      });
    }

    const created = await Student.insertMany(toInsert);

    for (const cid of Array.from(affectedClassIds)) {
      await renumberClass(cid);
    }

    let returnedStudents: any[] = [];
    if (defaultClassId) {
      returnedStudents = await Student.find({ class: defaultClassId, status: "active" })
        .populate("class", "name arm isGraduating category sourceSchool secondaryResultMode graduatingLevel")
        .sort({ numberInClass: 1 });
    }

    res.status(201).json({
      message: `Successfully imported ${created.length} students into ${affectedClassIds.size} class(es).`,
      importedCount: created.length,
      errors: importErrors,
      students: returnedStudents,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/students?class=<id>&branch=<id>
export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = {};
    const userIsSuperAdmin = isSuperAdmin(req);
    const gradClassIds = userIsSuperAdmin ? [] : await getAllGraduatingClassIds();

    if (req.query.class && !userIsSuperAdmin && gradClassIds.includes(req.query.class as string)) {
      return res.status(403).json({
        message: "Forbidden: Graduating classes are restricted to Super Admin.",
      });
    }

    if (req.user?.role === "branch_admin" && req.user.branch) {
      filter.branch = req.user.branch;
      if (req.query.class) {
        const classDoc = await Class.findById(req.query.class);
        if (!classDoc || classDoc.branch?.toString() !== req.user.branch.toString()) {
          return res.status(403).json({ message: "Forbidden: Class not in your branch" });
        }
        filter.class = req.query.class as string;
      } else if (gradClassIds.length > 0) {
        filter.class = { $nin: gradClassIds };
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User.findById(req.user.id);
      const assignedClassIds = (teacher?.classes || [])
        .map((c) => c.toString())
        .filter((cid) => !gradClassIds.includes(cid));
      if (req.query.class) {
        if (!assignedClassIds.includes(req.query.class as string)) {
          return res.status(403).json({ message: "Forbidden: You are not assigned to this class" });
        }
        filter.class = req.query.class as string;
      } else {
        filter.class = { $in: assignedClassIds };
      }
    } else if (req.user?.role === "subject_teacher") {
      const teacher = await User.findById(req.user.id);
      const assignedClassIds = (teacher?.classes || []).map((c) => c.toString());
      const teacherSubjectIds = teacher?.subjects || [];
      let subjectClassIds: string[] = [];
      if (teacherSubjectIds.length > 0) {
        const subjs = await Subject.find({ _id: { $in: teacherSubjectIds } }).select("class");
        subjectClassIds = subjs.filter((s) => s.class).map((s) => s.class.toString());
      }
      const allowedClassIds = Array.from(new Set([...assignedClassIds, ...subjectClassIds])).filter(
        (cid) => !gradClassIds.includes(cid)
      );
      if (req.query.class) {
        if (!allowedClassIds.includes(req.query.class as string)) {
          return res.status(403).json({ message: "Forbidden: You are not assigned to this class or its subjects" });
        }
        filter.class = req.query.class as string;
      } else {
        filter.class = { $in: allowedClassIds };
      }
    } else {
      if (req.query.class) {
        filter.class = req.query.class as string;
      } else if (!userIsSuperAdmin && gradClassIds.length > 0) {
        filter.class = { $nin: gradClassIds };
      }
      if (req.query.branch) filter.branch = req.query.branch as string;
    }

    const students = await Student.find(filter)
      .populate("class", "name arm isGraduating category sourceSchool secondaryResultMode graduatingLevel")
      .sort({ numberInClass: 1, name: 1 });

    const hasGradOrSeats = students.some(
      (s: any) => isClassGraduatingDoc(s.class) || Boolean(s.seatNumber && s.seatNumber.trim())
    );

    if (req.query.class && hasGradOrSeats) {
      return res.status(200).json(sortGraduatingStudents(students, "asc"));
    }

    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await Student.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Student not found" });

    const existingClassDoc = await Class.findById(existing.class);
    const destClassDoc =
      req.body.class && req.body.class.toString() !== existing.class.toString()
        ? await Class.findById(req.body.class)
        : existingClassDoc;

    if (
      (isClassGraduatingDoc(existingClassDoc) || isClassGraduatingDoc(destClassDoc)) &&
      !isSuperAdmin(req)
    ) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can edit graduating class students.",
      });
    }

    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (existing.branch && existing.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Student not in your branch" });
      }
      if (req.body.class && req.body.class !== existing.class.toString()) {
        if (!destClassDoc || destClassDoc.branch?.toString() !== req.user.branch.toString()) {
          return res.status(403).json({ message: "Forbidden: Destination class is not in your branch" });
        }
      }
      req.body.branch = req.user.branch;
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User.findById(req.user.id);
      const isAssigned = (teacher?.classes || []).some((c) => c.toString() === existing.class.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: "Forbidden: Student is not in your assigned class" });
      }
    }

    if (req.body.joinedTerm && !req.body.enrolledTerms) {
      req.body.enrolledTerms = [1, 2, 3].filter((t) => t >= Number(req.body.joinedTerm));
    } else if (req.body.enrolledTerms && Array.isArray(req.body.enrolledTerms) && req.body.enrolledTerms.length > 0) {
      req.body.joinedTerm = Math.min(...req.body.enrolledTerms);
    }

    const allowedUpdates: Record<string, any> = {};
    const unsetUpdates: Record<string, number> = {};

    const directFields = [
      "name",
      "gender",
      "class",
      "branch",
      "admissionNumber",
      "studentCode",
      "parentPhone",
      "parentEmail",
      "status",
      "graduationSession",
      "enrolledTerms",
      "joinedTerm",
    ];
    for (const f of directFields) {
      if (req.body[f] !== undefined) allowedUpdates[f] = req.body[f];
    }

    if (req.body.seatNumber !== undefined) {
      const cleanSeat = String(req.body.seatNumber || "").trim();
      if (cleanSeat) allowedUpdates.seatNumber = cleanSeat;
      else unsetUpdates.seatNumber = 1;
    }

    if (req.body.sourceSchool !== undefined) {
      const cleanSchool = String(req.body.sourceSchool || "").trim();
      if (cleanSchool) allowedUpdates.sourceSchool = cleanSchool;
      else unsetUpdates.sourceSchool = 1;
    }

    if (
      req.body.resultModeOverride !== undefined &&
      ["default", "current_only", "combine_1st_and_3rd"].includes(req.body.resultModeOverride)
    ) {
      allowedUpdates.resultModeOverride = req.body.resultModeOverride;
    }

    if (req.body.excludedSubjects !== undefined && Array.isArray(req.body.excludedSubjects)) {
      const targetClassId = req.body.class || existing.class;
      const validClassSubjs = await Subject.find({ class: targetClassId }).select("_id");
      const validSet = new Set(validClassSubjs.map((s) => s._id.toString()));
      allowedUpdates.excludedSubjects = req.body.excludedSubjects
        .map((id: any) => String(id))
        .filter((id: string) => validSet.has(id));
    }

    const updateQuery: Record<string, any> = { $set: allowedUpdates };
    if (Object.keys(unsetUpdates).length > 0) {
      updateQuery.$unset = unsetUpdates;
    }

    const updated = await Student.findByIdAndUpdate(req.params.id, updateQuery, { new: true });
    if (!updated) return res.status(404).json({ message: "Student not found" });

    await renumberClass(updated.class.toString());
    if (existing.class.toString() !== updated.class.toString()) {
      await renumberClass(existing.class.toString());
    }

    const refreshed = await Student.findById(updated._id).populate(
      "class",
      "name arm isGraduating category sourceSchool secondaryResultMode graduatingLevel"
    );
    res.status(200).json(refreshed);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PUT /api/students/:id/graduating-options (super_admin only)
export const updateStudentGraduatingOptions = async (req: AuthRequest, res: Response) => {
  try {
    if (!isSuperAdmin(req)) {
      return res.status(403).json({ message: "Forbidden: Super Admin access required." });
    }

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const { seatNumber, sourceSchool, resultModeOverride, excludedSubjects } = req.body || {};

    if (seatNumber !== undefined) {
      const cleanSeat = String(seatNumber || "").trim();
      student.seatNumber = cleanSeat || undefined;
    }
    if (sourceSchool !== undefined) {
      const cleanSchool = String(sourceSchool || "").trim();
      student.sourceSchool = cleanSchool || undefined;
    }
    if (
      resultModeOverride !== undefined &&
      ["default", "current_only", "combine_1st_and_3rd"].includes(resultModeOverride)
    ) {
      student.resultModeOverride = resultModeOverride;
    }
    if (excludedSubjects !== undefined) {
      if (!Array.isArray(excludedSubjects)) {
        return res.status(400).json({ message: "excludedSubjects must be an array" });
      }
      const classSubjects = await Subject.find({ class: student.class }).select("_id");
      const validIds = new Set(classSubjects.map((s) => s._id.toString()));
      student.excludedSubjects = excludedSubjects
        .map((id: any) => String(id))
        .filter((id: string) => validIds.has(id)) as any;
    }

    await student.save();

    if (seatNumber !== undefined) {
      await renumberClass(student.class.toString());
    }

    const populated = await Student.findById(student._id).populate(
      "class",
      "name arm isGraduating category sourceSchool secondaryResultMode graduatingLevel"
    );
    res.status(200).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.id;
    const userRole = req.user?.role;
    if (userRole !== "super_admin" && userRole !== "branch_admin") {
      return res
        .status(403)
        .json({ message: "Only administrators can delete a student." });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const classDoc = await Class.findById(student.class);
    if (isClassGraduatingDoc(classDoc) && !isSuperAdmin(req)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Only Super Admin can delete graduating class students." });
    }

    if (userRole === "branch_admin" && req.user?.branch) {
      if (
        student.branch &&
        student.branch.toString() !== req.user.branch.toString()
      ) {
        return res
          .status(403)
          .json({ message: "You can only delete students in your assigned branch." });
      }
    }

    await Student.findByIdAndDelete(studentId);

    await Score.deleteMany({ student: studentId });
    await Attendance.deleteMany({ student: studentId });
    await ReportCardRemark.deleteMany({ student: studentId });
    await User.updateMany({ linkedStudent: studentId }, { $unset: { linkedStudent: 1 } });

    await renumberClass(student.class.toString());
    res.status(200).json({ message: "Student and all associated records deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const cleanupOrphanedStudents = async (_req: AuthRequest, res: Response) => {
  try {
    const { purgeOrphanedData } = await import("../utils/dataCleanup");
    const result = await purgeOrphanedData();
    res.status(200).json({
      message: `Database cleaned: removed ${result.deletedStudentsCount} orphaned students, ${result.deletedSubjectsCount} subjects, and ${result.deletedScoresCount} score records.`,
      result,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error during cleanup", error: (err as Error).message });
  }
};

// POST /api/students/promote
export const promoteStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { studentIds, action, sourceClassId, targetClassId, graduationSession } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "studentIds array is required" });
    }

    if (!action || !["promote", "graduate", "retain", "transfer"].includes(action)) {
      return res.status(400).json({ message: "Valid action is required (promote, graduate, retain, transfer)" });
    }

    if (!isSuperAdmin(req)) {
      const gradIds = await getAllGraduatingClassIds();
      if (
        (sourceClassId && gradIds.includes(sourceClassId.toString())) ||
        (targetClassId && gradIds.includes(targetClassId.toString()))
      ) {
        return res.status(403).json({
          message: "Forbidden: Only Super Admin can manage graduating class students.",
        });
      }
      const inGrad = await Student.exists({ _id: { $in: studentIds }, class: { $in: gradIds } });
      if (inGrad) {
        return res.status(403).json({
          message: "Forbidden: Only Super Admin can promote or graduate graduating class students.",
        });
      }
    }

    if (action === "promote" || action === "transfer") {
      if (!targetClassId) {
        return res.status(400).json({ message: "targetClassId is required for promotion or transfer" });
      }

      await Student.updateMany(
        { _id: { $in: studentIds } },
        { class: targetClassId, status: "active" }
      );

      if (sourceClassId) {
        await renumberClass(sourceClassId);
      }
      await renumberClass(targetClassId);

      return res.status(200).json({
        message: `Successfully moved ${studentIds.length} student(s) to destination class.`,
        count: studentIds.length,
      });
    }

    if (action === "graduate") {
      await Student.updateMany(
        { _id: { $in: studentIds } },
        { status: "graduated", graduationSession: graduationSession || "" }
      );

      if (sourceClassId) {
        await renumberClass(sourceClassId);
      }

      return res.status(200).json({
        message: `Successfully marked ${studentIds.length} student(s) as Graduated.`,
        count: studentIds.length,
      });
    }

    if (action === "retain") {
      await Student.updateMany(
        { _id: { $in: studentIds } },
        { status: "active" }
      );

      if (sourceClassId) {
        await renumberClass(sourceClassId);
      }

      return res.status(200).json({
        message: `Successfully retained ${studentIds.length} student(s) in current class.`,
        count: studentIds.length,
      });
    }

    res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    res.status(500).json({ message: "Server error during promotion", error: (err as Error).message });
  }
};

// PUT /api/students/:id/enrolled-terms
export const updateStudentEnrolledTerms = async (req: AuthRequest, res: Response) => {
  try {
    const { enrolledTerms, joinedTerm } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const classDoc = await Class.findById(student.class);
    if (isClassGraduatingDoc(classDoc) && !isSuperAdmin(req)) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can manage graduating class students.",
      });
    }

    let finalEnrolled: number[] | undefined = enrolledTerms;
    let finalJoined: 1 | 2 | 3 | undefined = joinedTerm ? (Number(joinedTerm) as 1 | 2 | 3) : undefined;

    if (!finalEnrolled && finalJoined) {
      finalEnrolled = [1, 2, 3].filter((t) => t >= finalJoined!);
    } else if (finalEnrolled && finalEnrolled.length > 0) {
      finalJoined = Math.min(...finalEnrolled) as 1 | 2 | 3;
    } else {
      finalEnrolled = [1, 2, 3];
      finalJoined = 1;
    }

    student.enrolledTerms = finalEnrolled;
    student.joinedTerm = finalJoined;
    await student.save();

    res.status(200).json({
      message: "Enrolled terms updated successfully",
      student: {
        _id: student._id,
        name: student.name,
        enrolledTerms: student.enrolledTerms,
        joinedTerm: student.joinedTerm,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/students/auto-detect-enrolled-terms
export const autoDetectEnrolledTerms = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.body;
    if (classId && !isSuperAdmin(req)) {
      const cls = await Class.findById(classId);
      if (isClassGraduatingDoc(cls)) {
        return res.status(403).json({
          message: "Forbidden: Only Super Admin can manage graduating class students.",
        });
      }
    }

    const studentFilter: Record<string, any> = {
      status: { $nin: ["graduated", "transferred", "archived"] },
    };
    if (classId) {
      studentFilter.class = classId;
    } else if (!isSuperAdmin(req)) {
      const gradIds = await getAllGraduatingClassIds();
      if (gradIds.length > 0) studentFilter.class = { $nin: gradIds };
    }

    const students = await Student.find(studentFilter);
    const terms = await Term.find().sort({ termNumber: 1 });
    const t1 = terms.find((t) => t.termNumber === 1);
    const t2 = terms.find((t) => t.termNumber === 2);
    const t3 = terms.find((t) => t.termNumber === 3);

    let updatedCount = 0;
    const updates: any[] = [];

    for (const student of students) {
      const countT1 = t1 ? await Score.countDocuments({ student: student._id, term: t1._id }) : 0;
      const countT2 = t2 ? await Score.countDocuments({ student: student._id, term: t2._id }) : 0;
      const countT3 = t3 ? await Score.countDocuments({ student: student._id, term: t3._id }) : 0;

      let detectedJoined: 1 | 2 | 3 = 1;
      let detectedEnrolled: number[] = [1, 2, 3];

      if (countT1 > 0) {
        detectedJoined = 1;
        detectedEnrolled = [1, 2, 3];
      } else if (countT2 > 0) {
        detectedJoined = 2;
        detectedEnrolled = [2, 3];
      } else if (countT3 > 0) {
        detectedJoined = 3;
        detectedEnrolled = [3];
      } else {
        continue;
      }

      if (
        student.joinedTerm !== detectedJoined ||
        JSON.stringify(student.enrolledTerms) !== JSON.stringify(detectedEnrolled)
      ) {
        student.joinedTerm = detectedJoined;
        student.enrolledTerms = detectedEnrolled;
        await student.save();
        updatedCount++;
        updates.push({
          studentId: student._id,
          name: student.name,
          joinedTerm: detectedJoined,
          enrolledTerms: detectedEnrolled,
        });
      }
    }

    res.status(200).json({
      message: `Auto-detected enrolled terms for ${updatedCount} student(s).`,
      updatedCount,
      updates,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
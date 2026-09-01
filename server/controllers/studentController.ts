import { Response } from "express";
import Student from "../models/Student";
import Class from "../models/Class";
import Branch from "../models/Branch";
import { AuthRequest } from "../middleware/auth";
import Score from "../models/Score";
import Attendance from "../models/Attendance";
import ReportCardRemark from "../models/ReportCardRemark";
import User from "../models/User";

// Re-sorts every student in a class alphabetically (Arabic-aware collation,
// since names are typically in Arabic script) and reassigns numberInClass
// 1..N based on that order. Called after any add/delete so numbers never
// have gaps or duplicates, and always reflect alphabetical order — this
// solves both problems (renumbering on delete, and alphabetical sorting)
// with one mechanism instead of two separate fixes.
const renumberClass = async (classId: string) => {
  const students = await Student.find({ class: classId, status: "active" });

  // 'ar' locale collation sorts Arabic script correctly (by actual letter
  // order, not raw character codes); it also handles Latin names
  // reasonably if a class ever has mixed-script names.
  const collator = new Intl.Collator("ar");
  const sorted = [...students].sort((a, b) => {
    // males first, then females — gender takes priority over name
    if (a.gender !== b.gender) {
      return a.gender === "M" ? -1 : 1;
    }
    // within the same gender, alphabetical by name
    return collator.compare(a.name, b.name);
  });

  await Promise.all(
    sorted.map((student, index) =>
      Student.findByIdAndUpdate(student._id, { numberInClass: index + 1 })
    )
  );
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { name, gender, class: classId, branch, admissionNumber, parentPhone, parentEmail } = req.body;

    const countInClass = await Student.countDocuments({ class: classId });
    const admNum =
      admissionNumber?.trim() ||
      `IAIS/${new Date().getFullYear()}/${String(countInClass + 1).padStart(3, "0")}`;

    const student = await Student.create({
      name: name.trim(),
      gender: gender || "M",
      class: classId,
      branch,
      admissionNumber: admNum,
      studentCode: admNum,
      parentPhone: parentPhone?.trim(),
      parentEmail: parentEmail?.trim()?.toLowerCase(),
      numberInClass: 0,
      status: "active",
    });

    await renumberClass(classId);

    const updated = await Student.findById(student._id).populate("class", "name arm");
    res.status(201).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/students/bulk
// Multi-class or single-class bulk student importer from CSV/Excel data
export const bulkCreateStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { class: defaultClassId, branch: defaultBranchId, students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "students array is required" });
    }

    // Pre-fetch classes and branches for name matching
    const allClasses = await Class.find().populate("branch");
    const classMapByName: Record<string, any> = {};
    allClasses.forEach((c) => {
      const armSuffix = c.arm ? ` ${c.arm}` : "";
      const fullName = `${c.name}${armSuffix}`.toLowerCase().trim();
      classMapByName[fullName] = c;
      classMapByName[c.name.toLowerCase().trim()] = c;
    });

    const affectedClassIds = new Set<string>();
    const toInsert = [];
    const importErrors: Array<{ row: number; name?: string; error: string }> = [];

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const rowNum = i + 1;
      const rawName = String(s.name || s.Name || s.fullName || "").trim();
      const rawGender = String(s.gender || s.Gender || "M").trim().toUpperCase();
      const gender: "M" | "F" = rawGender === "F" || rawGender === "FEMALE" ? "F" : "M";
      const rawClass = String(s.class || s.Class || s.className || "").trim().toLowerCase();
      const admissionNum = String(s.admissionNumber || s.AdmissionNumber || s.admNo || s.studentId || "").trim();
      const parentPhone = String(s.parentPhone || s.ParentPhone || s.phone || "").trim();
      const parentEmail = String(s.parentEmail || s.ParentEmail || s.email || "").trim().toLowerCase();

      if (!rawName) {
        importErrors.push({ row: rowNum, error: "Student name is missing" });
        continue;
      }

      // Determine target class
      let targetClassId = defaultClassId;
      let targetBranchId = defaultBranchId;

      if (rawClass && classMapByName[rawClass]) {
        const matched = classMapByName[rawClass];
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

      affectedClassIds.add(targetClassId);

      const generatedAdm =
        admissionNum ||
        `IAIS/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

      toInsert.push({
        name: rawName,
        gender,
        class: targetClassId,
        branch: targetBranchId,
        admissionNumber: generatedAdm,
        studentCode: generatedAdm,
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

    // Renumber all affected classes
    for (const cid of Array.from(affectedClassIds)) {
      await renumberClass(cid);
    }

    let returnedStudents: any[] = [];
    if (defaultClassId) {
      returnedStudents = await Student.find({ class: defaultClassId, status: "active" }).sort({
        numberInClass: 1,
      });
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
    const filter: Record<string, string> = {};
    if (req.query.class) filter.class = req.query.class as string;

    if (req.user?.role === "branch_admin" && req.user.branch) {
      filter.branch = req.user.branch;
    } else if (req.query.branch) {
      filter.branch = req.query.branch as string;
    }

    const students = await Student.find(filter)
      .populate("class", "name arm")
      .sort({ numberInClass: 1 });
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Student not found" });

    // if the name changed, their alphabetical position may have changed
    // too — renumber so the class stays correctly ordered
    await renumberClass(updated.class.toString());

    const refreshed = await Student.findById(updated._id);
    res.status(200).json(refreshed);
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

    // clean up scores, attendance, remarks, and parent links
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
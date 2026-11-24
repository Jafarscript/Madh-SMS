import { Response } from "express";
import ClassModel from "../models/Class";
import Student from "../models/Student";
import Subject from "../models/Subject";
import Score from "../models/Score";
import Attendance from "../models/Attendance";
import AttendanceSetting from "../models/AttendanceSetting";
import ReportCardRemark from "../models/ReportCardRemark";
import ResultPublication from "../models/ResultPublication";
import Branch from "../models/Branch";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { ELEMENTARY_FIXED_SUBJECTS } from "../constants/elementarySubjects";
import {
  isGraduatingClass,
  isClassGraduatingDoc,
  detectGraduatingLevel,
  isSuperAdmin,
  seedGraduatingClassSubjects,
} from "../utils/graduatingAccess";
import { ensureGraduating2026Setup } from "../utils/seedGraduating2026";

export const normalizeArabic = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "") // remove diacritics
    .trim();
};

export const isElementaryClass = (name: string, category?: string): boolean => {
  if (category === "elementary") return true;

  const n = normalizeArabic(name || "");
  const raw = (name || "").toLowerCase();

  // Explicit secondary terms must stay secondary
  const isExplicitSecondary =
    n.includes("اعدادي") || // إعدادي / اعدادي / الاعدادية
    n.includes("ثانوي") || // ثانوي / الثانوية
    raw.includes("jss") ||
    raw.includes("sss") ||
    raw.includes("junior secondary") ||
    raw.includes("senior secondary") ||
    raw.includes("high school") ||
    raw.includes("college");

  if (isExplicitSecondary) return false;

  const isElementaryName =
    n.includes("مستوي") || // matches مستوى and المستوي
    n.includes("مستوى") ||
    n.includes("ابتدائ") || // matches ابتدائي, ابتدائيه, الابتدائي
    n.includes("روض") || // matches روضة, رياض
    n.includes("تمهيد") || // matches تمهيدي, التمهيدي
    n.includes("حضانه") || // matches حضانة, حضانه
    n.includes("طفول") || // طفولة
    raw.includes("stage") ||
    raw.includes("elementary") ||
    raw.includes("primary") ||
    raw.includes("pry") ||
    raw.includes("basic") ||
    raw.includes("nursery") ||
    raw.includes("nur") ||
    raw.includes("kg") ||
    raw.includes("kindergarten") ||
    raw.includes("creche") ||
    raw.includes("reception") ||
    raw.includes("preschool") ||
    raw.includes("pre-school") ||
    raw.includes("playgroup") ||
    raw.includes("toddler") ||
    /\bgrade\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) ||
    /\byear\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) ||
    /\bclass\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) ||
    /\bpri(mary)?\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) ||
    /\bbasic\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) ||
    /(صف|الفصل|المرحله|مرحله|المستوي|مستوي)?\s*(ال)?(اول|اولي|ثاني|ثانيه|ثالث|ثالثه|رابع|رابعه|خامس|خامسه|سادس|سادسه|[1-6])/.test(n);

  if (isElementaryName) return true;
  if (category === "secondary") return false;
  return false;
};

export const ensureElementarySubjectsForClass = async (classId: string) => {
  try {
    const existing = await Subject.find({ class: classId });
    const existingNames = new Set(
      existing.map((s) => s.nameEnglish.trim().toLowerCase())
    );

    const toInsert = [];
    for (let i = 0; i < ELEMENTARY_FIXED_SUBJECTS.length; i++) {
      const fixed = ELEMENTARY_FIXED_SUBJECTS[i];
      if (!existingNames.has(fixed.nameEnglish.toLowerCase())) {
        toInsert.push({
          nameEnglish: fixed.nameEnglish,
          nameArabic: fixed.nameArabic,
          class: classId,
          order: fixed.order,
        });
      }
    }

    if (toInsert.length > 0) {
      await Subject.insertMany(toInsert);
    }
  } catch (err) {
    console.error("Failed to auto-seed elementary subjects for class:", classId, err);
  }
};

export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    let {
      name,
      arm,
      branch,
      category,
      isGraduating,
      graduatingLevel,
      sourceSchool,
      secondaryResultMode,
    } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Class name is required" });
    }
    name = name.trim();

    const gradFlag = isGraduatingClass(name, Boolean(isGraduating));
    if (gradFlag && !isSuperAdmin(req)) {
      return res.status(403).json({
        message: "Forbidden: Only the main administrator (Super Admin) can create graduating classes.",
      });
    }

    // If branch_admin, force branch to their assigned branch
    if (req.user?.role === "branch_admin" && req.user.branch) {
      branch = req.user.branch;
    }

    // If graduating class has no explicit branch, assign to Permanent site (Ronik)
    if (gradFlag && !branch) {
      const ronikBranch =
        (await Branch.findOne({ name: /ronik/i })) ||
        (await Branch.findOne({ name: /permanent/i })) ||
        (await Branch.findOne());
      if (ronikBranch) branch = ronikBranch._id;
    }

    // Auto-detect category: if not provided or if defaulted to secondary but name is elementary
    if (!category || (category === "secondary" && isElementaryClass(name))) {
      category = isElementaryClass(name) ? "elementary" : "secondary";
    }

    const resolvedGradLevel = gradFlag
      ? graduatingLevel ||
        detectGraduatingLevel(name) ||
        (category === "elementary" ? "elementary" : "junior_secondary")
      : undefined;

    const validSecondaryMode =
      secondaryResultMode === "combine_1st_and_3rd" ? "combine_1st_and_3rd" : "current_only";

    const newClass = await ClassModel.create({
      name,
      arm: typeof arm === "string" && arm.trim() ? arm.trim() : undefined,
      branch,
      category,
      isGraduating: gradFlag,
      graduatingLevel: resolvedGradLevel,
      sourceSchool: typeof sourceSchool === "string" && sourceSchool.trim() ? sourceSchool.trim() : undefined,
      secondaryResultMode: validSecondaryMode,
    });

    if (category === "elementary") {
      await ensureElementarySubjectsForClass(newClass._id.toString());
    } else if (gradFlag) {
      await seedGraduatingClassSubjects(
        newClass._id.toString(),
        resolvedGradLevel,
        branch?.toString()
      );
    }

    const populated = await ClassModel.findById(newClass._id).populate("branch", "name");
    res.status(201).json(populated || newClass);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

// supports filtering by branch: GET /api/classes?branch=<id>
export const getClasses = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = {};

    // branch_admin is always scoped to their own branch
    if (req.user?.role === "branch_admin" && req.user.branch) {
      filter.branch = req.user.branch;
    } else if (req.user?.role === "class_teacher") {
      // class_teacher only sees classes they're actually assigned to
      const teacher = await User.findById(req.user.id);
      filter._id = { $in: (teacher?.classes || []).map((c) => c.toString()) };
    } else if (req.user?.role === "subject_teacher") {
      // subject_teacher only sees classes assigned to them OR classes of their assigned subjects
      const teacher = await User.findById(req.user.id);
      const teacherClassIds = (teacher?.classes || []).map((c) => c.toString());
      const teacherSubjectIds = teacher?.subjects || [];
      let subjectClassIds: string[] = [];
      if (teacherSubjectIds.length > 0) {
        const subjs = await Subject.find({ _id: { $in: teacherSubjectIds } }).select("class");
        subjectClassIds = subjs.filter((s) => s.class).map((s) => s.class.toString());
      }
      const allowedClassIds = Array.from(new Set([...teacherClassIds, ...subjectClassIds]));
      filter._id = { $in: allowedClassIds };
    } else if (req.query.branch) {
      filter.branch = req.query.branch as string;
    }

    const classes = await ClassModel.find(filter)
      .populate("branch", "name")
      .sort({ name: 1, arm: 1 });

    const userIsSuperAdmin = isSuperAdmin(req);

    // Ensure any elementary/graduating class is tagged cleanly, and hide graduating classes from non-super-admins
    const processed = await Promise.all(
      classes.map(async (cls) => {
        const clsObj = cls.toObject() as any;
        const isGrad = isClassGraduatingDoc(clsObj);

        if (isGrad && !clsObj.isGraduating) {
          clsObj.isGraduating = true;
          const level = detectGraduatingLevel(clsObj.name);
          if (level && !clsObj.graduatingLevel) clsObj.graduatingLevel = level;
          ClassModel.updateOne(
            { _id: cls._id },
            {
              $set: {
                isGraduating: true,
                ...(level ? { graduatingLevel: level } : {}),
              },
            }
          ).catch(() => {});
        }

        if (isGrad && !userIsSuperAdmin) {
          return null;
        }

        const isElem = clsObj.category === "elementary" || isElementaryClass(clsObj.name);
        if (clsObj.category !== "elementary" && isElem) {
          clsObj.category = "elementary";
          ClassModel.updateOne({ _id: cls._id }, { $set: { category: "elementary" } }).catch(() => {});
        }
        if (isElem) {
          ensureElementarySubjectsForClass(cls._id.toString()).catch(() => {});
        }
        return clsObj;
      })
    );

    res.status(200).json(processed.filter(Boolean));
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateClass = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      arm,
      branch,
      category,
      isGraduating,
      graduatingLevel,
      sourceSchool,
      secondaryResultMode,
    } = req.body;

    // Check existing class permissions
    const existing = await ClassModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Class not found" });

    const targetIsGrad =
      isClassGraduatingDoc(existing) ||
      isGraduatingClass(name ?? existing.name, isGraduating);

    if (targetIsGrad && !isSuperAdmin(req)) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can manage graduating classes.",
      });
    }

    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (existing.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: You can only edit classes in your assigned branch." });
      }
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = String(name).trim();

    // Determine category: if explicitly passed, honour it; otherwise infer from name
    if (category !== undefined) {
      updateData.category = category;
    } else if (name !== undefined) {
      updateData.category = isElementaryClass(name, existing.category) ? "elementary" : "secondary";
    }

    if (branch !== undefined) {
      // branch_admin cannot move class to another branch
      updateData.branch = req.user?.role === "branch_admin" && req.user.branch ? req.user.branch : branch;
    }

    if (isGraduating !== undefined || name !== undefined) {
      updateData.isGraduating = targetIsGrad;
      if (targetIsGrad && !existing.graduatingLevel && !graduatingLevel) {
        updateData.graduatingLevel = detectGraduatingLevel(updateData.name || existing.name);
      }
    }
    if (graduatingLevel !== undefined && ["elementary", "junior_secondary", "senior_secondary"].includes(graduatingLevel)) {
      updateData.graduatingLevel = graduatingLevel;
    }
    if (secondaryResultMode !== undefined && ["current_only", "combine_1st_and_3rd"].includes(secondaryResultMode)) {
      updateData.secondaryResultMode = secondaryResultMode;
    }

    const updateQuery: Record<string, any> = { $set: updateData };
    const unsetFields: Record<string, number> = {};

    if (arm !== undefined) {
      if (typeof arm === "string" && arm.trim()) {
        updateData.arm = arm.trim();
      } else {
        unsetFields.arm = 1;
      }
    }
    if (sourceSchool !== undefined) {
      if (typeof sourceSchool === "string" && sourceSchool.trim()) {
        updateData.sourceSchool = sourceSchool.trim();
      } else {
        unsetFields.sourceSchool = 1;
      }
    }
    if (Object.keys(unsetFields).length > 0) {
      updateQuery.$unset = unsetFields;
    }

    const updated = await ClassModel.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true, returnDocument: "after" },
    ).populate("branch", "name");

    if (updated && (updated.category === "elementary" || isElementaryClass(updated.name))) {
      await ensureElementarySubjectsForClass(updated._id.toString());
    }

    res.status(200).json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

export const deleteClass = async (req: AuthRequest, res: Response) => {
  try {
    const classId = req.params.id;

    // Strict Admin Authorization Check
    const userRole = req.user?.role;
    if (userRole !== "super_admin" && userRole !== "branch_admin") {
      return res
        .status(403)
        .json({ message: "Only administrators can delete a class." });
    }

    const classObj = await ClassModel.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (isClassGraduatingDoc(classObj) && !isSuperAdmin(req)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Only Super Admin can delete a graduating class." });
    }

    // Branch Admin Scoping Check
    if (userRole === "branch_admin" && req.user?.branch) {
      if (
        classObj.branch &&
        classObj.branch.toString() !== req.user.branch.toString()
      ) {
        return res
          .status(403)
          .json({ message: "You can only delete classes in your assigned branch." });
      }
    }

    // 1. Find all students belonging to this class
    const students = await Student.find({ class: classId }).select("_id");
    const studentIds = students.map((s) => s._id);

    // 2. Find all subjects assigned to this class
    const subjects = await Subject.find({ class: classId }).select("_id");
    const subjectIds = subjects.map((s) => s._id);

    // 3. Delete all Scores for these students OR these subjects
    await Score.deleteMany({
      $or: [
        { student: { $in: studentIds } },
        { subject: { $in: subjectIds } },
      ],
    });

    // 4. Delete all Attendance records for this class or these students
    await Attendance.deleteMany({
      $or: [{ class: classId }, { student: { $in: studentIds } }],
    });

    // 5. Delete all Attendance Settings for this class
    await AttendanceSetting.deleteMany({ class: classId });

    // 6. Delete all Report Card Remarks for these students
    if (studentIds.length > 0) {
      await ReportCardRemark.deleteMany({ student: { $in: studentIds } });
    }

    // 7. Delete all Result Publications for this class
    await ResultPublication.deleteMany({ class: classId });

    // 8. Delete all Students in this class
    await Student.deleteMany({ class: classId });

    // 9. Delete all Subjects in this class
    await Subject.deleteMany({ class: classId });

    // 10. Clean up User associations
    await User.updateMany({ classes: classId }, { $pull: { classes: classId } });
    if (subjectIds.length > 0) {
      await User.updateMany(
        { subjects: { $in: subjectIds } },
        { $pull: { subjects: { $in: subjectIds } } }
      );
    }
    if (studentIds.length > 0) {
      await User.updateMany(
        { linkedStudent: { $in: studentIds } },
        { $unset: { linkedStudent: 1 } }
      );
    }

    // 11. Delete the Class itself
    await ClassModel.findByIdAndDelete(classId);

    res.status(200).json({
      message:
        "Class and all linked students, subjects, scores, attendance, remarks, and records have been permanently deleted.",
      deletedStudentsCount: studentIds.length,
      deletedSubjectsCount: subjectIds.length,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/classes/graduating/setup-2026 (super_admin only)
export const setupGraduating2026 = async (req: AuthRequest, res: Response) => {
  try {
    if (!isSuperAdmin(req)) {
      return res.status(403).json({ message: "Forbidden: Super Admin access required." });
    }
    const summary = await ensureGraduating2026Setup();
    res.status(200).json({
      message: `Graduating classes & 2026 roster synced under ${summary.branchName}.`,
      summary,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/classes/:id/clone-subjects (super_admin only)
// Clones subjects from sourceClassId (or auto-matches level subjects) into target class
export const cloneClassSubjects = async (req: AuthRequest, res: Response) => {
  try {
    if (!isSuperAdmin(req)) {
      return res.status(403).json({ message: "Forbidden: Super Admin access required." });
    }
    const targetClass = await ClassModel.findById(req.params.id);
    if (!targetClass) return res.status(404).json({ message: "Target class not found" });

    const { sourceClassId } = req.body || {};

    if (!sourceClassId) {
      const level =
        targetClass.graduatingLevel ||
        detectGraduatingLevel(targetClass.name) ||
        (targetClass.category === "elementary" ? "elementary" : "junior_secondary");
      const count = await seedGraduatingClassSubjects(
        targetClass._id.toString(),
        level,
        targetClass.branch?.toString()
      );
      const updated = await Subject.find({ class: targetClass._id }).sort({ order: 1, nameEnglish: 1 });
      return res.status(200).json({
        message: `Added ${count} subject(s) from level curriculum.`,
        addedCount: count,
        subjects: updated,
      });
    }

    const sourceSubjects = await Subject.find({ class: sourceClassId }).sort({ order: 1, nameEnglish: 1 });
    if (sourceSubjects.length === 0) {
      return res.status(404).json({ message: "Source class has no subjects to copy." });
    }

    const existingSubjects = await Subject.find({ class: targetClass._id });
    const existingSet = new Set(existingSubjects.map((s) => s.nameEnglish.trim().toLowerCase()));
    let nextOrder = existingSubjects.length + 1;

    const toInsert = sourceSubjects
      .filter((s) => !existingSet.has(s.nameEnglish.trim().toLowerCase()))
      .map((s) => ({
        nameEnglish: s.nameEnglish,
        nameArabic: s.nameArabic,
        class: targetClass._id,
        order: nextOrder++,
      }));

    if (toInsert.length > 0) {
      await Subject.insertMany(toInsert);
    }

    const updated = await Subject.find({ class: targetClass._id }).sort({ order: 1, nameEnglish: 1 });
    res.status(200).json({
      message: `Copied ${toInsert.length} new subject(s) into ${targetClass.name}.`,
      addedCount: toInsert.length,
      subjects: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

import { Response } from "express";
import Subject from "../models/Subject";
import ClassModel from "../models/Class";
import Student from "../models/Student";
import Score from "../models/Score";
import { AuthRequest } from "../middleware/auth";
import User from "../models/User";
import { ensureElementarySubjectsForClass, isElementaryClass } from "./classController";
import {
  assertSuperAdminForClass,
  getAllGraduatingClassIds,
  isSuperAdmin,
} from "../utils/graduatingAccess";

export const createSubject = async (req: AuthRequest, res: Response) => {
  try {
    const { nameEnglish, nameArabic, class: classId, order } = req.body;

    const access = await assertSuperAdminForClass(req, classId);
    if (!access.classDoc) return res.status(404).json({ message: "Class not found" });
    if (!access.allowed) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can manage graduating class subjects.",
      });
    }

    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (access.classDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Class does not belong to your branch" });
      }
    }

    let finalOrder = order;
    if (finalOrder === undefined || finalOrder === null) {
      const count = await Subject.countDocuments({ class: classId });
      finalOrder = count + 1;
    }
    const subject = await Subject.create({
      nameEnglish,
      nameArabic,
      class: classId,
      order: Number(finalOrder) || 0,
    });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const bulkCreateSubjects = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, subjects } = req.body;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: "subjects array is required" });
    }

    const access = await assertSuperAdminForClass(req, classId);
    if (!access.classDoc) return res.status(404).json({ message: "Class not found" });
    if (!access.allowed) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can manage graduating class subjects.",
      });
    }

    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (access.classDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Class does not belong to your branch" });
      }
    }

    const currentCount = await Subject.countDocuments({ class: classId });

    const toInsert = subjects.map((s: { nameEnglish: string; nameArabic?: string; order?: number }, idx: number) => ({
      nameEnglish: s.nameEnglish,
      nameArabic: s.nameArabic,
      class: classId,
      order: s.order !== undefined ? s.order : currentCount + idx + 1,
    }));

    const created = await Subject.insertMany(toInsert);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/subjects?class=<classId>
export const getSubjects = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = {};
    const userIsSuperAdmin = isSuperAdmin(req);
    const gradClassIds = userIsSuperAdmin ? [] : await getAllGraduatingClassIds();

    if (req.query.class && !userIsSuperAdmin && gradClassIds.includes(req.query.class as string)) {
      return res.status(403).json({
        message: "Forbidden: Graduating class subjects are restricted to Super Admin.",
      });
    }

    if (req.user?.role === "branch_admin" && req.user.branch) {
      const branchClasses = await ClassModel.find({ branch: req.user.branch }).select("_id");
      const branchClassIds = branchClasses
        .map((c) => c._id.toString())
        .filter((cid) => !gradClassIds.includes(cid));
      if (req.query.class) {
        if (!branchClassIds.includes(req.query.class as string)) {
          return res.status(403).json({ message: "Forbidden: Class does not belong to your branch" });
        }
        filter.class = req.query.class as string;
      } else {
        filter.class = { $in: branchClassIds };
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User.findById(req.user.id);
      const teacherClassIds = (teacher?.classes || [])
        .map((c) => c.toString())
        .filter((cid) => !gradClassIds.includes(cid));
      if (req.query.class) {
        if (!teacherClassIds.includes(req.query.class as string)) {
          return res.status(403).json({ message: "Forbidden: You are not assigned to this class" });
        }
        filter.class = req.query.class as string;
      } else {
        filter.class = { $in: teacherClassIds };
      }
    } else if (req.user?.role === "subject_teacher") {
      const teacher = await User.findById(req.user.id);
      const allowedSubjectIds = (teacher?.subjects || []).map((s) => s.toString());
      filter._id = { $in: allowedSubjectIds };
      if (req.query.class) {
        filter.class = req.query.class as string;
      } else if (gradClassIds.length > 0) {
        filter.class = { $nin: gradClassIds };
      }
    } else if (req.query.class) {
      filter.class = req.query.class as string;
    } else if (!userIsSuperAdmin && gradClassIds.length > 0) {
      filter.class = { $nin: gradClassIds };
    }

    if (req.query.class) {
      const cls = await ClassModel.findById(req.query.class);
      if (cls && (cls.category === "elementary" || isElementaryClass(cls.name))) {
        await ensureElementarySubjectsForClass(cls._id.toString());
      }
    }

    const subjects = await Subject.find(filter).sort({ order: 1, nameEnglish: 1 });
    res.status(200).json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const reorderSubjects = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, subjectIds } = req.body;
    if (!classId || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res.status(400).json({ message: "class and subjectIds array are required" });
    }

    const access = await assertSuperAdminForClass(req, classId);
    if (!access.classDoc) return res.status(404).json({ message: "Class not found" });
    if (!access.allowed) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can reorder graduating class subjects.",
      });
    }

    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (access.classDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Class does not belong to your branch" });
      }
    }

    const bulkOps = subjectIds.map((id: string, index: number) => ({
      updateOne: {
        filter: { _id: id, class: classId },
        update: { $set: { order: index + 1 } },
      },
    }));

    await Subject.bulkWrite(bulkOps);

    const updatedSubjects = await Subject.find({ class: classId }).sort({ order: 1, nameEnglish: 1 });
    res.status(200).json(updatedSubjects);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateSubject = async (req: AuthRequest, res: Response) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const access = await assertSuperAdminForClass(req, subject.class.toString());
    if (!access.allowed) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can edit graduating class subjects.",
      });
    }

    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (!access.classDoc || access.classDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Subject does not belong to your branch" });
      }
    }

    const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const deleteSubject = async (req: AuthRequest, res: Response) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const access = await assertSuperAdminForClass(req, subject.class.toString());
    if (!access.allowed) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can delete graduating class subjects.",
      });
    }

    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (!access.classDoc || access.classDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Subject does not belong to your branch" });
      }
    }

    await Subject.findByIdAndDelete(req.params.id);
    await Promise.all([
      Score.deleteMany({ subject: req.params.id }),
      Student.updateMany(
        { excludedSubjects: req.params.id },
        { $pull: { excludedSubjects: req.params.id } }
      ),
      User.updateMany(
        { subjects: req.params.id },
        { $pull: { subjects: req.params.id } }
      ),
    ]);

    res.status(200).json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
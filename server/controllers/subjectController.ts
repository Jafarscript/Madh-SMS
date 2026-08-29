import { Response } from "express";
import Subject from "../models/Subject";
import { AuthRequest } from "../middleware/auth";
import User from "../models/User";

export const createSubject = async (req: AuthRequest, res: Response) => {
  try {
    const { nameEnglish, nameArabic, class: classId } = req.body;
    const subject = await Subject.create({ nameEnglish, nameArabic, class: classId });
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

    const toInsert = subjects.map((s: { nameEnglish: string; nameArabic?: string }) => ({
      nameEnglish: s.nameEnglish,
      nameArabic: s.nameArabic,
      class: classId,
    }));

    const created = await Subject.insertMany(toInsert);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/subjects?class=<classId>  — subjects are per-class, so almost always filtered
export const getSubjects = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = {};
    if (req.query.class) filter.class = req.query.class as string;

    if (req.user?.role === "subject_teacher") {
      const teacher = await User.findById(req.user.id);
      const allowedSubjectIds = (teacher?.subjects || []).map((s) => s.toString());
      filter._id = { $in: allowedSubjectIds };
    }

    const subjects = await Subject.find(filter).sort({ nameEnglish: 1 });
    res.status(200).json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateSubject = async (req: AuthRequest, res: Response) => {
  try {
    const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const deleteSubject = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await Subject.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
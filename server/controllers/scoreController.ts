import { Response } from "express";
import Score from "../models/Score";
import { AuthRequest } from "../middleware/auth";
import User from "../models/User";
import Student from "../models/Student";
import { isClassResultLocked } from "./resultPublicationController";

export const submitScore = async (req: AuthRequest, res: Response) => {
  try {
    const { student, subject, term, ca, exam } = req.body;

    if (!student || !subject || !term || !Number.isFinite(ca) || !Number.isFinite(exam) || ca < 0 || exam < 0) {
      return res.status(400).json({ message: "student, subject, term, and valid non-negative scores are required" });
    }

    const studentDoc = await Student.findById(student).select("class");
    if (!studentDoc) return res.status(404).json({ message: "Student not found" });

    if (await isClassResultLocked(studentDoc.class.toString(), term)) {
      return res.status(423).json({ message: "This class result is locked and scores cannot be changed" });
    }

    // Enforce: a subject_teacher can only submit scores for subjects
    // explicitly assigned to them (if assigned). Admin roles bypass this check.
    if (req.user?.role === "subject_teacher") {
      const teacher = await User.findById(req.user.id);
      const allowedSubjects = (teacher?.subjects || []).map((s) => s.toString());
      if (allowedSubjects.length > 0 && !allowedSubjects.includes(subject)) {
        return res.status(403).json({ message: "You are not assigned to this subject" });
      }
      const allowedClasses = (teacher?.classes || []).map((c) => c.toString());
      if (allowedClasses.length > 0 && !allowedClasses.includes(studentDoc.class.toString())) {
        return res.status(403).json({ message: "You are not assigned to this student's class" });
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User.findById(req.user.id);
      const allowedClasses = (teacher?.classes || []).map((c) => c.toString());
      if (allowedClasses.length > 0 && !allowedClasses.includes(studentDoc.class.toString())) {
        return res.status(403).json({ message: "You are not assigned to this class" });
      }
    }

    if (ca > 40 || exam > 60) {
      return res.status(400).json({ message: "CA must be ≤ 40 and Exam ≤ 60" });
    }

    const total = ca + exam;

    // upsert: if this student+subject+term score already exists, update it
    // instead of erroring on the unique index — teachers often correct entries
    const score = await Score.findOneAndUpdate(
      { student, subject, term },
      { ca, exam, total, enteredBy: req.user?.id },
      { new: true, upsert: true }
    );

    res.status(200).json(score);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/scores?class=<classId>&term=<termId>&subject=<subjectId>
export const getScores = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, string> = {};
    if (req.query.subject) filter.subject = req.query.subject as string;
    if (req.query.term) filter.term = req.query.term as string;

    // If a subject_teacher is viewing, only show scores for their assigned subjects
    if (req.user?.role === "subject_teacher") {
      const teacher = await User.findById(req.user.id);
      const allowedSubjects = (teacher?.subjects || []).map((s) => s.toString());
      if (allowedSubjects.length > 0 && filter.subject && !allowedSubjects.includes(filter.subject)) {
        return res.status(403).json({ message: "Not authorized for this subject" });
      }
    }

    const scores = await Score.find(filter)
      .populate("student", "name numberInClass")
      .populate("subject", "nameEnglish nameArabic");

    res.status(200).json(scores);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

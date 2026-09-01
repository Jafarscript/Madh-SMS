import { Response } from "express";
import Score from "../models/Score";
import ScoreAudit from "../models/ScoreAudit";
import { AuthRequest } from "../middleware/auth";
import User from "../models/User";
import Student from "../models/Student";
import { isClassResultLocked } from "./resultPublicationController";

export const submitScore = async (req: AuthRequest, res: Response) => {
  try {
    const { student, subject, term, ca, exam, reason } = req.body;

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
      const allowedSubjects = (teacher?.subjects || []).map((s) => s.toString());
      
      const isInAllowedClass = allowedClasses.includes(studentDoc.class.toString());
      const isAllowedSubject = allowedSubjects.includes(subject);

      // A class teacher can submit scores if the student is in their managed class
      // OR if they are assigned as subject teacher for this subject
      if (!isInAllowedClass && !isAllowedSubject && (allowedClasses.length > 0 || allowedSubjects.length > 0)) {
        return res.status(403).json({ message: "You are not assigned to this class or subject" });
      }
    }

    if (ca > 40 || exam > 60) {
      return res.status(400).json({ message: "CA must be ≤ 40 and Exam ≤ 60" });
    }

    const total = ca + exam;

    // Check existing score for audit tracking
    const existingScore = await Score.findOne({ student, subject, term });

    if (existingScore) {
      const caChanged = existingScore.ca !== ca;
      const examChanged = existingScore.exam !== exam;

      if (caChanged || examChanged) {
        await ScoreAudit.create({
          student,
          subject,
          term,
          class: studentDoc.class,
          action: "update",
          previousScore: {
            ca: existingScore.ca,
            exam: existingScore.exam,
            total: existingScore.total,
          },
          newScore: { ca, exam, total },
          changedBy: req.user?.id,
          reason: reason || "Score adjustment",
        });
      }
    } else {
      await ScoreAudit.create({
        student,
        subject,
        term,
        class: studentDoc.class,
        action: "create",
        newScore: { ca, exam, total },
        changedBy: req.user?.id,
        reason: reason || "Initial score entry",
      });
    }

    // upsert: if this student+subject+term score already exists, update it
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

// GET /api/scores/audit-logs
export const getScoreAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, subject: subjectId, term: termId, student: studentId, changedBy, limit = "100", page = "1" } = req.query;

    const filter: Record<string, any> = {};
    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;
    if (termId) filter.term = termId;
    if (studentId) filter.student = studentId;
    if (changedBy) filter.changedBy = changedBy;

    const lim = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 100));
    const p = Math.max(1, parseInt(page as string, 10) || 1);
    const skip = (p - 1) * lim;

    const total = await ScoreAudit.countDocuments(filter);
    const logs = await ScoreAudit.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .populate("student", "name numberInClass gender")
      .populate("subject", "nameEnglish nameArabic")
      .populate("term", "session termNumber isActive")
      .populate("class", "name arm")
      .populate("changedBy", "name email role");

    res.status(200).json({
      total,
      page: p,
      limit: lim,
      totalPages: Math.ceil(total / lim),
      logs,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

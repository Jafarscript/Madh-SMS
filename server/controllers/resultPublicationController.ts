import { Response } from "express";
import Class from "../models/Class";
import ResultPublication, { ResultStatus } from "../models/ResultPublication";
import Student from "../models/Student";
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
    if (!classId || !term) {
      return res.status(400).json({ message: "class and term are required" });
    }

    const publication = await ResultPublication.findOne({ class: classId as any, term: term as any });
    res.status(200).json(publication || { class: classId, term, status: "draft" });
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
    );
    res.status(200).json(publication);
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

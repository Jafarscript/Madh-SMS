import { Response } from "express";
import Attendance, { AttendanceStatus } from "../models/Attendance";
import Class from "../models/Class";
import Student from "../models/Student";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { isClassResultLocked } from "./resultPublicationController";

const canAccessClass = async (req: AuthRequest, classId: string) => {
  if (req.user?.role === "super_admin") return true;
  const [user, classDoc] = await Promise.all([User.findById(req.user?.id), Class.findById(classId)]);
  if (!user || !classDoc) return false;
  if (req.user?.role === "branch_admin") return user.branch?.toString() === classDoc.branch.toString();
  if (req.user?.role === "class_teacher") return (user.classes || []).some((id) => id.toString() === classId);
  return false;
};

// GET /api/attendance?class=<classId>&term=<termId>&date=YYYY-MM-DD
export const getClassAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, term, date } = req.query as Record<string, string>;
    if (!classId || !term || !date) return res.status(400).json({ message: "class, term, and date are required" });
    if (!(await canAccessClass(req, classId))) return res.status(403).json({ message: "You cannot access this class" });

    const [students, records] = await Promise.all([
      Student.find({ class: classId }).sort({ numberInClass: 1, name: 1 }).select("name numberInClass"),
      Attendance.find({ class: classId, term, date }).select("student status"),
    ]);
    const statuses = new Map(records.map((record) => [record.student.toString(), record.status]));
    res.status(200).json(
      students.map((student) => ({
        student: student._id,
        name: student.name,
        numberInClass: student.numberInClass,
        status: statuses.get(student._id.toString()) || "present",
      })),
    );
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PUT /api/attendance/bulk
// body: { class, term, date, records: [{ student, status }] }
export const saveClassAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, term, date, records } = req.body as {
      class?: string; term?: string; date?: string; records?: Array<{ student: string; status: AttendanceStatus }>;
    };
    if (!classId || !term || !/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "class, term, date, and attendance records are required" });
    }
    if (!(await canAccessClass(req, classId))) return res.status(403).json({ message: "You cannot manage this class" });
    if (await isClassResultLocked(classId, term)) return res.status(423).json({ message: "This class result is locked and attendance cannot be changed" });
    if (records.some((record) => !record.student || !["present", "absent", "late"].includes(record.status))) {
      return res.status(400).json({ message: "Every record needs a student and a valid status" });
    }

    const enrolled = await Student.countDocuments({ _id: { $in: records.map((record) => record.student) }, class: classId });
    if (enrolled !== records.length) return res.status(400).json({ message: "One or more students do not belong to this class" });

    await Promise.all(records.map((record) =>
      Attendance.findOneAndUpdate(
        { student: record.student, term, date: date as string },
        { class: classId, status: record.status, recordedBy: req.user!.id },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ),
    ));
    res.status(200).json({ message: "Attendance saved", count: records.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

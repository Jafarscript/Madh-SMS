import { Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import Student from "../models/Student";
import Term from "../models/Term";
import { AuthRequest } from "../middleware/auth";
import { buildReportCardData } from "./reportCardController";
import { generateSingleReportCardPdf } from "../utils/generateReportCardPdf";
import { buildSingleReportCardHtml } from "../utils/reportCardTemplate";
import { isStudentResultPublished } from "./resultPublicationController";

// Helper to get all linked student IDs for the logged-in parent
const getAllLinkedStudentIds = async (userId: string): Promise<string[]> => {
  const user = await User.findById(userId);
  if (!user) return [];
  const ids: string[] = [];
  if (user.linkedStudent) ids.push(user.linkedStudent.toString());
  if (Array.isArray(user.linkedStudents)) {
    user.linkedStudents.forEach((s) => {
      const sId = s.toString();
      if (!ids.includes(sId)) ids.push(sId);
    });
  }
  return ids;
};

// GET /api/parent-portal/children
// Returns all linked students for the authenticated parent
export const getMyChildren = async (req: AuthRequest, res: Response) => {
  try {
    const studentIds = await getAllLinkedStudentIds(req.user!.id);
    if (studentIds.length === 0) {
      return res.status(200).json([]);
    }

    const students = await Student.find({ _id: { $in: studentIds } })
      .populate("class", "name arm")
      .populate("branch", "name");

    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/parent-portal/link-child
// Allows parents to link an additional child / sibling to their account
export const linkChild = async (req: AuthRequest, res: Response) => {
  try {
    const { identifier, classId } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: "Admission Number, Student ID, or Name is required" });
    }

    const query = identifier.trim();
    let student = null;

    if (mongoose.Types.ObjectId.isValid(query)) {
      student = await Student.findById(query);
    }
    if (!student) {
      student = await Student.findOne({
        $or: [
          { admissionNumber: { $regex: `^${query}$`, $options: "i" } },
          { studentCode: { $regex: `^${query}$`, $options: "i" } },
        ],
      });
    }
    if (!student) {
      const nameFilter: any = { name: { $regex: query, $options: "i" } };
      if (classId) nameFilter.class = classId;
      student = await Student.findOne(nameFilter);
    }

    if (!student) {
      return res.status(404).json({
        message: "No student matching the provided Admission Number or Name was found.",
      });
    }

    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ message: "Parent account not found" });

    const studentIdStr = student._id.toString();
    const existingList = (user.linkedStudents || []).map((s) => s.toString());

    if (existingList.includes(studentIdStr) || user.linkedStudent?.toString() === studentIdStr) {
      return res.status(400).json({ message: "This student is already linked to your account." });
    }

    if (!user.linkedStudent) {
      user.linkedStudent = student._id as any;
    }

    const updatedList = Array.from(new Set([...existingList, studentIdStr]));
    user.linkedStudents = updatedList as any;

    await user.save();

    const populatedStudent = await Student.findById(student._id)
      .populate("class", "name arm")
      .populate("branch", "name");

    res.status(200).json({
      message: `Child ${student.name} linked successfully!`,
      student: populatedStudent,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/parent-portal/report-card?studentId=<id>&term=<termId>&gradingScale=<scaleId>
export const getMyChildReportCard = async (req: AuthRequest, res: Response) => {
  try {
    const { term, gradingScale, studentId: requestedStudentId } = req.query;
    if (!term) return res.status(400).json({ message: "term is required" });

    const linkedStudentIds = await getAllLinkedStudentIds(req.user!.id);
    if (linkedStudentIds.length === 0) {
      return res.status(403).json({ message: "No student linked to this account" });
    }

    let targetStudentId = linkedStudentIds[0];
    if (requestedStudentId) {
      if (!linkedStudentIds.includes(requestedStudentId as string)) {
        return res.status(403).json({ message: "You are not authorized to view this student's report card" });
      }
      targetStudentId = requestedStudentId as string;
    }

    if (!(await isStudentResultPublished(targetStudentId, term as string))) {
      return res.status(403).json({ message: "This report card has not been published yet" });
    }

    const data = await buildReportCardData(targetStudentId, term as string, gradingScale as string);
    if (!data) return res.status(404).json({ message: "Report card not found" });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/parent-portal/report-card/pdf?studentId=<id>&term=<termId>&gradingScale=<scaleId>&format=<pdf|html>
export const downloadMyChildReportCardPdf = async (req: AuthRequest, res: Response) => {
  try {
    const { term, gradingScale, format, studentId: requestedStudentId } = req.query;
    if (!term) return res.status(400).json({ message: "term is required" });

    const linkedStudentIds = await getAllLinkedStudentIds(req.user!.id);
    if (linkedStudentIds.length === 0) {
      return res.status(403).json({ message: "No student linked to this account" });
    }

    let targetStudentId = linkedStudentIds[0];
    if (requestedStudentId) {
      if (!linkedStudentIds.includes(requestedStudentId as string)) {
        return res.status(403).json({ message: "You are not authorized to view this student's report card" });
      }
      targetStudentId = requestedStudentId as string;
    }

    if (!(await isStudentResultPublished(targetStudentId, term as string))) {
      return res.status(403).json({ message: "This report card has not been published yet" });
    }

    const data = await buildReportCardData(targetStudentId, term as string, gradingScale as string);
    if (!data) return res.status(404).json({ message: "Report card not found" });

    if (format === "html") {
      const html = buildSingleReportCardHtml(data);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    }

    const pdfBuffer = await generateSingleReportCardPdf(data);

    if (pdfBuffer) {
      const safeAsciiFallback = "report_card.pdf";
      const encodedName = encodeURIComponent(`${data.student.name}_report_card.pdf`);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeAsciiFallback}"; filename*=UTF-8''${encodedName}`
      );
      return res.send(pdfBuffer);
    }

    // Fallback: Return printable standalone HTML
    const html = buildSingleReportCardHtml(data);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/parent-portal/terms
export const getAvailableTerms = async (_req: AuthRequest, res: Response) => {
  try {
    const terms = await Term.find().sort({ session: -1, termNumber: -1 });
    res.status(200).json(terms);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

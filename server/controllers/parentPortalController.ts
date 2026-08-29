import { Response } from "express";
import User from "../models/User";
import Term from "../models/Term";
import { AuthRequest } from "../middleware/auth";
import { buildReportCardData } from "./reportCardController";
import { generateSingleReportCardPdf } from "../utils/generateReportCardPdf";
import { isStudentResultPublished } from "./resultPublicationController";

const getLinkedStudentId = async (userId: string): Promise<string | null> => {
  const user = await User.findById(userId);
  if (!user || !user.linkedStudent) return null;
  return user.linkedStudent.toString();
};

// GET /api/parent-portal/report-card?term=<termId>&gradingScale=<scaleId>
export const getMyChildReportCard = async (req: AuthRequest, res: Response) => {
  try {
    const { term, gradingScale } = req.query;
    if (!term) return res.status(400).json({ message: "term is required" });

    const studentId = await getLinkedStudentId(req.user!.id);
    if (!studentId) {
      return res.status(403).json({ message: "No student linked to this account" });
    }
    if (!(await isStudentResultPublished(studentId, term as string))) {
      return res.status(403).json({ message: "This report card has not been published yet" });
    }

    const data = await buildReportCardData(studentId, term as string, gradingScale as string);
    if (!data) return res.status(404).json({ message: "Report card not found" });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/parent-portal/report-card/pdf?term=<termId>&gradingScale=<scaleId>
export const downloadMyChildReportCardPdf = async (req: AuthRequest, res: Response) => {
  try {
    const { term, gradingScale } = req.query;
    if (!term) return res.status(400).json({ message: "term is required" });

    const studentId = await getLinkedStudentId(req.user!.id);
    if (!studentId) {
      return res.status(403).json({ message: "No student linked to this account" });
    }
    if (!(await isStudentResultPublished(studentId, term as string))) {
      return res.status(403).json({ message: "This report card has not been published yet" });
    }

    const data = await buildReportCardData(studentId, term as string, gradingScale as string);
    if (!data) return res.status(404).json({ message: "Report card not found" });

    const pdfBuffer = await generateSingleReportCardPdf(data);

    // same ASCII-safe header handling as the admin download route
    const safeAsciiFallback = "report_card.pdf";
    const encodedName = encodeURIComponent(`${data.student.name}_report_card.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeAsciiFallback}"; filename*=UTF-8''${encodedName}`
    );
    res.send(pdfBuffer);
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

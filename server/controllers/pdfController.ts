import { Response } from "express";
import Student from "../models/Student";
import { AuthRequest } from "../middleware/auth";
import { buildReportCardData } from "./reportCardController";
import {
  generateSingleReportCardPdf,
  generateBulkReportCardPdf,
} from "../utils/generateReportCardPdf";

// Content-Disposition headers must stay ASCII-safe — a student's name may
// contain Arabic script or other non-ASCII characters, which would crash
// res.setHeader outright. RFC 5987's filename* syntax lets us send a
// UTF-8 filename safely via percent-encoding, with a plain ASCII
// fallback for older clients that don't support it.
const setPdfDownloadHeaders = (res: Response, rawName: string) => {
  const safeAsciiFallback = "report_card.pdf";
  const encodedName = encodeURIComponent(`${rawName}_report_card.pdf`);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeAsciiFallback}"; filename*=UTF-8''${encodedName}`
  );
};

// GET /api/report-card/pdf/single?student=<id>&term=<termId>&gradingScale=<scaleId>
export const downloadSingleReportCardPdf = async (req: AuthRequest, res: Response) => {
  try {
    const { student: studentId, term, gradingScale } = req.query;

    const reportData = await buildReportCardData(
      studentId as string,
      term as string,
      gradingScale as string
    );

    if (!reportData) return res.status(404).json({ message: "Report card data not found" });

    const pdfBuffer = await generateSingleReportCardPdf(reportData);

    setPdfDownloadHeaders(res, reportData.student.name);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/report-card/pdf/bulk?class=<classId>&term=<termId>&gradingScale=<scaleId>
export const downloadBulkReportCardPdf = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, term, gradingScale } = req.query;

    if (!classId || !term) {
      return res.status(400).json({ message: "class and term are required" });
    }

    const students = await Student.find({ class: classId as any }).sort({ numberInClass: 1 });
    if (students.length === 0) {
      return res.status(404).json({ message: "No students found in this class" });
    }

    const reportDataList = [];
    for (const student of students) {
      const data = await buildReportCardData(
        student._id.toString(),
        term as string,
        gradingScale as string
      );
      if (data) reportDataList.push(data);
    }

    if (reportDataList.length === 0) {
      return res.status(404).json({ message: "No report card data found for this class" });
    }

    const pdfBuffer = await generateBulkReportCardPdf(reportDataList);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="class_report_cards.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
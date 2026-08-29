import { Response } from "express";
import Student from "../models/Student";
import { AuthRequest } from "../middleware/auth";
import { buildReportCardData } from "./reportCardController";
import {
  generateSingleReportCardPdf,
  generateBulkReportCardPdf,
} from "../utils/generateReportCardPdf";

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
    const classId = req.query.class as string;
    const term = req.query.term as string;
    const gradingScale = req.query.gradingScale as string;

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
        term,
        gradingScale
      );
      if (data) reportDataList.push(data);
    }

    if (reportDataList.length === 0) {
      return res.status(404).json({ message: "No report card data could be generated" });
    }

    const pdfBuffer = await generateBulkReportCardPdf(reportDataList);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="bulk_report_cards.pdf"'
    );
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

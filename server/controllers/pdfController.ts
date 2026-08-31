import { Response } from "express";
import Student from "../models/Student";
import { AuthRequest } from "../middleware/auth";
import { buildReportCardData } from "./reportCardController";
import {
  generateSingleReportCardPdf,
  generateBulkReportCardPdf,
} from "../utils/generateReportCardPdf";
import {
  buildSingleReportCardHtml,
  buildBulkReportCardHtml,
} from "../utils/reportCardTemplate";

const setPdfDownloadHeaders = (res: Response, rawName: string) => {
  const safeAsciiFallback = "report_card.pdf";
  const encodedName = encodeURIComponent(`${rawName}_report_card.pdf`);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeAsciiFallback}"; filename*=UTF-8''${encodedName}`
  );
};

// GET /api/report-card/pdf/single?student=<id>&term=<termId>&gradingScale=<scaleId>&format=<pdf|html>
export const downloadSingleReportCardPdf = async (req: AuthRequest, res: Response) => {
  try {
    const { student: studentId, term, gradingScale, format } = req.query;

    const reportData = await buildReportCardData(
      studentId as string,
      term as string,
      gradingScale as string
    );

    if (!reportData) return res.status(404).json({ message: "Report card data not found" });

    if (format === "html") {
      const html = buildSingleReportCardHtml(reportData);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    }

    const pdfBuffer = await generateSingleReportCardPdf(reportData);

    if (pdfBuffer) {
      setPdfDownloadHeaders(res, reportData.student.name);
      return res.send(pdfBuffer);
    }

    // Fallback: If Chromium is not available on serverless, return the standalone printable HTML
    const html = buildSingleReportCardHtml(reportData);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/report-card/pdf/bulk?class=<classId>&term=<termId>&gradingScale=<scaleId>&format=<pdf|html>
export const downloadBulkReportCardPdf = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, term, gradingScale, format } = req.query;

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

    if (format === "html") {
      const html = buildBulkReportCardHtml(reportDataList);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    }

    const pdfBuffer = await generateBulkReportCardPdf(reportDataList);

    if (pdfBuffer) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="class_report_cards.pdf"`);
      return res.send(pdfBuffer);
    }

    // Fallback: Standalone multi-page printable HTML
    const html = buildBulkReportCardHtml(reportDataList);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

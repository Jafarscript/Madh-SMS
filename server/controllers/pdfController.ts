import { Response } from "express";
import Student from "../models/Student";
import ClassModel from "../models/Class";
import User from "../models/User";
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
import { isElementaryClass } from "./classController";

const setPdfDownloadHeaders = (res: Response, rawName: string) => {
  const safeAsciiFallback = "report_card.pdf";
  const encodedName = encodeURIComponent(`${rawName}_report_card.pdf`);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeAsciiFallback}"; filename*=UTF-8''${encodedName}`
  );
};

// GET /api/report-card/pdf/single?student=<id>&term=<termId>&gradingScale=<scaleId>&format=<pdf|html>&classCategory=<cat>&isElementary=<bool>
export const downloadSingleReportCardPdf = async (req: AuthRequest, res: Response) => {
  try {
    const { student: studentId, term, gradingScale, format, classCategory, isElementary: qIsElem } = req.query;

    if (!studentId || !term) {
      return res.status(400).json({ message: "student and term are required" });
    }

    const studentDoc = await Student.findById(studentId).select("class branch");
    if (!studentDoc) return res.status(404).json({ message: "Student not found" });

    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (studentDoc.branch && studentDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Student is not in your branch" });
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User.findById(req.user.id);
      const isAssigned = (teacher?.classes || []).some((c) => c.toString() === studentDoc.class.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: "Forbidden: You are not assigned to this student's class" });
      }
    }

    // Direct Class Model lookup to accurately verify elementary category
    let isClassElementary = false;
    if (studentDoc.class) {
      const cls = await ClassModel.findById(studentDoc.class);
      if (cls) {
        isClassElementary =
          cls.category === "elementary" ||
          isElementaryClass(cls.name, cls.category) ||
          isElementaryClass(cls.name);
      }
    }

    const reportData = await buildReportCardData(
      studentId as string,
      term as string,
      gradingScale as string
    );

    if (!reportData) return res.status(404).json({ message: "Report card data not found" });

    if (
      isClassElementary ||
      classCategory === "elementary" ||
      qIsElem === "true" ||
      reportData.isElementary === true ||
      reportData.classCategory === "elementary" ||
      isElementaryClass(reportData.student?.class)
    ) {
      reportData.isElementary = true;
      reportData.classCategory = "elementary";
    }

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

// GET /api/report-card/pdf/bulk?class=<classId>&term=<termId>&gradingScale=<scaleId>&format=<pdf|html>&classCategory=<cat>&isElementary=<bool>
export const downloadBulkReportCardPdf = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, term, gradingScale, format, classCategory, isElementary: qIsElem } = req.query;

    if (!classId || !term) {
      return res.status(400).json({ message: "class and term are required" });
    }

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (cls.branch && cls.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Class does not belong to your branch" });
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User.findById(req.user.id);
      const isAssigned = (teacher?.classes || []).some((c) => c.toString() === classId.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: "Forbidden: You are not assigned to this class" });
      }
    }

    const isClassElementary =
      cls.category === "elementary" ||
      classCategory === "elementary" ||
      qIsElem === "true" ||
      isElementaryClass(cls.name, cls.category) ||
      isElementaryClass(cls.name);

    const students = await Student.find({ class: classId as any, status: "active" }).sort({ numberInClass: 1 });
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
      if (data) {
        if (isClassElementary) {
          data.isElementary = true;
          data.classCategory = "elementary";
        }
        reportDataList.push(data);
      }
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

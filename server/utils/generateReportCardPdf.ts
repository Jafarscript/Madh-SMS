import PDFDocument from "pdfkit";
import { ReportCardData } from "./reportCardTemplate";

export const generateSingleReportCardPdf = async (data: ReportCardData): Promise<Buffer> => {
  return generateSingleReportCardPdfWithPDFKit(data);
};

export const generateBulkReportCardPdf = async (dataList: ReportCardData[]): Promise<Buffer> => {
  return generateBulkReportCardPdfWithPDFKit(dataList);
};

const generateSingleReportCardPdfWithPDFKit = (data: ReportCardData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 30 });
    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // Header
    doc.fontSize(16).fillColor("#0B3D2E").text("INSTITUTE OF ARABIC AND ISLAMIC STUDIES", { align: "center" });
    doc.fontSize(10).fillColor("#C9A227").text("School Management System — Term Report Card", { align: "center" });
    doc.moveDown(0.8);

    // Student Info
    const startY = doc.y;
    doc.rect(30, startY, 535, 45).fillAndStroke("#F4F6F5", "#0B3D2E");
    doc.fontSize(9).fillColor("#0B3D2E");
    doc.text(`Student: ${data.student.name}`, 40, startY + 8);
    doc.text(`Class: ${data.student.class} ${data.student.arm || ""}`, 200, startY + 8);
    doc.text(`Gender: ${data.student.gender === "M" ? "Male" : "Female"}`, 340, startY + 8);
    doc.text(`Roll No: ${data.student.numberInClass || "N/A"}`, 450, startY + 8);

    doc.text(`Session: ${data.term.session}`, 40, startY + 26);
    doc.text(`Term: Term ${data.term.termNumber}`, 200, startY + 26);
    doc.text(`Position: ${data.position ? `${data.position} of ${data.totalStudentsInClass}` : "N/A"}`, 340, startY + 26);
    doc.text(`Result: ${data.result} (${data.overallPercentage}%)`, 450, startY + 26);

    // Subjects Table Header
    const tableTop = startY + 55;
    doc.rect(30, tableTop, 535, 18).fill("#0B3D2E");
    doc.fillColor("#FFFFFF").fontSize(8);
    doc.text("Subject", 35, tableTop + 5, { width: 140 });
    doc.text("CA (40)", 180, tableTop + 5, { width: 50, align: "center" });
    doc.text("Exam (60)", 235, tableTop + 5, { width: 55, align: "center" });
    doc.text("Total", 295, tableTop + 5, { width: 45, align: "center" });
    doc.text("Cum. Avg", 345, tableTop + 5, { width: 55, align: "center" });
    doc.text("Grade", 405, tableTop + 5, { width: 45, align: "center" });
    doc.text("Remark", 455, tableTop + 5, { width: 105, align: "center" });

    let currentY = tableTop + 20;
    data.subjects.forEach((subj, idx) => {
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.rect(30, currentY - 2, 535, 16).fill("#F9FAFB");
      }
      doc.fillColor("#111827").fontSize(8);
      doc.text(subj.nameEnglish, 35, currentY + 2, { width: 140 });
      doc.text(subj.ca !== null ? String(subj.ca) : "-", 180, currentY + 2, { width: 50, align: "center" });
      doc.text(subj.exam !== null ? String(subj.exam) : "-", 235, currentY + 2, { width: 55, align: "center" });
      doc.text(subj.currentTermScore !== null ? String(subj.currentTermScore) : "-", 295, currentY + 2, { width: 45, align: "center" });
      doc.text(subj.cumulativeAverage !== null ? `${subj.cumulativeAverage}%` : "-", 345, currentY + 2, { width: 55, align: "center" });
      doc.text(subj.grade || "-", 405, currentY + 2, { width: 45, align: "center" });
      doc.text(subj.remark || "-", 455, currentY + 2, { width: 105, align: "center" });
      currentY += 16;
    });

    // Summary Box
    const summaryY = currentY + 12;
    doc.rect(30, summaryY, 535, 38).fillAndStroke("#FAF6EE", "#C9A227");
    doc.fontSize(8).fillColor("#0B3D2E");
    doc.text(`Total Score: ${data.overallTotal}`, 45, summaryY + 8);
    doc.text(`Overall Average: ${data.overallPercentage}%`, 180, summaryY + 8);
    doc.text(`Final Status: ${data.result}`, 330, summaryY + 8);
    doc.text(`Rank: ${data.position || "N/A"} / ${data.totalStudentsInClass}`, 440, summaryY + 8);

    if (data.classTeacherComment) {
      doc.fontSize(7.5).fillColor("#374151");
      doc.text(`Teacher Remark: "${data.classTeacherComment.en}"`, 45, summaryY + 22, { width: 480 });
    }

    doc.end();
  });
};

const generateBulkReportCardPdfWithPDFKit = (dataList: ReportCardData[]): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 30, autoFirstPage: false });
    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    dataList.forEach((data) => {
      doc.addPage();
      // Header
      doc.fontSize(16).fillColor("#0B3D2E").text("INSTITUTE OF ARABIC AND ISLAMIC STUDIES", { align: "center" });
      doc.fontSize(10).fillColor("#C9A227").text("School Management System — Term Report Card", { align: "center" });
      doc.moveDown(0.8);

      // Student Info
      const startY = doc.y;
      doc.rect(30, startY, 535, 45).fillAndStroke("#F4F6F5", "#0B3D2E");
      doc.fontSize(9).fillColor("#0B3D2E");
      doc.text(`Student: ${data.student.name}`, 40, startY + 8);
      doc.text(`Class: ${data.student.class} ${data.student.arm || ""}`, 200, startY + 8);
      doc.text(`Gender: ${data.student.gender === "M" ? "Male" : "Female"}`, 340, startY + 8);
      doc.text(`Roll No: ${data.student.numberInClass || "N/A"}`, 450, startY + 8);

      doc.text(`Session: ${data.term.session}`, 40, startY + 26);
      doc.text(`Term: Term ${data.term.termNumber}`, 200, startY + 26);
      doc.text(`Position: ${data.position ? `${data.position} of ${data.totalStudentsInClass}` : "N/A"}`, 340, startY + 26);
      doc.text(`Result: ${data.result} (${data.overallPercentage}%)`, 450, startY + 26);

      // Table
      const tableTop = startY + 55;
      doc.rect(30, tableTop, 535, 18).fill("#0B3D2E");
      doc.fillColor("#FFFFFF").fontSize(8);
      doc.text("Subject", 35, tableTop + 5, { width: 140 });
      doc.text("CA (40)", 180, tableTop + 5, { width: 50, align: "center" });
      doc.text("Exam (60)", 235, tableTop + 5, { width: 55, align: "center" });
      doc.text("Total", 295, tableTop + 5, { width: 45, align: "center" });
      doc.text("Cum. Avg", 345, tableTop + 5, { width: 55, align: "center" });
      doc.text("Grade", 405, tableTop + 5, { width: 45, align: "center" });
      doc.text("Remark", 455, tableTop + 5, { width: 105, align: "center" });

      let currentY = tableTop + 20;
      data.subjects.forEach((subj, idx) => {
        const isEven = idx % 2 === 0;
        if (isEven) {
          doc.rect(30, currentY - 2, 535, 16).fill("#F9FAFB");
        }
        doc.fillColor("#111827").fontSize(8);
        doc.text(subj.nameEnglish, 35, currentY + 2, { width: 140 });
        doc.text(subj.ca !== null ? String(subj.ca) : "-", 180, currentY + 2, { width: 50, align: "center" });
        doc.text(subj.exam !== null ? String(subj.exam) : "-", 235, currentY + 2, { width: 55, align: "center" });
        doc.text(subj.currentTermScore !== null ? String(subj.currentTermScore) : "-", 295, currentY + 2, { width: 45, align: "center" });
        doc.text(subj.cumulativeAverage !== null ? `${subj.cumulativeAverage}%` : "-", 345, currentY + 2, { width: 55, align: "center" });
        doc.text(subj.grade || "-", 405, currentY + 2, { width: 45, align: "center" });
        doc.text(subj.remark || "-", 455, currentY + 2, { width: 105, align: "center" });
        currentY += 16;
      });

      const summaryY = currentY + 12;
      doc.rect(30, summaryY, 535, 38).fillAndStroke("#FAF6EE", "#C9A227");
      doc.fontSize(8).fillColor("#0B3D2E");
      doc.text(`Total Score: ${data.overallTotal}`, 45, summaryY + 8);
      doc.text(`Overall Average: ${data.overallPercentage}%`, 180, summaryY + 8);
      doc.text(`Final Status: ${data.result}`, 330, summaryY + 8);
      doc.text(`Rank: ${data.position || "N/A"} / ${data.totalStudentsInClass}`, 440, summaryY + 8);

      if (data.classTeacherComment) {
        doc.fontSize(7.5).fillColor("#374151");
        doc.text(`Teacher Remark: "${data.classTeacherComment.en}"`, 45, summaryY + 22, { width: 480 });
      }
    });

    doc.end();
  });
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from "react";
import { Upload, Download, AlertCircle, CheckCircle2, X, FileSpreadsheet, RefreshCw } from "lucide-react";

interface Student {
  _id: string;
  name: string;
  numberInClass?: number;
}

interface ParsedRow {
  studentId?: string;
  studentName: string;
  numberInClass?: number;
  ca: string;
  exam: string;
  total: string;
  status: "valid" | "warning" | "error";
  errorMessage?: string;
}

interface BulkScoreUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentScores?: Record<string, { ca: string; exam: string }>;
  subjectName: string;
  className: string;
  termName: string;
  onApply: (parsedEntries: Record<string, { ca: string; exam: string }>) => void;
}

export const BulkScoreUploadModal: React.FC<BulkScoreUploadModalProps> = ({
  isOpen,
  onClose,
  students,
  currentScores = {},
  subjectName,
  className,
  termName,
  onApply,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [autoSplitTotals, setAutoSplitTotals] = useState(true);
  const [hasParsed, setHasParsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const headers = ["NoInClass", "StudentName", "CA_40", "Exam_60", "Total_100"];
    const sorted = [...students].sort((a, b) => (a.numberInClass || 0) - (b.numberInClass || 0));
    
    const csvContent = [
      headers.join(","),
      ...sorted.map((s) => {
        const cur = currentScores[s._id] || { ca: "", exam: "" };
        const total = (cur.ca !== "" || cur.exam !== "") 
          ? String((cur.ca !== "" ? Number(cur.ca) : 0) + (cur.exam !== "" ? Number(cur.exam) : 0))
          : "";
        // Sanitize name with quotes if it contains commas
        const safeName = s.name.includes(",") ? `"${s.name}"` : s.name;
        return `${s.numberInClass || ""},${safeName},${cur.ca},${cur.exam},${total}`;
      }),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${subjectName}_${className}_Scores_Template.csv`.replace(/\s+/g, "_");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCsvText = (text: string) => {
    // Split lines cleanly
    const rawLines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
    if (rawLines.length === 0) return;

    // Detect delimiter: comma, tab, or semicolon
    const firstLine = rawLines[0];
    let delimiter = ",";
    if (firstLine.includes("\t")) delimiter = "\t";
    else if (firstLine.includes(";")) delimiter = ";";

    // Helper to parse CSV line handling quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === delimiter && !inQuotes) {
          result.push(cur.trim());
          cur = "";
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headerParts = parseLine(rawLines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    
    // Find column indexes
    let noIdx = headerParts.findIndex((h) => h.includes("no") || h.includes("num") || h.includes("number"));
    let nameIdx = headerParts.findIndex((h) => h.includes("name") || h.includes("student"));
    let caIdx = headerParts.findIndex((h) => h.includes("ca") || h.includes("test") || h.includes("cont"));
    let examIdx = headerParts.findIndex((h) => h.includes("exam") || h.includes("final"));
    let totalIdx = headerParts.findIndex((h) => h.includes("total") || h.includes("score") || h.includes("mark"));

    // Fallback if headers not named standardly
    if (nameIdx === -1 && headerParts.length >= 2) nameIdx = 1;
    if (noIdx === -1 && headerParts.length >= 1 && !isNaN(Number(headerParts[0]))) noIdx = 0;
    if (caIdx === -1 && headerParts.length >= 3) caIdx = 2;
    if (examIdx === -1 && headerParts.length >= 4) examIdx = 3;
    if (totalIdx === -1 && headerParts.length >= 5) totalIdx = 4;

    const dataLines = rawLines.slice(1);
    const parsedRows: ParsedRow[] = [];

    dataLines.forEach((line) => {
      const cols = parseLine(line);
      if (cols.length === 0 || cols.every((c) => c === "")) return;

      const rawNo = noIdx !== -1 ? Number(cols[noIdx]) : NaN;
      const rawName = nameIdx !== -1 ? cols[nameIdx] : "";
      let rawCa = caIdx !== -1 ? cols[caIdx] : "";
      let rawExam = examIdx !== -1 ? cols[examIdx] : "";
      let rawTotal = totalIdx !== -1 ? cols[totalIdx] : "";

      // Match student in class
      let matchedStudent: Student | undefined;
      if (!isNaN(rawNo) && rawNo > 0) {
        matchedStudent = students.find((s) => s.numberInClass === rawNo);
      }
      if (!matchedStudent && rawName) {
        const cleanName = rawName.trim().toLowerCase();
        matchedStudent = students.find((s) => s.name.trim().toLowerCase() === cleanName);
        if (!matchedStudent) {
          matchedStudent = students.find((s) => s.name.toLowerCase().includes(cleanName) || cleanName.includes(s.name.toLowerCase()));
        }
      }

      // Auto-split total if enabled and CA/Exam are empty
      if (autoSplitTotals && rawTotal && (!rawCa || !rawExam)) {
        const totalNum = Number(rawTotal);
        if (!isNaN(totalNum)) {
          const clamped = Math.max(0, Math.min(100, totalNum));
          const autoCa = Math.round(clamped * 0.4);
          const autoExam = clamped - autoCa;
          rawCa = String(autoCa);
          rawExam = String(autoExam);
        }
      } else if (rawCa !== "" || rawExam !== "") {
        const caNum = rawCa !== "" ? Number(rawCa) : 0;
        const examNum = rawExam !== "" ? Number(rawExam) : 0;
        rawTotal = String(caNum + examNum);
      }

      // Validation
      let status: "valid" | "warning" | "error" = "valid";
      let errorMessage: string | undefined;

      if (!matchedStudent) {
        status = "error";
        errorMessage = `Could not match student '${rawName || `#${rawNo}`}' in this class`;
      } else {
        const caNum = rawCa !== "" ? Number(rawCa) : null;
        const examNum = rawExam !== "" ? Number(rawExam) : null;

        if (caNum !== null && (isNaN(caNum) || caNum < 0 || caNum > 40)) {
          status = "error";
          errorMessage = `CA score must be between 0 and 40 (got ${rawCa})`;
        } else if (examNum !== null && (isNaN(examNum) || examNum < 0 || examNum > 60)) {
          status = "error";
          errorMessage = `Exam score must be between 0 and 60 (got ${rawExam})`;
        } else if (caNum === null && examNum === null) {
          status = "warning";
          errorMessage = "No scores entered for this row";
        }
      }

      parsedRows.push({
        studentId: matchedStudent?._id,
        studentName: matchedStudent ? matchedStudent.name : (rawName || `Row #${parsedRows.length + 1}`),
        numberInClass: matchedStudent ? matchedStudent.numberInClass : (!isNaN(rawNo) ? rawNo : undefined),
        ca: rawCa,
        exam: rawExam,
        total: rawTotal,
        status,
        errorMessage,
      });
    });

    setRows(parsedRows);
    setHasParsed(true);
  };

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    const output: Record<string, { ca: string; exam: string }> = {};
    rows.forEach((r) => {
      if (r.studentId && r.status !== "error") {
        output[r.studentId] = {
          ca: r.ca || "",
          exam: r.exam || "",
        };
      }
    });
    onApply(output);
    onClose();
  };

  const validCount = rows.filter((r) => r.status === "valid").length;
  const warningCount = rows.filter((r) => r.status === "warning").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: "#F4F1EA" }}>
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-800" />
              Bulk Score Upload (CSV / Excel)
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {subjectName} • {className} • {termName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Step 1: Actions & Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-emerald-950 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-800" />
                  1. Download Student Roster Template
                </h4>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Download a pre-filled CSV with your class student names and IDs ready for score entry.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="mt-3 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV Template ({students.length} Students)
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                dragActive
                  ? "border-emerald-600 bg-emerald-50/50"
                  : "border-gray-300 hover:border-emerald-600 bg-gray-50/50 hover:bg-emerald-50/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-7 h-7 text-emerald-800 mb-1.5" />
              <p className="text-xs font-semibold text-gray-800">
                {fileName ? fileName : "2. Click or Drag & Drop completed CSV here"}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">Supports CSV files exported from Excel or Sheets</p>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200/80 text-xs">
            <label className="flex items-center gap-2 text-gray-700 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={autoSplitTotals}
                onChange={(e) => setAutoSplitTotals(e.target.checked)}
                className="rounded text-emerald-700 focus:ring-emerald-500"
              />
              <span>Auto-split <strong>Total</strong> into <strong>40% CA</strong> and <strong>60% Exam</strong> if CA/Exam are omitted</span>
            </label>
            {hasParsed && (
              <span className="text-gray-500 font-mono text-[11px]">
                {rows.length} rows parsed
              </span>
            )}
          </div>

          {/* Preview Section */}
          {hasParsed && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Score Verification & Preview
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} Valid
                  </span>
                  {warningCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-medium px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5" /> {warningCount} Empty
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-red-700 font-medium px-2 py-0.5 rounded-full bg-red-50 border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5" /> {errorCount} Invalid
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs max-h-64 overflow-y-auto overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[500px] text-xs text-left">
                  <thead className="bg-gray-100 text-gray-600 sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center">No</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3 w-20 text-center">CA (40)</th>
                      <th className="py-2 px-3 w-20 text-center">Exam (60)</th>
                      <th className="py-2 px-3 w-20 text-center">Total (100)</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {rows.map((r, i) => (
                      <tr
                        key={i}
                        className={
                          r.status === "error"
                            ? "bg-red-50/50"
                            : r.status === "warning"
                            ? "bg-amber-50/30"
                            : "hover:bg-gray-50"
                        }
                      >
                        <td className="py-2 px-3 text-center text-gray-400 font-mono">
                          {r.numberInClass ?? "-"}
                        </td>
                        <td className="py-2 px-3 font-medium text-gray-800">
                          {r.studentName}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-semibold text-gray-700">
                          {r.ca || "-"}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-semibold text-gray-700">
                          {r.exam || "-"}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-800">
                          {r.total || "-"}
                        </td>
                        <td className="py-2 px-3">
                          {r.status === "valid" && (
                            <span className="text-emerald-700 font-medium inline-flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </span>
                          )}
                          {r.status === "warning" && (
                            <span className="text-amber-700 text-[11px]">
                              {r.errorMessage}
                            </span>
                          )}
                          {r.status === "error" && (
                            <span className="text-red-700 font-medium text-[11px] flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {r.errorMessage}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 rounded-lg transition"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {hasParsed && (
              <button
                type="button"
                onClick={handleApply}
                disabled={validCount === 0}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Apply {validCount} Scores to Table
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkScoreUploadModal;

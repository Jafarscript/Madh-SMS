import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, Users, X, Printer } from "lucide-react";
import api from "../../api/axios";
import { PrintableCredentialSlips, CredentialSlip } from "./PrintableCredentialSlips";

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
  branch: { _id: string; name: string };
}

interface ParsedStudentRow {
  name: string;
  gender: "M" | "F";
  admissionNumber?: string;
  parentPhone?: string;
  parentEmail?: string;
  className?: string;
  classId?: string;
  isValid: boolean;
  validationError?: string;
}

interface Props {
  classes: ClassItem[];
  defaultClassId?: string;
  onImportComplete?: (classId: string) => void;
  onClose: () => void;
}

export const BulkStudentUploader: React.FC<Props> = ({
  classes,
  defaultClassId,
  onImportComplete,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [targetClassId, setTargetClassId] = useState(defaultClassId || classes[0]?._id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultSlips, setResultSlips] = useState<CredentialSlip[] | null>(null);

  const downloadSampleTemplate = (format: "csv" | "xlsx") => {
    const selectedClassObj = classes.find((c) => c._id === targetClassId);
    const sampleData = [
      {
        "Student Full Name": "Ahmad Abdullah",
        "Gender (M or F)": "M",
        "Admission Number (Optional)": "IAIS/2026/001",
        "Parent Phone": "08012345678",
        "Parent Email": "parent1@gmail.com",
        "Class Name (Optional)": selectedClassObj?.name || "Primary 1",
      },
      {
        "Student Full Name": "Fatima Zaid",
        "Gender (M or F)": "F",
        "Admission Number (Optional)": "IAIS/2026/002",
        "Parent Phone": "08098765432",
        "Parent Email": "parent2@gmail.com",
        "Class Name (Optional)": selectedClassObj?.name || "Primary 1",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students_Template");

    if (format === "xlsx") {
      XLSX.writeFile(workbook, "Student_Enrollment_Template.xlsx");
    } else {
      XLSX.writeFile(workbook, "Student_Enrollment_Template.csv", { bookType: "csv" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (rawJson.length === 0) {
          setError("The uploaded spreadsheet contains no student data rows.");
          setParsedRows([]);
          return;
        }

        const rows: ParsedStudentRow[] = rawJson.map((row) => {
          const name = (
            row["Student Full Name"] ||
            row["Full Name"] ||
            row["Name"] ||
            row["Student Name"] ||
            row["name"] ||
            ""
          ).toString().trim();

          const rawGender = (
            row["Gender (M or F)"] ||
            row["Gender"] ||
            row["gender"] ||
            "M"
          ).toString().trim().toUpperCase();

          const gender: "M" | "F" = rawGender.startsWith("F") ? "F" : "M";

          const admissionNumber = (
            row["Admission Number (Optional)"] ||
            row["Admission Number"] ||
            row["Admission No"] ||
            row["Adm No"] ||
            row["admissionNumber"] ||
            ""
          ).toString().trim();

          const parentPhone = (
            row["Parent Phone"] ||
            row["Phone"] ||
            row["Guardian Phone"] ||
            row["parentPhone"] ||
            ""
          ).toString().trim();

          const parentEmail = (
            row["Parent Email"] ||
            row["Email"] ||
            row["parentEmail"] ||
            ""
          ).toString().trim();

          const className = (
            row["Class Name (Optional)"] ||
            row["Class"] ||
            row["Class Name"] ||
            row["class"] ||
            ""
          ).toString().trim();

          let classId = targetClassId;
          if (className) {
            const matchedClass = classes.find(
              (c) =>
                c.name.toLowerCase() === className.toLowerCase() ||
                `${c.name} ${c.arm || ""}`.trim().toLowerCase() === className.toLowerCase()
            );
            if (matchedClass) classId = matchedClass._id;
          }

          const isValid = name.length >= 2;
          const validationError = !isValid ? "Student Full Name is required" : undefined;

          return {
            name,
            gender,
            admissionNumber: admissionNumber || undefined,
            parentPhone: parentPhone || undefined,
            parentEmail: parentEmail || undefined,
            className,
            classId,
            isValid,
            validationError,
          };
        });

        setParsedRows(rows);
      } catch (err) {
        console.error("Student sheet parse error", err);
        setError("Failed to read file. Please ensure it is a valid CSV or Excel file.");
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleCommitImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setError("No valid students found to enroll.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const selectedClassObj = classes.find((c) => c._id === targetClassId);
      const branchId = selectedClassObj?.branch?._id || classes[0]?.branch?._id;

      const payload = {
        class: targetClassId,
        branch: branchId,
        students: validRows.map((r) => ({
          name: r.name,
          gender: r.gender,
          admissionNumber: r.admissionNumber,
          parentPhone: r.parentPhone,
          parentEmail: r.parentEmail,
        })),
      };

      const res = await api.post("/students/bulk", payload);
      const createdStudents = res.data?.students || [];

      // Build printable slips / ID badges
      const slips: CredentialSlip[] = (createdStudents.length > 0 ? createdStudents : validRows).map(
        (s: any, idx: number) => ({
          id: s._id || `s-${idx}`,
          name: s.name,
          role: "Student",
          email: s.studentCode || s.parentEmail || "",
          admissionNumber: s.admissionNumber || `ADM-${idx + 1}`,
          className: selectedClassObj ? `${selectedClassObj.name} ${selectedClassObj.arm ? `(${selectedClassObj.arm})` : ""}` : "",
          branchName: selectedClassObj?.branch?.name,
        })
      );

      setResultSlips(slips);
      setParsedRows([]);
      setSelectedFile(null);
      if (onImportComplete) onImportComplete(targetClassId);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to bulk enroll students.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-sky-50/50">
          <div>
            <h3 className="text-base font-bold text-sky-950 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-sky-600" />
              Bulk Student Enrollment & Admission
            </h3>
            <p className="text-xs text-sky-800/80 mt-0.5">
              Upload 50-200+ students from Excel or CSV. Admission numbers and class roll numbers will be allocated automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Target class selection & templates */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Enrollment Class *
              </label>
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.arm ? `(${c.arm})` : ""} {c.branch?.name ? `• ${c.branch.name}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-4 sm:pt-0">
              <button
                type="button"
                onClick={() => downloadSampleTemplate("xlsx")}
                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-white text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" /> Excel Template
              </button>
              <button
                type="button"
                onClick={() => downloadSampleTemplate("csv")}
                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-white text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-sky-600" /> CSV Template
              </button>
            </div>
          </div>

          {/* Drag & Drop Dropzone */}
          <div className="border-2 border-dashed border-sky-200 hover:border-sky-400 bg-sky-50/30 rounded-2xl p-6 text-center transition relative cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-2.5">
              <Upload className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              {selectedFile ? selectedFile.name : "Select or drag & drop student spreadsheet"}
            </h4>
            <p className="text-[11px] text-slate-500">
              Supports Excel (.xlsx, .xls) and CSV (.csv) format
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Pre-upload Table */}
          {parsedRows.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Ready to enroll ({parsedRows.filter((r) => r.isValid).length} students)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setSelectedFile(null);
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 underline"
                >
                  Clear Selection
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[550px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3">Gender</th>
                      <th className="py-2 px-3">Adm No.</th>
                      <th className="py-2 px-3">Parent Contact</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className={r.isValid ? "hover:bg-slate-50" : "bg-rose-50"}>
                        <td className="py-2 px-3 text-slate-400 font-mono">{i + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{r.name}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.gender === "M" ? "bg-sky-100 text-sky-800" : "bg-pink-100 text-pink-800"
                          }`}>
                            {r.gender === "M" ? "Male" : "Female"}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {r.admissionNumber || <span className="text-slate-400 italic font-sans">Auto</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {r.parentPhone || r.parentEmail || "—"}
                        </td>
                        <td className="py-2 px-3">
                          {r.isValid ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Ready
                            </span>
                          ) : (
                            <span className="text-rose-700 font-semibold">{r.validationError}</span>
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

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCommitImport}
            disabled={loading || parsedRows.filter((r) => r.isValid).length === 0}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            {loading ? "Enrolling Students..." : `Enroll ${parsedRows.filter((r) => r.isValid).length} Students`}
          </button>
        </div>
      </div>

      {/* Result Slips / Badge Slip Dialog */}
      {resultSlips && (
        <PrintableCredentialSlips
          title="Student Admission Slips"
          subtitle={`Successfully enrolled ${resultSlips.length} students. Print or export student verification slips.`}
          slips={resultSlips}
          onClose={() => {
            setResultSlips(null);
            onClose();
          }}
          type="student"
        />
      )}
    </div>
  );
};

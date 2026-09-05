import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, Trash2, Printer, Users } from "lucide-react";
import api from "../../api/axios";
import { PrintableCredentialSlips, CredentialSlip } from "./PrintableCredentialSlips";

interface Branch {
  _id: string;
  name: string;
}

interface ParsedStaffRow {
  name: string;
  email?: string;
  role?: string;
  phone?: string;
  branchName?: string;
  branchId?: string;
  password?: string;
  isValid: boolean;
  validationError?: string;
}

interface Props {
  branches: Branch[];
  onImportComplete?: () => void;
}

export const BulkStaffUploader: React.FC<Props> = ({ branches, onImportComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStaffRow[]>([]);
  const [defaultBranch, setDefaultBranch] = useState(branches[0]?._id || "");
  const [defaultRole, setDefaultRole] = useState<"class_teacher" | "subject_teacher">("subject_teacher");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultSlips, setResultSlips] = useState<CredentialSlip[] | null>(null);

  const downloadSampleTemplate = (format: "csv" | "xlsx") => {
    const sampleData = [
      {
        "Full Name": "Ustadh Muhammad Usman",
        "Email Address (Optional)": "muhammad.usman@school.com",
        "Role (class_teacher or subject_teacher)": "subject_teacher",
        "Phone / WhatsApp": "08012345678",
        "Campus Branch (Optional)": branches[0]?.name || "Main Campus",
        "Initial Password (Optional)": "",
      },
      {
        "Full Name": "Ustadha Maryam Bello",
        "Email Address (Optional)": "",
        "Role (class_teacher or subject_teacher)": "class_teacher",
        "Phone / WhatsApp": "08098765432",
        "Campus Branch (Optional)": branches[0]?.name || "Main Campus",
        "Initial Password (Optional)": "Bello2026!",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff_Template");

    if (format === "xlsx") {
      XLSX.writeFile(workbook, "Staff_Bulk_Upload_Template.xlsx");
    } else {
      XLSX.writeFile(workbook, "Staff_Bulk_Upload_Template.csv", { bookType: "csv" });
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
          setError("The uploaded spreadsheet contains no data rows.");
          setParsedRows([]);
          return;
        }

        const rows: ParsedStaffRow[] = rawJson.map((row) => {
          // Normalize column headers
          const name = (
            row["Full Name"] ||
            row["Name"] ||
            row["Staff Name"] ||
            row["Teacher Name"] ||
            row["name"] ||
            ""
          ).toString().trim();

          const email = (
            row["Email Address (Optional)"] ||
            row["Email"] ||
            row["Email Address"] ||
            row["email"] ||
            ""
          ).toString().trim();

          const rawRole = (
            row["Role (class_teacher or subject_teacher)"] ||
            row["Role"] ||
            row["role"] ||
            ""
          ).toString().trim().toLowerCase();

          let role = defaultRole;
          if (rawRole.includes("class")) role = "class_teacher";
          else if (rawRole.includes("subject")) role = "subject_teacher";
          else if (rawRole.includes("admin")) role = "class_teacher";

          const phone = (
            row["Phone / WhatsApp"] ||
            row["Phone"] ||
            row["phone"] ||
            ""
          ).toString().trim();

          const branchName = (
            row["Campus Branch (Optional)"] ||
            row["Branch"] ||
            row["Campus"] ||
            row["branch"] ||
            ""
          ).toString().trim();

          const password = (
            row["Initial Password (Optional)"] ||
            row["Password"] ||
            row["password"] ||
            ""
          ).toString().trim();

          let branchId = defaultBranch;
          if (branchName) {
            const matchedBranch = branches.find(
              (b) => b.name.toLowerCase() === branchName.toLowerCase()
            );
            if (matchedBranch) branchId = matchedBranch._id;
          }

          const isValid = name.length >= 2;
          const validationError = !isValid ? "Full Name is required (min 2 characters)" : undefined;

          return {
            name,
            email,
            role,
            phone,
            branchName,
            branchId,
            password,
            isValid,
            validationError,
          };
        });

        setParsedRows(rows);
      } catch (err) {
        console.error("Spreadsheet parse error", err);
        setError("Could not parse file. Please upload a valid CSV or Excel file.");
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleCommitImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setError("No valid staff rows to import.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        staffList: validRows.map((r) => ({
          name: r.name,
          email: r.email || undefined,
          role: r.role || defaultRole,
          phone: r.phone || undefined,
          branch: r.branchId || defaultBranch || undefined,
          password: r.password || undefined,
        })),
        defaultBranchId: defaultBranch || undefined,
        defaultRole,
      };

      const res = await api.post("/users/bulk-staff", payload);
      const createdUsers = res.data?.users || [];

      // Build credential slips for distribution
      const slips: CredentialSlip[] = createdUsers.map((u: any) => {
        const branchObj = branches.find((b) => b._id === u.branch);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          branchName: branchObj?.name,
          initialPassword: u.initialPassword,
        };
      });

      setResultSlips(slips);
      setParsedRows([]);
      setSelectedFile(null);
      if (onImportComplete) onImportComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to import staff members.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-sky-600" />
              Bulk Staff & Teacher Spreadsheet Onboarding
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload an Excel (.xlsx) or CSV file with 50-200+ staff members. Accounts and login credentials will be generated automatically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadSampleTemplate("xlsx")}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" /> Excel Template (.xlsx)
            </button>
            <button
              type="button"
              onClick={() => downloadSampleTemplate("csv")}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" /> CSV Template
            </button>
          </div>
        </div>

        {/* Global defaults */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Fallback Campus / Branch (for rows without branch)
            </label>
            <select
              value={defaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
              className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
            >
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Fallback Designation / Role
            </label>
            <select
              value={defaultRole}
              onChange={(e) => setDefaultRole(e.target.value as any)}
              className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="subject_teacher">Subject Teacher</option>
              <option value="class_teacher">Class Teacher</option>
            </select>
          </div>
        </div>

        {/* File Drag and Drop Zone */}
        <div className="border-2 border-dashed border-sky-200 hover:border-sky-400 bg-sky-50/40 rounded-2xl p-8 text-center transition relative cursor-pointer">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">
            {selectedFile ? selectedFile.name : "Click or drag & drop staff spreadsheet here"}
          </h4>
          <p className="text-xs text-slate-500">
            Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Data Preview ({parsedRows.length} staff members parsed)
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {parsedRows.filter((r) => r.isValid).length} Valid
              </span>
              {parsedRows.some((r) => !r.isValid) && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {parsedRows.filter((r) => !r.isValid).length} Incomplete
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setParsedRows([]);
                  setSelectedFile(null);
                }}
                className="text-xs text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleCommitImport}
                disabled={loading || parsedRows.filter((r) => r.isValid).length === 0}
                className="px-5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                {loading ? "Creating Accounts..." : `Confirm & Create ${parsedRows.filter((r) => r.isValid).length} Accounts`}
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[600px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((r, i) => (
                  <tr key={i} className={r.isValid ? "hover:bg-slate-50" : "bg-rose-50/50"}>
                    <td className="py-2 px-3 text-slate-400 font-mono">{i + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{r.name}</td>
                    <td className="py-2 px-3 text-slate-600 font-mono">
                      {r.email || <span className="text-slate-400 italic font-sans">Auto-generate</span>}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {r.role === "class_teacher" ? "Class Teacher" : "Subject Teacher"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{r.phone || "—"}</td>
                    <td className="py-2 px-3">
                      {r.isValid ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Ready
                        </span>
                      ) : (
                        <span className="text-rose-700 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> {r.validationError}
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

      {/* Printable Credential Slips Modal after successful creation */}
      {resultSlips && (
        <PrintableCredentialSlips
          title="Staff Account Credentials Created"
          subtitle={`Successfully provisioned ${resultSlips.length} staff accounts. Print or distribute these credentials.`}
          slips={resultSlips}
          onClose={() => setResultSlips(null)}
          type="staff"
        />
      )}
    </div>
  );
};

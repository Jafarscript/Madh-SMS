import { Printer, Download, CheckCircle, X, ShieldCheck } from "lucide-react";

export interface CredentialSlip {
  id?: string;
  name: string;
  email: string;
  role: string;
  branchName?: string;
  initialPassword?: string;
  admissionNumber?: string;
  className?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  slips: CredentialSlip[];
  onClose: () => void;
  type?: "staff" | "student";
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  branch_admin: "Branch Admin",
  class_teacher: "Class Teacher",
  subject_teacher: "Subject Teacher",
  parent: "Parent / Guardian",
};

export const PrintableCredentialSlips = ({
  title,
  subtitle,
  slips,
  onClose,
  type = "staff",
}: Props) => {
  const handlePrint = () => {
    window.print();
  };

  const downloadAsText = () => {
    let content = `${title.toUpperCase()}\nGenerated on: ${new Date().toLocaleString()}\n${"=".repeat(60)}\n\n`;

    slips.forEach((s, idx) => {
      content += `[#${idx + 1}] ${s.name}\n`;
      if (s.email) content += `Email / Username: ${s.email}\n`;
      if (s.initialPassword) content += `Initial Password: ${s.initialPassword}\n`;
      if (s.role) content += `Role: ${roleLabels[s.role] || s.role}\n`;
      if (s.branchName) content += `Campus: ${s.branchName}\n`;
      if (s.admissionNumber) content += `Admission No: ${s.admissionNumber}\n`;
      if (s.className) content += `Class: ${s.className}\n`;
      content += `${"-".repeat(40)}\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type}_credentials_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {subtitle || `Generated ${slips.length} account credential slips. Print or export for distribution.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadAsText}
              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" /> Export Text
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print Slips
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slips Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="printable-slips-container">
            {slips.map((slip, index) => (
              <div
                key={slip.id || index}
                className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-5 shadow-sm relative overflow-hidden"
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-sky-900 tracking-wider uppercase">
                      Institute of Arabic & Islamic Studies
                    </p>
                    <p className="text-[9px] text-slate-400 font-serif">معهد التعليم العربي الإسلامي</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 uppercase tracking-wide">
                    {slip.role ? (roleLabels[slip.role] || slip.role) : "Student"}
                  </span>
                </div>

                {/* Slip Details */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Full Name:</span>
                    <strong className="text-slate-900 text-sm font-semibold">{slip.name}</strong>
                  </div>

                  {slip.email && (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Login Email / Username:</span>
                        <span className="font-mono font-medium text-slate-800">{slip.email}</span>
                      </div>
                    </div>
                  )}

                  {slip.initialPassword && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 block uppercase">Temporary Password:</span>
                        <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                          {slip.initialPassword}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Change on 1st login
                      </span>
                    </div>
                  )}

                  {slip.admissionNumber && (
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Admission Number:</span>
                        <span className="font-mono font-bold text-slate-900">{slip.admissionNumber}</span>
                      </div>
                      {slip.className && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Assigned Class:</span>
                          <span className="font-semibold text-sky-700">{slip.className}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {slip.branchName && (
                    <div className="text-[11px] text-slate-500 pt-1">
                      Campus: <strong className="text-slate-700">{slip.branchName}</strong>
                    </div>
                  )}
                </div>

                {/* Footer instructions */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Portal Login URL: /login</span>
                  <span>Confidential Slip #{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Total Slips: <strong>{slips.length}</strong>. Slips are formatted to fit standard cutouts on A4 paper.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};

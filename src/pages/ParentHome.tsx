/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ReportCardView from "../components/ReportCardView";
import type { ReportCardData } from "../types/reportCard";
import { Users, Plus, CheckCircle, AlertCircle, Sparkles, GraduationCap, X, ChevronRight } from "lucide-react";

interface Term {
  _id: string;
  session: string;
  termNumber: number;
  isActive: boolean;
}

interface LinkedChild {
  _id: string;
  name: string;
  admissionNumber?: string;
  gender?: "M" | "F";
  class?: {
    _id: string;
    name: string;
    arm?: string;
    branch?: {
      name: string;
    };
  };
}

const ParentHome = () => {
  const { user, logout } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [reportData, setReportData] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  // Link another child modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkStudentName, setLinkStudentName] = useState("");
  const [linkIdentifier, setLinkIdentifier] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");

  const fetchChildren = async () => {
    try {
      const res = await api.get("/parent-portal/children");
      setChildren(res.data || []);
      if (res.data && res.data.length > 0 && !selectedChildId) {
        setSelectedChildId(res.data[0]._id);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchChildren();
    api.get("/parent-portal/terms").then((res) => {
      setTerms(res.data);
      const active = res.data.find((t: Term) => t.isActive);
      if (active) setSelectedTerm(active._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedTerm) return;
    setError("");
    setLoading(true);
    setReportData(null);
    const queryParams = new URLSearchParams({ term: selectedTerm });
    if (selectedChildId) queryParams.append("studentId", selectedChildId);

    api
      .get(`/parent-portal/report-card?${queryParams.toString()}`)
      .then((res) => setReportData(res.data))
      .catch((err) => {
        setError(err.response?.data?.message || "No report card found for this term");
      })
      .finally(() => setLoading(false));
  }, [selectedTerm, selectedChildId]);

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinking(true);
    setLinkError("");
    setLinkSuccess("");

    try {
      const res = await api.post("/parent-portal/link-child", {
        studentName: linkStudentName.trim(),
        admissionNumberOrCode: linkIdentifier.trim() || undefined,
      });

      setLinkSuccess(res.data?.message || "Child successfully linked to your portal!");
      await fetchChildren();
      if (res.data?.student?._id) {
        setSelectedChildId(res.data.student._id);
      }
      setTimeout(() => {
        setShowLinkModal(false);
        setLinkStudentName("");
        setLinkIdentifier("");
        setLinkSuccess("");
      }, 1500);
    } catch (err: any) {
      setLinkError(err.response?.data?.message || "Failed to link child. Please verify child's full name and admission number.");
    } finally {
      setLinking(false);
    }
  };

  const openPrintWindow = (html: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handlePrint = async () => {
    if (!selectedTerm) return;
    try {
      const queryParams = new URLSearchParams({
        term: selectedTerm,
        format: "html",
      });
      if (selectedChildId) queryParams.append("studentId", selectedChildId);

      const res = await api.get(`/parent-portal/report-card/pdf?${queryParams.toString()}`, {
        responseType: "text",
      });
      openPrintWindow(res.data);
    } catch {
      setError("Failed to open printable report card");
    }
  };

  const handleDownload = async () => {
    if (!selectedTerm) return;
    setDownloading(true);
    try {
      const queryParams = new URLSearchParams({ term: selectedTerm });
      if (selectedChildId) queryParams.append("studentId", selectedChildId);

      const res = await api.get(`/parent-portal/report-card/pdf?${queryParams.toString()}`, {
        responseType: "blob",
      });
      const contentType = String(res.headers["content-type"] || "");
      if (contentType.includes("text/html")) {
        const text = await res.data.text();
        openPrintWindow(text);
        return;
      }

      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${reportData?.student.name || "report-card"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      handlePrint();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-sky-950 via-sky-900 to-sky-950 text-white shadow-md border-b border-sky-800/60">
        <div>
          <h1
            className="text-base sm:text-lg font-bold text-white tracking-tight"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Parent Portal — {user?.name}
          </h1>
          <p className="text-xs text-sky-300/80">Institute of Arabic and Islamic Studies</p>
        </div>
        <button
          onClick={logout}
          className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg bg-sky-800/80 hover:bg-sky-700 text-sky-100 hover:text-white border border-sky-700 transition"
        >
          Log out
        </button>
      </header>

      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
        {/* Child switcher bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600" />
                Select Child ({children.length})
              </span>
              <button
                type="button"
                onClick={() => setShowLinkModal(true)}
                className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Link Another Child
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {children.map((child) => {
                const isSelected = selectedChildId === child._id;
                return (
                  <button
                    key={child._id}
                    type="button"
                    onClick={() => setSelectedChildId(child._id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      isSelected
                        ? "bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/20"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{child.name}</span>
                    {child.class?.name && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                        isSelected ? "bg-sky-700 text-sky-100" : "bg-slate-200 text-slate-600"
                      }`}>
                        {child.class.name}
                      </span>
                    )}
                  </button>
                );
              })}

              {children.length === 0 && (
                <div className="text-xs text-slate-500 py-1 flex items-center gap-2">
                  <span>No children linked yet.</span>
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(true)}
                    className="text-sky-600 font-bold underline"
                  >
                    Link your child now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Term filter and Action buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Academic Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="border border-slate-300 rounded-xl px-4 py-2.5 min-w-[220px] text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none"
            >
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.session} — Term {t.termNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleDownload}
              disabled={!reportData || downloading}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-sky-600 hover:bg-sky-700 active:scale-[0.99] shadow-md shadow-sky-600/20 disabled:opacity-50 transition"
            >
              {downloading ? "Downloading PDF..." : "Download Official PDF"}
            </button>
            <button
              onClick={handlePrint}
              disabled={!reportData}
              className="px-5 py-2.5 rounded-xl text-sky-700 text-sm font-semibold border border-sky-600 hover:bg-sky-50 active:scale-[0.99] shadow-xs disabled:opacity-50 transition"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12 text-sm text-slate-500 font-medium">
            Loading student report card...
          </div>
        )}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl mb-6 font-medium">
            {error}
          </div>
        )}

        {reportData && (
          <div className="max-w-4xl mx-auto shadow-sm rounded-2xl overflow-hidden">
            <ReportCardView data={reportData} />
          </div>
        )}
      </div>

      {/* Link Child Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Link Student to Parent Portal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLinkChild} className="p-6 space-y-4">
              {linkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{linkError}</span>
                </div>
              )}

              {linkSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{linkSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student's Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={linkStudentName}
                  onChange={(e) => setLinkStudentName(e.target.value)}
                  placeholder="e.g. Ahmad Abdullah"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admission Number or Student Code (Optional)
                </label>
                <input
                  type="text"
                  value={linkIdentifier}
                  onChange={(e) => setLinkIdentifier(e.target.value)}
                  placeholder="e.g. IAIS/2026/001"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none uppercase font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Helps pinpoint your child if multiple students share similar names.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking || !linkStudentName.trim()}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {linking ? "Verifying..." : "Link Child"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentHome;
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ReportCardView from "../components/ReportCardView";
import type { ReportCardData } from "../types/reportCard";

interface Term {
  _id: string;
  session: string;
  termNumber: number;
  isActive: boolean;
}


const ParentHome = () => {
  const { user, logout } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [reportData, setReportData] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  // uses the parent-specific /parent-portal/terms route, not the general
  // /terms route — keeps the parent's access surface limited to what it
  // actually needs, consistent with the rest of the parent-portal design
  useEffect(() => {
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
    api
      .get(`/parent-portal/report-card?term=${selectedTerm}`)
      .then((res) => setReportData(res.data))
      .catch((err) => {
        setError(err.response?.data?.message || "No report card found for this term");
      })
      .finally(() => setLoading(false));
  }, [selectedTerm]);

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
      const res = await api.get(`/parent-portal/report-card/pdf?term=${selectedTerm}&format=html`, {
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
      const res = await api.get(`/parent-portal/report-card/pdf?term=${selectedTerm}`, {
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

      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
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
    </div>
  );
};

export default ParentHome;
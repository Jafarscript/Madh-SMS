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

  const handleDownload = async () => {
    if (!selectedTerm) return;
    setDownloading(true);
    try {
      const res = await api.get(`/parent-portal/report-card/pdf?term=${selectedTerm}`, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${reportData?.student.name || "report-card"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      setError("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF6EE" }}>
      <div
        className="px-8 py-4 flex justify-between items-center"
        style={{ backgroundColor: "#0B3D2E" }}
      >
        <p style={{ fontFamily: "Playfair Display, serif", color: "#F4E4B8" }}>
          Parent Portal — {user?.name}
        </p>
        <button onClick={logout} className="text-sm text-white/70 hover:text-white">
          Log out
        </button>
      </div>

      <div className="p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-end mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 min-w-[220px]"
            >
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.session} — Term {t.termNumber}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownload}
            disabled={!reportData || downloading}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#0B3D2E" }}
          >
            {downloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>

        {loading && <p className="text-sm text-gray-400">Loading...</p>}
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

       {reportData && (
  <div className="max-w-3xl mx-auto">
    <ReportCardView data={reportData} />
  </div>
)}
      </div>
    </div>
  );
};

export default ParentHome;
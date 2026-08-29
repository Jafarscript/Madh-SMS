/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import ReportCardView from "../../components/ReportCardView";
import RemarksCommentBankModal from "../../components/RemarksCommentBankModal";
import { REPORT_CARD_COMMENTS, ReportCardComment } from "../../constants/reportCardComments";
import { useAuth } from "../../context/AuthContext";
import type { ReportCardData } from "../../types/reportCard";
import { MessageSquareQuote, Search, Sparkles } from "lucide-react";

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
}
interface Student {
  _id: string;
  name: string;
  gender: string,
  numberInClass?: number;
}
interface Term {
  _id: string;
  session: string;
  termNumber: number;
  isActive: boolean;
}
interface GradingScale {
  _id: string;
  name: string;
}

type ResultStatus = "draft" | "published" | "locked";


const ReportCard = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [scales, setScales] = useState<GradingScale[]>([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedScale, setSelectedScale] = useState("");

  const [reportData, setReportData] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const studentGender = students.find((s) => s._id === selectedStudent)?.gender;
  const filteredComments = REPORT_CARD_COMMENTS.filter(
    (c) => c.gender === "N" || c.gender === studentGender,
  );

  const [classTeacherCommentId, setClassTeacherCommentId] = useState("");
  const [classTeacherCustom, setClassTeacherCustom] = useState({
    en: "",
    ar: "",
  });
  const [useCustomClassTeacher, setUseCustomClassTeacher] = useState(false);

  const [principalCommentId, setPrincipalCommentId] = useState("");
  const [principalCustom, setPrincipalCustom] = useState({ en: "", ar: "" });
  const [useCustomPrincipal, setUseCustomPrincipal] = useState(false);

  const [savingComment, setSavingComment] = useState(false);
  const [resultStatus, setResultStatus] = useState<ResultStatus>("draft");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Comment Bank Modal State
  const [commentBankTarget, setCommentBankTarget] = useState<"classTeacher" | "principal" | null>(null);

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
    api.get("/terms").then((res) => {
      setTerms(res.data);
      const active = res.data.find((t: Term) => t.isActive);
      if (active) setSelectedTerm(active._id);
    });
    api.get("/grading-scales").then((res) => {
      setScales(res.data);
      if (res.data.length > 0) setSelectedScale(res.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setSelectedStudent("");
      return;
    }
    api
      .get(`/students?class=${selectedClass}`)
      .then((res) => setStudents(res.data));
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedTerm) {
      setResultStatus("draft");
      return;
    }
    api
      .get(`/result-publications?class=${selectedClass}&term=${selectedTerm}`)
      .then((res) => setResultStatus(res.data.status || "draft"))
      .catch(() => setResultStatus("draft"));
  }, [selectedClass, selectedTerm]);

  const canView = selectedStudent && selectedTerm && selectedScale;

  const handleView = async () => {
    if (!canView) return;
    setError("");
    setLoading(true);
    setReportData(null);
    try {
      const res = await api.get(
        `/report-card?student=${selectedStudent}&term=${selectedTerm}&gradingScale=${selectedScale}`,
      );
      setReportData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load report card");
    } finally {
      setLoading(false);
    }
  };

  // downloads a single PDF by requesting it as a blob, then triggering
  // a browser download — needed because this is an authenticated request
  // (can't just link straight to the URL, the token has to go in the header)
  const downloadBlob = async (url: string, filename: string) => {
    const res = await api.get(url, { responseType: "blob" });
    const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  const handleDownloadSingle = async () => {
    if (!canView) return;
    setDownloading(true);
    try {
      await downloadBlob(
        `/report-card/pdf/single?student=${selectedStudent}&term=${selectedTerm}&gradingScale=${selectedScale}`,
        `${reportData?.student.name || "report-card"}.pdf`,
      );
    } catch {
      setError("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadBulk = async () => {
    if (!selectedClass || !selectedTerm || !selectedScale) {
      setError("Select a class, term, and grading scale first");
      return;
    }
    setBulkDownloading(true);
    setError("");
    try {
      await downloadBlob(
        `/report-card/pdf/bulk?class=${selectedClass}&term=${selectedTerm}&gradingScale=${selectedScale}`,
        `class-report-cards.pdf`,
      );
    } catch {
      setError("Failed to download bulk PDF");
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleSaveComment = async (
    field: "classTeacherComment" | "principalComment",
  ) => {
    setSavingComment(true);
    try {
      const payload: Record<string, unknown> = {
        student: selectedStudent,
        term: selectedTerm,
        field,
      };

      if (field === "classTeacherComment" && useCustomClassTeacher) {
        payload.en = classTeacherCustom.en;
        payload.ar = classTeacherCustom.ar;
      } else if (field === "classTeacherComment") {
        payload.commentId = classTeacherCommentId;
      } else if (field === "principalComment" && useCustomPrincipal) {
        payload.en = principalCustom.en;
        payload.ar = principalCustom.ar;
      } else {
        payload.commentId = principalCommentId;
      }

      await api.put("/report-card-remarks", payload);
      handleView();
    } catch {
      setError("Failed to save comment");
    } finally {
      setSavingComment(false);
    }
  };

  const updateResultStatus = async (status: ResultStatus) => {
    if (!selectedClass || !selectedTerm) return;
    setUpdatingStatus(true);
    setError("");
    try {
      const res = await api.put("/result-publications", {
        class: selectedClass,
        term: selectedTerm,
        status,
      });
      setResultStatus(res.data.status);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update result status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isAdmin = user?.role === "super_admin" || user?.role === "branch_admin";

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title="Report Cards"
        subtitle="View one student, or download a whole class in bulk"
      />

      <div className="bg-white p-6 rounded-xl shadow-sm mb-8 flex flex-col gap-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
            >
              <option value="">Select a class</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {c.arm ? ` — الشعبة ${c.arm}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={!selectedClass}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 disabled:bg-gray-50"
            >
              <option value="">Select a student</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.numberInClass ? `${s.numberInClass}. ` : ""}
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
            >
              <option value="">Select a term</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.session} — Term {t.termNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grading Scale
            </label>
            <select
              value={selectedScale}
              onChange={(e) => setSelectedScale(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
            >
              {scales.map((sc) => (
                <option key={sc._id} value={sc._id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleView}
            disabled={!canView || loading}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#0B3D2E" }}
          >
            {loading ? "Loading..." : "View Report Card"}
          </button>

          <button
            onClick={handleDownloadSingle}
            disabled={!canView || downloading}
            className="px-5 py-2.5 rounded-lg border text-sm font-medium disabled:opacity-50"
            style={{ borderColor: "#0B3D2E", color: "#0B3D2E" }}
          >
            {downloading ? "Downloading..." : "Download PDF"}
          </button>

          <button
            onClick={handleDownloadBulk}
            disabled={!selectedClass || !selectedTerm || bulkDownloading}
            className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#C9A227", color: "#0B3D2E" }}
          >
            {bulkDownloading ? "Generating..." : "Download Whole Class (PDF)"}
          </button>
        </div>

        {selectedClass && selectedTerm && (
          <div className="border-t pt-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Result status:</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                resultStatus === "locked"
                  ? "bg-red-100 text-red-700"
                  : resultStatus === "published"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {resultStatus === "draft" ? "Draft — hidden from parents" : resultStatus === "published" ? "Published" : "Locked"}
            </span>

            {isAdmin && resultStatus === "draft" && (
              <button
                onClick={() => updateResultStatus("published")}
                disabled={updatingStatus}
                className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50"
                style={{ backgroundColor: "#0B3D2E" }}
              >
                {updatingStatus ? "Updating..." : "Publish Results"}
              </button>
            )}
            {isAdmin && resultStatus === "published" && (
              <>
                <button
                  onClick={() => updateResultStatus("locked")}
                  disabled={updatingStatus}
                  className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50 bg-red-700"
                >
                  {updatingStatus ? "Updating..." : "Lock Results"}
                </button>
                <button
                  onClick={() => updateResultStatus("draft")}
                  disabled={updatingStatus}
                  className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
                >
                  Unpublish
                </button>
              </>
            )}
            {isAdmin && resultStatus === "locked" && (
              <button
                onClick={() => updateResultStatus("published")}
                disabled={updatingStatus}
                className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
              >
                Unlock Results
              </button>
            )}
          </div>
        )}
      </div>

      {reportData && (
        <div className="max-w-3xl">
          <ReportCardView data={reportData} />
        </div>
      )}
      {reportData && (
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6 flex flex-col gap-6">
          {/* Class Teacher's Comment */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-800">
                Class Teacher's Comment
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCommentBankTarget("classTeacher")}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200"
                >
                  <MessageSquareQuote className="w-3.5 h-3.5" />
                  Browse Comment Bank
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomClassTeacher((v) => !v)}
                  className="text-xs underline text-gray-500 hover:text-gray-700"
                >
                  {useCustomClassTeacher
                    ? "Choose from list"
                    : "Write custom"}
                </button>
              </div>
            </div>

            {!useCustomClassTeacher ? (
              <select
                value={classTeacherCommentId}
                onChange={(e) => setClassTeacherCommentId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
              >
                <option value="">Select a comment or use Comment Bank</option>
                {filteredComments.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ar} — {c.en}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  dir="rtl"
                  style={{ fontFamily: "Amiri, serif" }}
                  placeholder="التعليق بالعربية (Arabic comment)"
                  value={classTeacherCustom.ar}
                  onChange={(e) =>
                    setClassTeacherCustom((p) => ({ ...p, ar: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
                />
                <input
                  placeholder="Comment in English"
                  value={classTeacherCustom.en}
                  onChange={(e) =>
                    setClassTeacherCustom((p) => ({ ...p, en: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
                />
              </div>
            )}

            <button
              type="button"
              disabled={savingComment}
              onClick={() => handleSaveComment("classTeacherComment")}
              className="mt-3 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 shadow-xs transition"
              style={{ backgroundColor: "#0B3D2E" }}
            >
              {savingComment ? "Saving..." : "Save Class Teacher Remark"}
            </button>
          </div>

          {/* Principal's Comment — admins only */}
          {(user?.role === "super_admin" || user?.role === "branch_admin") && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Principal's Comment
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCommentBankTarget("principal")}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200"
                  >
                    <MessageSquareQuote className="w-3.5 h-3.5" />
                    Browse Comment Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseCustomPrincipal((v) => !v)}
                    className="text-xs underline text-gray-500 hover:text-gray-700"
                  >
                    {useCustomPrincipal
                      ? "Choose from list"
                      : "Write custom"}
                  </button>
                </div>
              </div>

              {!useCustomPrincipal ? (
                <select
                  value={principalCommentId}
                  onChange={(e) => setPrincipalCommentId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
                >
                  <option value="">Select a comment or use Comment Bank</option>
                  {filteredComments.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ar} — {c.en}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex flex-col gap-2">
                  <input
                    dir="rtl"
                    style={{ fontFamily: "Amiri, serif" }}
                    placeholder="تعليق المدير بالعربية"
                    value={principalCustom.ar}
                    onChange={(e) =>
                      setPrincipalCustom((p) => ({ ...p, ar: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
                  />
                  <input
                    placeholder="Principal's comment in English"
                    value={principalCustom.en}
                    onChange={(e) =>
                      setPrincipalCustom((p) => ({ ...p, en: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>
              )}

              <button
                type="button"
                disabled={savingComment}
                onClick={() => handleSaveComment("principalComment")}
                className="mt-3 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 shadow-xs transition"
                style={{ backgroundColor: "#0B3D2E" }}
              >
                {savingComment ? "Saving..." : "Save Principal Remark"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Remarks Comment Bank Modal */}
      <RemarksCommentBankModal
        isOpen={commentBankTarget !== null}
        onClose={() => setCommentBankTarget(null)}
        studentGender={studentGender}
        studentName={students.find((s) => s._id === selectedStudent)?.name}
        currentCommentId={
          commentBankTarget === "classTeacher"
            ? classTeacherCommentId
            : principalCommentId
        }
        onSelectComment={(comment: ReportCardComment) => {
          if (commentBankTarget === "classTeacher") {
            setClassTeacherCommentId(comment.id);
            setUseCustomClassTeacher(false);
          } else if (commentBankTarget === "principal") {
            setPrincipalCommentId(comment.id);
            setUseCustomPrincipal(false);
          }
        }}
      />
    </div>
  );
};

export default ReportCard;

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import ReportCardView from "../../components/ReportCardView";
import RemarksCommentBankModal from "../../components/RemarksCommentBankModal";
import ReportCardTemplateModal from "../../components/ReportCardTemplateModal";
import { REPORT_CARD_COMMENTS, ReportCardComment } from "../../constants/reportCardComments";
import { useAuth } from "../../context/AuthContext";
import type { ReportCardData } from "../../types/reportCard";
import {
  MessageSquareQuote,
  Search,
  ChevronLeft,
  ChevronRight,
  Lock,
  X,
  User,
  GraduationCap,
  Building2,
  Calendar,
  Palette,
} from "lucide-react";

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
  branch?: { _id: string; name: string } | string;
}
interface Student {
  _id: string;
  name: string;
  gender: string;
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

  const [searchQuery, setSearchQuery] = useState("");

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
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data || []));
    api.get("/terms").then((res) => {
      setTerms(res.data || []);
      const active = res.data?.find((t: Term) => t.isActive);
      if (active) setSelectedTerm(active._id);
      else if (res.data?.length > 0) setSelectedTerm(res.data[0]._id);
    });
    api.get("/grading-scales").then((res) => {
      setScales(res.data || []);
      if (res.data?.length > 0) setSelectedScale(res.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setSelectedStudent("");
      setSearchQuery("");
      setReportData(null);
      return;
    }
    api.get(`/students?class=${selectedClass}`).then((res) => {
      const studentList = res.data || [];
      setStudents(studentList);
      if (studentList.length > 0) {
        setSelectedStudent(studentList[0]._id);
      } else {
        setSelectedStudent("");
      }
    });
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

  const currentIndex = useMemo(() => {
    return students.findIndex((s) => s._id === selectedStudent);
  }, [students, selectedStudent]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.numberInClass !== undefined && String(s.numberInClass).includes(q))
    );
  }, [students, searchQuery]);

  const handlePrevStudent = () => {
    if (currentIndex > 0) {
      setSelectedStudent(students[currentIndex - 1]._id);
    }
  };

  const handleNextStudent = () => {
    if (currentIndex < students.length - 1) {
      setSelectedStudent(students[currentIndex + 1]._id);
    }
  };

  const loadReportCard = async (studentId: string, termId: string, scaleId: string) => {
    if (!studentId || !termId || !scaleId) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.get(
        `/report-card?student=${studentId}&term=${termId}&gradingScale=${scaleId}`,
      );
      setReportData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load report card");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudent && selectedTerm && selectedScale) {
      loadReportCard(selectedStudent, selectedTerm, selectedScale);
    }
  }, [selectedStudent, selectedTerm, selectedScale]);

  const canView = Boolean(selectedStudent && selectedTerm && selectedScale);

  const handleView = () => {
    if (canView) {
      loadReportCard(selectedStudent, selectedTerm, selectedScale);
    }
  };

  // downloads a single PDF by requesting it as a blob, then triggering
  // a browser download — needed because this is an authenticated request
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

  const selectedStudentObj = students.find((s) => s._id === selectedStudent);
  const selectedClassObj = classes.find((c) => c._id === selectedClass);

  const getBranchLabel = (c?: ClassItem) => {
    if (!c || !c.branch) return "";
    return typeof c.branch === "object" ? c.branch.name : c.branch;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Report Cards"
          subtitle="Review individual student performance, browse rosters seamlessly, and export print-ready A4 report cards"
        />
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="self-start sm:self-center flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-sky-50 text-sky-800 border border-sky-300 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Palette className="w-4 h-4 text-sky-600" />
            <span>Customize Template & Branding</span>
          </button>
        )}
      </div>

      {/* Main Controls Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Top Dropdowns Row: Class, Term, Grading Scale */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-600" /> Class & Branch
            </label>
            <select
              id="report-card-class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="">Select a class</option>
              {classes.map((c) => {
                const branchName = getBranchLabel(c);
                return (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {c.arm ? ` (${c.arm})` : ""}
                    {branchName ? ` — ${branchName}` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-600" /> Term / Session
            </label>
            <select
              id="report-card-term-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="">Select a term</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.session} — Term {t.termNumber} {t.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-sky-600" /> Grading Scale
            </label>
            <select
              id="report-card-scale-select"
              value={selectedScale}
              onChange={(e) => setSelectedScale(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            >
              {scales.map((sc) => (
                <option key={sc._id} value={sc._id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Navigation & Search Toolbar */}
        {selectedClass && (
          <div className="border border-sky-100 bg-sky-50/40 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left/Right Prev/Next Navigator */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
              <button
                id="report-prev-student-btn"
                type="button"
                onClick={handlePrevStudent}
                disabled={currentIndex <= 0 || loading}
                title="Previous Student (Left Arrow)"
                className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 hover:border-sky-600 hover:text-sky-700 text-gray-700 rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-sky-200 rounded-xl text-xs font-medium text-gray-800 shadow-xs">
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span>
                  {students.length > 0 ? (
                    <>
                      <strong>{currentIndex >= 0 ? currentIndex + 1 : 0}</strong> / {students.length}
                    </>
                  ) : (
                    "0 students"
                  )}
                </span>
              </div>

              <button
                id="report-next-student-btn"
                type="button"
                onClick={handleNextStudent}
                disabled={currentIndex >= students.length - 1 || loading}
                title="Next Student (Right Arrow)"
                className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 hover:border-sky-600 hover:text-sky-700 text-gray-700 rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Student Search & Select Bar */}
            <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="student-search-input"
                  type="text"
                  placeholder="Search student name or #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-7 py-1.5 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Direct Dropdown */}
              <select
                id="report-card-student-select"
                value={selectedStudent}
                onChange={(e) => {
                  setSelectedStudent(e.target.value);
                  setSearchQuery("");
                }}
                disabled={!selectedClass || students.length === 0}
                className="w-48 bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-800 focus:ring-2 focus:ring-sky-500 outline-none truncate"
              >
                <option value="">Select student</option>
                {filteredStudents.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.numberInClass ? `${s.numberInClass}. ` : ""}
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap items-center justify-between pt-1 border-t border-gray-100">
          <div className="flex gap-2 flex-wrap">
            <button
              id="view-report-card-btn"
              onClick={handleView}
              disabled={!canView || loading}
              className="px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-50"
            >
              {loading ? "Loading..." : "Reload Report Sheet"}
            </button>

            <button
              id="download-single-pdf-btn"
              onClick={handleDownloadSingle}
              disabled={!canView || downloading}
              className="px-4 py-2 rounded-xl border border-sky-600 text-sky-700 text-xs font-semibold hover:bg-sky-50 shadow-xs transition disabled:opacity-50"
            >
              {downloading ? "Preparing A4 PDF..." : "Download Single PDF (A4)"}
            </button>
          </div>

          <button
            id="download-bulk-pdf-btn"
            onClick={handleDownloadBulk}
            disabled={!selectedClass || !selectedTerm || bulkDownloading}
            className="px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50 bg-amber-500 hover:bg-amber-600 text-white"
          >
            {bulkDownloading ? "Generating Class PDFs..." : "Download Whole Class (Bulk A4 PDF)"}
          </button>
        </div>

        {/* Publication Status */}
        {selectedClass && selectedTerm && (
          <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Result Publication:</span>
              <span
                className={`rounded-full px-2.5 py-0.5 font-bold text-[11px] ${
                  resultStatus === "locked"
                    ? "bg-rose-100 text-rose-800"
                    : resultStatus === "published"
                    ? "bg-sky-100 text-sky-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {resultStatus === "draft"
                  ? "Draft (Hidden from Parents)"
                  : resultStatus === "published"
                  ? "Published"
                  : "Locked & Finalized"}
              </span>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                {resultStatus === "draft" && (
                  <button
                    onClick={() => updateResultStatus("published")}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold bg-sky-600 hover:bg-sky-700 shadow-xs disabled:opacity-50 transition"
                  >
                    {updatingStatus ? "Updating..." : "Publish to Parents"}
                  </button>
                )}
                {resultStatus === "published" && (
                  <>
                    <button
                      onClick={() => updateResultStatus("locked")}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold bg-rose-700 hover:bg-rose-800 shadow-xs disabled:opacity-50 transition"
                    >
                      {updatingStatus ? "Locking..." : "Lock Results"}
                    </button>
                    <button
                      onClick={() => updateResultStatus("draft")}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium disabled:opacity-50 transition"
                    >
                      Unpublish
                    </button>
                  </>
                )}
                {resultStatus === "locked" && (
                  <button
                    onClick={() => updateResultStatus("published")}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium disabled:opacity-50 transition"
                  >
                    Unlock Results
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Student Information Banner */}
      {selectedStudentObj && (
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between text-xs text-gray-700">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">
              {selectedStudentObj.name}
            </span>
            {selectedStudentObj.numberInClass && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 font-mono rounded">
                #{selectedStudentObj.numberInClass}
              </span>
            )}
            <span className="text-gray-400">•</span>
            <span>
              {selectedClassObj?.name}
              {selectedClassObj?.arm ? ` (${selectedClassObj.arm})` : ""}
            </span>
            {getBranchLabel(selectedClassObj) && (
              <>
                <span className="text-gray-400">•</span>
                <span className="font-medium text-sky-800">
                  {getBranchLabel(selectedClassObj)}
                </span>
              </>
            )}
          </div>

          <div className="text-gray-500 font-medium">
            Student {currentIndex + 1} of {students.length}
          </div>
        </div>
      )}

      {/* Report Card Sheet View */}
      {reportData && (
        <div className="max-w-4xl mx-auto shadow-md rounded-lg overflow-hidden bg-white">
          <ReportCardView data={reportData} />
        </div>
      )}

      {/* Remarks Section */}
      {reportData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
          {resultStatus === "locked" && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-2 font-medium">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Results for this class are <strong>LOCKED</strong>. Remarks are frozen in read-only mode.
                </span>
              </div>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold rounded">
                Read-Only
              </span>
            </div>
          )}

          {/* Class Teacher's Comment */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-800">
                Class Teacher's Comment
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={resultStatus === "locked"}
                  onClick={() => setCommentBankTarget("classTeacher")}
                  className="text-xs font-semibold text-sky-800 hover:text-sky-950 flex items-center gap-1 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquareQuote className="w-3.5 h-3.5" />
                  Browse Comment Bank
                </button>
                <button
                  type="button"
                  disabled={resultStatus === "locked"}
                  onClick={() => setUseCustomClassTeacher((v) => !v)}
                  className="text-xs underline text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {useCustomClassTeacher ? "Choose from list" : "Write custom"}
                </button>
              </div>
            </div>

            {!useCustomClassTeacher ? (
              <select
                value={classTeacherCommentId}
                disabled={resultStatus === "locked"}
                onChange={(e) => setClassTeacherCommentId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-sky-500 outline-none"
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
                  disabled={resultStatus === "locked"}
                  value={classTeacherCustom.ar}
                  onChange={(e) =>
                    setClassTeacherCustom((p) => ({ ...p, ar: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <input
                  placeholder="Comment in English"
                  disabled={resultStatus === "locked"}
                  value={classTeacherCustom.en}
                  onChange={(e) =>
                    setClassTeacherCustom((p) => ({ ...p, en: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            )}

            <button
              type="button"
              disabled={savingComment || resultStatus === "locked"}
              onClick={() => handleSaveComment("classTeacherComment")}
              className={`mt-3 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 shadow-xs transition disabled:cursor-not-allowed ${
                resultStatus === "locked"
                  ? "bg-gray-400"
                  : "bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99]"
              }`}
            >
              {resultStatus === "locked" ? "Locked (Read-Only)" : savingComment ? "Saving..." : "Save Class Teacher Remark"}
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
                    disabled={resultStatus === "locked"}
                    onClick={() => setCommentBankTarget("principal")}
                    className="text-xs font-semibold text-sky-800 hover:text-sky-950 flex items-center gap-1 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquareQuote className="w-3.5 h-3.5" />
                    Browse Comment Bank
                  </button>
                  <button
                    type="button"
                    disabled={resultStatus === "locked"}
                    onClick={() => setUseCustomPrincipal((v) => !v)}
                    className="text-xs underline text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {useCustomPrincipal ? "Choose from list" : "Write custom"}
                  </button>
                </div>
              </div>

              {!useCustomPrincipal ? (
                <select
                  value={principalCommentId}
                  disabled={resultStatus === "locked"}
                  onChange={(e) => setPrincipalCommentId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-sky-500 outline-none"
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
                    disabled={resultStatus === "locked"}
                    value={principalCustom.ar}
                    onChange={(e) =>
                      setPrincipalCustom((p) => ({ ...p, ar: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <input
                    placeholder="Principal's comment in English"
                    disabled={resultStatus === "locked"}
                    value={principalCustom.en}
                    onChange={(e) =>
                      setPrincipalCustom((p) => ({ ...p, en: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              )}

              <button
                type="button"
                disabled={savingComment || resultStatus === "locked"}
                onClick={() => handleSaveComment("principalComment")}
                className={`mt-3 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 shadow-xs transition disabled:cursor-not-allowed ${
                  resultStatus === "locked"
                    ? "bg-gray-400"
                    : "bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99]"
                }`}
              >
                {resultStatus === "locked" ? "Locked (Read-Only)" : savingComment ? "Saving..." : "Save Principal Remark"}
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

      {/* Report Card Template Customization & Branding Modal */}
      <ReportCardTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSaved={() => {
          handleView();
        }}
      />
    </div>
  );
};

export default ReportCard;

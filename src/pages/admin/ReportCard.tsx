/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import ReportCardView from "../../components/ReportCardView";
import RemarksCommentBankModal from "../../components/RemarksCommentBankModal";
import ReportCardTemplateModal from "../../components/ReportCardTemplateModal";
import { REPORT_CARD_COMMENTS, ReportCardComment } from "../../constants/reportCardComments";
import { useAuth } from "../../context/AuthContext";
import type { ReportCardData } from "../../types/reportCard";
import { isElementaryClass } from "../../utils/classCategoryHelper";
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
  Edit3,
  Sparkles,
  Activity,
  Check,
  CheckCircle2,
  Download,
  Printer,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
  branch?: { _id: string; name: string } | string;
  category?: "secondary" | "elementary";
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
  const [printingSingle, setPrintingSingle] = useState(false);
  const [printingBulk, setPrintingBulk] = useState(false);
  const [error, setError] = useState("");

  const isAnyExporting = downloading || bulkDownloading || printingSingle || printingBulk;

  const { user } = useAuth();
  const [commentsBank, setCommentsBank] = useState<ReportCardComment[]>(REPORT_CARD_COMMENTS);
  const studentGender = students.find((s) => s._id === selectedStudent)?.gender;
  const filteredComments = useMemo(() => {
    return commentsBank.filter(
      (c) => c.gender === "N" || !studentGender || c.gender === studentGender,
    );
  }, [commentsBank, studentGender]);

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
  const [savingPrincipalComment, setSavingPrincipalComment] = useState(false);
  const [affectiveScores, setAffectiveScores] = useState<Record<string, number>>({});
  const [savingSkills, setSavingSkills] = useState(false);
  const [skillsSavedSuccess, setSkillsSavedSuccess] = useState(false);
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
      if (res.data?.length > 0) {
        const taqdeer = res.data.find((s: GradingScale) => s.name === "التقدير");
        setSelectedScale(taqdeer ? taqdeer._id : res.data[0]._id);
      }
    });
    api.get("/predefined-comments").then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCommentsBank(res.data);
      }
    }).catch(() => {});
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

  // Synchronize comment form inputs whenever the report card data is loaded or switched
  useEffect(() => {
    if (reportData) {
      if (reportData.classTeacherComment) {
        const ct = reportData.classTeacherComment;
        if (ct.id) {
          setClassTeacherCommentId(ct.id);
          setUseCustomClassTeacher(false);
          setClassTeacherCustom({ en: ct.en || "", ar: ct.ar || "" });
        } else {
          setClassTeacherCommentId("");
          setUseCustomClassTeacher(true);
          setClassTeacherCustom({ en: ct.en || "", ar: ct.ar || "" });
        }
      } else {
        setClassTeacherCommentId("");
        setClassTeacherCustom({ en: "", ar: "" });
        setUseCustomClassTeacher(false);
      }

      if (reportData.principalComment) {
        const pc = reportData.principalComment;
        if (pc.id) {
          setPrincipalCommentId(pc.id);
          setUseCustomPrincipal(false);
          setPrincipalCustom({ en: pc.en || "", ar: pc.ar || "" });
        } else {
          setPrincipalCommentId("");
          setUseCustomPrincipal(true);
          setPrincipalCustom({ en: pc.en || "", ar: pc.ar || "" });
        }
      } else {
        setPrincipalCommentId("");
        setPrincipalCustom({ en: "", ar: "" });
        setUseCustomPrincipal(false);
      }

      if (reportData.affectiveScores && typeof reportData.affectiveScores === "object") {
        setAffectiveScores(reportData.affectiveScores);
      } else {
        setAffectiveScores({
          "Punctuality": 5,
          "Neatness": 4,
          "Attitude to sch. Work": 5,
          "Attentiveness": 4,
          "Speaking Habit/Writing": 4,
          "Verbal Fluency": 5,
          "Games / Sports": 4,
        });
      }
    }
  }, [reportData]);

  const handleUpdateSkill = async (skillName: string, rating: number) => {
    if (resultStatus === "locked" || !selectedStudent || !selectedTerm) return;
    const newScores = { ...affectiveScores, [skillName]: rating };
    setAffectiveScores(newScores);

    // Optimistically update displayed report card
    if (reportData) {
      setReportData({
        ...reportData,
        affectiveScores: newScores,
      });
    }

    try {
      await api.put("/report-card-remarks", {
        student: selectedStudent,
        term: selectedTerm,
        field: "affectiveScores",
        affectiveScores: newScores,
      });
      setSkillsSavedSuccess(true);
      setTimeout(() => setSkillsSavedSuccess(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update skill rating");
    }
  };

  const handleSaveAllSkills = async () => {
    if (!selectedStudent || !selectedTerm || resultStatus === "locked") return;
    setSavingSkills(true);
    setError("");
    try {
      await api.put("/report-card-remarks", {
        student: selectedStudent,
        term: selectedTerm,
        field: "affectiveScores",
        affectiveScores,
      });
      setSkillsSavedSuccess(true);
      setTimeout(() => setSkillsSavedSuccess(false), 2500);
      if (selectedStudent && selectedTerm && selectedScale) {
        await loadReportCard(selectedStudent, selectedTerm, selectedScale);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save skills");
    } finally {
      setSavingSkills(false);
    }
  };

  const canView = Boolean(selectedStudent && selectedTerm && selectedScale);

  const handleView = () => {
    if (canView) {
      loadReportCard(selectedStudent, selectedTerm, selectedScale);
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

  // downloads a single PDF by requesting it as a blob, then triggering
  // a browser download — if the backend returned HTML (e.g. serverless fallback),
  // opens a high-fidelity print window to Save as PDF natively.
  const downloadBlob = async (url: string, filename: string) => {
    const res = await api.get(url, { responseType: "blob" });
    const contentType = String(res.headers["content-type"] || "");

    if (contentType.includes("text/html")) {
      const text = await res.data.text();
      openPrintWindow(text);
      return;
    }

    const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  const selectedStudentObj = students.find((s) => s._id === selectedStudent);
  const selectedClassObj = classes.find((c) => c._id === selectedClass);

  const isCurrentClassElementary = Boolean(
    reportData?.isElementary ||
    reportData?.classCategory === "elementary" ||
    selectedClassObj?.category === "elementary" ||
    (selectedClassObj?.name && isElementaryClass(selectedClassObj.name, selectedClassObj.category)) ||
    (reportData?.student?.class && isElementaryClass(reportData.student.class))
  );

  const handlePrintSingle = async () => {
    if (!canView || isAnyExporting) return;
    setPrintingSingle(true);
    setError("");
    try {
      const elemParam = isCurrentClassElementary ? "&isElementary=true&classCategory=elementary" : "";
      const res = await api.get(
        `/report-card/pdf/single?student=${selectedStudent}&term=${selectedTerm}&gradingScale=${selectedScale}&format=html${elemParam}`,
        { responseType: "text" }
      );
      openPrintWindow(res.data);
    } catch {
      setError("Failed to generate printable report card");
    } finally {
      setPrintingSingle(false);
    }
  };

  const handlePrintBulk = async () => {
    if (!selectedClass || !selectedTerm || !selectedScale || isAnyExporting) {
      if (!selectedClass || !selectedTerm || !selectedScale) {
        setError("Select a class, term, and grading scale first");
      }
      return;
    }
    setPrintingBulk(true);
    setError("");
    try {
      const elemParam = isCurrentClassElementary ? "&isElementary=true&classCategory=elementary" : "";
      const res = await api.get(
        `/report-card/pdf/bulk?class=${selectedClass}&term=${selectedTerm}&gradingScale=${selectedScale}&format=html${elemParam}`,
        { responseType: "text" }
      );
      openPrintWindow(res.data);
    } catch {
      setError("Failed to generate bulk printable report cards");
    } finally {
      setPrintingBulk(false);
    }
  };

  const handleDownloadSingle = async () => {
    if (!canView || isAnyExporting) return;
    setDownloading(true);
    setError("");
    try {
      const elemParam = isCurrentClassElementary ? "&isElementary=true&classCategory=elementary" : "";
      await downloadBlob(
        `/report-card/pdf/single?student=${selectedStudent}&term=${selectedTerm}&gradingScale=${selectedScale}${elemParam}`,
        `${reportData?.student.name || "report-card"}.pdf`,
      );
    } catch {
      // If direct PDF failed, fallback to print view
      await handlePrintSingle();
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadBulk = async () => {
    if (!selectedClass || !selectedTerm || !selectedScale || isAnyExporting) {
      if (!selectedClass || !selectedTerm || !selectedScale) {
        setError("Select a class, term, and grading scale first");
      }
      return;
    }
    setBulkDownloading(true);
    setError("");
    try {
      const elemParam = isCurrentClassElementary ? "&isElementary=true&classCategory=elementary" : "";
      await downloadBlob(
        `/report-card/pdf/bulk?class=${selectedClass}&term=${selectedTerm}&gradingScale=${selectedScale}${elemParam}`,
        `class-report-cards.pdf`,
      );
    } catch {
      await handlePrintBulk();
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleSaveComment = async (
    field: "classTeacherComment" | "principalComment",
  ) => {
    if (!selectedStudent || !selectedTerm) {
      setError("Please select a student and term first");
      return;
    }
    if (field === "classTeacherComment") {
      setSavingComment(true);
    } else {
      setSavingPrincipalComment(true);
    }
    setError("");
    try {
      const payload: Record<string, unknown> = {
        student: selectedStudent,
        term: selectedTerm,
        field,
      };

      if (field === "classTeacherComment") {
        if (useCustomClassTeacher) {
          if (!classTeacherCustom.en.trim() && !classTeacherCustom.ar.trim()) {
            setError("Please write a comment or choose one from the bank");
            setSavingComment(false);
            return;
          }
          payload.en = classTeacherCustom.en.trim();
          payload.ar = classTeacherCustom.ar.trim();
        } else {
          if (!classTeacherCommentId) {
            setError("Please select a comment from the list or browse the Comment Bank");
            setSavingComment(false);
            return;
          }
          payload.commentId = classTeacherCommentId;
          if (classTeacherCustom.en || classTeacherCustom.ar) {
            payload.en = classTeacherCustom.en.trim();
            payload.ar = classTeacherCustom.ar.trim();
          }
        }
      } else {
        if (useCustomPrincipal) {
          if (!principalCustom.en.trim() && !principalCustom.ar.trim()) {
            setError("Please write a principal comment or choose one from the bank");
            setSavingPrincipalComment(false);
            return;
          }
          payload.en = principalCustom.en.trim();
          payload.ar = principalCustom.ar.trim();
        } else {
          if (!principalCommentId) {
            setError("Please select a principal comment from the list or browse the Comment Bank");
            setSavingPrincipalComment(false);
            return;
          }
          payload.commentId = principalCommentId;
          if (principalCustom.en || principalCustom.ar) {
            payload.en = principalCustom.en.trim();
            payload.ar = principalCustom.ar.trim();
          }
        }
      }

      await api.put("/report-card-remarks", payload);
      if (selectedStudent && selectedTerm && selectedScale) {
        await loadReportCard(selectedStudent, selectedTerm, selectedScale);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save comment");
    } finally {
      if (field === "classTeacherComment") {
        setSavingComment(false);
      } else {
        setSavingPrincipalComment(false);
      }
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

  const getBranchLabel = (c?: ClassItem) => {
    if (!c || !c.branch) return "";
    return typeof c.branch === "object" ? c.branch.name : c.branch;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-sky-600" /> Grading Scale
              </label>
              <Link
                to="/admin/grading-scales"
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 hover:underline flex items-center gap-1"
                title="Configure or Edit Grading Scales"
              >
                Edit Scales →
              </Link>
            </div>
            <div className="flex gap-2">
              <select
                id="report-card-scale-select"
                value={selectedScale}
                onChange={(e) => setSelectedScale(e.target.value)}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              >
                {scales.map((sc) => (
                  <option key={sc._id} value={sc._id}>
                    {sc.name}
                  </option>
                ))}
              </select>
              <Link
                to="/admin/grading-scales"
                className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition shrink-0"
                title="Edit Grading Scale"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </Link>
            </div>
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

        {/* Active Export / Print Progress Banner */}
        {isAnyExporting && (
          <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-xl p-3 flex items-center justify-between shadow-xs mb-3 animate-pulse">
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <Loader2 className="w-4 h-4 text-sky-600 animate-spin flex-shrink-0" />
              <span>
                {bulkDownloading && "Generating bulk PDF for whole class... Compiling student report cards, please wait."}
                {printingBulk && "Preparing bulk printable document for class... Formatting sheets, please wait."}
                {downloading && "Generating official report card PDF (A4)... Please wait a moment."}
                {printingSingle && "Preparing printable report card sheet... Opening print dialog shortly."}
              </span>
            </div>
            <span className="text-[11px] text-sky-700 bg-sky-100 font-bold px-2 py-0.5 rounded-full flex-shrink-0">
              Working...
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap items-center justify-between pt-1 border-t border-gray-100">
          <div className="flex gap-2 flex-wrap">
            <button
              id="view-report-card-btn"
              onClick={handleView}
              disabled={!canView || loading || isAnyExporting}
              className="px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reload Report Sheet
                </>
              )}
            </button>

            <button
              id="download-single-pdf-btn"
              onClick={handleDownloadSingle}
              disabled={!canView || isAnyExporting}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Preparing PDF (A4)...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download PDF (A4)
                </>
              )}
            </button>

            <button
              id="print-single-pdf-btn"
              onClick={handlePrintSingle}
              disabled={!canView || isAnyExporting}
              className="px-4 py-2 rounded-xl border border-sky-600 text-sky-700 text-xs font-semibold hover:bg-sky-50 shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {printingSingle ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                  Preparing Print...
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save as PDF
                </>
              )}
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              id="download-bulk-pdf-btn"
              onClick={handleDownloadBulk}
              disabled={!selectedClass || !selectedTerm || isAnyExporting}
              className="px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50 bg-amber-500 hover:bg-amber-600 text-white"
            >
              {bulkDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating Class PDFs...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download Class (Bulk PDF)
                </>
              )}
            </button>
            <button
              id="print-bulk-pdf-btn"
              onClick={handlePrintBulk}
              disabled={!selectedClass || !selectedTerm || isAnyExporting}
              className="px-4 py-2 rounded-xl border border-amber-600 text-amber-700 text-xs font-semibold hover:bg-amber-50 shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {printingBulk ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  Preparing Class Print...
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  Print Whole Class
                </>
              )}
            </button>
          </div>
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
        <div className="max-w-4xl mx-auto shadow-md rounded-lg overflow-x-auto custom-scrollbar bg-white">
          <ReportCardView data={reportData} onUpdateSkill={handleUpdateSkill} />
        </div>
      )}

      {/* Remarks & Skills Management Section */}
      {reportData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
          {resultStatus === "locked" && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-2 font-medium">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Results for this class are <strong>LOCKED</strong>. Remarks and skills are frozen in read-only mode.
                </span>
              </div>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold rounded">
                Read-Only
              </span>
            </div>
          )}

          {/* Psychomotor & Affective Skills Section for Elementary */}
          {isCurrentClassElementary && (
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <Activity className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <span>Psychomotor / Affective Skills</span>
                      <span className="text-gray-400 font-normal">|</span>
                      <span style={{ fontFamily: "Amiri, serif" }} className="text-indigo-900 text-sm">
                        السلوك والنشاط
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Rate student conduct on a 1–5 scale (5 = Excellent, 1 = Poor). Click a score below or directly on the report card sheet.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    disabled={resultStatus === "locked"}
                    onClick={() => {
                      const allFive = {
                        "Punctuality": 5,
                        "Neatness": 5,
                        "Attitude to sch. Work": 5,
                        "Attentiveness": 5,
                        "Speaking Habit/Writing": 5,
                        "Verbal Fluency": 5,
                        "Games / Sports": 5,
                      };
                      setAffectiveScores(allFive);
                      if (reportData) setReportData({ ...reportData, affectiveScores: allFive });
                    }}
                    className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
                  >
                    Set all to 5
                  </button>
                  <button
                    type="button"
                    disabled={resultStatus === "locked"}
                    onClick={() => {
                      const allFour = {
                        "Punctuality": 4,
                        "Neatness": 4,
                        "Attitude to sch. Work": 4,
                        "Attentiveness": 4,
                        "Speaking Habit/Writing": 4,
                        "Verbal Fluency": 4,
                        "Games / Sports": 4,
                      };
                      setAffectiveScores(allFour);
                      if (reportData) setReportData({ ...reportData, affectiveScores: allFour });
                    }}
                    className="text-xs font-semibold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
                  >
                    Set all to 4
                  </button>
                </div>
              </div>

              {/* Skills grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { en: "Punctuality", ar: "المواظبة" },
                  { en: "Neatness", ar: "النظافة" },
                  { en: "Attitude to sch. Work", ar: "التجاوب الدراسي" },
                  { en: "Attentiveness", ar: "الانتباه" },
                  { en: "Speaking Habit/Writing", ar: "التحدث / الخط" },
                  { en: "Verbal Fluency", ar: "الفصاحة" },
                  { en: "Games / Sports", ar: "الألعاب والرياضة" },
                ].map((skill) => {
                  const currentScore = affectiveScores[skill.en] ?? 5;
                  return (
                    <div
                      key={skill.en}
                      className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-gray-800 truncate">
                          {skill.en}
                        </span>
                        <span
                          className="text-[11px] text-gray-500 font-medium"
                          style={{ fontFamily: "Amiri, serif" }}
                        >
                          {skill.ar}
                        </span>
                      </div>

                      {/* 1 - 5 Rating Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {[1, 2, 3, 4, 5].map((num) => {
                          const isSelected = currentScore === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              disabled={resultStatus === "locked"}
                              onClick={() => handleUpdateSkill(skill.en, num)}
                              className={`w-7 h-7 rounded-md text-xs font-bold transition flex items-center justify-center ${
                                isSelected
                                  ? "bg-indigo-600 text-white shadow-xs scale-105"
                                  : "bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={`Rate ${num}`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-gray-500">
                  {skillsSavedSuccess && (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Skills saved successfully!
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  disabled={savingSkills || resultStatus === "locked"}
                  onClick={handleSaveAllSkills}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 shadow-xs transition disabled:cursor-not-allowed ${
                    resultStatus === "locked"
                      ? "bg-gray-400"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-[0.99]"
                  }`}
                >
                  {resultStatus === "locked"
                    ? "Locked (Read-Only)"
                    : savingSkills
                    ? "Saving Skills..."
                    : "Save Psychomotor Skills"}
                </button>
              </div>
            </div>
          )}

          {/* Class Teacher's Comment */}
          <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs">
                  CT
                </span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Class Teacher's Comment</h3>
                  <p className="text-xs text-gray-500">Teacher's observation and term assessment</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={resultStatus === "locked"}
                  onClick={() => setCommentBankTarget("classTeacher")}
                  className="text-xs font-semibold text-sky-800 hover:text-sky-950 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-sky-200 shadow-xs hover:bg-sky-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquareQuote className="w-3.5 h-3.5 text-sky-600" />
                  Browse Comment Bank
                </button>
                <button
                  type="button"
                  disabled={resultStatus === "locked"}
                  onClick={() => setUseCustomClassTeacher((v) => !v)}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-xs hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-sky-500 outline-none shadow-xs"
              >
                <option value="">Select a comment or browse Comment Bank</option>
                {filteredComments.map((c) => {
                  const val = c.id || (c as any)._id || (c as any).code;
                  return (
                    <option key={val} value={val}>
                      {c.ar} — {c.en}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="flex flex-col gap-2.5">
                <input
                  dir="rtl"
                  style={{ fontFamily: "Amiri, serif" }}
                  placeholder="التعليق بالعربية (Arabic comment)"
                  disabled={resultStatus === "locked"}
                  value={classTeacherCustom.ar}
                  onChange={(e) =>
                    setClassTeacherCustom((p) => ({ ...p, ar: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-sky-500 outline-none shadow-xs"
                />
                <input
                  placeholder="Comment in English"
                  disabled={resultStatus === "locked"}
                  value={classTeacherCustom.en}
                  onChange={(e) =>
                    setClassTeacherCustom((p) => ({ ...p, en: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-sky-500 outline-none shadow-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-500">
                {classTeacherCommentId ? "Comment selected from bank" : useCustomClassTeacher ? "Custom text entered" : "No comment assigned"}
              </span>
              <button
                type="button"
                disabled={savingComment || resultStatus === "locked"}
                onClick={() => handleSaveComment("classTeacherComment")}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 shadow-xs transition disabled:cursor-not-allowed ${
                  resultStatus === "locked"
                    ? "bg-gray-400"
                    : "bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99]"
                }`}
              >
                {resultStatus === "locked"
                  ? "Locked (Read-Only)"
                  : savingComment
                  ? "Saving..."
                  : "Save Class Teacher Remark"}
              </button>
            </div>
          </div>

          {/* Principal's Comment */}
          <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  PR
                </span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Principal's Comment</h3>
                  <p className="text-xs text-gray-500">Principal / Head of school overall endorsement</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={resultStatus === "locked"}
                  onClick={() => setCommentBankTarget("principal")}
                  className="text-xs font-semibold text-emerald-900 hover:text-emerald-950 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-xs hover:bg-emerald-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-700" />
                  Browse Comment Bank
                </button>
                <button
                  type="button"
                  disabled={resultStatus === "locked"}
                  onClick={() => setUseCustomPrincipal((v) => !v)}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-xs hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
              >
                <option value="">Select a comment or browse Comment Bank</option>
                {filteredComments.map((c) => {
                  const val = c.id || (c as any)._id || (c as any).code;
                  return (
                    <option key={val} value={val}>
                      {c.ar} — {c.en}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="flex flex-col gap-2.5">
                <input
                  dir="rtl"
                  style={{ fontFamily: "Amiri, serif" }}
                  placeholder="تعليق المدير بالعربية (Arabic principal comment)"
                  disabled={resultStatus === "locked"}
                  value={principalCustom.ar}
                  onChange={(e) =>
                    setPrincipalCustom((p) => ({ ...p, ar: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
                />
                <input
                  placeholder="Principal's comment in English"
                  disabled={resultStatus === "locked"}
                  value={principalCustom.en}
                  onChange={(e) =>
                    setPrincipalCustom((p) => ({ ...p, en: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-500">
                {principalCommentId ? "Comment selected from bank" : useCustomPrincipal ? "Custom text entered" : "No comment assigned"}
              </span>
              <button
                type="button"
                disabled={savingPrincipalComment || resultStatus === "locked"}
                onClick={() => handleSaveComment("principalComment")}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 shadow-xs transition disabled:cursor-not-allowed ${
                  resultStatus === "locked"
                    ? "bg-gray-400"
                    : "bg-emerald-700 hover:bg-emerald-800 shadow-md shadow-emerald-700/20 active:scale-[0.99]"
                }`}
              >
                {resultStatus === "locked"
                  ? "Locked (Read-Only)"
                  : savingPrincipalComment
                  ? "Saving..."
                  : "Save Principal Remark"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remarks Comment Bank Modal */}
      <RemarksCommentBankModal
        isOpen={commentBankTarget !== null}
        onClose={() => setCommentBankTarget(null)}
        targetRole={commentBankTarget === "principal" ? "principal" : "class_teacher"}
        studentGender={studentGender}
        studentName={students.find((s) => s._id === selectedStudent)?.name}
        currentCommentId={
          commentBankTarget === "classTeacher"
            ? classTeacherCommentId
            : principalCommentId
        }
        onSelectComment={(comment: ReportCardComment) => {
          const cId = comment.id || (comment as any)._id || (comment as any).code;
          if (commentBankTarget === "classTeacher") {
            setClassTeacherCommentId(cId);
            setUseCustomClassTeacher(false);
            setClassTeacherCustom({ en: comment.en || "", ar: comment.ar || "" });
          } else if (commentBankTarget === "principal") {
            setPrincipalCommentId(cId);
            setUseCustomPrincipal(false);
            setPrincipalCustom({ en: comment.en || "", ar: comment.ar || "" });
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

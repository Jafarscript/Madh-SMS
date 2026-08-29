/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useRef, useState, useMemo } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  Upload,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Award,
  Users,
  Percent,
} from "lucide-react";
import BulkScoreUploadModal from "../components/BulkScoreUploadModal";

interface Subject {
  _id: string;
  nameEnglish: string;
  nameArabic?: string;
  class: string;
}
interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
}
interface Student {
  _id: string;
  name: string;
  numberInClass?: number;
}
interface Term {
  _id: string;
  session: string;
  termNumber: number;
  isActive: boolean;
}
interface ScoreEntry {
  ca: string;
  exam: string;
}

type Field = "ca" | "exam" | "total";
type FilterType = "all" | "missing" | "completed" | "at_risk";

const SubjectTeacherHome = () => {
  const { user, logout } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classesById, setClassesById] = useState<Record<string, ClassItem>>({});
  const [selectedSubject, setSelectedSubject] = useState("");
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [existingScores, setExistingScores] = useState<Record<string, { ca: number; exam: number }>>({});
  const [entries, setEntries] = useState<Record<string, ScoreEntry>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  // Bulk Upload Modal state
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // refs for keyboard navigation
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    api.get("/auth/me").then((res) => setSubjects(res.data.subjects || []));
  }, []);

  useEffect(() => {
    const load = async () => {
      const classesRes = await api.get("/classes");
      const classMap: Record<string, ClassItem> = {};
      classesRes.data.forEach((c: ClassItem) => (classMap[c._id] = c));
      setClassesById(classMap);

      const termsRes = await api.get("/terms");
      setTerms(termsRes.data);
      const active = termsRes.data.find((t: Term) => t.isActive);
      if (active) setSelectedTerm(active._id);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedSubject || !selectedTerm) {
      setStudents([]);
      return;
    }
    const subject = subjects.find((s) => s._id === selectedSubject);
    if (!subject) return;

    const loadRoster = async () => {
      const studentsRes = await api.get(`/students?class=${subject.class}`);
      setStudents(studentsRes.data);

      const scoresRes = await api.get(
        `/scores?subject=${selectedSubject}&term=${selectedTerm}`
      );
      const scoreMap: Record<string, { ca: number; exam: number }> = {};
      const initialEntries: Record<string, ScoreEntry> = {};
      scoresRes.data.forEach((sc: any) => {
        if (!sc.student) return;
        scoreMap[sc.student._id] = { ca: sc.ca, exam: sc.exam };
        initialEntries[sc.student._id] = { ca: String(sc.ca), exam: String(sc.exam) };
      });
      setExistingScores(scoreMap);
      setEntries(initialEntries);
    };
    loadRoster();
  }, [selectedSubject, selectedTerm, subjects]);

  const selectedSubjectObj = subjects.find((s) => s._id === selectedSubject);
  const selectedClassObj = selectedSubjectObj ? classesById[selectedSubjectObj.class] : null;

  // stable, sorted order
  const sortedStudents = useMemo(() => {
    return [...students].sort(
      (a, b) => (a.numberInClass ?? 0) - (b.numberInClass ?? 0)
    );
  }, [students]);

  // filtered students based on search and status
  const filteredStudents = useMemo(() => {
    return sortedStudents.filter((s) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesNo = s.numberInClass ? String(s.numberInClass).includes(q) : false;
        if (!matchesName && !matchesNo) return false;
      }

      // Filter
      const entry = entries[s._id];
      const hasCa = entry && entry.ca !== "";
      const hasExam = entry && entry.exam !== "";
      const isComplete = hasCa && hasExam;
      const total = isComplete ? Number(entry.ca) + Number(entry.exam) : null;

      if (filterType === "missing" && isComplete) return false;
      if (filterType === "completed" && !isComplete) return false;
      if (filterType === "at_risk" && (!isComplete || (total !== null && total >= 50))) return false;

      return true;
    });
  }, [sortedStudents, searchQuery, filterType, entries]);

  // Live Class Statistics calculations
  const classStats = useMemo(() => {
    let completedCount = 0;
    let totalScoreSum = 0;
    let highest = -1;
    let lowest = 101;
    let passCount = 0;

    sortedStudents.forEach((s) => {
      const entry = entries[s._id];
      if (entry && entry.ca !== "" && entry.exam !== "") {
        const ca = Number(entry.ca);
        const exam = Number(entry.exam);
        const total = ca + exam;
        if (!isNaN(total)) {
          completedCount++;
          totalScoreSum += total;
          if (total > highest) highest = total;
          if (total < lowest) lowest = total;
          if (total >= 40) passCount++;
        }
      }
    });

    const average = completedCount > 0 ? (totalScoreSum / completedCount).toFixed(1) : "-";
    const passRate = completedCount > 0 ? `${Math.round((passCount / completedCount) * 100)}%` : "-";

    return {
      totalStudents: sortedStudents.length,
      completedCount,
      completionRate: sortedStudents.length > 0 ? Math.round((completedCount / sortedStudents.length) * 100) : 0,
      average,
      highest: highest >= 0 ? highest : "-",
      lowest: lowest <= 100 ? lowest : "-",
      passRate,
    };
  }, [sortedStudents, entries]);

  const handleChange = (studentId: string, field: Field, value: string) => {
    if (field === "total") {
      if (value === "") {
        setEntries((prev) => ({
          ...prev,
          [studentId]: { ca: "", exam: "" },
        }));
        return;
      }
      const num = Number(value);
      if (!isNaN(num)) {
        const total = Math.max(0, Math.min(100, num));
        const ca = Math.round(total * 0.4);
        const exam = total - ca;
        setEntries((prev) => ({
          ...prev,
          [studentId]: { ca: String(ca), exam: String(exam) },
        }));
      }
    } else {
      setEntries((prev) => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || { ca: "", exam: "" }),
          [field]: value,
        },
      }));
    }
  };

  const handleSave = async (studentId: string) => {
    setError("");
    setSavedMsg("");
    const entry = entries[studentId];
    if (!entry || entry.ca === "" || entry.exam === "") {
      setError("Enter both CA and Exam before saving");
      return;
    }

    const ca = Number(entry.ca);
    const exam = Number(entry.exam);

    if (ca > 40 || exam > 60 || ca < 0 || exam < 0) {
      setError("CA must be 0-40 and Exam must be 0-60");
      return;
    }

    setSaving(studentId);
    try {
      await api.post("/scores", {
        student: studentId,
        subject: selectedSubject,
        term: selectedTerm,
        ca,
        exam,
      });
      setExistingScores((prev) => ({ ...prev, [studentId]: { ca, exam } }));
      setSavedMsg("Saved score successfully");
      setTimeout(() => setSavedMsg(""), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save score");
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAll = async () => {
    setError("");
    setSavedMsg("");

    const toSave = sortedStudents.filter((s) => {
      const entry = entries[s._id];
      return entry && entry.ca !== "" && entry.exam !== "";
    });

    if (toSave.length === 0) {
      setError("No completed scores to save yet");
      return;
    }

    for (const s of toSave) {
      const entry = entries[s._id];
      const ca = Number(entry.ca);
      const exam = Number(entry.exam);
      if (ca > 40 || exam > 60 || ca < 0 || exam < 0) {
        setError(`Invalid score for ${s.name} — CA must be 0-40, Exam must be 0-60`);
        return;
      }
    }

    setSavingAll(true);
    try {
      await Promise.all(
        toSave.map((s) => {
          const entry = entries[s._id];
          return api.post("/scores", {
            student: s._id,
            subject: selectedSubject,
            term: selectedTerm,
            ca: Number(entry.ca),
            exam: Number(entry.exam),
          });
        })
      );

      setExistingScores((prev) => {
        const updated = { ...prev };
        toSave.forEach((s) => {
          const entry = entries[s._id];
          updated[s._id] = { ca: Number(entry.ca), exam: Number(entry.exam) };
        });
        return updated;
      });

      setSavedMsg(`Saved ${toSave.length} score${toSave.length > 1 ? "s" : ""} successfully`);
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Some scores failed to save — please check and try again");
    } finally {
      setSavingAll(false);
    }
  };

  const handleRevertAll = () => {
    if (window.confirm("Revert all unsaved score edits back to saved state?")) {
      const initialEntries: Record<string, ScoreEntry> = {};
      Object.keys(existingScores).forEach((id) => {
        initialEntries[id] = {
          ca: String(existingScores[id].ca),
          exam: String(existingScores[id].exam),
        };
      });
      setEntries(initialEntries);
      setSavedMsg("Reverted changes");
      setTimeout(() => setSavedMsg(""), 1500);
    }
  };

  const handleApplyBulkScores = (parsedEntries: Record<string, { ca: string; exam: string }>) => {
    setEntries((prev) => ({
      ...prev,
      ...parsedEntries,
    }));
    setSavedMsg(`Imported ${Object.keys(parsedEntries).length} student scores into table. Click 'Save All' to persist.`);
  };

  // Keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    field: Field,
    studentId: string
  ) => {
    const focusCell = (row: number, f: Field) => {
      const target = filteredStudents[row];
      if (!target) return;
      const el = inputRefs.current[`${target._id}-${f}`];
      if (el) {
        el.focus();
        el.select();
      }
    };

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        focusCell(rowIndex - 1, field);
        break;
      case "ArrowDown":
        e.preventDefault();
        focusCell(rowIndex + 1, field);
        break;
      case "ArrowLeft":
        if (field === "total") {
          e.preventDefault();
          focusCell(rowIndex, "exam");
        } else if (field === "exam") {
          e.preventDefault();
          focusCell(rowIndex, "ca");
        }
        break;
      case "ArrowRight":
        if (field === "ca") {
          e.preventDefault();
          focusCell(rowIndex, "exam");
        } else if (field === "exam") {
          e.preventDefault();
          focusCell(rowIndex, "total");
        }
        break;
      case "Enter":
        e.preventDefault();
        handleSave(studentId);
        focusCell(rowIndex + 1, field);
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF6EE" }}>
      {/* Top Navbar */}
      <div
        className="px-4 sm:px-8 py-4 flex justify-between items-center shadow-xs"
        style={{ backgroundColor: "#0B3D2E" }}
      >
        <div>
          <p
            className="text-sm sm:text-lg font-bold truncate"
            style={{ fontFamily: "Playfair Display, serif", color: "#F4E4B8" }}
          >
            Subject Teacher Portal — {user?.name}
          </p>
          <p className="text-xs text-white/60">Manage marks, bulk imports, and score distribution</p>
        </div>
        <button
          onClick={logout}
          className="text-xs sm:text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg shrink-0 ml-2 transition"
        >
          Log out
        </button>
      </div>

      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
        {/* Subject & Term Selectors */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200/80">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Select Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              >
                <option value="">-- Choose a subject --</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.nameEnglish} {s.nameArabic ? `(${s.nameArabic})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Academic Term
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              >
                <option value="">-- Choose a term --</option>
                {terms.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.session} — Term {t.termNumber} {t.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {savedMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedMsg}</span>
          </div>
        )}

        {selectedSubject && selectedTerm && (
          <>
            {/* Live Analytics Dashboard Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-1">
                  <span>Submissions</span>
                  <Users className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {classStats.completedCount} / {classStats.totalStudents}
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-700 h-full rounded-full transition-all duration-300"
                    style={{ width: `${classStats.completionRate}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-1">
                  <span>Class Average</span>
                  <TrendingUp className="w-4 h-4 text-blue-700" />
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {classStats.average}
                  <span className="text-xs font-normal text-gray-500 ml-1">/ 100</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Based on saved & entered marks</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-1">
                  <span>Score Range</span>
                  <Award className="w-4 h-4 text-amber-700" />
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {classStats.highest} <span className="text-xs font-normal text-gray-400">high</span> / {classStats.lowest} <span className="text-xs font-normal text-gray-400">low</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Highest & lowest scores</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-1">
                  <span>Pass Rate (≥40)</span>
                  <Percent className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-xl font-bold text-emerald-800">
                  {classStats.passRate}
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Passing standard</p>
              </div>
            </div>

            {/* Actions & Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Left: Class info & search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                {selectedClassObj && (
                  <div className="px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-semibold text-emerald-950 shrink-0">
                    {selectedClassObj.name} {selectedClassObj.arm ? `— ${selectedClassObj.arm}` : ""}
                  </div>
                )}
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student or number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                {/* Filters */}
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      filterType === "all" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All ({sortedStudents.length})
                  </button>
                  <button
                    onClick={() => setFilterType("missing")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      filterType === "missing" ? "bg-amber-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Missing ({sortedStudents.length - classStats.completedCount})
                  </button>
                  <button
                    onClick={() => setFilterType("completed")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      filterType === "completed" ? "bg-emerald-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Completed ({classStats.completedCount})
                  </button>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowBulkUpload(true)}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  Bulk Upload CSV
                </button>

                <button
                  onClick={handleRevertAll}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                  title="Revert Unsaved Changes"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleSaveAll}
                  disabled={savingAll}
                  className="px-5 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition"
                  style={{ backgroundColor: "#0B3D2E" }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {savingAll ? "Saving all..." : `Save All (${classStats.completedCount})`}
                </button>
              </div>
            </div>

            {/* Quick Scoring Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Tip:</strong> Typing in <strong>Total (100)</strong> automatically calculates <strong>CA (40%)</strong> and <strong>Exam (60%)</strong> to nearest whole number. You can also use arrow keys to navigate like a spreadsheet.
                </span>
              </div>
            </div>

            {/* Desktop / tablet: Spreadsheet table */}
            <div className="hidden sm:block bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-100" style={{ backgroundColor: "#F4F1EA" }}>
                      <th className="p-3.5 font-semibold text-gray-600 w-14 text-center">No.</th>
                      <th className="p-3.5 font-semibold text-gray-700">Student Name</th>
                      <th className="p-3.5 font-semibold text-emerald-900 w-36 bg-emerald-100/40">
                        Total (100)
                        <span className="block text-[10px] text-emerald-700 font-normal">Auto 40/60 Split</span>
                      </th>
                      <th className="p-3.5 font-semibold text-gray-700 w-32">
                        CA Test (40)
                        <span className="block text-[10px] text-gray-400 font-normal">Max: 40</span>
                      </th>
                      <th className="p-3.5 font-semibold text-gray-700 w-32">
                        Exam (60)
                        <span className="block text-[10px] text-gray-400 font-normal">Max: 60</span>
                      </th>
                      <th className="p-3.5 font-semibold text-gray-500 text-center w-28">Status</th>
                      <th className="p-3.5 w-24 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-gray-400 text-xs">
                          No students found matching current filter/search.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s, rowIndex) => {
                        const entry = entries[s._id] || { ca: "", exam: "" };
                        const hasCa = entry.ca !== "";
                        const hasExam = entry.exam !== "";
                        const caNum = hasCa ? Number(entry.ca) : null;
                        const examNum = hasExam ? Number(entry.exam) : null;
                        const totalNum = (hasCa || hasExam) ? (Number(entry.ca || 0) + Number(entry.exam || 0)) : null;
                        const totalVal = totalNum !== null ? String(totalNum) : "";

                        // Validation checks
                        const isCaInvalid = caNum !== null && (caNum < 0 || caNum > 40);
                        const isExamInvalid = examNum !== null && (examNum < 0 || examNum > 60);
                        const isTotalInvalid = totalNum !== null && (totalNum < 0 || totalNum > 100);
                        const isIncomplete = (hasCa && !hasExam) || (!hasCa && hasExam);
                        const isSaved = existingScores[s._id] &&
                          String(existingScores[s._id].ca) === entry.ca &&
                          String(existingScores[s._id].exam) === entry.exam;

                        return (
                          <tr
                            key={s._id}
                            className={`transition-colors hover:bg-gray-50/70 ${
                              isCaInvalid || isExamInvalid || isTotalInvalid
                                ? "bg-red-50/40"
                                : isIncomplete
                                ? "bg-amber-50/30"
                                : ""
                            }`}
                          >
                            <td className="p-3.5 text-gray-400 text-center font-mono text-xs font-medium">
                              {s.numberInClass ?? "-"}
                            </td>
                            <td className="p-3.5 font-medium text-gray-900">
                              {s.name}
                            </td>

                            {/* Total Auto-Split */}
                            <td className="p-3.5 bg-emerald-50/30">
                              <input
                                ref={(el) => {
                                  inputRefs.current[`${s._id}-total`] = el;
                                }}
                                type="number"
                                min={0}
                                max={100}
                                placeholder="0-100"
                                value={totalVal}
                                onChange={(e) => handleChange(s._id, "total", e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, rowIndex, "total", s._id)}
                                className={`w-24 border rounded-lg px-2.5 py-1.5 text-emerald-950 font-bold text-center bg-white outline-none transition ${
                                  isTotalInvalid
                                    ? "border-red-500 focus:ring-2 focus:ring-red-500"
                                    : "border-emerald-300 focus:ring-2 focus:ring-emerald-500"
                                }`}
                              />
                            </td>

                            {/* CA Input */}
                            <td className="p-3.5">
                              <div className="relative inline-block">
                                <input
                                  ref={(el) => {
                                    inputRefs.current[`${s._id}-ca`] = el;
                                  }}
                                  type="number"
                                  min={0}
                                  max={40}
                                  placeholder="0-40"
                                  value={entry.ca}
                                  onChange={(e) => handleChange(s._id, "ca", e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, rowIndex, "ca", s._id)}
                                  className={`w-20 border rounded-lg px-2.5 py-1.5 text-center outline-none transition ${
                                    isCaInvalid
                                      ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 text-red-900 font-bold"
                                      : "border-gray-300 focus:ring-2 focus:ring-emerald-500"
                                  }`}
                                />
                                {isCaInvalid && (
                                  <span className="block text-[10px] text-red-600 font-semibold mt-0.5">Max 40</span>
                                )}
                              </div>
                            </td>

                            {/* Exam Input */}
                            <td className="p-3.5">
                              <div className="relative inline-block">
                                <input
                                  ref={(el) => {
                                    inputRefs.current[`${s._id}-exam`] = el;
                                  }}
                                  type="number"
                                  min={0}
                                  max={60}
                                  placeholder="0-60"
                                  value={entry.exam}
                                  onChange={(e) => handleChange(s._id, "exam", e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, rowIndex, "exam", s._id)}
                                  className={`w-20 border rounded-lg px-2.5 py-1.5 text-center outline-none transition ${
                                    isExamInvalid
                                      ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 text-red-900 font-bold"
                                      : "border-gray-300 focus:ring-2 focus:ring-emerald-500"
                                  }`}
                                />
                                {isExamInvalid && (
                                  <span className="block text-[10px] text-red-600 font-semibold mt-0.5">Max 60</span>
                                )}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="p-3.5 text-center">
                              {isCaInvalid || isExamInvalid || isTotalInvalid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-100/70 px-2 py-0.5 rounded-md">
                                  <AlertTriangle className="w-3 h-3" /> Error
                                </span>
                              ) : isIncomplete ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                                  Incomplete
                                </span>
                              ) : isSaved ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                                  <CheckCircle2 className="w-3 h-3" /> Saved
                                </span>
                              ) : hasCa && hasExam ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                                  Unsaved
                                </span>
                              ) : (
                                <span className="text-[11px] text-gray-400">Empty</span>
                              )}
                            </td>

                            {/* Action */}
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => handleSave(s._id)}
                                disabled={saving === s._id || isCaInvalid || isExamInvalid || isTotalInvalid || isIncomplete}
                                className="text-xs px-3.5 py-1.5 rounded-lg text-white font-medium disabled:opacity-40 shadow-xs transition"
                                style={{ backgroundColor: "#0B3D2E" }}
                              >
                                {saving === s._id
                                  ? "Saving..."
                                  : isSaved
                                  ? "Update"
                                  : "Save"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: Stacked cards */}
            <div className="sm:hidden flex flex-col gap-3">
              {filteredStudents.map((s, rowIndex) => {
                const entry = entries[s._id] || { ca: "", exam: "" };
                const hasCa = entry.ca !== "";
                const hasExam = entry.exam !== "";
                const totalVal = (hasCa || hasExam) ? String(Number(entry.ca || 0) + Number(entry.exam || 0)) : "";
                const isSaved = existingScores[s._id] &&
                  String(existingScores[s._id].ca) === entry.ca &&
                  String(existingScores[s._id].exam) === entry.exam;

                return (
                  <div key={s._id} className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-gray-800">
                        <span className="text-gray-400 mr-1.5 font-mono">#{s.numberInClass || "-"}</span>
                        {s.name}
                      </p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200">
                        Total: {totalVal || "-"}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
                        <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                          Total Mark (100) — Auto 40% CA / 60% Exam
                        </label>
                        <input
                          ref={(el) => {
                            inputRefs.current[`${s._id}-total`] = el;
                          }}
                          type="number"
                          min={0}
                          max={100}
                          placeholder="e.g. 75"
                          inputMode="numeric"
                          value={totalVal}
                          onChange={(e) => handleChange(s._id, "total", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, "total", s._id)}
                          className="w-full border border-emerald-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                        />
                      </div>

                      <div className="flex gap-2.5 items-end">
                        <div className="flex-1">
                          <label className="block text-[11px] text-gray-500 mb-1 font-semibold">CA Test (40)</label>
                          <input
                            ref={(el) => {
                              inputRefs.current[`${s._id}-ca`] = el;
                            }}
                            type="number"
                            min={0}
                            max={40}
                            inputMode="numeric"
                            value={entry.ca}
                            onChange={(e) => handleChange(s._id, "ca", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, "ca", s._id)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[11px] text-gray-500 mb-1 font-semibold">Exam (60)</label>
                          <input
                            ref={(el) => {
                              inputRefs.current[`${s._id}-exam`] = el;
                            }}
                            type="number"
                            min={0}
                            max={60}
                            inputMode="numeric"
                            value={entry.exam}
                            onChange={(e) => handleChange(s._id, "exam", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, "exam", s._id)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                        <button
                          onClick={() => handleSave(s._id)}
                          disabled={saving === s._id}
                          className="px-4 py-2.5 rounded-lg text-white text-xs font-bold disabled:opacity-50 shrink-0 shadow-xs"
                          style={{ backgroundColor: "#0B3D2E" }}
                        >
                          {saving === s._id
                            ? "..."
                            : isSaved
                            ? "Update"
                            : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Bulk Score Upload Modal */}
      {selectedSubjectObj && selectedClassObj && (
        <BulkScoreUploadModal
          isOpen={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
          students={students}
          currentScores={entries}
          subjectName={selectedSubjectObj.nameEnglish}
          className={selectedClassObj.name + (selectedClassObj.arm ? ` ${selectedClassObj.arm}` : "")}
          termName={terms.find((t) => t._id === selectedTerm)?.session || ""}
          onApply={handleApplyBulkScores}
        />
      )}
    </div>
  );
};

export default SubjectTeacherHome;

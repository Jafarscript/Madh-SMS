/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  Users,
  Archive,
  RefreshCw,
  Sparkles,
  Plus,
  ShieldCheck,
  CheckSquare,
  Square,
  Search,
  BookOpen,
} from "lucide-react";

interface Term {
  _id: string;
  session: string;
  termNumber: number;
  isActive: boolean;
  createdAt?: string;
}

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
  branch?: { _id: string; name: string };
}

interface Student {
  _id: string;
  name: string;
  gender: "M" | "F";
  numberInClass?: number;
  class: string | { _id: string; name: string; arm?: string };
  status?: string;
  graduationSession?: string;
}

export default function Terms() {
  const [activeTab, setActiveTab] = useState<"terms" | "promotion" | "archive">("terms");

  // Terms State
  const [terms, setTerms] = useState<Term[]>([]);
  const [newSession, setNewSession] = useState("");
  const [newTermNumber, setNewTermNumber] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Classes & Student Promotion State
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sourceClassId, setSourceClassId] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [promotionAction, setPromotionAction] = useState<"promote" | "graduate" | "retain">("promote");
  const [studentsInSource, setStudentsInSource] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promotionSearch, setPromotionSearch] = useState("");

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchTerms = async () => {
    try {
      const res = await api.get("/terms");
      setTerms(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch terms");
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get("/classes");
      setClasses(res.data || []);
    } catch (err: any) {
      console.error("Failed to fetch classes", err);
    }
  };

  useEffect(() => {
    fetchTerms();
    fetchClasses();
  }, []);

  // Fetch students when source class changes
  useEffect(() => {
    if (!sourceClassId) {
      setStudentsInSource([]);
      setSelectedStudentIds([]);
      return;
    }
    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        const res = await api.get(`/students?class=${sourceClassId}`);
        const activeOnly = (res.data || []).filter(
          (s: Student) => !s.status || s.status === "active"
        );
        setStudentsInSource(activeOnly);
        // Default select all active students for easy batch promotion
        setSelectedStudentIds(activeOnly.map((s: Student) => s._id));
      } catch (err) {
        console.error("Failed to load students for class", err);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [sourceClassId]);

  // Create new term
  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      await api.post("/terms", { session: newSession.trim(), termNumber: newTermNumber, isActive: false });
      setNewSession("");
      setNewTermNumber(1);
      setSuccessMsg("Academic term created successfully!");
      fetchTerms();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create term");
    } finally {
      setLoading(false);
    }
  };

  // Activate term
  const handleActivateTerm = async (id: string) => {
    setError("");
    setSuccessMsg("");
    try {
      await api.put(`/terms/${id}/activate`);
      setSuccessMsg("Active academic term updated successfully!");
      fetchTerms();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to activate term");
    }
  };

  // Student Selection Toggles
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s._id));
    }
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Execute Student Promotion / Graduation
  const handleExecutePromotion = async () => {
    if (selectedStudentIds.length === 0) return;
    if (promotionAction === "promote" && !targetClassId) {
      setError("Please select a target destination class for promotion.");
      setShowConfirmModal(false);
      return;
    }

    setPromoting(true);
    setError("");
    setSuccessMsg("");
    try {
      const activeTerm = terms.find((t) => t.isActive);
      const graduationSession = activeTerm?.session || new Date().getFullYear().toString();

      const res = await api.post("/students/promote", {
        studentIds: selectedStudentIds,
        action: promotionAction,
        sourceClassId,
        targetClassId: promotionAction === "promote" ? targetClassId : undefined,
        graduationSession,
      });

      setSuccessMsg(res.data.message || "Students transitioned successfully!");
      setShowConfirmModal(false);

      // Refresh source class student list
      const updatedRes = await api.get(`/students?class=${sourceClassId}`);
      const activeOnly = (updatedRes.data || []).filter(
        (s: Student) => !s.status || s.status === "active"
      );
      setStudentsInSource(activeOnly);
      setSelectedStudentIds(activeOnly.map((s: Student) => s._id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to execute student transition");
    } finally {
      setPromoting(false);
    }
  };

  const filteredStudents = studentsInSource.filter((s) =>
    s.name.toLowerCase().includes(promotionSearch.toLowerCase())
  );

  const activeTerm = terms.find((t) => t.isActive);
  const sourceClassObj = classes.find((c) => c._id === sourceClassId);
  const targetClassObj = classes.find((c) => c._id === targetClassId);

  // Group terms by session for Archiving tab
  const sessionsMap: Record<string, Term[]> = {};
  terms.forEach((t) => {
    if (!sessionsMap[t.session]) sessionsMap[t.session] = [];
    sessionsMap[t.session].push(t);
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Academic Calendar & Session Transitions"
        subtitle="Manage academic terms, end-of-year session transitions, student class promotions, and session archives"
      />

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("terms")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === "terms"
              ? "border-sky-600 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Terms & Academic Sessions</span>
        </button>

        <button
          onClick={() => setActiveTab("promotion")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === "promotion"
              ? "border-sky-600 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Promotions & Class Transitions</span>
          <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
            End of 3rd Term
          </span>
        </button>

        <button
          onClick={() => setActiveTab("archive")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === "archive"
              ? "border-sky-600 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Session Archives ({Object.keys(sessionsMap).length})</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: Terms & Sessions */}
      {activeTab === "terms" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Form */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 lg:col-span-1 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-600" />
              <span>Add New Academic Term</span>
            </h3>
            <p className="text-xs text-slate-500">
              Create terms for current or upcoming academic sessions. Only one term can be active at a time.
            </p>

            <form onSubmit={handleCreateTerm} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Academic Session
                </label>
                <input
                  type="text"
                  value={newSession}
                  onChange={(e) => setNewSession(e.target.value)}
                  required
                  placeholder="e.g. 2026/2027"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Term Number
                </label>
                <select
                  value={newTermNumber}
                  onChange={(e) => setNewTermNumber(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value={1}>1st Term</option>
                  <option value={2}>2nd Term</option>
                  <option value={3}>3rd Term (Promotion Term)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !newSession.trim()}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl shadow-sm shadow-sky-600/20 active:scale-95 transition disabled:opacity-50"
              >
                {loading ? "Adding..." : "+ Create Term"}
              </button>
            </form>
          </div>

          {/* Terms List */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Academic Terms Registry</h3>
                <p className="text-xs text-slate-500">
                  Current active term determines default score entry, report card generation, and broadsheet views.
                </p>
              </div>
              {activeTerm && (
                <div className="text-right">
                  <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-3 py-1 rounded-full border border-sky-200 inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
                    Active: {activeTerm.session} (Term {activeTerm.termNumber})
                  </span>
                </div>
              )}
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              {terms.map((t) => (
                <div
                  key={t._id}
                  className={`p-4 flex items-center justify-between transition ${
                    t.isActive ? "bg-sky-50/60 font-semibold" : "hover:bg-slate-50 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        t.isActive
                          ? "bg-sky-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      T{t.termNumber}
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 font-bold">
                        {t.session} — {t.termNumber === 1 ? "1st" : t.termNumber === 2 ? "2nd" : "3rd"} Term
                      </p>
                      <p className="text-xs text-slate-500 font-normal">
                        {t.termNumber === 3
                          ? "End-of-Session Promotion Term"
                          : `Mid-session Term ${t.termNumber}`}
                      </p>
                    </div>
                  </div>

                  <div>
                    {t.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Currently Active
                      </span>
                    ) : (
                      <button
                        onClick={() => handleActivateTerm(t._id)}
                        className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 transition shadow-2xs"
                      >
                        Set as Active Term
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Student Promotion & Class Transitions */}
      {activeTab === "promotion" && (
        <div className="space-y-6">
          {/* Transition Configuration Card */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">End-of-Year Class Transition Wizard</h3>
                <p className="text-xs text-slate-500">
                  Promote students from their current class to the next class level/arm, graduate final-year students, or retain students in current class.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Source Class */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Select Source (Current) Class
                </label>
                <select
                  value={sourceClassId}
                  onChange={(e) => setSourceClassId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="">-- Choose Source Class --</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.arm ? `(${c.arm})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Transition Action
                </label>
                <select
                  value={promotionAction}
                  onChange={(e) => setPromotionAction(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                >
                  <option value="promote">✨ Promote to Next Class Level / Arm</option>
                  <option value="graduate">🎓 Mark as Graduated (Final Class/SSS 3)</option>
                  <option value="retain">🔄 Retain in Current Class</option>
                </select>
              </div>

              {/* Target Class */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Destination (Next) Class
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  disabled={promotionAction !== "promote"}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 outline-none disabled:opacity-40 disabled:bg-slate-100"
                >
                  <option value="">-- Choose Destination Class --</option>
                  {classes
                    .filter((c) => c._id !== sourceClassId)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.arm ? `(${c.arm})` : ""}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Students List in Source Class */}
          {sourceClassId && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden space-y-4 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-sky-600" />
                    <span>
                      Roster: {sourceClassObj?.name} {sourceClassObj?.arm ? `(${sourceClassObj.arm})` : ""}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select students to apply transition ({selectedStudentIds.length} of {studentsInSource.length} selected)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={promotionSearch}
                      onChange={(e) => setPromotionSearch(e.target.value)}
                      placeholder="Search student..."
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white"
                    />
                  </div>

                  <button
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                  >
                    {selectedStudentIds.length === filteredStudents.length ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                        <span>Select All</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={selectedStudentIds.length === 0 || (promotionAction === "promote" && !targetClassId)}
                    className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm shadow-sky-600/20 active:scale-95 transition disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>
                      Execute {promotionAction === "promote" ? "Promotion" : promotionAction === "graduate" ? "Graduation" : "Retention"} ({selectedStudentIds.length})
                    </span>
                  </button>
                </div>
              </div>

              {loadingStudents ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600" />
                  <p className="text-xs font-medium mt-2">Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-sm font-semibold text-slate-600">No active students in this class.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredStudents.map((student) => {
                    const isSelected = selectedStudentIds.includes(student._id);
                    return (
                      <div
                        key={student._id}
                        onClick={() => handleToggleStudent(student._id)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-sky-50/70 border-sky-300 text-sky-950 shadow-2xs"
                            : "bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold border transition ${
                              isSelected
                                ? "bg-sky-600 border-sky-600 text-white"
                                : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            ✓
                          </div>
                          <div>
                            <p className="text-xs font-bold">{student.name}</p>
                            <p className="text-[11px] text-slate-500">
                              No. #{student.numberInClass || "—"} • {student.gender === "M" ? "Male" : "Female"}
                            </p>
                          </div>
                        </div>

                        {isSelected && promotionAction === "promote" && targetClassObj && (
                          <div className="text-[10px] font-bold text-sky-700 flex items-center gap-1 bg-sky-100 px-2 py-0.5 rounded-md">
                            <span>→ {targetClassObj.name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Session Archives */}
      {activeTab === "archive" && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Archive className="w-5 h-5 text-sky-600" />
              <span>Historical Academic Sessions & Archives</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review completed sessions and terms with historical snapshots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(sessionsMap).map(([sessionName, sessionTerms]) => {
              const hasActive = sessionTerms.some((t) => t.isActive);
              return (
                <div
                  key={sessionName}
                  className={`p-5 rounded-2xl border transition ${
                    hasActive
                      ? "bg-sky-50/40 border-sky-300"
                      : "bg-slate-50/60 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{sessionName} Session</h4>
                      <p className="text-xs text-slate-500">{sessionTerms.length} terms registered</p>
                    </div>

                    {hasActive ? (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                        Current Session
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                        Archived Session
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {sessionTerms.map((t) => (
                      <div
                        key={t._id}
                        className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-200/80"
                      >
                        <span className="font-semibold text-slate-800">
                          {t.termNumber === 1 ? "1st Term" : t.termNumber === 2 ? "2nd Term" : "3rd Term (Promotion)"}
                        </span>
                        {t.isActive ? (
                          <span className="text-emerald-600 font-bold">Active Now</span>
                        ) : (
                          <span className="text-slate-400">Completed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-sky-700">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-sky-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Class Transition</h3>
                <p className="text-xs text-slate-500">Please review before confirming</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 text-slate-700 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Source Class:</span>
                <strong className="text-slate-900">{sourceClassObj?.name} {sourceClassObj?.arm ? `(${sourceClassObj.arm})` : ""}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action:</span>
                <strong className="text-sky-700 capitalize">{promotionAction}</strong>
              </div>
              {promotionAction === "promote" && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination Class:</span>
                  <strong className="text-emerald-700">{targetClassObj?.name} {targetClassObj?.arm ? `(${targetClassObj.arm})` : ""}</strong>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Students Affected:</span>
                <strong className="text-slate-900">{selectedStudentIds.length} students</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePromotion}
                disabled={promoting}
                className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm shadow-sky-600/20 rounded-xl active:scale-95 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {promoting ? "Executing..." : "Confirm & Execute"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

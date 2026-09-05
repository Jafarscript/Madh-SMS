/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Users,
  BookOpen,
  MessageSquareQuote,
  ArrowUpDown,
  FileCheck2,
} from "lucide-react";

interface Term {
  _id: string;
  session: string;
  termNumber: number;
  isActive: boolean;
}

interface Branch {
  _id: string;
  name: string;
}

interface ClassPublicationItem {
  classId: string;
  className: string;
  arm?: string;
  branchName?: string;
  studentCount: number;
  subjectCount: number;
  scoresPercent: number;
  remarksPercent: number;
  missingScoresCount: number;
  missingTeacherRemarksCount: number;
  missingPrincipalRemarksCount: number;
  isFullyReady: boolean;
  status: "draft" | "published" | "locked";
  publishedAt?: string;
  lockedAt?: string;
}

interface AuditDetails {
  classInfo: {
    name: string;
    arm?: string;
    studentCount: number;
    subjectCount: number;
  };
  publication: {
    status: "draft" | "published" | "locked";
    publishedAt?: string;
    lockedAt?: string;
  };
  subjectsAudit: Array<{
    subjectId: string;
    nameEnglish: string;
    nameArabic?: string;
    teacherName?: string;
    enteredCount: number;
    expectedCount: number;
    missingCount: number;
    isComplete: boolean;
  }>;
  remarksAudit: {
    teacherRemarksEntered: number;
    principalRemarksEntered: number;
    missingTeacherRemarks: number;
    missingPrincipalRemarks: number;
  };
}

const ResultPublishing: React.FC = () => {
  const { user } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "locked" | "ready">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [classes, setClasses] = useState<ClassPublicationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Audit modal
  const [auditClassId, setAuditClassId] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditData, setAuditData] = useState<AuditDetails | null>(null);

  useEffect(() => {
    api.get("/terms").then((res) => {
      setTerms(res.data);
      const active = res.data.find((t: Term) => t.isActive);
      if (active) setSelectedTerm(active._id);
    });
    if (user?.role === "super_admin") {
      api.get("/branches").then((res) => setBranches(res.data));
    }
  }, [user]);

  const loadData = async () => {
    if (!selectedTerm) return;
    setLoading(true);
    setError("");
    try {
      const branchQuery = selectedBranch ? `&branch=${selectedBranch}` : "";
      const res = await api.get(`/result-publications/overview?term=${selectedTerm}${branchQuery}`);
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.classes)
        ? res.data.classes
        : [];
      setClasses(list);
      setSelectedClassIds([]);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load publication status");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTerm, selectedBranch]);

  const handleOpenAudit = async (classId: string) => {
    setAuditClassId(classId);
    setAuditLoading(true);
    try {
      const res = await api.get(`/result-publications/audit?class=${classId}&term=${selectedTerm}`);
      setAuditData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load class audit details");
    } finally {
      setAuditLoading(false);
    }
  };

  const handleUpdateSingleStatus = async (classId: string, newStatus: "draft" | "published" | "locked") => {
    setActionLoading(classId);
    setError("");
    setSuccessMsg("");
    try {
      await api.put("/result-publications", {
        class: classId,
        term: selectedTerm,
        status: newStatus,
      });
      setSuccessMsg(`Status updated to ${newStatus.toUpperCase()}`);
      setTimeout(() => setSuccessMsg(""), 2000);
      loadData();
      if (auditClassId === classId) {
        handleOpenAudit(classId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBatchUpdate = async (newStatus: "draft" | "published" | "locked") => {
    if (selectedClassIds.length === 0) return;
    setActionLoading("batch");
    setError("");
    setSuccessMsg("");
    try {
      await api.post("/result-publications/batch", {
        classIds: selectedClassIds,
        term: selectedTerm,
        status: newStatus,
      });
      setSuccessMsg(`Batch updated ${selectedClassIds.length} classes to ${newStatus.toUpperCase()}`);
      setTimeout(() => setSuccessMsg(""), 2500);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to batch update status");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredClasses = useMemo(() => {
    const list = Array.isArray(classes) ? classes : [];
    return list.filter((c) => {
      // Search
      const matchesSearch =
        (c.className || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.arm && c.arm.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.branchName && c.branchName.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      // Status
      if (statusFilter === "all") return true;
      if (statusFilter === "ready") return c.isFullyReady;
      return c.status === statusFilter;
    });
  }, [classes, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const list = Array.isArray(classes) ? classes : [];
    const total = list.length;
    const draft = list.filter((c) => c.status === "draft").length;
    const published = list.filter((c) => c.status === "published").length;
    const locked = list.filter((c) => c.status === "locked").length;
    const ready = list.filter((c) => c.isFullyReady).length;
    return { total, draft, published, locked, ready };
  }, [classes]);

  const toggleSelectAll = () => {
    if (selectedClassIds.length === filteredClasses.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(filteredClasses.map((c) => c.classId));
    }
  };

  const toggleSelectClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Result Publishing & Security"
        subtitle="Manage term result release states, lock grading, and audit score completeness"
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-1">
            <span>Total Classes</span>
            <BookOpen className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <p className="text-[11px] text-gray-400 mt-1">Across selected term</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-1">
            <span>Draft</span>
            <EyeOff className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{stats.draft}</div>
          <p className="text-[11px] text-amber-700 mt-1">Hidden from parents</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold mb-1">
            <span>Published</span>
            <Eye className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{stats.published}</div>
          <p className="text-[11px] text-emerald-700 mt-1">Visible in parent portal</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200/80 bg-red-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-red-800 text-xs font-semibold mb-1">
            <span>Locked</span>
            <Lock className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-900">{stats.locked}</div>
          <p className="text-[11px] text-red-700 mt-1">Immutable & frozen</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200/80 bg-blue-50/20 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-blue-800 text-xs font-semibold mb-1">
            <span>100% Ready</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.ready}</div>
          <p className="text-[11px] text-blue-700 mt-1">Scores & remarks complete</p>
        </div>
      </div>

      {/* Control Bar: Selectors & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Academic Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="">Select Term</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.session} — Term {t.termNumber} {t.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          {user?.role === "super_admin" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                School Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Search Class
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search class or arm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills & Batch Operations */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === "all" ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All ({classes.length})
            </button>
            <button
              onClick={() => setStatusFilter("ready")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === "ready" ? "bg-sky-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Ready to Publish ({stats.ready})
            </button>
            <button
              onClick={() => setStatusFilter("draft")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === "draft" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Drafts ({stats.draft})
            </button>
            <button
              onClick={() => setStatusFilter("published")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === "published" ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Published ({stats.published})
            </button>
            <button
              onClick={() => setStatusFilter("locked")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === "locked" ? "bg-red-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Locked ({stats.locked})
            </button>
          </div>

          {/* Batch Actions */}
          {selectedClassIds.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 animate-in fade-in">
              <span className="text-xs font-bold text-gray-700">
                {selectedClassIds.length} Selected:
              </span>
              <button
                onClick={() => handleBatchUpdate("published")}
                disabled={actionLoading === "batch"}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5" /> Publish
              </button>
              <button
                onClick={() => handleBatchUpdate("locked")}
                disabled={actionLoading === "batch"}
                className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition shadow-2xs"
              >
                <Lock className="w-3.5 h-3.5" /> Lock
              </button>
              <button
                onClick={() => handleBatchUpdate("draft")}
                disabled={actionLoading === "batch"}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition shadow-2xs"
              >
                <EyeOff className="w-3.5 h-3.5" /> Unpublish
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100 bg-slate-50">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredClasses.length > 0 && selectedClassIds.length === filteredClasses.length}
                    onChange={toggleSelectAll}
                    className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="p-3.5 font-semibold text-gray-700">Class & Arm</th>
                {user?.role === "super_admin" && (
                  <th className="p-3.5 font-semibold text-gray-700">Branch</th>
                )}
                <th className="p-3.5 font-semibold text-gray-700 text-center">Students</th>
                <th className="p-3.5 font-semibold text-gray-700 w-48">Score Progress</th>
                <th className="p-3.5 font-semibold text-gray-700 w-36">Remarks Progress</th>
                <th className="p-3.5 font-semibold text-gray-700 text-center">Status</th>
                <th className="p-3.5 font-semibold text-gray-700 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-600" />
                    Loading class publication status...
                  </td>
                </tr>
              ) : filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-xs">
                    No classes found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((item) => {
                  const isSelected = selectedClassIds.includes(item.classId);
                  const isBusy = actionLoading === item.classId;

                  return (
                    <tr
                      key={item.classId}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        isSelected ? "bg-sky-50/50" : ""
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectClass(item.classId)}
                          className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      <td className="p-3.5 font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{item.className}</span>
                          {item.arm && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                              Arm {item.arm}
                            </span>
                          )}
                          {item.isFullyReady && (
                            <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-bold rounded-md border border-sky-200">
                              Ready
                            </span>
                          )}
                        </div>
                      </td>

                      {user?.role === "super_admin" && (
                        <td className="p-3.5 text-gray-600 text-xs">
                          {item.branchName || "—"}
                        </td>
                      )}

                      <td className="p-3.5 text-center font-medium text-gray-700">
                        {item.studentCount}
                      </td>

                      {/* Score completion progress */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-gray-700">
                              {item.scoresPercent}%
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {item.missingScoresCount > 0 ? `${item.missingScoresCount} missing` : "All entered"}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                item.scoresPercent === 100
                                  ? "bg-sky-600"
                                  : item.scoresPercent > 50
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${item.scoresPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Remarks completion progress */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-gray-700">
                              {item.remarksPercent}%
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {item.missingTeacherRemarksCount + item.missingPrincipalRemarksCount > 0
                                ? `${item.missingTeacherRemarksCount + item.missingPrincipalRemarksCount} pending`
                                : "Done"}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                item.remarksPercent === 100
                                  ? "bg-sky-600"
                                  : "bg-sky-400"
                              }`}
                              style={{ width: `${item.remarksPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            item.status === "locked"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : item.status === "published"
                              ? "bg-sky-100 text-sky-800 border border-sky-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {item.status === "locked" ? (
                            <>
                              <Lock className="w-3 h-3" /> Locked
                            </>
                          ) : item.status === "published" ? (
                            <>
                              <Eye className="w-3 h-3" /> Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" /> Draft
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAudit(item.classId)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                            title="Audit class completeness"
                          >
                            Audit
                          </button>

                          {item.status === "draft" && (
                            <button
                              onClick={() => handleUpdateSingleStatus(item.classId, "published")}
                              disabled={isBusy}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition shadow-2xs disabled:opacity-50"
                            >
                              {isBusy ? "..." : "Publish"}
                            </button>
                          )}

                          {item.status === "published" && (
                            <>
                              <button
                                onClick={() => handleUpdateSingleStatus(item.classId, "locked")}
                                disabled={isBusy}
                                className="px-2.5 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg transition shadow-2xs disabled:opacity-50"
                                title="Freeze marks & remarks"
                              >
                                {isBusy ? "..." : "Lock"}
                              </button>
                              <button
                                onClick={() => handleUpdateSingleStatus(item.classId, "draft")}
                                disabled={isBusy}
                                className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                title="Hide from parents"
                              >
                                Draft
                              </button>
                            </>
                          )}

                          {item.status === "locked" && (
                            <button
                              onClick={() => handleUpdateSingleStatus(item.classId, "published")}
                              disabled={isBusy}
                              className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                              title="Unlock class for edits"
                            >
                              {isBusy ? "..." : "Unlock"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class Audit Details Modal */}
      {auditClassId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  Class Completion Audit — {auditData?.classInfo.name} {auditData?.classInfo.arm ? `(${auditData.classInfo.arm})` : ""}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verification before publication • {auditData?.classInfo.studentCount} Students enrolled
                </p>
              </div>
              <button
                onClick={() => {
                  setAuditClassId(null);
                  setAuditData(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {auditLoading ? (
                <div className="py-12 text-center text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                  Auditing subjects and remarks...
                </div>
              ) : auditData ? (
                <>
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-4 rounded-2xl border bg-gray-50">
                    <div className="flex items-center gap-3">
                      {auditData.publication.status === "locked" ? (
                        <div className="p-2 bg-red-100 rounded-xl text-red-700">
                          <Lock className="w-5 h-5" />
                        </div>
                      ) : auditData.publication.status === "published" ? (
                        <div className="p-2 bg-sky-100 rounded-xl text-sky-700">
                          <Eye className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
                          <EyeOff className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900 capitalize">
                          Status: {auditData.publication.status}
                        </p>
                        <p className="text-xs text-gray-500">
                          {auditData.publication.status === "locked"
                            ? "All scores and remarks are locked and secure."
                            : auditData.publication.status === "published"
                            ? "Results are live and visible to parents."
                            : "Results are in draft mode and hidden from parents."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {auditData.publication.status === "draft" && (
                        <button
                          onClick={() => handleUpdateSingleStatus(auditClassId, "published")}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition"
                        >
                          Publish Now
                        </button>
                      )}
                      {auditData.publication.status === "published" && (
                        <button
                          onClick={() => handleUpdateSingleStatus(auditClassId, "locked")}
                          className="px-3 py-1.5 bg-red-700 text-white text-xs font-bold rounded-xl"
                        >
                          Lock Now
                        </button>
                      )}
                      {auditData.publication.status === "locked" && (
                        <button
                          onClick={() => handleUpdateSingleStatus(auditClassId, "published")}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl"
                        >
                          Unlock
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Remarks Audit Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquareQuote className="w-4 h-4 text-sky-600" /> Remarks & Comments Audit
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500">Class Teacher Remarks</p>
                        <p className="text-lg font-bold text-gray-900 mt-0.5">
                          {auditData.remarksAudit.teacherRemarksEntered} / {auditData.classInfo.studentCount}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {auditData.remarksAudit.missingTeacherRemarks > 0
                            ? `⚠️ ${auditData.remarksAudit.missingTeacherRemarks} students missing teacher comment`
                            : "✅ 100% Completed"}
                        </p>
                      </div>

                      <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500">Principal Remarks</p>
                        <p className="text-lg font-bold text-gray-900 mt-0.5">
                          {auditData.remarksAudit.principalRemarksEntered} / {auditData.classInfo.studentCount}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {auditData.remarksAudit.missingPrincipalRemarks > 0
                            ? `⚠️ ${auditData.remarksAudit.missingPrincipalRemarks} students missing principal comment`
                            : "✅ 100% Completed"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subject Scores Audit */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-sky-600" /> Subject Scores Audit
                    </h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                      {auditData.subjectsAudit.map((sub) => (
                        <div key={sub.subjectId} className="p-3.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-gray-800">{sub.nameEnglish}</p>
                            <p className="text-gray-400 text-[11px]">
                              Teacher: {sub.teacherName || "Unassigned"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                sub.isComplete
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {sub.enteredCount} / {sub.expectedCount} Entered
                            </span>
                            {sub.missingCount > 0 && (
                              <p className="text-[10px] text-red-600 font-semibold mt-0.5">
                                {sub.missingCount} marks missing
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setAuditClassId(null);
                  setAuditData(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPublishing;

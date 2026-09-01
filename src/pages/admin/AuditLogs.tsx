import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import {
  History,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  User,
  Calendar,
  BookOpen,
  GraduationCap,
  Download,
  RefreshCw,
  Clock,
  FileSpreadsheet,
} from "lucide-react";

interface AuditLog {
  _id: string;
  student: {
    _id: string;
    name: string;
    numberInClass: number;
    gender: string;
  };
  subject: {
    _id: string;
    nameEnglish: string;
    nameArabic?: string;
  };
  term: {
    _id: string;
    session: string;
    termNumber: number;
    isActive: boolean;
  };
  class?: {
    _id: string;
    name: string;
    arm?: string;
  };
  action: "create" | "update" | "delete" | "bulk_import";
  previousScore?: {
    ca?: number;
    exam?: number;
    total?: number;
  };
  newScore: {
    ca?: number;
    exam?: number;
    total?: number;
  };
  changedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  reason?: string;
  createdAt: string;
}

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
}

interface SubjectItem {
  _id: string;
  nameEnglish: string;
  nameArabic?: string;
  class: string;
}

interface TermItem {
  _id: string;
  session: string;
  termNumber: number;
  isActive: boolean;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);

  // Filters
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFilters = async () => {
    try {
      const [cRes, sRes, tRes] = await Promise.all([
        api.get("/classes"),
        api.get("/subjects"),
        api.get("/terms"),
      ]);
      setClasses(cRes.data || []);
      setSubjects(sRes.data || []);
      setTerms(tRes.data || []);
    } catch (err) {
      console.error("Failed to fetch filter metadata", err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 50,
      };
      if (selectedClass !== "all") params.class = selectedClass;
      if (selectedSubject !== "all") params.subject = selectedSubject;
      if (selectedTerm !== "all") params.term = selectedTerm;

      const res = await api.get("/scores/audit-logs", { params });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, selectedClass, selectedSubject, selectedTerm]);

  // Client-side search and action filter
  const filteredLogs = logs.filter((log) => {
    if (selectedAction !== "all" && log.action !== selectedAction) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const studentName = log.student?.name?.toLowerCase() || "";
    const subjectName = log.subject?.nameEnglish?.toLowerCase() || "";
    const userName = log.changedBy?.name?.toLowerCase() || "";
    const userEmail = log.changedBy?.email?.toLowerCase() || "";
    const reason = log.reason?.toLowerCase() || "";

    return (
      studentName.includes(query) ||
      subjectName.includes(query) ||
      userName.includes(query) ||
      userEmail.includes(query) ||
      reason.includes(query)
    );
  });

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = [
      "Date & Time",
      "Action",
      "Student Name",
      "Class",
      "Subject",
      "Term",
      "Previous CA",
      "Previous Exam",
      "Previous Total",
      "New CA",
      "New Exam",
      "New Total",
      "Changed By",
      "User Role",
      "Reason",
    ];

    const rows = filteredLogs.map((log) => [
      new Date(log.createdAt).toLocaleString(),
      log.action,
      `"${log.student?.name || "N/A"}"`,
      `"${log.class ? `${log.class.name} ${log.class.arm || ""}` : "N/A"}"`,
      `"${log.subject?.nameEnglish || "N/A"}"`,
      `"${log.term ? `${log.term.session} Term ${log.term.termNumber}` : "N/A"}"`,
      log.previousScore?.ca ?? "—",
      log.previousScore?.exam ?? "—",
      log.previousScore?.total ?? "—",
      log.newScore?.ca ?? "—",
      log.newScore?.exam ?? "—",
      log.newScore?.total ?? "—",
      `"${log.changedBy?.name || log.changedBy?.email || "N/A"}"`,
      log.changedBy?.role || "N/A",
      `"${log.reason || "Score Entry"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Score_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getScoreDiff = (prev?: number, next?: number) => {
    if (prev === undefined || prev === null) return null;
    const diff = (next ?? 0) - prev;
    if (diff > 0) return `+${diff}`;
    if (diff < 0) return `${diff}`;
    return "0";
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Grading Audit Trail & Activity Logs"
          subtitle="Real-time security log tracking every score entry and adjustment with previous vs new score comparisons"
        />

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm shadow-sky-600/20 active:scale-95 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Recorded Actions</p>
            <p className="text-xl font-bold text-slate-900">{total.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Score Adjustments</p>
            <p className="text-xl font-bold text-slate-900">
              {logs.filter((l) => l.action === "update").length}
              <span className="text-xs font-normal text-slate-500 ml-1.5">in current page</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Integrity Status</p>
            <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Surveillance
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, subject, teacher name/email, or reason..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" />
              <span>Action:</span>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(["all", "update", "create"] as const).map((act) => (
                <button
                  key={act}
                  onClick={() => setSelectedAction(act)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                    selectedAction === act
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {act === "all" ? "All Logs" : act === "update" ? "Adjustments" : "New Entries"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.arm ? `(${c.arm})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.nameEnglish} {s.nameArabic ? `(${s.nameArabic})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Academic Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => {
                setSelectedTerm(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="all">All Terms</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.session} — Term {t.termNumber} {t.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-sky-600" />
            <p className="text-sm font-medium">Loading audit history...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <History className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="text-base font-semibold text-slate-700">No audit logs found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Score entries and score updates made by teachers or administrators will automatically be logged here with complete before-and-after snapshots.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Student & Class</th>
                  <th className="py-3 px-4">Subject & Term</th>
                  <th className="py-3 px-4">Score Snapshot (Before → After)</th>
                  <th className="py-3 px-4">User / Staff</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const isUpdate = log.action === "update" && log.previousScore;
                  const totalDiff = isUpdate
                    ? getScoreDiff(log.previousScore?.total, log.newScore?.total)
                    : null;

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        <div className="font-medium text-slate-900">
                          {new Date(log.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.action === "update" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Score Adjusted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Initial Entry
                          </span>
                        )}
                      </td>

                      {/* Student & Class */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {log.student?.name || "Unknown Student"}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-slate-400" />
                          <span>
                            {log.class ? `${log.class.name} ${log.class.arm || ""}` : "No Class"}
                          </span>
                          {log.student?.numberInClass ? (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono">
                              #{log.student.numberInClass}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Subject & Term */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {log.subject?.nameEnglish || "Subject"}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {log.term
                              ? `${log.term.session} — Term ${log.term.termNumber}`
                              : "No Term"}
                          </span>
                        </div>
                      </td>

                      {/* Score Diff Comparison */}
                      <td className="py-3.5 px-4">
                        {isUpdate ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400 font-mono line-through">
                                CA {log.previousScore?.ca} + Exam {log.previousScore?.exam} ={" "}
                                <strong className="text-slate-500">{log.previousScore?.total}</strong>
                              </span>
                              <ArrowRight className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="text-[11px] font-mono font-bold text-slate-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                CA {log.newScore?.ca} + Exam {log.newScore?.exam} ={" "}
                                <span className="text-sky-700">{log.newScore?.total}</span>
                              </span>
                            </div>
                            {totalDiff && (
                              <div className="text-[10px] font-bold text-slate-500">
                                Total Change:{" "}
                                <span
                                  className={
                                    totalDiff.startsWith("+")
                                      ? "text-emerald-600"
                                      : totalDiff.startsWith("-")
                                      ? "text-rose-600"
                                      : "text-slate-500"
                                  }
                                >
                                  {totalDiff} pts
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded inline-block border border-slate-200">
                            CA: <strong>{log.newScore?.ca}</strong> | Exam:{" "}
                            <strong>{log.newScore?.exam}</strong> | Total:{" "}
                            <strong className="text-sky-700">{log.newScore?.total}</strong>
                          </div>
                        )}
                      </td>

                      {/* Changed By User */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.changedBy?.name || log.changedBy?.email || "System"}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium capitalize">
                          {log.changedBy?.role?.replace("_", " ") || "Administrator"}
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs">
                        <span className="text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
                          {log.reason || "Score recorded via teacher portal"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total logs)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

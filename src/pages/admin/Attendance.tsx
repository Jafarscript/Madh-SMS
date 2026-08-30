import { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import {
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
  branch?: { _id: string; name: string } | string;
}

interface Term {
  _id: string;
  session: string;
  termNumber: number;
  isActive: boolean;
}

interface StudentAttendanceRecord {
  student: string;
  name: string;
  numberInClass?: number;
  timesPresent: number | string;
  timesAbsent: number | string;
}

interface AttendanceSettings {
  timesSchoolOpened: number | string;
  dateResumed: string;
  dateClosed: string;
  nextResumption: string;
  applyToWholeBranch?: boolean;
}

const Attendance = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  const [settings, setSettings] = useState<AttendanceSettings>({
    timesSchoolOpened: "",
    dateResumed: "",
    dateClosed: "",
    nextResumption: "",
    applyToWholeBranch: false,
  });

  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [quickFillPresent, setQuickFillPresent] = useState<string>("");

  useEffect(() => {
    api.get("/classes").then((res) => {
      setClasses(res.data || []);
      if (res.data?.length > 0) setSelectedClass(res.data[0]._id);
    });
    api.get("/terms").then((res) => {
      setTerms(res.data || []);
      const active = res.data?.find((term: Term) => term.isActive);
      if (active) setSelectedTerm(active._id);
      else if (res.data?.length > 0) setSelectedTerm(res.data[0]._id);
    });
  }, []);

  const loadAttendance = async () => {
    if (!selectedClass || !selectedTerm) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get(`/attendance?class=${selectedClass}&term=${selectedTerm}`);
      const data = res.data;
      setSettings({
        timesSchoolOpened: data.settings?.timesSchoolOpened ?? "",
        dateResumed: data.settings?.dateResumed || "",
        dateClosed: data.settings?.dateClosed || "",
        nextResumption: data.settings?.nextResumption || "",
        applyToWholeBranch: false,
      });
      setQuickFillPresent(data.settings?.timesSchoolOpened ? String(data.settings.timesSchoolOpened) : "");
      setRecords(
        (data.students || []).map((s: any) => ({
          student: s.student,
          name: s.name,
          numberInClass: s.numberInClass,
          timesPresent: s.timesPresent !== null && s.timesPresent !== undefined ? String(s.timesPresent) : "",
          timesAbsent: s.timesAbsent !== null && s.timesAbsent !== undefined ? String(s.timesAbsent) : "",
        }))
      );
      setIsLocked(!!data.isLocked);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Could not load class attendance data",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedTerm) {
      loadAttendance();
    }
  }, [selectedClass, selectedTerm]);

  const handleStudentChange = (
    studentId: string,
    field: "timesPresent" | "timesAbsent",
    value: string
  ) => {
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.student !== studentId) return rec;
        const updated = { ...rec, [field]: value };
        // Auto-compute absent if timesSchoolOpened is provided and only present was modified
        if (field === "timesPresent" && settings.timesSchoolOpened && value !== "") {
          const openedNum = Number(settings.timesSchoolOpened);
          const presNum = Number(value);
          if (!isNaN(openedNum) && !isNaN(presNum) && openedNum >= presNum) {
            updated.timesAbsent = String(openedNum - presNum);
          }
        }
        return updated;
      })
    );
  };

  const handleQuickFill = () => {
    const val = quickFillPresent.trim();
    if (!val) return;
    const openedNum = Number(settings.timesSchoolOpened || val);
    const presNum = Number(val);
    const defaultAbsent = !isNaN(openedNum) && !isNaN(presNum) && openedNum >= presNum ? String(openedNum - presNum) : "0";

    setRecords((prev) =>
      prev.map((rec) => ({
        ...rec,
        timesPresent: val,
        timesAbsent: defaultAbsent,
      }))
    );
  };

  const handleClearAll = () => {
    setRecords((prev) =>
      prev.map((rec) => ({
        ...rec,
        timesPresent: "",
        timesAbsent: "",
      }))
    );
  };

  const saveAttendance = async () => {
    if (!selectedClass || !selectedTerm) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.put("/attendance/bulk", {
        class: selectedClass,
        term: selectedTerm,
        settings: {
          timesSchoolOpened:
            settings.timesSchoolOpened !== "" ? Number(settings.timesSchoolOpened) : null,
          dateResumed: settings.dateResumed,
          dateClosed: settings.dateClosed,
          nextResumption: settings.nextResumption,
          applyToWholeBranch: settings.applyToWholeBranch,
        },
        records: records.map((r) => ({
          student: r.student,
          timesPresent: r.timesPresent !== "" ? Number(r.timesPresent) : null,
          timesAbsent: r.timesAbsent !== "" ? Number(r.timesAbsent) : null,
        })),
      });
      setMessage({ type: "success", text: "Attendance and term calendar saved successfully." });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Could not save attendance data",
      });
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const total = records.length;
    const filled = records.filter((r) => r.timesPresent !== "" || r.timesAbsent !== "").length;
    const unassigned = total - filled;
    return { total, filled, unassigned };
  }, [records]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Attendance & Term Dates"
        subtitle="Manage term calendar dates and student attendance counts (Present / Absent)"
      />

      {/* Selectors Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
            Class
          </label>
          <select
            id="attendance-class-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
          >
            <option value="">Select class</option>
            {classes.map((item) => {
              const branchName =
                typeof item.branch === "object" && item.branch !== null
                  ? item.branch.name
                  : typeof item.branch === "string" && item.branch
                  ? item.branch
                  : "";
              return (
                <option key={item._id} value={item._id}>
                  {item.name}
                  {item.arm ? ` (${item.arm})` : ""}
                  {branchName ? ` — ${branchName}` : ""}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
            Term / Session
          </label>
          <select
            id="attendance-term-select"
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
          >
            <option value="">Select term</option>
            {terms.map((term) => (
              <option key={term._id} value={term._id}>
                {term.session} — Term {term.termNumber} {term.isActive ? "(Active)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            id="attendance-refresh-btn"
            onClick={loadAttendance}
            disabled={!selectedClass || !selectedTerm || loading}
            className="w-full rounded-lg px-4 py-2 text-white font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            style={{ backgroundColor: "#0B3D2E" }}
          >
            {loading ? (
              <>
                <Clock className="w-4 h-4 animate-spin" /> Loading...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" /> Load Data
              </>
            )}
          </button>
        </div>
      </div>

      {isLocked && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-sm">
          <Lock className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <span>
            <strong>Class Result is Locked:</strong> Attendance and term dates for this class and
            term are currently finalized and cannot be edited.
          </span>
        </div>
      )}

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Central Term Calendar Settings Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Term Calendar & Resumption Dates</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These dates and total times opened appear automatically on every student's report sheet for this term.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
            Central Settings
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Times School Opened (No. of Days)
            </label>
            <input
              id="term-school-opened-input"
              type="number"
              min="0"
              placeholder="e.g. 110"
              disabled={isLocked}
              value={settings.timesSchoolOpened}
              onChange={(e) =>
                setSettings((s) => ({ ...s, timesSchoolOpened: e.target.value }))
              }
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none disabled:bg-slate-100"
            />
            <p className="text-[11px] text-slate-500 mt-1">Leave blank to display "-" on sheet</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date School Resumed
            </label>
            <input
              id="term-date-resumed-input"
              type="text"
              placeholder="e.g. 08/09/2025"
              disabled={isLocked}
              value={settings.dateResumed}
              onChange={(e) =>
                setSettings((s) => ({ ...s, dateResumed: e.target.value }))
              }
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none disabled:bg-slate-100"
            />
            <p className="text-[11px] text-slate-500 mt-1">resumption date for this term</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date School Closes
            </label>
            <input
              id="term-date-closed-input"
              type="text"
              placeholder="e.g. 12/12/2025"
              disabled={isLocked}
              value={settings.dateClosed}
              onChange={(e) =>
                setSettings((s) => ({ ...s, dateClosed: e.target.value }))
              }
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none disabled:bg-slate-100"
            />
            <p className="text-[11px] text-slate-500 mt-1">closing/vacation date</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Next Resumption Date
            </label>
            <input
              id="term-next-resumption-input"
              type="text"
              placeholder="e.g. 05/01/2026"
              disabled={isLocked}
              value={settings.nextResumption}
              onChange={(e) =>
                setSettings((s) => ({ ...s, nextResumption: e.target.value }))
              }
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none disabled:bg-slate-100"
            />
            <p className="text-[11px] text-slate-500 mt-1">next term start date</p>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={isLocked}
              checked={settings.applyToWholeBranch}
              onChange={(e) =>
                setSettings((s) => ({ ...s, applyToWholeBranch: e.target.checked }))
              }
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <span>Apply these 4 calendar values to all classes in this branch</span>
          </label>
        </div>
      </div>

      {/* Student Attendance Records Table */}
      {selectedClass && selectedTerm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header & Quick Fill toolbar */}
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50">
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Student Attendance Roster</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter total times present and absent for each student for the entire term. If left blank, it displays as a dash (<b>-</b>).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">
                <b>{stats.filled}</b> of <b>{stats.total}</b> students set
              </span>
              <button
                id="attendance-save-btn"
                onClick={saveAttendance}
                disabled={saving || isLocked || records.length === 0}
                className="rounded-xl px-4 py-2 text-white font-semibold text-sm flex items-center gap-2 bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Attendance
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Fast batch tools */}
          {!isLocked && records.length > 0 && (
            <div className="px-5 py-3 border-b border-slate-200 bg-sky-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span className="font-medium text-sky-950">Fast Auto-Fill:</span>
                <input
                  type="number"
                  placeholder="e.g. 110"
                  value={quickFillPresent}
                  onChange={(e) => setQuickFillPresent(e.target.value)}
                  className="w-24 border border-sky-300 rounded-lg px-2.5 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="px-3 py-1 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition shadow-xs"
                >
                  Fill All Students
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-slate-500 hover:text-rose-600 transition underline underline-offset-2 font-medium"
                >
                  Reset / Clear Table
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-16 text-center">#</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 w-40 text-center">Times Present</th>
                  <th className="px-4 py-3 w-40 text-center">Times Absent</th>
                  <th className="px-4 py-3 w-32 text-center">Report Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No students found in this class.
                    </td>
                  </tr>
                ) : (
                  records.map((record, index) => {
                    const presentDisplay = record.timesPresent !== "" ? record.timesPresent : "-";
                    const absentDisplay = record.timesAbsent !== "" ? record.timesAbsent : "-";
                    return (
                      <tr key={record.student} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 text-center text-slate-500 font-medium">
                          {record.numberInClass || index + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {record.name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            placeholder="-"
                            disabled={isLocked}
                            value={record.timesPresent}
                            onChange={(e) =>
                              handleStudentChange(record.student, "timesPresent", e.target.value)
                            }
                            className="w-28 text-center font-bold border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none disabled:bg-slate-100"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            placeholder="-"
                            disabled={isLocked}
                            value={record.timesAbsent}
                            onChange={(e) =>
                              handleStudentChange(record.student, "timesAbsent", e.target.value)
                            }
                            className="w-28 text-center font-bold border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none disabled:bg-slate-100"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-mono font-medium">
                            <span className="text-sky-700 font-bold">{presentDisplay}</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-rose-700 font-bold">{absentDisplay}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {records.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Showing {records.length} students
              </span>
              <button
                onClick={saveAttendance}
                disabled={saving || isLocked || records.length === 0}
                className="rounded-xl px-5 py-2 text-white font-semibold text-sm flex items-center gap-2 bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Attendance & Dates
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;

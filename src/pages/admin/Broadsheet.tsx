/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useRef } from "react";
import {
  Printer,
  Download,
  Search,
  BookOpen,
  Award,
  TrendingUp,
  Users,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";

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

interface SubjectScore {
  subject: string;
  nameEnglish: string;
  nameArabic?: string;
  order: number;
  score: number | null;
  ca?: number | null;
  exam?: number | null;
  termScores?: { termNumber: number; termId: string; score: number | null }[];
}

interface TermSummary {
  termId: string;
  termNumber: number;
  session: string;
  total: number;
  average: number;
  overallPercentage: number;
  allEntered: boolean;
  enteredCount: number;
  grade: string;
  remark: string;
  remarkArabic: string;
  position?: number | null;
}

interface Row {
  student: string;
  name: string;
  gender?: string;
  numberInClass?: number;
  subjectScores: SubjectScore[];
  total: number;
  average: number;
  overallPercentage: number;
  grade: string;
  remark: string;
  remarkArabic: string;
  position: number;
  allSubjectsEntered: boolean;
  termSummaries?: TermSummary[];
  cumulativeTotal?: number;
  cumulativeAverage?: number;
  cumulativePercentage?: number;
  cumulativeGrade?: string;
  cumulativeRemark?: string;
  cumulativeRemarkArabic?: string;
  cumulativePosition?: number;
}

interface SubjectMeta {
  _id: string;
  nameEnglish: string;
  nameArabic?: string;
  order?: number;
}

interface BroadsheetSummary {
  totalStudents: number;
  totalSubjects: number;
  classAvgPercentage: number;
  highestTotal: number;
  lowestTotal: number;
  remarkDistribution: Record<string, number>;
}

type SortKey =
  | "numberInClass"
  | "name"
  | "total"
  | "overallPercentage"
  | "remark"
  | "position"
  | "cumulativeAverage"
  | "cumulativePosition";

type ViewMode = "current" | "prior_summary" | "detailed_subjects";

const Broadsheet = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [subjects, setSubjects] = useState<SubjectMeta[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [sessionTerms, setSessionTerms] = useState<Term[]>([]);
  const [currentTermObj, setCurrentTermObj] = useState<Term | null>(null);
  const [summary, setSummary] = useState<BroadsheetSummary | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("numberInClass");
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("current");

  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
    api.get("/terms").then((res) => {
      setTerms(res.data);
      const active = res.data.find((t: Term) => t.isActive);
      if (active) setSelectedTerm(active._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass || !selectedTerm) {
      setSubjects([]);
      setRows([]);
      setSessionTerms([]);
      setSummary(null);
      return;
    }
    setLoading(true);
    api
      .get(`/broadsheet?class=${selectedClass}&term=${selectedTerm}`)
      .then((res) => {
        setSubjects(res.data.subjects || []);
        setRows(res.data.rows || []);
        setSessionTerms(res.data.sessionTerms || []);
        setCurrentTermObj(res.data.currentTerm || null);
        setSummary(res.data.summary || null);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedClass, selectedTerm]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filteredRows = rows.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const sortedRows = [...filteredRows].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "numberInClass")
      cmp = (a.numberInClass ?? 0) - (b.numberInClass ?? 0);
    if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    if (sortKey === "total") cmp = a.total - b.total;
    if (sortKey === "overallPercentage") cmp = a.overallPercentage - b.overallPercentage;
    if (sortKey === "position") cmp = a.position - b.position;
    if (sortKey === "cumulativeAverage")
      cmp = (a.cumulativeAverage ?? 0) - (b.cumulativeAverage ?? 0);
    if (sortKey === "cumulativePosition")
      cmp = (a.cumulativePosition ?? 0) - (b.cumulativePosition ?? 0);
    if (sortKey === "remark") cmp = a.remark.localeCompare(b.remark);
    return sortAsc ? cmp : -cmp;
  });

  const getRemarkBadgeColor = (remarkArabic: string) => {
    switch (remarkArabic) {
      case "ممتاز":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "جيد جداً":
        return "bg-sky-100 text-sky-800 border-sky-300";
      case "جيد":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "مقبول":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "راسب":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (sortedRows.length === 0) return;

    const headers = [
      "No.",
      "Student Name",
      ...subjects.map((s) => `${s.nameEnglish} (${s.nameArabic || ""})`),
      "Total",
      "Overall %",
      "Remark (التقدير)",
      "Grade",
      "Position",
    ];

    if (viewMode === "prior_summary") {
      sessionTerms.forEach((st) => {
        headers.push(`Term ${st.termNumber} Total`, `Term ${st.termNumber} %`, `Term ${st.termNumber} Pos`);
      });
      headers.push("Cumulative Average %", "Cumulative Remark", "Cumulative Pos");
    }

    const csvData = sortedRows.map((r) => {
      const rowData = [
        r.numberInClass ?? "",
        `"${r.name.replace(/"/g, '""')}"`,
        ...r.subjectScores.map((sc) => (sc.score !== null ? sc.score : "")),
        r.total,
        `${r.overallPercentage}%`,
        `"${r.remarkArabic} (${r.remark})"`,
        r.grade,
        r.position,
      ];

      if (viewMode === "prior_summary") {
        sessionTerms.forEach((st) => {
          const tSum = r.termSummaries?.find((ts) => ts.termNumber === st.termNumber);
          rowData.push(tSum ? tSum.total : "", tSum ? `${tSum.overallPercentage}%` : "", tSum?.position ?? "");
        });
        rowData.push(
          r.cumulativePercentage !== undefined ? `${r.cumulativePercentage}%` : "",
          r.cumulativeRemarkArabic ? `"${r.cumulativeRemarkArabic}"` : "",
          r.cumulativePosition ?? ""
        );
      }

      return rowData.join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvData].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Broadsheet_${selectedClass}_${currentTermObj?.session || "Session"}_Term${currentTermObj?.termNumber || ""}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedClassObj = classes.find((c) => c._id === selectedClass);
  const selectedBranchName =
    selectedClassObj && typeof selectedClassObj.branch === "object"
      ? selectedClassObj.branch.name
      : typeof selectedClassObj?.branch === "string"
      ? selectedClassObj.branch
      : "";

  const priorTermsList = currentTermObj
    ? sessionTerms.filter((st) => st.termNumber < currentTermObj.termNumber)
    : [];

  const SortHeader = ({
    label,
    labelAr,
    sortk,
    align = "text-left",
  }: {
    label: string;
    labelAr?: string;
    sortk: SortKey;
    align?: string;
  }) => (
    <th
      onClick={() => handleSort(sortk)}
      className={`p-3 font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap hover:bg-black/5 transition ${align}`}
    >
      <div>{label}</div>
      {labelAr && (
        <div className="text-[11px] text-emerald-800 font-normal" style={{ fontFamily: "Amiri, serif" }}>
          {labelAr}
        </div>
      )}
      {sortKey === sortk && (
        <span className="text-sky-600 text-xs ml-1">{sortAsc ? "▲" : "▼"}</span>
      )}
    </th>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="print:hidden">
        <PageHeader
          title="Broadsheet & Gradebook"
          subtitle="Master academic results with overall percentage, remarks (التقدير), and multi-term performance tracking"
        />

        {/* Filters and Controls */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              >
                <option value="">Select a class</option>
                {classes.map((c) => {
                  const bName =
                    typeof c.branch === "object" && c.branch !== null
                      ? c.branch.name
                      : typeof c.branch === "string" && c.branch
                      ? c.branch
                      : "";
                  return (
                    <option key={c._id} value={c._id}>
                      {c.name}
                      {c.arm ? ` (${c.arm})` : ""}
                      {bName ? ` — ${bName}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                Term
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              >
                <option value="">Select a term</option>
                {terms.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.session} — Term {t.termNumber} {t.isActive ? " (Active)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                Search Student
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type student name..."
                  className="w-full border border-gray-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={rows.length === 0}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-40"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={rows.length === 0}
                className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-40"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* View Mode Switcher */}
          {rows.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  View Mode:
                </span>
              </div>
              <div className="inline-flex p-1 bg-gray-100 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode("current")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewMode === "current"
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Current Term Broadsheet
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("prior_summary")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewMode === "prior_summary"
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Show Previous Terms Comparison
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("detailed_subjects")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewMode === "detailed_subjects"
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Subject Multi-Term Breakdown
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Broadsheet Summary Statistics */}
        {summary && rows.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium mb-1">
                <Users className="w-3.5 h-3.5 text-sky-600" /> Total Students
              </div>
              <div className="text-xl font-bold text-gray-900">{summary.totalStudents}</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium mb-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Subjects
              </div>
              <div className="text-xl font-bold text-gray-900">{summary.totalSubjects}</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Class Average %
              </div>
              <div className="text-xl font-bold text-emerald-700">
                {summary.classAvgPercentage}%
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium mb-1">
                <Award className="w-3.5 h-3.5 text-amber-600" /> Highest Total
              </div>
              <div className="text-xl font-bold text-gray-900">{summary.highestTotal}</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs col-span-2">
              <div className="text-xs font-medium text-gray-500 mb-1.5">
                Remarks Distribution (التقدير)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(summary.remarkDistribution).map(([remark, count]) => (
                  <span
                    key={remark}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border ${getRemarkBadgeColor(
                      remark
                    )}`}
                  >
                    {remark}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
          <p className="text-sm font-medium">Loading broadsheet data...</p>
        </div>
      )}

      {!loading && selectedClass && selectedTerm && rows.length === 0 && (
        <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
          <p className="text-sm font-medium">No students or results found for this class and term.</p>
        </div>
      )}

      {/* Broadsheet Table Document (Printable) */}
      {!loading && rows.length > 0 && (
        <div
          ref={printableRef}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto print:shadow-none print:border-none print:p-0"
        >
          {/* Header visible when printing */}
          <div className="hidden print:block p-6 border-b text-center">
            <h1 className="text-2xl font-bold text-gray-900">CLASS BROADSHEET & MASTER GRADEBOOK</h1>
            <p className="text-sm text-gray-600 mt-1">
              Class: {selectedClassObj?.name} {selectedClassObj?.arm ? `(${selectedClassObj.arm})` : ""}{" "}
              {selectedBranchName ? `| Branch: ${selectedBranchName}` : ""} | Session:{" "}
              {currentTermObj?.session} — Term {currentTermObj?.termNumber}
            </p>
          </div>

          <table className="text-sm w-full border-collapse">
            <thead>
              <tr className="border-b bg-stone-100/80 print:bg-stone-100">
                <SortHeader label="No." labelAr="الرقم" sortk="numberInClass" align="text-center" />
                <SortHeader label="Student Name" labelAr="اسم الطالب" sortk="name" />

                {/* Subject Columns */}
                {subjects.map((s, idx) => (
                  <th
                    key={s._id}
                    className="p-3 font-semibold text-gray-800 whitespace-nowrap text-center border-l border-stone-200/60 min-w-[90px]"
                  >
                    <div className="text-xs font-bold text-gray-700">
                      #{idx + 1} {s.nameEnglish}
                    </div>
                    {s.nameArabic && (
                      <div
                        className="text-sm text-emerald-900 font-bold"
                        style={{ fontFamily: "Amiri, serif" }}
                        dir="rtl"
                      >
                        {s.nameArabic}
                      </div>
                    )}
                    {viewMode === "detailed_subjects" && (
                      <div className="flex justify-center gap-1 text-[10px] text-gray-400 font-normal mt-1">
                        {sessionTerms.map((st) => (
                          <span key={st._id} className="px-1 bg-stone-200 rounded">
                            T{st.termNumber}
                          </span>
                        ))}
                      </div>
                    )}
                  </th>
                ))}

                {/* Current Term Total & Overall % */}
                <SortHeader
                  label="Total"
                  labelAr="المجموع"
                  sortk="total"
                  align="text-center"
                />
                <SortHeader
                  label="Overall %"
                  labelAr="النسبة"
                  sortk="overallPercentage"
                  align="text-center"
                />

                {/* Remarks (التقدير) */}
                <SortHeader
                  label="Remarks"
                  labelAr="التقدير"
                  sortk="remark"
                  align="text-center"
                />

                {/* Current Term Position */}
                <SortHeader
                  label="Position"
                  labelAr="الترتيب"
                  sortk="position"
                  align="text-center"
                />

                {/* Prior Terms Comparison Columns (when viewMode is prior_summary) */}
                {viewMode === "prior_summary" && (
                  <>
                    {priorTermsList.map((pt) => (
                      <th
                        key={pt._id}
                        className="p-3 font-semibold text-indigo-900 bg-indigo-50/50 whitespace-nowrap text-center border-l border-indigo-100"
                      >
                        <div className="text-xs font-bold">Term {pt.termNumber}</div>
                        <div className="text-[10px] text-indigo-600 font-normal">Tot / % / Pos</div>
                      </th>
                    ))}
                    <SortHeader
                      label="Cumul. %"
                      labelAr="المعدل التراكمي"
                      sortk="cumulativeAverage"
                      align="text-center"
                    />
                    <th className="p-3 font-semibold text-emerald-900 bg-emerald-50/40 text-center whitespace-nowrap border-l border-emerald-100">
                      <div>Cumul. Remark</div>
                      <div
                        className="text-[11px] text-emerald-800 font-normal"
                        style={{ fontFamily: "Amiri, serif" }}
                      >
                        التقدير التراكمي
                      </div>
                    </th>
                    <SortHeader
                      label="Cumul. Pos"
                      labelAr="الترتيب التراكمي"
                      sortk="cumulativePosition"
                      align="text-center"
                    />
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedRows.map((row) => (
                <tr
                  key={row.student}
                  className="hover:bg-sky-50/40 transition print:hover:bg-transparent"
                >
                  <td className="p-3 text-center text-xs font-bold text-gray-500">
                    {row.numberInClass ?? "—"}
                  </td>

                  <td className="p-3 font-semibold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{row.name}</span>
                      {!row.allSubjectsEntered && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200 print:hidden"
                          title="Not all subject scores entered yet"
                        >
                          Incomplete
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Subject Scores */}
                  {row.subjectScores.map((sc) => (
                    <td
                      key={sc.subject}
                      className="p-3 text-center border-l border-gray-100 font-medium text-gray-800"
                    >
                      {viewMode === "detailed_subjects" ? (
                        <div className="flex justify-center gap-1.5 text-xs">
                          {sc.termScores?.map((ts) => (
                            <span
                              key={ts.termNumber}
                              className={`px-1 py-0.5 rounded text-[11px] ${
                                ts.termId === currentTermObj?._id
                                  ? "font-bold text-sky-900 bg-sky-100"
                                  : "text-gray-600 bg-gray-100"
                              }`}
                            >
                              {ts.score !== null ? ts.score : "—"}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span>
                          {sc.score !== null ? (
                            sc.score
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </span>
                      )}
                    </td>
                  ))}

                  {/* Total */}
                  <td className="p-3 text-center font-bold text-gray-900 border-l border-gray-100">
                    {row.total}
                  </td>

                  {/* Overall Percentage */}
                  <td className="p-3 text-center font-bold text-sky-800 border-l border-gray-100">
                    {row.overallPercentage}%
                  </td>

                  {/* Remarks (التقدير) */}
                  <td className="p-3 text-center border-l border-gray-100 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${getRemarkBadgeColor(
                        row.remarkArabic
                      )}`}
                    >
                      <span style={{ fontFamily: "Amiri, serif" }} className="text-sm">
                        {row.remarkArabic}
                      </span>
                      <span className="text-[10px] opacity-75 font-normal">
                        ({row.remark})
                      </span>
                    </span>
                  </td>

                  {/* Current Position */}
                  <td className="p-3 text-center font-bold text-emerald-900 border-l border-gray-100">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {row.position}
                    </span>
                  </td>

                  {/* Prior Terms Comparison Data */}
                  {viewMode === "prior_summary" && (
                    <>
                      {priorTermsList.map((pt) => {
                        const tSum = row.termSummaries?.find(
                          (ts) => ts.termNumber === pt.termNumber
                        );
                        return (
                          <td
                            key={pt._id}
                            className="p-3 text-center border-l border-indigo-100 bg-indigo-50/20 text-xs"
                          >
                            {tSum ? (
                              <div>
                                <span className="font-semibold text-gray-800">
                                  {tSum.total}
                                </span>{" "}
                                <span className="text-indigo-700">({tSum.overallPercentage}%)</span>{" "}
                                <span className="text-gray-500 text-[10px]">
                                  #{tSum.position ?? "—"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Cumulative Session Percentage */}
                      <td className="p-3 text-center font-bold text-emerald-800 border-l border-emerald-100 bg-emerald-50/20">
                        {row.cumulativePercentage !== undefined
                          ? `${row.cumulativePercentage}%`
                          : "—"}
                      </td>

                      {/* Cumulative Remark (التقدير التراكمي) */}
                      <td className="p-3 text-center border-l border-emerald-100 bg-emerald-50/20 whitespace-nowrap">
                        {row.cumulativeRemarkArabic ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${getRemarkBadgeColor(
                              row.cumulativeRemarkArabic
                            )}`}
                          >
                            <span style={{ fontFamily: "Amiri, serif" }}>
                              {row.cumulativeRemarkArabic}
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Cumulative Position */}
                      <td className="p-3 text-center font-bold text-emerald-900 border-l border-emerald-100 bg-emerald-50/20">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {row.cumulativePosition ?? "—"}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length > 0 && sortedRows.length === 0 && (
            <p className="p-8 text-sm text-gray-400 text-center">
              No student matches "{searchQuery}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Broadsheet;

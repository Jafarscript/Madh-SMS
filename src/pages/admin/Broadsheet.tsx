/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import {
  Printer,
  Download,
  FileSpreadsheet,
  Search,
  BookOpen,
  Award,
  TrendingUp,
  Users,
  SlidersHorizontal,
  GraduationCap,
  Edit3,
} from "lucide-react";
import XLSX from "xlsx-js-style";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import { compareSeatNumbers } from "../../utils/classCategoryHelper";

const SCHOOL_NAME_ARABIC = "معهد التعليم العربي الإسلامي للجمعية الخيرية";

const getArabicTermOrdinal = (termNumber?: number): string => {
  if (termNumber === 1) return "الأولى";
  if (termNumber === 2) return "الثانية";
  if (termNumber === 3) return "الثالثة";
  return "";
};

const getHijriYearFromSession = (session?: string): string => {
  const match = (session || "").match(/(\d{4})/);
  const startYear = match ? parseInt(match[1], 10) : new Date().getFullYear();
  try {
    const formatted = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      year: "numeric",
    }).format(new Date(startYear, 8, 1));
    const digits = formatted.match(/\d{4}/)?.[0];
    if (digits) return digits;
  } catch {
    // Fallback calculation below
  }
  return String(Math.round(((startYear - 622) * 33) / 32));
};

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
  isGraduating?: boolean;
  category?: "secondary" | "elementary";
  sourceSchool?: string;
  secondaryResultMode?: "current_only" | "combine_1st_and_3rd";
  branch?: { _id: string; name: string } | string;
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

interface SubjectScore {
  subject: string;
  nameEnglish: string;
  nameArabic?: string;
  order: number;
  score: number | null;
  ca?: number | null;
  exam?: number | null;
  isExcluded?: boolean;
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
  seatNumber?: string | null;
  sourceSchool?: string | null;
  effectiveResultMode?: "cascade" | "current_only" | "combine_1st_and_3rd";
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
  | "seatNumber"
  | "name"
  | "total"
  | "overallPercentage"
  | "remark"
  | "remarkArabic"
  | "position"
  | "cumulativeAverage"
  | "cumulativePosition";

type ViewMode = "current" | "prior_summary" | "detailed_subjects";

const Broadsheet = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [scales, setScales] = useState<GradingScale[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedScale, setSelectedScale] = useState("");
  const [subjects, setSubjects] = useState<SubjectMeta[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [sessionTerms, setSessionTerms] = useState<Term[]>([]);
  const [currentTermObj, setCurrentTermObj] = useState<Term | null>(null);
  const [summary, setSummary] = useState<BroadsheetSummary | null>(null);
  const [classMeta, setClassMeta] = useState<{
    isGraduating?: boolean;
    isElementary?: boolean;
    sourceSchool?: string | null;
    secondaryResultMode?: string;
  } | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("numberInClass");
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("current");
  const [onlyPresentTerms, setOnlyPresentTerms] = useState(true);

  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
    api.get("/terms").then((res) => {
      setTerms(res.data);
      const active = res.data.find((t: Term) => t.isActive);
      if (active) setSelectedTerm(active._id);
    });
    api.get("/grading-scales").then((res) => {
      setScales(res.data || []);
      if (res.data?.length > 0) {
        const taqdeer = res.data.find((s: GradingScale) => s.name === "التقدير");
        setSelectedScale(taqdeer ? taqdeer._id : res.data[0]._id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedClass || !selectedTerm) {
      setSubjects([]);
      setRows([]);
      setSessionTerms([]);
      setSummary(null);
      setClassMeta(null);
      return;
    }
    setLoading(true);
    const scaleParam = selectedScale ? `&gradingScale=${selectedScale}` : "";
    api
      .get(`/broadsheet?class=${selectedClass}&term=${selectedTerm}&onlyPresentTerms=${onlyPresentTerms}${scaleParam}`)
      .then((res) => {
        setSubjects(res.data.subjects || []);
        setRows(res.data.rows || []);
        setSessionTerms(res.data.sessionTerms || []);
        setCurrentTermObj(res.data.currentTerm || null);
        setSummary(res.data.summary || null);
        setClassMeta(res.data.classMeta || null);
        if (res.data.classMeta?.isGraduating) {
          setSortKey("seatNumber");
          setSortAsc(true);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedClass, selectedTerm, onlyPresentTerms, selectedScale]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filteredRows = rows.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      (r.seatNumber && r.seatNumber.toLowerCase().includes(q))
    );
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "numberInClass")
      cmp = (a.numberInClass ?? 0) - (b.numberInClass ?? 0);
    if (sortKey === "seatNumber")
      cmp = compareSeatNumbers(a.seatNumber, b.seatNumber, "asc");
    if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    if (sortKey === "total") cmp = a.total - b.total;
    if (sortKey === "overallPercentage") cmp = a.overallPercentage - b.overallPercentage;
    if (sortKey === "position") cmp = a.position - b.position;
    if (sortKey === "cumulativeAverage")
      cmp = (a.cumulativeAverage ?? 0) - (b.cumulativeAverage ?? 0);
    if (sortKey === "cumulativePosition")
      cmp = (a.cumulativePosition ?? 0) - (b.cumulativePosition ?? 0);
    if (sortKey === "remark") cmp = a.remark.localeCompare(b.remark);
    if (sortKey === "remarkArabic") cmp = a.remarkArabic.localeCompare(b.remarkArabic);
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

  // True Excel export (.xlsx) with RTL, Arabic header, colored headers, bold text, and red failing cells
  const handleExportExcel = () => {
    if (sortedRows.length === 0) return;

    const failThreshold = classMeta?.isElementary ? 40 : 50;
    const { schoolName, examSubtitle } = getBroadsheetHeaderText();

    const baseHeaders = [
      "الرقم",
      "رقم الجلوس",
      "اسم الطالب",
      ...subjects.map((s) => s.nameArabic || s.nameEnglish),
      "المجموع",
      "النسبة",
      "التقدير",
      "الترتيب",
    ];

    const extraHeaders: string[] = [];
    if (viewMode === "prior_summary") {
      sessionTerms.forEach((st) => {
        extraHeaders.push(`الفترة ${st.termNumber} المجموع`, `الفترة ${st.termNumber} %`, `الفترة ${st.termNumber} الترتيب`);
      });
      extraHeaders.push("المعدل التراكمي %", "التقدير التراكمي", "الترتيب التراكمي");
    }

    const headers = [...baseHeaders, ...extraHeaders];
    const totalCols = headers.length;
    const subjectStartCol = 3;
    const subjectEndCol = 3 + subjects.length - 1;
    const pctColIdx = 3 + subjects.length + 1;
    const remarkColIdx = 3 + subjects.length + 2;

    const excelData = sortedRows.map((r) => {
      const rowData: (string | number)[] = [
        r.numberInClass ?? "",
        r.seatNumber ?? "",
        r.name,
        ...r.subjectScores.map((sc) => (sc.isExcluded ? "" : sc.score !== null ? sc.score : "")),
        r.total,
        `${r.overallPercentage}%`,
        r.remarkArabic || r.remark,
        r.position ?? "",
      ];

      if (viewMode === "prior_summary") {
        sessionTerms.forEach((st) => {
          const tSum = r.termSummaries?.find((ts) => ts.termNumber === st.termNumber);
          rowData.push(tSum ? tSum.total : "", tSum ? `${tSum.overallPercentage}%` : "", tSum?.position ?? "");
        });
        rowData.push(
          r.cumulativePercentage !== undefined ? `${r.cumulativePercentage}%` : "",
          r.cumulativeRemarkArabic || r.cumulativeRemark || "",
          r.cumulativePosition ?? ""
        );
      }

      return rowData;
    });

    const aoa: (string | number)[][] = [
      [schoolName, ...Array(Math.max(0, totalCols - 1)).fill("")],
      [examSubtitle, ...Array(Math.max(0, totalCols - 1)).fill("")],
      headers,
      ...excelData,
    ];

    const worksheet: any = XLSX.utils.aoa_to_sheet(aoa);

    // Merge title rows across all columns
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
    ];

    // Right-to-Left worksheet view
    worksheet["!views"] = [{ RTL: true }];

    const thinBorder = {
      top: { style: "thin", color: { rgb: "CBD5E1" } },
      bottom: { style: "thin", color: { rgb: "CBD5E1" } },
      left: { style: "thin", color: { rgb: "CBD5E1" } },
      right: { style: "thin", color: { rgb: "CBD5E1" } },
    };

    const headerBorder = {
      top: { style: "thin", color: { rgb: "FFFFFF" } },
      bottom: { style: "medium", color: { rgb: "FFFFFF" } },
      left: { style: "thin", color: { rgb: "FFFFFF" } },
      right: { style: "thin", color: { rgb: "FFFFFF" } },
    };

    // Style top title rows (Row 0 & Row 1)
    for (let c = 0; c < totalCols; c++) {
      const addr0 = XLSX.utils.encode_cell({ r: 0, c });
      if (worksheet[addr0]) {
        worksheet[addr0].s = {
          font: { name: "Arial", sz: 16, bold: true, color: { rgb: "0F172A" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
      const addr1 = XLSX.utils.encode_cell({ r: 1, c });
      if (worksheet[addr1]) {
        worksheet[addr1].s = {
          font: { name: "Arial", sz: 13, bold: true, color: { rgb: "1E293B" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    }

    // Style header row (Row 2) - subject columns emerald, other headers navy, all bold white text
    for (let c = 0; c < totalCols; c++) {
      const addr = XLSX.utils.encode_cell({ r: 2, c });
      const isSubjectCol = c >= subjectStartCol && c <= subjectEndCol;
      if (worksheet[addr]) {
        worksheet[addr].s = {
          font: { name: "Arial", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
          fill: { patternType: "solid", fgColor: { rgb: isSubjectCol ? "065F46" : "1E3A8A" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: headerBorder,
        };
      }
    }

    // Style data rows (Row 3+) - all text bold; scores < failThreshold (and failing remark) in red bg + white bold text
    excelData.forEach((rowArr, rIdx) => {
      const excelRow = rIdx + 3;
      const sourceRow = sortedRows[rIdx];
      const isOverallFail =
        sourceRow.overallPercentage < failThreshold ||
        sourceRow.remarkArabic === "راسب" ||
        sourceRow.remark === "Fail";

      for (let c = 0; c < totalCols; c++) {
        const addr = XLSX.utils.encode_cell({ r: excelRow, c });
        if (!worksheet[addr]) continue;

        let isRedCell = false;
        if (c >= subjectStartCol && c <= subjectEndCol) {
          const sc = sourceRow.subjectScores[c - subjectStartCol];
          if (sc && !sc.isExcluded && sc.score !== null && sc.score < failThreshold) {
            isRedCell = true;
          }
        } else if ((c === pctColIdx || c === remarkColIdx) && isOverallFail) {
          isRedCell = true;
        }

        worksheet[addr].s = {
          font: {
            name: "Arial",
            sz: 11,
            bold: true,
            color: { rgb: isRedCell ? "FFFFFF" : "0F172A" },
          },
          fill: isRedCell
            ? { patternType: "solid", fgColor: { rgb: "DC2626" } }
            : rIdx % 2 === 1
            ? { patternType: "solid", fgColor: { rgb: "F8FAFC" } }
            : undefined,
          alignment: {
            horizontal: c === 2 ? "right" : "center",
            vertical: "center",
          },
          border: thinBorder,
        };
      }
    });

    // Row heights
    worksheet["!rows"] = [
      { hpt: 30 },
      { hpt: 24 },
      { hpt: 32 },
      ...excelData.map(() => ({ hpt: 22 })),
    ];

    // Auto-fit column widths
    const colWidths = headers.map((h, i) => {
      let maxLen = h.length;
      excelData.forEach((row) => {
        const valStr = String(row[i] ?? "");
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      return { wch: Math.max(maxLen + 5, i === 2 ? 26 : 12) };
    });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    workbook.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(workbook, worksheet, "Broadsheet");

    const classNameStr = selectedClassObj?.name || "Class";
    const sessionStr = currentTermObj?.session || "Session";
    const termStr = currentTermObj?.termNumber ? `Term${currentTermObj.termNumber}` : "";
    const fileName = `Broadsheet_${classNameStr}_${sessionStr}_${termStr}.xlsx`.replace(/[\s/\\?%*:|"<>]+/g, "_");

    XLSX.writeFile(workbook, fileName);
  };

  // CSV export with UTF-8 BOM (\uFEFF) for compatibility
  const handleExportCSV = () => {
    if (sortedRows.length === 0) return;

    const headers = [
      "No.",
      "Seat No.",
      "Student Name",
      ...subjects.map((s) => s.nameArabic || s.nameEnglish),
      "Total",
      "Overall %",
      "Remark (English)",
      "التقدير (Arabic)",
      "Position",
    ];

    if (viewMode === "prior_summary") {
      sessionTerms.forEach((st) => {
        headers.push(`Term ${st.termNumber} Total`, `Term ${st.termNumber} %`, `Term ${st.termNumber} Pos`);
      });
      headers.push("Cumulative Average %", "Cumulative Remark", "التقدير التراكمي", "Cumulative Pos");
    }

    const csvData = sortedRows.map((r) => {
      const rowData = [
        r.numberInClass ?? "",
        `"${(r.seatNumber || "").replace(/"/g, '""')}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        ...r.subjectScores.map((sc) => (sc.isExcluded ? "" : sc.score !== null ? sc.score : "")),
        r.total,
        `${r.overallPercentage}%`,
        `"${r.remark}"`,
        `"${r.remarkArabic}"`,
        r.position,
      ];

      if (viewMode === "prior_summary") {
        sessionTerms.forEach((st) => {
          const tSum = r.termSummaries?.find((ts) => ts.termNumber === st.termNumber);
          rowData.push(tSum ? tSum.total : "", tSum ? `${tSum.overallPercentage}%` : "", tSum?.position ?? "");
        });
        rowData.push(
          r.cumulativePercentage !== undefined ? `${r.cumulativePercentage}%` : "",
          `"${r.cumulativeRemark || ""}"`,
          `"${r.cumulativeRemarkArabic || ""}"`,
          r.cumulativePosition ?? ""
        );
      }

      return rowData.join(",");
    });

    // \uFEFF ensures UTF-8 BOM so Arabic displays correctly if opened in CSV-aware tools
    const csvContent = "\uFEFF" + [headers.join(","), ...csvData].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Broadsheet_${selectedClassObj?.name || "Class"}_${currentTermObj?.session || "Session"}_Term${currentTermObj?.termNumber || ""}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedClassObj = classes.find((c) => c._id === selectedClass);
  const selectedBranchName =
    selectedClassObj && typeof selectedClassObj.branch === "object"
      ? selectedClassObj.branch.name
      : typeof selectedClassObj?.branch === "string"
      ? selectedClassObj.branch
      : "";

  const failThreshold = classMeta?.isElementary ? 40 : 50;

  const getBroadsheetHeaderText = () => {
    const termOrd = getArabicTermOrdinal(currentTermObj?.termNumber);
    const rawClassName = (selectedClassObj?.name || "").trim();
    const classTitle = rawClassName.startsWith("الصف")
      ? rawClassName
      : rawClassName
      ? `الصف ${rawClassName}`
      : "";
    const armSuffix = selectedClassObj?.arm ? ` (${selectedClassObj.arm})` : "";
    const sessionDisplay = (currentTermObj?.session || "").replace("/", " / ");
    const hijriYear = getHijriYearFromSession(currentTermObj?.session);

    const examSubtitle = [
      "نتيجة امتحان",
      termOrd ? `الفترة ${termOrd}` : "",
      classTitle ? `ل${classTitle}${armSuffix}` : "",
      sessionDisplay ? `للعام الدراسي ${sessionDisplay}` : "",
      hijriYear ? `الموافق ${hijriYear} هـ` : "",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      schoolName: SCHOOL_NAME_ARABIC,
      examSubtitle,
    };
  };

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
      className={`p-3 font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap hover:bg-black/5 transition print:bg-[#1e3a8a] print:text-white print:font-bold print:border print:border-slate-300 [&_*]:print:text-white [&_*]:print:font-bold ${align}`}
    >
      <div>{label}</div>
      {labelAr && (
        <div className="text-[11px] text-emerald-800 font-normal" style={{ fontFamily: "Amiri, serif" }}>
          {labelAr}
        </div>
      )}
      {sortKey === sortk && (
        <span className="text-sky-600 text-xs ml-1 print:hidden">{sortAsc ? "▲" : "▼"}</span>
      )}
    </th>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .broadsheet-print-area {
            direction: rtl !important;
          }
          .broadsheet-print-area table {
            direction: rtl !important;
            width: 100% !important;
            font-weight: 700 !important;
          }
        }
      `}</style>
      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <PageHeader
            title="Broadsheet & Gradebook"
            subtitle="Master academic results with Arabic curriculum subjects, distinct English & Arabic remarks, and Excel export"
          />
          <Link
            to="/admin/grading-scales"
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:border-sky-300 text-sky-700 hover:text-sky-800 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <GraduationCap className="w-4 h-4 text-sky-600" />
            Edit Grading Scales
          </Link>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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
                  value={selectedScale}
                  onChange={(e) => setSelectedScale(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                >
                  {scales.map((sc) => (
                    <option key={sc._id} value={sc._id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
                <Link
                  to="/admin/grading-scales"
                  className="px-3 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition shrink-0"
                  title="Edit Grading Scale"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </Link>
              </div>
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

            {/* Actions: Print & Native Excel Export */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={rows.length === 0}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-40 shadow-xs"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={rows.length === 0}
                className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-40 shadow-xs shadow-emerald-700/20"
                title="Export native Excel (.xlsx) with Arabic characters fully preserved"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export Excel
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={rows.length === 0}
                className="py-2.5 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium flex items-center justify-center transition disabled:opacity-40"
                title="Export as CSV (UTF-8 BOM)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* View Mode Switcher */}
          {rows.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
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

                {classMeta?.isGraduating && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold inline-flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Graduating
                    </span>
                    {!classMeta.isElementary && (
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          classMeta.secondaryResultMode === "combine_1st_and_3rd"
                            ? "bg-purple-50 text-purple-800 border-purple-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {classMeta.secondaryResultMode === "combine_1st_and_3rd"
                          ? "1st + 3rd Terms"
                          : "Current Exam Only"}
                      </span>
                    )}
                    {classMeta.sourceSchool && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium">
                        {classMeta.sourceSchool}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Only Present Terms Toggle */}
              <label
                title="When checked, students who joined mid-year (Term 2 or Term 3) will only have their attended terms averaged. Terms they were absent/not enrolled will not be counted as 0 or aggregated against them."
                className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-gray-700 bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl transition"
              >
                <input
                  type="checkbox"
                  checked={onlyPresentTerms}
                  onChange={(e) => setOnlyPresentTerms(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-emerald-900">Only aggregate terms present</span>
              </label>
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
          className="broadsheet-print-area bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto custom-scrollbar print:shadow-none print:border-none print:p-0 print:overflow-visible"
        >
          {/* Header visible ONLY when printing/saving as PDF */}
          <div className="hidden print:block px-4 py-4 border-b-2 border-slate-800 text-center" dir="rtl">
            <h1
              className="text-2xl font-bold text-slate-950 leading-snug"
              style={{ fontFamily: "Amiri, serif" }}
            >
              {getBroadsheetHeaderText().schoolName}
            </h1>
            <p
              className="text-base font-bold text-slate-900 mt-1"
              style={{ fontFamily: "Amiri, serif" }}
            >
              {getBroadsheetHeaderText().examSubtitle}
            </p>
            {selectedBranchName && (
              <p className="text-xs font-bold text-slate-700 mt-1">
                {selectedBranchName}
              </p>
            )}
          </div>

          <table className="text-sm w-full min-w-max border-collapse print:text-xs print:font-bold">
            <thead>
              <tr className="border-b bg-stone-100/80 print:bg-[#1e3a8a]">
                <SortHeader label="No." labelAr="الرقم" sortk="numberInClass" align="text-center" />
                <SortHeader label="Seat No." labelAr="رقم الجلوس" sortk="seatNumber" align="text-center" />
                <SortHeader label="Student Name" labelAr="اسم الطالب" sortk="name" align="text-left print:text-right" />

                {/* Subject Columns: Arabic text only */}
                {subjects.map((s) => (
                  <th
                    key={s._id}
                    className="p-3 font-semibold text-gray-800 whitespace-nowrap text-center border-l border-stone-200/60 min-w-[95px] print:bg-[#065f46] print:text-white print:font-bold print:border print:border-slate-300 [&_*]:print:text-white [&_*]:print:font-bold"
                  >
                    <div
                      className="text-base text-emerald-950 font-bold leading-tight print:text-white print:text-sm"
                      style={{ fontFamily: "Amiri, serif" }}
                      dir="rtl"
                    >
                      {s.nameArabic || s.nameEnglish}
                    </div>
                    {viewMode === "detailed_subjects" && (
                      <div className="flex justify-center gap-1 text-[10px] text-gray-400 font-normal mt-1">
                        {sessionTerms.map((st) => (
                          <span key={st._id} className="px-1 bg-stone-200 print:bg-emerald-700 rounded">
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

                {/* Remarks: English Column */}
                <SortHeader
                  label="Remark"
                  labelAr="التقدير بالإنجليزية"
                  sortk="remark"
                  align="text-center"
                />

                {/* Remarks: Arabic Column */}
                <SortHeader
                  label="التقدير"
                  labelAr="Arabic Remark"
                  sortk="remarkArabic"
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
                        className="p-3 font-semibold text-indigo-900 bg-indigo-50/50 whitespace-nowrap text-center border-l border-indigo-100 print:bg-[#1e3a8a] print:text-white print:font-bold print:border print:border-slate-300 [&_*]:print:text-white [&_*]:print:font-bold"
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
                    <th className="p-3 font-semibold text-gray-700 text-center whitespace-nowrap border-l border-emerald-100 bg-emerald-50/40 print:bg-[#1e3a8a] print:text-white print:font-bold print:border print:border-slate-300 [&_*]:print:text-white [&_*]:print:font-bold">
                      <div>Cumul. Remark</div>
                      <div className="text-[11px] text-gray-500 font-normal">English</div>
                    </th>
                    <th className="p-3 font-semibold text-emerald-900 bg-emerald-50/40 text-center whitespace-nowrap border-l border-emerald-100 print:bg-[#1e3a8a] print:text-white print:font-bold print:border print:border-slate-300 [&_*]:print:text-white [&_*]:print:font-bold">
                      <div
                        className="text-sm text-emerald-800 font-bold"
                        style={{ fontFamily: "Amiri, serif" }}
                        dir="rtl"
                      >
                        التقدير التراكمي
                      </div>
                      <div className="text-[11px] text-emerald-600 font-normal">Arabic</div>
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
                  <td className="p-3 text-center text-xs font-bold text-gray-500 print:text-slate-950 print:font-bold print:border print:border-slate-300">
                    {row.numberInClass ?? "—"}
                  </td>

                  <td className="p-3 text-center text-xs font-mono font-semibold text-indigo-700 whitespace-nowrap print:text-slate-950 print:font-bold print:border print:border-slate-300">
                    {row.seatNumber || "—"}
                  </td>

                  <td className="p-3 font-semibold text-gray-900 whitespace-nowrap print:text-slate-950 print:font-bold print:border print:border-slate-300 print:text-right">
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
                  {row.subjectScores.map((sc) => {
                    const isFailingScore = !sc.isExcluded && sc.score !== null && sc.score < failThreshold;
                    return (
                    <td
                      key={sc.subject}
                      className={`p-3 text-center border-l border-gray-100 font-medium print:font-bold print:border print:border-slate-300 ${
                        isFailingScore
                          ? "bg-red-600 text-white font-bold print:bg-red-600 print:text-white"
                          : "text-gray-800 print:text-slate-950"
                      }`}
                    >
                      {sc.isExcluded ? (
                        <span className="text-[10px] text-gray-300 italic print:text-slate-500">N/A</span>
                      ) : viewMode === "detailed_subjects" ? (
                        <div className="flex justify-center gap-1.5 text-xs">
                          {sc.termScores?.map((ts) => (
                            <span
                              key={ts.termNumber}
                              className={`px-1 py-0.5 rounded text-[11px] print:font-bold ${
                                ts.score !== null && ts.score < failThreshold
                                  ? "bg-red-600 text-white font-bold"
                                  : ts.termId === currentTermObj?._id
                                  ? "font-bold text-sky-900 bg-sky-100"
                                  : "text-gray-600 bg-gray-100"
                              }`}
                            >
                              {ts.score !== null ? ts.score : "—"}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className={isFailingScore ? "font-bold text-white" : "print:font-bold"}>
                          {sc.score !== null ? (
                            sc.score
                          ) : (
                            <span className="text-gray-300 print:text-slate-400">—</span>
                          )}
                        </span>
                      )}
                    </td>
                    );
                  })}

                  {/* Total */}
                  <td className="p-3 text-center font-bold text-gray-900 border-l border-gray-100 print:text-slate-950 print:font-bold print:border print:border-slate-300">
                    {row.total}
                  </td>

                  {/* Overall Percentage */}
                  <td
                    className={`p-3 text-center font-bold border-l border-gray-100 print:font-bold print:border print:border-slate-300 ${
                      row.overallPercentage < failThreshold
                        ? "bg-red-600 text-white print:bg-red-600 print:text-white"
                        : "text-sky-800 print:text-slate-950"
                    }`}
                  >
                    {row.overallPercentage}%
                  </td>

                  {/* Remark (English Column) */}
                  <td className="p-3 text-center border-l border-gray-100 whitespace-nowrap text-xs font-semibold text-gray-700 print:text-slate-950 print:font-bold print:border print:border-slate-300">
                    {row.remark}
                  </td>

                  {/* Remarks (Arabic Column) */}
                  <td
                    className={`p-3 text-center border-l border-gray-100 whitespace-nowrap print:font-bold print:border print:border-slate-300 ${
                      row.remarkArabic === "راسب" || row.overallPercentage < failThreshold
                        ? "print:bg-red-600 print:text-white"
                        : ""
                    }`}
                  >
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-bold border shadow-2xs print:border-none print:shadow-none print:px-1 print:py-0 ${
                        row.remarkArabic === "راسب" || row.overallPercentage < failThreshold
                          ? "bg-red-600 text-white border-red-700"
                          : getRemarkBadgeColor(row.remarkArabic)
                      }`}
                      style={{ fontFamily: "Amiri, serif" }}
                      dir="rtl"
                    >
                      {row.remarkArabic}
                    </span>
                  </td>

                  {/* Current Position */}
                  <td className="p-3 text-center font-bold text-emerald-900 border-l border-gray-100 print:text-slate-950 print:font-bold print:border print:border-slate-300">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 print:bg-transparent print:border-none print:text-slate-950 print:font-bold">
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
                            className="p-3 text-center border-l border-indigo-100 bg-indigo-50/20 text-xs print:bg-transparent print:text-slate-950 print:font-bold print:border print:border-slate-300"
                          >
                            {tSum ? (
                              <div>
                                <span className="font-semibold text-gray-800 print:text-slate-950 print:font-bold">
                                  {tSum.total}
                                </span>{" "}
                                <span className="text-indigo-700 print:text-slate-950 print:font-bold">({tSum.overallPercentage}%)</span>{" "}
                                <span className="text-gray-500 text-[10px] print:text-slate-950 print:font-bold">
                                  #{tSum.position ?? "—"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-300 print:text-slate-400">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Cumulative Session Percentage */}
                      <td
                        className={`p-3 text-center font-bold border-l border-emerald-100 bg-emerald-50/20 print:font-bold print:border print:border-slate-300 ${
                          row.cumulativePercentage !== undefined && row.cumulativePercentage < failThreshold
                            ? "bg-red-600 text-white print:bg-red-600 print:text-white"
                            : "text-emerald-800 print:bg-transparent print:text-slate-950"
                        }`}
                      >
                        {row.cumulativePercentage !== undefined
                          ? `${row.cumulativePercentage}%`
                          : "—"}
                      </td>

                      {/* Cumulative Remark (English Column) */}
                      <td className="p-3 text-center border-l border-emerald-100 bg-emerald-50/20 text-xs font-semibold text-gray-700 whitespace-nowrap print:bg-transparent print:text-slate-950 print:font-bold print:border print:border-slate-300">
                        {row.cumulativeRemark || "—"}
                      </td>

                      {/* Cumulative Remark (Arabic Column - التقدير التراكمي) */}
                      <td
                        className={`p-3 text-center border-l border-emerald-100 bg-emerald-50/20 whitespace-nowrap print:font-bold print:border print:border-slate-300 ${
                          row.cumulativeRemarkArabic === "راسب" ||
                          (row.cumulativePercentage !== undefined && row.cumulativePercentage < failThreshold)
                            ? "print:bg-red-600 print:text-white"
                            : "print:bg-transparent"
                        }`}
                      >
                        {row.cumulativeRemarkArabic ? (
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border print:border-none print:px-1 print:py-0 ${
                              row.cumulativeRemarkArabic === "راسب" ||
                              (row.cumulativePercentage !== undefined && row.cumulativePercentage < failThreshold)
                                ? "bg-red-600 text-white border-red-700"
                                : getRemarkBadgeColor(row.cumulativeRemarkArabic)
                            }`}
                            style={{ fontFamily: "Amiri, serif" }}
                            dir="rtl"
                          >
                            {row.cumulativeRemarkArabic}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Cumulative Position */}
                      <td className="p-3 text-center font-bold text-emerald-900 border-l border-emerald-100 bg-emerald-50/20 print:bg-transparent print:text-slate-950 print:font-bold print:border print:border-slate-300">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 print:bg-transparent print:border-none print:text-slate-950 print:font-bold">
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


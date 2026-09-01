import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const currentDir =
  typeof __dirname !== "undefined"
    ? __dirname
    : typeof import.meta?.url === "string"
      ? path.dirname(fileURLToPath(import.meta.url))
      : process.cwd();

const LOGO_PATH = path.join(currentDir, "../assets/logo.png");
const FONT_PATH = path.join(currentDir, "../assets/fonts/Amiri-Regular.ttf");

const logoBase64 = fs.existsSync(LOGO_PATH)
  ? fs.readFileSync(LOGO_PATH).toString("base64")
  : "";
const fontBase64 = fs.existsSync(FONT_PATH)
  ? fs.readFileSync(FONT_PATH).toString("base64")
  : "";

interface SubjectResult {
  nameEnglish: string;
  nameArabic?: string;
  ca: number | null;
  exam: number | null;
  currentTermScore: number | null;
  priorPeriodValue: number | null;
  combinedTotal: number | null;
  cumulativeAverage: number | null;
  grade: string | null;
  remark: string | null;
  remarkArabic: string | null;
}

interface TermAverage {
  termNumber: number;
  average: number | null;
}

interface ReportCardComment {
  en: string;
  ar: string;
}

export interface ReportCardTemplateSettings {
  schoolNameArabic?: string;
  schoolNameEnglish?: string;
  address?: string;
  logoBase64?: string;
  primaryColor?: string;
  headerColor?: string;
  showPrincipalSignature?: boolean;
  principalSignatureBase64?: string;
  showStamp?: boolean;
  stampBase64?: string;
  watermarkText?: string;
}

export interface ReportCardData {
  student: {
    name: string;
    gender: string;
    numberInClass?: number;
    class: string;
    arm: string | null;
  };
  term: { session: string; termNumber: number };
  subjects: SubjectResult[];
  overallTotal: number;
  overallPercentage: number;
  position: number | null;
  result: string;
  totalStudentsInClass: number;
  termAverages: TermAverage[];
  attendance: {
    timesSchoolOpened?: number | null;
    timesPresent?: number | null;
    timesAbsent?: number | null;
    dateResumed?: string | null;
    dateClosed?: string | null;
    nextResumption?: string | null;
    schoolDays?: number | null;
    presentDays?: number | null;
    absentDays?: number | null;
    lateDays?: number;
    percentage?: number | null;
  };
  classTeacherComment: ReportCardComment | null;
  principalComment: ReportCardComment | null;
  templateSettings?: ReportCardTemplateSettings | null;
}

// CSS values here deliberately mirror the Tailwind classes used in
// client/src/components/ReportCardView.tsx (text-2xl=24px, text-xs=12px,
// text-[10px]=10px, h-9=36px, h-8=32px, min-h-9=36px, border-4=4px, etc.)
// so the on-screen view and the downloaded PDF look the same, not two
// independently-drifting layouts.
const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;500;600;700&display=swap');

  @page {
    size: A4 portrait;
    margin: 6mm 7mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #111827;
    background: #ffffff;
    -webkit-font-smoothing: antialiased;
  }

  .arabic {
    font-family: 'Amiri', 'Traditional Arabic', serif;
    direction: rtl;
  }

  .sheet {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    border: 4px solid var(--primary-color, #16a34a);
    border-radius: 2px;
    padding: 14px 16px;
    background: #ffffff;
    page-break-after: always;
    page-break-inside: avoid;
    position: relative;
  }
  .sheet:last-child { page-break-after: auto; }

  .header { text-align: center; position: relative; margin-bottom: 10px; min-height: 60px; }
  .header .logo {
    position: absolute; top: 0; right: 0; width: 62px; height: 62px;
    border-radius: 4px; object-fit: contain;
  }
  .header .logo-placeholder {
    position: absolute; top: 0; right: 0; width: 62px; height: 62px;
    border-radius: 4px; background: #F4F1EA; color: #9ca3af;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600;
  }
  .header .school-name-ar {
    font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 24px; color: var(--header-color, #1e3a8a); font-weight: bold; line-height: 1.2;
  }
  .header .school-name-en { font-size: 12px; font-weight: bold; margin-top: 3px; color: #111827; }
  .header .address { font-size: 10px; font-weight: bold; margin-top: 2px; color: #374151; line-height: 1.3; white-space: pre-line; }

  .title-bar {
    text-align: center; font-size: 12px; font-weight: bold; color: var(--header-color, #1e3a8a);
    margin: 6px 0 10px 0; display: flex; justify-content: center; align-items: center; gap: 8px;
  }
  .title-bar .ar { font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 13px; }

  .info-section { display: flex; border: 1px solid #000; margin-bottom: 10px; font-size: 10px; }
  .attendance { flex: 1; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: space-between; }
  .attendance-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 3.5px 6px; border-bottom: 1px solid #e5e7eb; font-size: 10px;
  }
  .attendance-row:last-child { border-bottom: none; }
  .attendance-row.attendance-header { font-weight: bold; background: #f9fafb; border-bottom: 1px solid #000; }
  .attendance-row .en-label { width: 44%; text-align: left; font-weight: 500; color: #111827; line-height: 1.2; }
  .attendance-row .mid-val { width: 20%; text-align: center; font-weight: bold; color: #000; font-size: 10.5px; }
  .attendance-row .ar-label { width: 36%; text-align: right; font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 11.5px; color: #111827; line-height: 1.2; }

  .student-info { flex: 1; }
  .student-info-row { display: flex; border-bottom: 1px solid #000; height: 35px; }
  .student-info-row:last-child { border-bottom: none; }
  .student-info-row .value {
    flex: 2; display: flex; align-items: center; justify-content: center;
    font-weight: bold; font-size: 13.5px; border-right: 1px solid #000; color: #111827;
  }
  .student-info-row .label {
    flex: 1; display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: bold; text-align: center; line-height: 1.2;
  }

  table.subjects { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px; }
  table.subjects th, table.subjects td { border: 1px solid #000; padding: 4.5px 5px; text-align: center; }
  table.subjects th { font-size: 10px; font-weight: bold; background: #fafafa; line-height: 1.2; }
  table.subjects td.subject-name { text-align: left; font-weight: bold; }
  table.subjects td.subject-name .ar { font-family: 'Amiri', 'Traditional Arabic', serif; float: right; font-size: 11px; }
  table.subjects tr.total-row td { font-weight: bold; }

  .bottom-section { display: flex; margin-bottom: 10px; border: 1px solid #000; font-size: 10px; }
  .bottom-box { flex: 1; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: space-between; }
  .bottom-box:last-child { border-right: none; }
  .bottom-box .row { display: flex; border-bottom: 1px solid #000; height: 34px; }
  .bottom-box .row:last-child { border-bottom: none; }
  .bottom-box .row .label {
    flex: 1; display: flex; align-items: center; justify-content: center;
    font-weight: bold; background: #fafafa; text-align: center; line-height: 1.2;
  }
  .bottom-box .row .val {
    flex: 1; display: flex; align-items: center; justify-content: center;
    font-weight: bold; font-size: 11.5px;
  }
  .term-averages-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
    height: 100%;
  }
  .term-averages-table td {
    padding: 3.5px 8px;
    vertical-align: middle;
  }
  .term-averages-table tr.term-row {
    border-bottom: 1px solid #000;
  }
  .term-averages-table .term-name-cell {
    text-align: left;
    white-space: nowrap;
  }
  .term-averages-table .term-name-cell .en {
    font-weight: 500;
    font-size: 9.5px;
    color: #111827;
  }
  .term-averages-table .term-name-cell .ar {
    font-family: 'Amiri', 'Traditional Arabic', serif;
    font-size: 11.5px;
    margin: 0 4px;
    color: #111827;
  }
  .term-averages-table .term-name-cell .colon {
    font-weight: bold;
    font-size: 10px;
    color: #111827;
  }
  .term-averages-table .term-val-cell {
    text-align: right;
    font-weight: bold;
    font-size: 11px;
    color: #111827;
    white-space: nowrap;
  }
  .term-averages-table tr.cumulative-row {
    background: #fafafa;
    border-top: 1px solid #000;
    font-weight: bold;
  }
  .term-averages-table tr.cumulative-row td {
    padding: 4px 8px;
  }
  .term-averages-table tr.cumulative-row .cum-label {
    text-align: left;
    font-weight: bold;
    font-size: 9.5px;
    color: #111827;
  }
  .term-averages-table tr.cumulative-row .cum-val {
    text-align: right;
    font-weight: bold;
    font-size: 11px;
    color: #111827;
    white-space: nowrap;
  }

  .comment-section { border: 1px solid #000; font-size: 10px; position: relative; }
  .comment-row { display: flex; border-bottom: 1px solid #000; min-height: 42px; position: relative; }
  .comment-row:last-child { border-bottom: none; }
  .comment-row .comment-label {
    flex: 1; display: flex; align-items: center; justify-content: center;
    text-align: center; font-weight: bold; border-right: 1px solid #000; padding: 4px; line-height: 1.2;
  }
  .comment-row .comment-value {
    flex: 2; display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 4px 10px; position: relative;
  }
  .comment-row .comment-value .ar { font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 11.5px; }
  .comment-row .comment-value .en { font-size: 10px; margin-top: 1px; }
  .comment-row .comment-value .empty { color: #d1d5db; }
  .comment-row .comment-value .signature-img {
    max-height: 32px; max-width: 120px; object-fit: contain; margin-top: 2px;
  }
  .comment-row .stamp-img {
    position: absolute; right: 15px; bottom: 2px; max-height: 40px; max-width: 80px; opacity: 0.85; pointer-events: none;
  }
`;

const ordinalEn = ["1ST", "2ND", "3RD"];
const ordinalAr = ["الأولى", "الثانية", "الثالثة"];

const renderComment = (
  comment: ReportCardComment | null,
  isPrincipal: boolean = false,
  signatureBase64?: string,
  showStamp?: boolean,
  stampBase64?: string
): string => {
  let content = "";
  if (!comment) {
    content = `<span class="empty">—</span>`;
  } else {
    content = `<span class="ar">${comment.ar}</span><span class="en">${comment.en}</span>`;
  }

  if (isPrincipal) {
    if (signatureBase64) {
      content += `<img class="signature-img" src="${signatureBase64.startsWith("data:") ? signatureBase64 : `data:image/png;base64,${signatureBase64}`}" alt="Signature" />`;
    }
    if (showStamp && stampBase64) {
      content += `<img class="stamp-img" src="${stampBase64.startsWith("data:") ? stampBase64 : `data:image/png;base64,${stampBase64}`}" alt="Stamp" />`;
    }
  }

  return content;
};

const buildSheetHtml = (data: ReportCardData): string => {
  const {
    student,
    term,
    subjects,
    overallTotal,
    overallPercentage,
    position,
    result,
    totalStudentsInClass,
    termAverages,
    classTeacherComment,
    principalComment,
    attendance,
    templateSettings,
  } = data;

  const schoolNameAr =
    templateSettings?.schoolNameArabic || "معهد التعليم العربي الإسلامي";
  const schoolNameEn =
    templateSettings?.schoolNameEnglish || "INSTITUTE OF ARABIC AND ISLAMIC STUDIES";
  const schoolAddress =
    templateSettings?.address ||
    "18/20 ADEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665";
  const formattedAddress = schoolAddress.replace(/\n/g, "<br/>");

  const effectiveLogo =
    templateSettings?.logoBase64 ||
    (logoBase64 ? `data:image/png;base64,${logoBase64}` : "");

  const primaryColor = templateSettings?.primaryColor || "#16a34a";
  const headerColor = templateSettings?.headerColor || "#1e3a8a";

  const showCascadeColumns = term.termNumber === 2 || term.termNumber === 3;

  const subjectRows = subjects
    .map(
      (s) => `
      <tr>
      <td class="subject-name">${s.nameEnglish} ${s.nameArabic ? `<span class="ar">${s.nameArabic}</span>` : ""}</td>
      <td>${s.ca ?? "-"}</td>
      <td>${s.exam ?? "-"}</td>
      <td>${s.currentTermScore ?? "-"}</td>
      ${showCascadeColumns ? `<td>${s.priorPeriodValue ?? "-"}</td>` : ""}
      ${showCascadeColumns ? `<td>${s.combinedTotal ?? "-"}</td>` : ""}
      <td>${s.cumulativeAverage ?? "-"}</td>
    </tr>`
    )
    .join("");

  const termAverageRows = termAverages
    .map(
      (t) => `
      <tr class="term-row">
        <td class="term-name-cell">
          <span class="en">${ordinalEn[t.termNumber - 1]}</span>
          <span class="ar arabic" dir="rtl">${ordinalAr[t.termNumber - 1]}</span>
          <span class="colon">:</span>
        </td>
        <td class="term-val-cell">${t.average ?? "-"}</td>
      </tr>`
    )
    .join("");

  const formatVal = (val: any) => {
    if (val === undefined || val === null || val === "") return "-";
    return String(val);
  };

  const openedVal = formatVal(attendance?.timesSchoolOpened ?? attendance?.schoolDays);
  const presentVal = formatVal(attendance?.timesPresent ?? attendance?.presentDays);
  const absentVal = formatVal(attendance?.timesAbsent ?? attendance?.absentDays);
  const resumedVal = formatVal(attendance?.dateResumed);
  const closedVal = formatVal(attendance?.dateClosed);
  const nextResumptionVal = formatVal(attendance?.nextResumption);

  return `
    <div class="sheet" style="--primary-color: ${primaryColor}; --header-color: ${headerColor};">
      <div class="header">
        ${
          effectiveLogo
            ? `<img class="logo" src="${effectiveLogo.startsWith("data:") ? effectiveLogo : `data:image/png;base64,${effectiveLogo}`}" />`
            : `<div class="logo-placeholder">logo</div>`
        }
        <div class="school-name-ar">${schoolNameAr}</div>
        <div class="school-name-en">${schoolNameEn}</div>
        <div class="address">${formattedAddress}</div>
      </div>

      <div class="title-bar">
        <span class="ar">كشف درجات الفترة ${ordinalAr[term.termNumber - 1]}</span>
        <span>REPORT SHEET FOR ${ordinalEn[term.termNumber - 1]} TERM ${term.session} ACADEMIC SESSION</span>
      </div>

      <div class="info-section">
        <div class="attendance">
          <div class="attendance-row attendance-header">
            <span class="en-label">ATTENDANCE</span>
            <span class="mid-val"></span>
            <span class="ar-label">الحضور والغياب</span>
          </div>
          <div class="attendance-row">
            <span class="en-label">No. of times school opened</span>
            <span class="mid-val">${openedVal}</span>
            <span class="ar-label">عدد أيام الدوام</span>
          </div>
          <div class="attendance-row">
            <span class="en-label">No. of times present</span>
            <span class="mid-val">${presentVal}</span>
            <span class="ar-label">عدد أيام الحضور</span>
          </div>
          <div class="attendance-row">
            <span class="en-label">No. of times absent</span>
            <span class="mid-val">${absentVal}</span>
            <span class="ar-label">عدد أيام الغياب</span>
          </div>
          <div class="attendance-row">
            <span class="en-label">Date School resumed</span>
            <span class="mid-val">${resumedVal}</span>
            <span class="ar-label">بدء الدراسة</span>
          </div>
          <div class="attendance-row">
            <span class="en-label">Date School closes</span>
            <span class="mid-val">${closedVal}</span>
            <span class="ar-label">ختم الدراسة</span>
          </div>
          <div class="attendance-row">
            <span class="en-label">Next resumption</span>
            <span class="mid-val">${nextResumptionVal}</span>
            <span class="ar-label">العودة إلى الدراسة</span>
          </div>
        </div>
        <div class="student-info">
          <div class="student-info-row">
            <div class="value arabic">${student.name}</div>
            <div class="label">الاسم<br/>NAME</div>
          </div>
          <div class="student-info-row">
            <div class="value arabic">${student.class}</div>
            <div class="label">الصف<br/>CLASS</div>
          </div>
          <div class="student-info-row">
            <div class="value">${totalStudentsInClass ?? "-"}</div>
            <div class="label">عدد الطلاب<br/>NO IN CLASS</div>
          </div>
          ${
            student.arm
              ? `<div class="student-info-row">
                  <div class="value">${student.arm}</div>
                  <div class="label">الشعبة<br/>DIVISION</div>
                </div>`
              : ""
          }
          <div class="student-info-row">
            <div class="value">${student.gender}</div>
            <div class="label">الجنس<br/>GENDER</div>
          </div>
        </div>
      </div>

      <table class="subjects">
        <thead>
          <tr>
            <th style="width: 26%">المواد : SUBJECT</th>
            <th>CA: مذ<br/>40</th>
            <th>EXAM :متح<br/>60</th>
            <th>TOTAL : محص<br/>100</th>
            ${
              term.termNumber === 2
                ? `<th>محصلة الفترة الأولى<br/>1st term total</th>
                   <th>محصلة الفترة الأولى والثانية<br/>1st and 2nd term total</th>`
                : ""
            }
            ${
              term.termNumber === 3
                ? `<th>محصلة الفترة الثانية<br/>2nd term total</th>
                   <th>محصلة الفترة الثانية والثالثة<br/>2nd and 3rd term total</th>`
                : ""
            }
            <th>وسطى الدرجات<br/>Average marks</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
          <tr class="total-row">
            <td class="subject-name">المجموع الكلي : TOTAL</td>
            <td></td><td></td>
            <td>${overallTotal}</td>
            ${showCascadeColumns ? `<td></td><td></td>` : ""}
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="bottom-section">
        <div class="bottom-box">
          <div class="row"><div class="label">الترتيب<br/>POSITION</div><div class="val">${position ?? "-"}</div></div>
          <div class="row"><div class="label">النتيجة<br/>RESULT</div><div class="val" style="color: ${result === "Pass" ? "#0B3D2E" : "#B42318"}; font-weight: bold;">${result}</div></div>
        </div>
        <div class="bottom-box">
          <table class="term-averages-table">
            <tbody>
              ${termAverageRows}
              <tr class="cumulative-row">
                <td class="cum-label">CUMULATIVE AVERAGE</td>
                <td class="cum-val">${overallTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="bottom-box">
          <div class="row"><div class="label">النسبة المئوية<br/>PERCENTAGE</div><div class="val">${overallPercentage}%</div></div>
          <div class="row">
            <div class="label">التقدير<br/>GRADE</div>
            <div class="val">
              ${subjects[0]?.remark ?? "-"}
              ${subjects[0]?.remarkArabic ? `<span class="arabic" style="margin-left: 4px; font-family: 'Amiri', 'Traditional Arabic', serif;">${subjects[0].remarkArabic}</span>` : ""}
            </div>
          </div>
        </div>
      </div>

      <div class="comment-section">
        <div class="comment-row">
          <div class="comment-label">تعليق وتوقيع أستاذ الصف<br/>CLASS TEACHER'S COMMENT AND SIGNATURE</div>
          <div class="comment-value">${renderComment(classTeacherComment)}</div>
        </div>
        <div class="comment-row">
          <div class="comment-label">تعليق و توقيع الوكيل<br/>PRINCIPAL'S COMMENT AND SIGNATURE</div>
          <div class="comment-value">${renderComment(
            principalComment,
            true,
            templateSettings?.showPrincipalSignature ? templateSettings.principalSignatureBase64 : undefined,
            templateSettings?.showStamp,
            templateSettings?.stampBase64
          )}</div>
        </div>
      </div>
    </div>
  `;
};

export const buildSingleReportCardHtml = (data: ReportCardData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Report Card - ${data.student.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${sharedStyles}</style>
</head>
<body>${buildSheetHtml(data)}</body>
</html>
`;

export const buildBulkReportCardHtml = (dataList: ReportCardData[]): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Class Report Cards</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${sharedStyles}</style>
</head>
<body>${dataList.map(buildSheetHtml).join("")}</body>
</html>
`;

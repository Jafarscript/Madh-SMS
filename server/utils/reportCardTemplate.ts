import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGO_PATH = path.join(__dirname, "../assets/logo.png");
const FONT_PATH = path.join(__dirname, "../assets/fonts/Amiri-Regular.ttf");

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
  attendance: { schoolDays: number; presentDays: number; absentDays: number; lateDays: number; percentage: number | null };
  classTeacherComment: ReportCardComment | null;
  principalComment: ReportCardComment | null;
}

// CSS values here deliberately mirror the Tailwind classes used in
// client/src/components/ReportCardView.tsx (text-2xl=24px, text-xs=12px,
// text-[10px]=10px, h-9=36px, h-8=32px, min-h-9=36px, border-4=4px, etc.)
// so the on-screen view and the downloaded PDF look the same, not two
// independently-drifting layouts.
const sharedStyles = `
  @font-face {
    font-family: 'Amiri';
    src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', serif; color: #111; }
  .arabic { font-family: 'Amiri', serif; direction: rtl; }

  .sheet {
    width: 780px;
    margin: 0 auto;
    border: 4px solid #16a34a;
    border-radius: 2px;
    padding: 16px;
    page-break-after: always;
  }
  .sheet:last-child { page-break-after: auto; }

  .header { text-align: center; position: relative; margin-bottom: 8px; }
  .header .logo {
    position: absolute; top: 0; right: 0; width: 64px; height: 64px;
    border-radius: 4px; object-fit: contain;
  }
  .header .school-name-ar {
    font-family: 'Amiri', serif; font-size: 24px; color: #1e3a8a; font-weight: bold;
  }
  .header .school-name-en { font-size: 12px; font-weight: bold; margin-top: 4px; }
  .header .address { font-size: 10px; font-weight: bold; margin-top: 2px; color: #374151; }

  .title-bar {
    text-align: center; font-size: 12px; font-weight: bold; color: #1e3a8a;
    margin: 8px 0; display: flex; justify-content: center; gap: 8px;
  }
  .title-bar .ar { font-family: 'Amiri', serif; }

  .info-section { display: flex; border: 1px solid #000; margin-bottom: 8px; font-size: 10px; }
  .attendance { flex: 1; border-right: 1px solid #000; }
  .attendance-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 4px 8px; border-bottom: 1px solid #e5e7eb;
  }
  .attendance-row:last-child { border-bottom: none; }
  .attendance-row .ar { font-family: 'Amiri', serif; }

  .student-info { flex: 1; }
  .student-info-row { display: flex; border-bottom: 1px solid #000; height: 36px; }
  .student-info-row:last-child { border-bottom: none; }
  .student-info-row .value {
    flex: 2; display: flex; align-items: center; justify-content: center;
    font-weight: bold; font-size: 14px; border-right: 1px solid #000;
  }
  .student-info-row .label {
    flex: 1; display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: bold; text-align: center; line-height: 1.2;
  }

  table.subjects { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px; }
  table.subjects th, table.subjects td { border: 1px solid #000; padding: 4px; text-align: center; }
  table.subjects th { font-size: 10px; font-weight: bold; background: #fafafa; }
  table.subjects td.subject-name { text-align: left; font-weight: bold; }
  table.subjects td.subject-name .ar { font-family: 'Amiri', serif; float: right; }
  table.subjects tr.total-row td { font-weight: bold; }

  .bottom-section { display: flex; margin-bottom: 8px; border: 1px solid #000; font-size: 10px; }
  .bottom-box { flex: 1; border-right: 1px solid #000; }
  .bottom-box:last-child { border-right: none; }
  .bottom-box .row { display: flex; border-bottom: 1px solid #000; height: 32px; }
  .bottom-box .row:last-child { border-bottom: none; }
  .bottom-box .row .label {
    flex: 1; display: flex; align-items: center; justify-content: center;
    font-weight: bold; background: #fafafa; text-align: center;
  }
  .bottom-box .row .val {
    flex: 1; display: flex; align-items: center; justify-content: center;
    font-weight: bold;
  }
  .bottom-box .plain-row { padding: 4px 8px; border-bottom: 1px solid #000; }
  .bottom-box .plain-row:last-child {
    border-bottom: none; display: flex; justify-content: space-between; font-weight: bold;
  }

  .comment-section { border: 1px solid #000; font-size: 10px; }
  .comment-row { display: flex; border-bottom: 1px solid #000; min-height: 36px; }
  .comment-row:last-child { border-bottom: none; }
  .comment-row .comment-label {
    flex: 1; display: flex; align-items: center; justify-content: center;
    text-align: center; font-weight: bold; border-right: 1px solid #000; padding: 4px; line-height: 1.2;
  }
  .comment-row .comment-value {
    flex: 2; display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 4px;
  }
  .comment-row .comment-value .ar { font-family: 'Amiri', serif; font-size: 11px; }
  .comment-row .comment-value .en { font-size: 10px; margin-top: 2px; }
  .comment-row .comment-value .empty { color: #d1d5db; }
`;

const ordinalEn = ["1ST", "2ND", "3RD"];
const ordinalAr = ["الأولى", "الثانية", "الثالثة"];

const renderComment = (comment: ReportCardComment | null): string => {
  if (!comment) return `<span class="empty">—</span>`;
  return `<span class="ar">${comment.ar}</span><span class="en">${comment.en}</span>`;
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
  } = data;

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
      <div class="plain-row">
        ${ordinalEn[t.termNumber - 1]} ${ordinalAr[t.termNumber - 1]} : ${t.average ?? "-"}
      </div>`
    )
    .join("");

  // Same fix as the frontend: pull the CURRENT term's own average out of
  // termAverages instead of displaying overallPercentage directly — the
  // two are now mathematically identical after the backend denominator
  // fix, but this keeps the value tied to the row it's summarizing.
  const currentTermAverage =
    termAverages.find((t) => t.termNumber === term.termNumber)?.average ?? overallPercentage;

  return `
    <div class="sheet">
      <div class="header">
        ${logoBase64 ? `<img class="logo" src="data:image/png;base64,${logoBase64}" />` : ""}
        <div class="school-name-ar">معهد التعليم العربي الإسلامي</div>
        <div class="school-name-en">INSTITUTE OF ARABIC AND ISLAMIC STUDIES</div>
        <div class="address">18/20 ABEWALE BELLO STREET, OFF AILEGUN ROAD,<br/>49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665</div>
      </div>

      <div class="title-bar">
        <span class="ar">كشف درجات الفترة ${ordinalAr[term.termNumber - 1]}</span>
        <span>REPORT SHEET FOR ${ordinalEn[term.termNumber - 1]} TERM ${term.session} ACADEMIC SESSION</span>
      </div>

      <div class="info-section">
        <div class="attendance">
          <div class="attendance-row"><span class="ar">الحضور والغياب</span><span>ATTENDANCE</span></div>
          <div class="attendance-row"><span class="ar">عدد أيام الدوام</span><span>No. of times school opened: <b>${attendance.schoolDays}</b></span></div>
          <div class="attendance-row"><span class="ar">نسبة الحضور</span><span>No. of times present: <b>${attendance.presentDays}</b></span></div>
          <div class="attendance-row"><span class="ar">نسبة الغياب</span><span>No. of times absent: <b>${attendance.absentDays}</b></span></div>
          <div class="attendance-row"><span class="ar">بدء الدراسة</span><span>Date School resumed</span></div>
          <div class="attendance-row"><span class="ar">ختم الدراسة</span><span>Date School closes</span></div>
          <div class="attendance-row"><span class="ar">العودة إلى الدراسة</span><span>Next resumption</span></div>
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
          <div class="row"><div class="label">النتيجة<br/>RESULT</div><div class="val">${result}</div></div>
        </div>
        <div class="bottom-box">
          ${termAverageRows}
          <div class="plain-row"><span>CUMULATIVE AVERAGE</span><span>${overallTotal}</span></div>
        </div>
        <div class="bottom-box">
          <div class="row"><div class="label">النسبة المئوية<br/>PERCENTAGE</div><div class="val">${overallPercentage}%</div></div>
          <div class="row"><div class="label">التقدير<br/>GRADE</div><div class="val">${subjects[0]?.remark ?? "-"}</div></div>
        </div>
      </div>

      <div class="comment-section">
        <div class="comment-row">
          <div class="comment-label">تعليق وتوقيع أستاذ الصف<br/>CLASS TEACHER'S COMMENT AND SIGNATURE</div>
          <div class="comment-value">${renderComment(classTeacherComment)}</div>
        </div>
        <div class="comment-row">
          <div class="comment-label">تعليق و توقيع الوكيل<br/>PRINCIPAL'S COMMENT AND SIGNATURE</div>
          <div class="comment-value">${renderComment(principalComment)}</div>
        </div>
      </div>
    </div>
  `;
};

export const buildSingleReportCardHtml = (data: ReportCardData): string => `
  <html><head><style>${sharedStyles}</style></head>
  <body>${buildSheetHtml(data)}</body></html>
`;

export const buildBulkReportCardHtml = (dataList: ReportCardData[]): string => `
  <html><head><style>${sharedStyles}</style></head>
  <body>${dataList.map(buildSheetHtml).join("")}</body></html>
`;

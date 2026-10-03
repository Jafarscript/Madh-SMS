import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isElementaryClass } from "../controllers/classController";
import { ELEMENTARY_FIXED_SUBJECTS } from "../constants/elementarySubjects";

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
  cumulativeAverage?: number;
  overallAverage?: number;
  grade?: string | null;
  remark?: string | null;
  remarkArabic?: string | null;
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
  isElementary?: boolean;
  classCategory?: "elementary" | "secondary";
  affectiveScores?: Record<string, number>;
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
    margin: 4.5mm 5mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  html, body {
    width: 100%;
    margin: 0;
    padding: 0;
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
    min-height: calc(297mm - 10mm);
    box-sizing: border-box;
    margin: 0 auto;
    border: 4px solid var(--primary-color, #16a34a);
    border-radius: 2px;
    padding: 12px 14px;
    background: #ffffff;
    page-break-after: always;
    page-break-inside: avoid;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
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

  /* Elementary Report Card Specific Styles matching ElementaryReportCardView.tsx */
  .elem-sheet {
    border: 1.5px solid #000 !important;
    padding: 10px 12px;
    background: #ffffff;
    color: #030712;
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    box-sizing: border-box;
    width: 100% !important;
    max-width: 100% !important;
    min-height: calc(297mm - 10mm);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
    page-break-inside: avoid;
    position: relative;
  }
  .elem-school-header {
    position: relative;
    text-align: center;
    padding-bottom: 6px;
    margin-bottom: 6px;
    border-bottom: 1px solid #d1d5db;
  }
  .elem-school-header .school-name-ar {
    font-family: 'Amiri', serif;
    font-size: 24px;
    font-weight: bold;
    color: #030712;
    line-height: 1.2;
    direction: rtl;
    margin: 0;
  }
  .elem-school-header .school-city-ar {
    font-family: 'Amiri', serif;
    font-size: 13px;
    font-weight: bold;
    color: #1f2937;
    margin-top: 2px;
    direction: rtl;
  }
  .elem-school-header .school-name-en {
    font-size: 13px;
    font-weight: bold;
    letter-spacing: 0.5px;
    color: #111827;
    margin-top: 3px;
    text-transform: uppercase;
  }
  .elem-school-header .school-charity-en {
    font-size: 10px;
    letter-spacing: 0.8px;
    color: #374151;
    font-weight: 600;
    text-transform: uppercase;
    margin-top: 1px;
  }
  .elem-school-header .school-address-en {
    font-size: 8.5px;
    color: #4b5563;
    margin-top: 2px;
    line-height: 1.35;
  }
  .elem-school-header .elem-logo-img {
    position: absolute;
    right: 0;
    top: 0;
    width: 68px;
    height: 68px;
    object-fit: contain;
  }
  .elem-school-header .elem-logo-placeholder {
    position: absolute;
    right: 0;
    top: 0;
    width: 64px;
    height: 64px;
    border: 1px dashed #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #9ca3af;
  }

  .elem-banner {
    background-color: #1e3a5f;
    color: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 16px;
    font-weight: bold;
    font-size: 13px;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
    border: 1px solid #000;
  }
  .elem-banner .banner-en {
    letter-spacing: 1px;
  }
  .elem-banner .banner-ar {
    font-family: 'Amiri', serif;
    font-size: 16px;
    direction: rtl;
  }

  .elem-top-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 6px;
  }
  .attendance-box {
    border: 1px solid #000;
  }
  .attendance-table {
    width: 100%;
    font-size: 9.5px;
    text-align: center;
    border-collapse: collapse;
  }
  .attendance-table th, .attendance-table td {
    padding: 2.2px 5px;
  }
  .att-head-row {
    border-bottom: 1px solid #000;
    font-weight: bold;
    background: #ffffff;
  }
  .att-th-left {
    text-align: left;
    width: 46%;
  }
  .att-th-mid {
    width: 18%;
    border-left: 1px solid #000;
    border-right: 1px solid #000;
  }
  .att-th-right {
    text-align: right;
    width: 36%;
    font-size: 11px;
    font-family: 'Amiri', serif;
    direction: rtl;
  }
  .attendance-table tbody tr {
    border-bottom: 1px solid #000;
  }
  .attendance-table tbody tr:last-child {
    border-bottom: none;
  }
  .att-td-left {
    text-align: left;
  }
  .att-td-mid {
    border-left: 1px solid #000;
    border-right: 1px solid #000;
    font-weight: 600;
    text-align: center;
  }
  .att-td-right {
    text-align: right;
    font-family: 'Amiri', serif;
    direction: rtl;
  }

  .elem-meta-col {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 4px;
  }
  .elem-info-table {
    width: 100%;
    font-size: 10px;
    border: 1px solid #000;
    border-collapse: collapse;
  }
  .elem-info-table td {
    padding: 2.5px 6px;
    font-weight: bold;
  }
  .elem-info-table tr.border-b {
    border-bottom: 1px solid #000;
  }
  .info-td-label {
    text-align: left;
  }
  .info-td-val {
    text-align: center;
  }
  .info-td-val.name-val {
    font-size: 12px;
    font-family: 'Amiri', serif;
  }
  .term-ar-val {
    font-family: 'Amiri', serif;
    margin-left: 6px;
    margin-right: 6px;
  }
  .info-td-ar {
    text-align: right;
    font-family: 'Amiri', serif;
    direction: rtl;
  }

  .elem-mini-aff-table {
    width: 100%;
    font-size: 9.5px;
    text-align: center;
    border: 1px solid #000;
    border-collapse: collapse;
  }
  .elem-mini-aff-table th, .elem-mini-aff-table td {
    padding: 2px 4px;
  }
  .elem-mini-aff-table thead tr {
    background: #f1f5f9;
    border-bottom: 1px solid #000;
  }
  .mini-aff-th-label {
    text-align: left;
    border-right: 1px solid #000;
    font-weight: bold;
    padding-left: 6px;
  }
  .mini-aff-th-num {
    width: 20px;
    border-right: 1px solid #000;
    font-weight: bold;
  }
  .mini-aff-th-num.last {
    border-right: none;
  }
  .elem-mini-aff-table tbody tr.border-b {
    border-bottom: 1px solid #000;
  }
  .mini-aff-td-label {
    text-align: left;
    border-right: 1px solid #000;
    font-weight: 500;
    padding-left: 6px;
  }
  .mini-aff-td-check {
    border-right: 1px solid #000;
    font-weight: bold;
    color: #1e3a8a;
  }
  .mini-aff-td-check.last {
    border-right: none;
  }

  .elem-subjects-box {
    border: 1px solid #000;
    overflow: hidden;
    margin-bottom: 6px;
  }
  .elem-sub-table {
    width: 100%;
    font-size: 10.5px;
    border-collapse: collapse;
  }
  .sub-head-row {
    background: #e2e8f0;
    border-bottom: 1px solid #000;
    text-align: center;
    font-weight: bold;
  }
  .sub-th {
    padding: 3.5px 3px;
    border-right: 1px solid #000;
  }
  .sub-th.grade-col { width: 14%; }
  .sub-th.total-col { width: 13%; }
  .sub-th.exam-col { width: 15%; }
  .sub-th.ca-col { width: 16%; }
  .sub-th .ar-lbl {
    font-family: 'Amiri', serif;
    font-size: 11px;
  }
  .sub-th .en-lbl {
    font-size: 9px;
    font-weight: 600;
  }
  .sub-th-subject {
    padding: 3.5px 10px;
    text-align: right;
  }
  .sub-head-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }
  .sub-head-en {
    letter-spacing: 0.5px;
  }
  .sub-head-ar {
    font-family: 'Amiri', serif;
    font-size: 13px;
    direction: rtl;
  }
  .sub-data-row {
    border-bottom: 1px solid #000;
    text-align: center;
    font-weight: 500;
  }
  .sub-td {
    padding: 3px 3px;
    border-right: 1px solid #000;
  }
  .sub-td.grade-val {
    font-weight: 600;
    color: #1f2937;
  }
  .sub-td.total-val {
    font-weight: 600;
  }
  .sub-td-name {
    padding: 3px 10px;
    text-align: right;
  }
  .sub-name-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }
  .sub-name-en {
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .sub-name-ar {
    font-family: 'Amiri', serif;
    font-size: 12.5px;
    direction: rtl;
  }
  .sub-total-row {
    border-top: 2px solid #000;
    background: #ffffff;
    font-weight: bold;
    text-align: center;
  }
  .sub-td.total-result {
    color: #be123c;
    font-weight: bold;
  }
  .sub-td.total-sum {
    font-weight: bold;
  }
  .total-label-cell {
    font-weight: bold;
  }
  .total-en {
    letter-spacing: 0.5px;
  }
  .total-ar {
    font-family: 'Amiri', serif;
    font-size: 13px;
    direction: rtl;
  }

  .elem-bottom-grid {
    display: grid;
    grid-template-columns: 5fr 2fr 5fr;
    gap: 6px;
    font-size: 9.5px;
  }
  .elem-skills-col {
    border: 1px solid #000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .elem-psych-table {
    width: 100%;
    font-size: 9px;
    text-align: center;
    border-collapse: collapse;
  }
  .psych-top-head {
    background: #f1f5f9;
    border-bottom: 1px solid #000;
    font-weight: bold;
  }
  .psych-top-head th {
    padding: 2.5px 2px;
    font-size: 9.5px;
  }
  .psych-top-head .ar {
    font-family: 'Amiri', serif;
  }
  .psych-sub-head {
    background: #f8fafc;
    border-bottom: 1px solid #000;
    font-weight: bold;
  }
  .psych-sub-head th.p-num {
    width: 18px;
    padding: 2px 0;
    border-right: 1px solid #000;
  }
  .psych-sub-head th.p-title {
    padding: 2px 4px;
    text-align: right;
  }
  .elem-psych-table tbody tr {
    border-bottom: 1px solid #000;
  }
  .elem-psych-table tbody tr.last-row {
    border-bottom: none;
  }
  .p-check {
    padding: 2px 0;
    border-right: 1px solid #000;
    font-weight: bold;
    color: #1e3a8a;
  }
  .p-label-cell {
    padding: 2px 4px;
    text-align: right;
  }
  .p-label-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .p-en {
    font-size: 8px;
    color: #374151;
  }
  .p-ar {
    font-family: 'Amiri', serif;
    font-weight: 600;
    font-size: 9.5px;
    direction: rtl;
  }

  .elem-seal-col {
    border: 1px solid #000;
    padding: 3px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    text-align: center;
    background: #ffffff;
  }
  .scale-list {
    font-size: 8.5px;
    font-weight: bold;
    line-height: 1.45;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 3px;
    width: 100%;
    text-align: left;
    padding-left: 3px;
  }
  .seal-container {
    margin: 3px 0;
  }
  .seal-container .stamp-img {
    max-height: 60px;
    max-width: 60px;
    object-fit: contain;
  }
  .official-seal-svg {
    width: 60px;
    height: 60px;
    margin: 0 auto;
    display: block;
  }

  .elem-summary-col {
    border: 1px solid #000;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .sum-grid-box {
    border-bottom: 1px solid #000;
    font-size: 9px;
    font-weight: 600;
  }
  .sum-grid-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .sum-grid-row.border-b {
    border-bottom: 1px solid #000;
  }
  .sum-cell {
    padding: 2px 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sum-cell.border-r {
    border-right: 1px solid #000;
  }
  .sum-cell .sum-val {
    font-size: 10.5px;
  }
  .sum-cell .sum-val.text-rose {
    color: #be123c;
  }
  .sum-cell .ar {
    font-family: 'Amiri', serif;
    direction: rtl;
  }

  .teacher-comment-box {
    padding: 3.5px 4px;
    border-bottom: 1px solid #000;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 42px;
  }
  .comment-title-ar {
    text-align: right;
    font-weight: bold;
    font-size: 9px;
    font-family: 'Amiri', serif;
    direction: rtl;
  }
  .comment-title-en {
    font-weight: normal;
    font-family: 'Inter', sans-serif;
    font-size: 8px;
    direction: ltr;
  }
  .comment-body {
    text-align: center;
    padding: 2px 0;
    font-weight: 500;
    font-size: 8.5px;
    color: #1f2937;
  }
  .comment-ar {
    font-family: 'Amiri', serif;
    font-size: 9.5px;
  }
  .comment-placeholder {
    color: #6b7280;
  }
  .sig-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8px;
    color: #374151;
  }
  .sig-row .ar {
    font-family: 'Amiri', serif;
    direction: rtl;
  }

  .principal-comment-box {
    padding: 3.5px 4px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 42px;
    position: relative;
  }
  .princ-prompt {
    font-size: 8.5px;
    color: #374151;
  }
  .princ-prompt .ar-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .princ-prompt .ar-line .ar {
    font-family: 'Amiri', serif;
    direction: rtl;
  }
  .princ-prompt .en-line {
    text-align: left;
    margin-top: 1px;
  }
  .princ-body {
    text-align: center;
    padding: 1px 0;
  }
  .princ-text {
    font-size: 8px;
    font-weight: 500;
    color: #111827;
  }
  .princ-text .ar {
    font-family: 'Amiri', serif;
    margin: 0 4px;
    font-size: 9px;
  }
  .princ-sig-img {
    max-height: 20px;
    max-width: 80px;
    object-fit: contain;
    margin: 2px auto 0;
    display: block;
  }

  @media print {
    @page {
      size: A4 portrait;
      margin: 4.5mm 5mm;
    }
    html, body {
      width: auto !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .sheet, .elem-sheet {
      width: 100% !important;
      max-width: 100% !important;
      min-height: calc(297mm - 9mm) !important;
      height: calc(297mm - 9mm) !important;
      margin: 0 !important;
      padding: 10px 12px !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: flex-start !important;
      gap: 20px !important;
      page-break-inside: avoid !important;
      page-break-after: always !important;
    }
    .sheet > .header,
    .sheet > .title-bar,
    .sheet > .info-section,
    .sheet > table.subjects,
    .sheet > .bottom-section,
    .elem-sheet > .elem-school-header,
    .elem-sheet > .elem-banner,
    .elem-sheet > .elem-top-grid,
    .elem-sheet > .elem-subjects-box {
      margin-bottom: 0 !important;
    }
    .elem-sheet > .elem-top-grid,
    .elem-sheet > .elem-bottom-grid {
      gap: 0 !important;
    }
    .sheet > table.subjects,
    .elem-sheet > .elem-subjects-box {
      flex: 1 1 auto !important;
      min-height: 0 !important;
    }
    .sheet:last-child, .elem-sheet:last-child {
      page-break-after: auto !important;
    }
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

const toArabicNumerals = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || val === "") return "-";
  const str = String(val);
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return str.replace(/[0-9]/g, (d) => arabicDigits[parseInt(d, 10)]);
};

const getArabicGradeRemark = (grade: string | null | undefined, percentage: number): string => {
  if (percentage < 50 || grade === "Fail" || grade === "Poor" || grade === "F") return "ضعيف";
  if (percentage >= 85 || grade === "Excellent" || grade === "A") return "ممتاز";
  if (percentage >= 75 || grade === "V. Good" || grade === "V.Good" || grade === "B") return "جيد جداً";
  if (percentage >= 65 || grade === "Good" || grade === "C") return "جيد";
  return "مقبول";
};

const getElementaryGrade = (score: number | null | undefined, existingGrade?: string | null): string => {
  if (score !== null && score !== undefined && !isNaN(score)) {
    if (score >= 85) return "Excellent";
    if (score >= 75) return "V.Good";
    if (score >= 65) return "Good";
    if (score >= 50) return "Fair";
    return "Poor";
  }
  if (existingGrade) {
    if (existingGrade === "A1" || existingGrade === "A") return "Excellent";
    if (
      existingGrade === "B2" ||
      existingGrade === "B" ||
      existingGrade.includes("Very Good") ||
      existingGrade.includes("V. Good") ||
      existingGrade.includes("V.Good")
    ) {
      return "V.Good";
    }
    if (existingGrade === "C4" || existingGrade === "C") return "Good";
    if (existingGrade === "D7" || existingGrade === "D" || existingGrade === "Pass") return "Fair";
    if (existingGrade === "F9" || existingGrade === "F" || existingGrade === "Fail") return "Poor";
    return existingGrade;
  }
  return "";
};

const buildElementarySheetHtml = (data: ReportCardData): string => {
  const {
    student,
    term,
    subjects,
    overallTotal,
    overallPercentage,
    position,
    result,
    totalStudentsInClass,
    classTeacherComment,
    principalComment,
    attendance,
    templateSettings,
    affectiveScores = {},
  } = data;

  const schoolNameAr =
    templateSettings?.schoolNameArabic || "معهد التعليم العربي الإسلامي";
  const schoolNameEn =
    templateSettings?.schoolNameEnglish || "INSTITUTE OF ARABIC AND ISLAMIC STUDIES";
  const effectiveLogo =
    templateSettings?.logoBase64 ||
    (logoBase64 ? `data:image/png;base64,${logoBase64}` : "");

  const timesOpened = attendance?.timesSchoolOpened ?? attendance?.schoolDays ?? "";
  const timesPresent = attendance?.timesPresent ?? attendance?.presentDays ?? "";
  const timesAbsent = attendance?.timesAbsent ?? attendance?.absentDays ?? "";
  const dateResumed = attendance?.dateResumed || "";
  const dateClosed = attendance?.dateClosed || "";
  const nextResumption = attendance?.nextResumption || "";

  const fallbackRemark =
    overallPercentage >= 85
      ? "Excellent"
      : overallPercentage >= 75
      ? "V.Good"
      : overallPercentage >= 65
      ? "Good"
      : overallPercentage >= 50
      ? "Fair"
      : "Poor";
  const fallbackRemarkArabic =
    overallPercentage >= 85
      ? "ممتاز"
      : overallPercentage >= 75
      ? "جيد جداً"
      : overallPercentage >= 65
      ? "جيد"
      : overallPercentage >= 50
      ? "مقبول"
      : "ضعيف";

  const isEnrolled = (data.student as any)?.isEnrolledInCurrentTerm !== false;
  const displayRemark = data.remark || (!isEnrolled ? "Not Enrolled" : fallbackRemark);
  const displayRemarkArabic = data.remarkArabic || (!isEnrolled ? "لم يلتحق" : fallbackRemarkArabic);

  // Map incoming subjects
  const subjectMap = new Map<string, any>();
  subjects.forEach((s) => {
    const key = (s.nameEnglish || "").trim().toLowerCase();
    subjectMap.set(key, s);
    if (s.nameArabic) {
      subjectMap.set(s.nameArabic.trim(), s);
    }
  });

  const displaySubjects: Array<{
    nameEnglish: string;
    nameArabic: string;
    ca: number | null;
    exam: number | null;
    total: number | null;
    grade: string | null;
  }> = [];

  const matchedKeys = new Set<string>();

  // 1. Process fixed 6 subjects in exact order
  ELEMENTARY_FIXED_SUBJECTS.forEach((fixed) => {
    const keyEn = fixed.nameEnglish.trim().toLowerCase();
    const keyAr = fixed.nameArabic.trim();

    let found = subjectMap.get(keyEn) || subjectMap.get(keyAr);
    if (!found) {
      for (const [sKey, sVal] of subjectMap.entries()) {
        if (
          (keyEn.includes("memorization") && sKey.includes("memorization")) ||
          (keyEn.includes("hadith") && sKey.includes("hadith")) ||
          (keyEn.includes("reading") && sKey.includes("reading")) ||
          (keyEn.includes("writing") && sKey.includes("writing")) ||
          (keyEn.includes("arabic") && sKey === "arabic") ||
          (keyEn.includes("hymns") && sKey.includes("hymn"))
        ) {
          found = sVal;
          break;
        }
      }
    }

    if (found) {
      matchedKeys.add((found.nameEnglish || "").trim().toLowerCase());
      if (found.nameArabic) matchedKeys.add(found.nameArabic.trim());
    }

    const totalVal =
      found?.currentTermScore ??
      found?.combinedTotal ??
      (found?.ca !== null && found?.exam !== null && found?.ca !== undefined && found?.exam !== undefined
        ? Number(found.ca) + Number(found.exam)
        : null);

    displaySubjects.push({
      nameEnglish: fixed.nameEnglish,
      nameArabic: fixed.nameArabic,
      ca: found?.ca ?? null,
      exam: found?.exam ?? null,
      total: totalVal,
      grade: getElementaryGrade(totalVal, found?.grade ?? null),
    });
  });

  // 2. Append any extra subjects
  subjects.forEach((s) => {
    const keyEn = (s.nameEnglish || "").trim().toLowerCase();
    const keyAr = (s.nameArabic || "").trim();
    if (!matchedKeys.has(keyEn) && (!keyAr || !matchedKeys.has(keyAr))) {
      const totalVal =
        s.currentTermScore ??
        s.combinedTotal ??
        (s.ca !== null && s.exam !== null && s.ca !== undefined && s.exam !== undefined
          ? Number(s.ca) + Number(s.exam)
          : null);

      displaySubjects.push({
        nameEnglish: s.nameEnglish,
        nameArabic: s.nameArabic || "",
        ca: s.ca ?? null,
        exam: s.exam ?? null,
        total: totalVal,
        grade: getElementaryGrade(totalVal, s.grade ?? null),
      });
    }
  });

  const defaultAffective: Record<string, number> = {
    "Punctuality": 5,
    "Neatness": 4,
    "Attitude to sch. Work": 5,
    "Attentiveness": 4,
    "Speaking Habit/Writing": 4,
    "Verbal Fluency": 5,
    "Games / Sports": 4,
  };
  const affScores = { ...defaultAffective, ...affectiveScores };

  return `
    <div class="sheet elem-sheet">
      ${
        templateSettings?.watermarkText
          ? `<div class="watermark">${templateSettings.watermarkText}</div>`
          : ""
      }

      <!-- Top School Header exactly matching ElementaryReportCardView.tsx -->
      <div class="elem-school-header">
        <h1 class="school-name-ar">${schoolNameAr}</h1>
        <p class="school-city-ar">ايجيبوا - لاغوس - نيجيريا</p>
        <h2 class="school-name-en">${schoolNameEn}</h2>
        <p class="school-charity-en">FOR CHARITABLE ORGANIZATION</p>
        <p class="school-address-en">
          18/20 ADEWALE BELLO STREET, OFF AILEGUN ROAD, EJIGBO, LAGOS.<br />
          49 LAFENWA STREET, OFF COCA ROAD, EJIGBO, LAGOS. TEL: 08023299665
        </p>
        ${
          effectiveLogo
            ? `<img src="${effectiveLogo}" alt="School Logo" class="elem-logo-img" />`
            : `<div class="elem-logo-placeholder">Logo</div>`
        }
      </div>

      <!-- Dark Navy Blue Banner -->
      <div class="elem-banner">
        <span class="banner-en">REPORT CARD</span>
        <span class="banner-ar">كشف الدرجات</span>
      </div>

      <!-- Top Grid: Attendance Table on Left, Meta & Mini Affective on Right -->
      <div class="elem-top-grid">
        <!-- Attendance Table -->
        <div class="attendance-box">
          <table class="attendance-table">
            <thead>
              <tr class="att-head-row">
                <th class="att-th-left">ATTENDANCE</th>
                <th class="att-th-mid"></th>
                <th class="att-th-right">الحضور والغياب</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="att-td-left">No. of times school opened</td>
                <td class="att-td-mid">${timesOpened || "-"}</td>
                <td class="att-td-right">عدد أيام الدوام</td>
              </tr>
              <tr>
                <td class="att-td-left">No. of times present</td>
                <td class="att-td-mid">${timesPresent || "-"}</td>
                <td class="att-td-right">نسبة الحضور</td>
              </tr>
              <tr>
                <td class="att-td-left">No. of times absent</td>
                <td class="att-td-mid">${timesAbsent || "-"}</td>
                <td class="att-td-right">نسبة الغياب</td>
              </tr>
              <tr>
                <td class="att-td-left">No. of Students in the class</td>
                <td class="att-td-mid">${totalStudentsInClass || "-"}</td>
                <td class="att-td-right">عدد الطلاب في الصف</td>
              </tr>
              <tr>
                <td class="att-td-left">Date School resumed</td>
                <td class="att-td-mid">${dateResumed || "-"}</td>
                <td class="att-td-right">بدء الدراسة</td>
              </tr>
              <tr>
                <td class="att-td-left">Date School closes</td>
                <td class="att-td-mid">${dateClosed || "-"}</td>
                <td class="att-td-right">ختم الدراسة</td>
              </tr>
              <tr>
                <td class="att-td-left">Next resumption</td>
                <td class="att-td-mid">${nextResumption || "-"}</td>
                <td class="att-td-right">العودة إلى الدراسة</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Right Info Boxes: Session/Term, Name/Class, Mini Affective -->
        <div class="elem-meta-col">
          <!-- Session & Term Table -->
          <table class="elem-info-table">
            <tbody>
              <tr class="border-b">
                <td class="info-td-label" style="width: 22%;">Session:</td>
                <td class="info-td-val" style="width: 56%;">${term.session}</td>
                <td class="info-td-ar" style="width: 22%;">:عام</td>
              </tr>
              <tr>
                <td class="info-td-label">Term:</td>
                <td class="info-td-val">
                  <span>${ordinalEn[term.termNumber - 1] || "1st"} Term</span>
                  <span class="term-ar-val">${ordinalAr[term.termNumber - 1] || "الأولى"}</span>
                </td>
                <td class="info-td-ar">:الفترة</td>
              </tr>
            </tbody>
          </table>

          <!-- Name & Class Table -->
          <table class="elem-info-table">
            <tbody>
              <tr class="border-b">
                <td class="info-td-label" style="width: 20%;">Name:</td>
                <td class="info-td-val name-val" style="width: 60%;">${student.name}</td>
                <td class="info-td-ar" style="width: 20%;">:الإسم</td>
              </tr>
              <tr>
                <td class="info-td-label">Class:</td>
                <td class="info-td-val">
                  <span style="text-transform: uppercase;">${student.class}</span>
                  ${student.arm ? `<span> (${student.arm})</span>` : ""}
                </td>
                <td class="info-td-ar">:الصف</td>
              </tr>
            </tbody>
          </table>

          <!-- Mini Affective Domain Table -->
          <table class="elem-mini-aff-table">
            <thead>
              <tr>
                <th class="mini-aff-th-label">AFFECTIVE DOMAIN</th>
                <th class="mini-aff-th-num">1</th>
                <th class="mini-aff-th-num">2</th>
                <th class="mini-aff-th-num">3</th>
                <th class="mini-aff-th-num">4</th>
                <th class="mini-aff-th-num last">5</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b">
                <td class="mini-aff-td-label">Punctuality</td>
                <td class="mini-aff-td-check">${affScores["Punctuality"] === 1 ? "✓" : ""}</td>
                <td class="mini-aff-td-check">${affScores["Punctuality"] === 2 ? "✓" : ""}</td>
                <td class="mini-aff-td-check">${affScores["Punctuality"] === 3 ? "✓" : ""}</td>
                <td class="mini-aff-td-check">${affScores["Punctuality"] === 4 ? "✓" : ""}</td>
                <td class="mini-aff-td-check last">${affScores["Punctuality"] === 5 ? "✓" : ""}</td>
              </tr>
              <tr>
                <td class="mini-aff-td-label">Neatness</td>
                <td class="mini-aff-td-check">${affScores["Neatness"] === 1 ? "✓" : ""}</td>
                <td class="mini-aff-td-check">${affScores["Neatness"] === 2 ? "✓" : ""}</td>
                <td class="mini-aff-td-check">${affScores["Neatness"] === 3 ? "✓" : ""}</td>
                <td class="mini-aff-td-check">${affScores["Neatness"] === 4 ? "✓" : ""}</td>
                <td class="mini-aff-td-check last">${affScores["Neatness"] === 5 ? "✓" : ""}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Elementary Subjects Table -->
      <div class="elem-subjects-box">
        <table class="elem-sub-table">
          <thead>
            <tr class="sub-head-row">
              <th class="sub-th grade-col">
                <span class="ar-lbl">التقدير</span><br />
                <span class="en-lbl">(GRADE)</span>
              </th>
              <th class="sub-th total-col">
                <span class="ar-lbl">المحصلة</span><br />
                <span class="en-lbl">(TOTAL)</span>
              </th>
              <th class="sub-th exam-col">
                <span class="ar-lbl">الامتحان</span><br />
                <span class="en-lbl">(EXAM 60%)</span>
              </th>
              <th class="sub-th ca-col">
                <span class="ar-lbl">المراقبة المستمرة</span><br />
                <span class="en-lbl">(CA 40%)</span>
              </th>
              <th class="sub-th-subject">
                <div class="sub-head-flex">
                  <span class="sub-head-en">SUBJECTS</span>
                  <span class="sub-head-ar">المواد</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            ${displaySubjects
              .map(
                (sub) => `
              <tr class="sub-data-row">
                <td class="sub-td grade-val">${sub.grade ?? ""}</td>
                <td class="sub-td total-val">${sub.total !== null && sub.total !== undefined ? sub.total : ""}</td>
                <td class="sub-td exam-val">${sub.exam !== null && sub.exam !== undefined ? sub.exam : ""}</td>
                <td class="sub-td ca-val">${sub.ca !== null && sub.ca !== undefined ? sub.ca : ""}</td>
                <td class="sub-td-name">
                  <div class="sub-name-flex">
                    <span class="sub-name-en">${sub.nameEnglish}</span>
                    <span class="sub-name-ar">${sub.nameArabic}</span>
                  </div>
                </td>
              </tr>
            `
              )
              .join("")}

            <!-- Total Row -->
            <tr class="sub-total-row">
              <td class="sub-td total-result">${result || "Fail"}</td>
              <td class="sub-td total-sum">${overallTotal > 0 ? overallTotal : "."}</td>
              <td class="sub-td" style="border-right: 1px solid #000;"></td>
              <td class="sub-td" style="border-right: 1px solid #000;"></td>
              <td class="sub-td-name total-label-cell">
                <div class="sub-name-flex">
                  <span class="total-en">TOTAL</span>
                  <span class="total-ar">المجموع الكلي</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bottom Section: Skills, Grading Scale, Rosette Star, Summary & Remarks -->
      <div class="elem-bottom-grid">
        <!-- Left: Psychomotor / Affective Skills Table -->
        <div class="elem-skills-col">
          <table class="elem-psych-table">
            <thead>
              <tr class="psych-top-head">
                <th colspan="6">
                  (Psychomotor / Affective Skills) &nbsp; <span class="ar">السلوك والنشاط</span>
                </th>
              </tr>
              <tr class="psych-sub-head">
                <th class="p-num">5</th>
                <th class="p-num">4</th>
                <th class="p-num">3</th>
                <th class="p-num">2</th>
                <th class="p-num">1</th>
                <th class="p-title">Skills</th>
              </tr>
            </thead>
            <tbody>
              ${[
                { en: "Punctuality", ar: "المواظبة" },
                { en: "Neatness", ar: "النظافة" },
                { en: "Attitude to sch. Work", ar: "التجاوب الدراسي" },
                { en: "Attentiveness", ar: "الانتباه" },
                { en: "Speaking Habit/Writing", ar: "التحدث / الخط" },
                { en: "Verbal Fluency", ar: "الفصاحة" },
                { en: "Games / Sports", ar: "الألعاب والرياضة" },
              ]
                .map((skill, sIdx, arr) => {
                  const score = affScores[skill.en] ?? null;
                  return `
                <tr class="${sIdx === arr.length - 1 ? "last-row" : ""}">
                  <td class="p-check">${score === 5 ? "✓" : ""}</td>
                  <td class="p-check">${score === 4 ? "✓" : ""}</td>
                  <td class="p-check">${score === 3 ? "✓" : ""}</td>
                  <td class="p-check">${score === 2 ? "✓" : ""}</td>
                  <td class="p-check">${score === 1 ? "✓" : ""}</td>
                  <td class="p-label-cell">
                    <div class="p-label-flex">
                      <span class="p-en">${skill.en}</span>
                      <span class="p-ar">${skill.ar}</span>
                    </div>
                  </td>
                </tr>
              `;
                })
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- Center: Scale & Rosette Seal -->
        <div class="elem-seal-col">
          <div class="scale-list">
            <div>85 - 100 = Excellent</div>
            <div>75 - 84 = V.Good</div>
            <div>65 - 74 = Good</div>
            <div>50 - 64 = Fair</div>
            <div>1 - 49 = Poor</div>
          </div>

          <div class="seal-container">
            ${
              templateSettings?.showStamp && templateSettings?.stampBase64
                ? `<img src="${templateSettings.stampBase64.startsWith("data:") ? templateSettings.stampBase64 : `data:image/png;base64,${templateSettings.stampBase64}`}" alt="Stamp" class="stamp-img" />`
                : `
              <svg class="official-seal-svg" viewBox="0 0 100 100">
                <polygon
                  points="50,4 61,19 79,9 80,29 98,36 88,53 97,70 77,75 73,95 54,87 37,97 30,78 10,75 18,57 5,42 22,33 21,13 40,20"
                  fill="none"
                  stroke="#1e3a8a"
                  stroke-width="1.6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="28"
                  fill="none"
                  stroke="#1e3a8a"
                  stroke-width="1.2"
                  stroke-dasharray="2,2"
                />
                <circle cx="50" cy="50" r="22" fill="#f8fafc" stroke="#1e3a8a" stroke-width="1" />
                <text
                  x="50"
                  y="47"
                  text-anchor="middle"
                  font-size="6.5"
                  font-weight="bold"
                  fill="#1e3a8a"
                >
                  OFFICIAL
                </text>
                <text
                  x="50"
                  y="56"
                  text-anchor="middle"
                  font-size="6.5"
                  font-weight="bold"
                  fill="#1e3a8a"
                >
                  SEAL
                </text>
              </svg>
            `
            }
          </div>
        </div>

        <!-- Right: Position/Percentage/Result/Grade & Remarks -->
        <div class="elem-summary-col">
          <!-- Summary Grid: 2 rows of 2 boxes -->
          <div class="sum-grid-box">
            <div class="sum-grid-row border-b">
              <div class="sum-cell border-r">
                <span>Position</span>
                <strong class="sum-val">${position ? position : "-"}</strong>
                <span class="ar">:الترتيب</span>
              </div>
              <div class="sum-cell">
                <span>Percentage%</span>
                <strong class="sum-val">${overallPercentage.toFixed(1)} %</strong>
                <span class="ar">النسبة المئوية:</span>
              </div>
            </div>

            <div class="sum-grid-row">
              <div class="sum-cell border-r">
                <span>Result:</span>
                <strong class="sum-val text-rose">${result || "Fail"}</strong>
                <span class="ar">:النتيجة</span>
              </div>
              <div class="sum-cell">
                <span>Grade:</span>
                <strong class="sum-val text-rose ar">${displayRemark} ${displayRemarkArabic ? `<span class="ar" style="font-family: 'Amiri', 'Traditional Arabic', serif;" dir="rtl">(${displayRemarkArabic})</span>` : ""}</strong>
                <span class="ar">:التقدير</span>
              </div>
            </div>
          </div>

          <!-- Teacher's comment -->
          <div class="teacher-comment-box">
            <div class="comment-title-ar">
              تعليق أستاذ الصف / <span class="comment-title-en">:Teacher's comment</span>
            </div>
            <div class="comment-body">
              ${
                classTeacherComment?.en || classTeacherComment?.ar
                  ? `<div>
                      ${classTeacherComment.ar ? `<div class="comment-ar font-bold">${classTeacherComment.ar}</div>` : ""}
                      ${classTeacherComment.en ? `<div class="comment-en">${classTeacherComment.en}</div>` : ""}
                    </div>`
                  : `<span class="comment-placeholder italic">performance can improve with increased focus</span>`
              }
            </div>
            <div class="sig-row">
              <span>Signature: ....................................................</span>
              <span class="ar">:التوقيع</span>
            </div>
          </div>

          <!-- Principal's comment -->
          <div class="principal-comment-box">
            <div class="comment-title-ar">
              تعليق الوكيل / <span class="comment-title-en">:Principal's comment</span>
            </div>
            <div class="comment-body">
              ${
                principalComment?.en || principalComment?.ar
                  ? `<div>
                      ${principalComment.ar ? `<div class="comment-ar font-bold">${principalComment.ar}</div>` : ""}
                      ${principalComment.en ? `<div class="comment-en">${principalComment.en}</div>` : ""}
                    </div>`
                  : `<span class="comment-placeholder italic">an exemplary student demonstrating diligence and character</span>`
              }
              ${
                templateSettings?.showPrincipalSignature && templateSettings.principalSignatureBase64
                  ? `<img src="${templateSettings.principalSignatureBase64.startsWith("data:") ? templateSettings.principalSignatureBase64 : `data:image/png;base64,${templateSettings.principalSignatureBase64}`}" alt="Principal Signature" class="princ-sig-img" style="max-height: 20px; max-width: 80px; object-fit: contain; margin: 2px auto 0;" />`
                  : ""
              }
            </div>
            <div class="sig-row">
              <span>Signature: ....................................................</span>
              <span class="ar">:التوقيع</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

const buildSecondarySheetHtml = (data: ReportCardData): string => {
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
    grade,
    remark,
    remarkArabic,
  } = data;

  const fallbackRemark =
    overallPercentage >= 85
      ? "Excellent"
      : overallPercentage >= 75
      ? "Very Good"
      : overallPercentage >= 60
      ? "Good"
      : overallPercentage >= 50
      ? "Pass"
      : "Fail";
  const fallbackRemarkArabic =
    overallPercentage >= 85
      ? "ممتاز"
      : overallPercentage >= 75
      ? "جيد جدا"
      : overallPercentage >= 60
      ? "جيد"
      : overallPercentage >= 50
      ? "مقبول"
      : "راسب";

  const isEnrolled = (student as any)?.isEnrolledInCurrentTerm !== false;
  const displayRemark = remark || data.remark || (!isEnrolled ? "Not Enrolled" : fallbackRemark);
  const displayRemarkArabic = remarkArabic || data.remarkArabic || (!isEnrolled ? "لم يلتحق" : fallbackRemarkArabic);

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
            <td></td>
            ${showCascadeColumns ? `<td></td><td></td>` : ""}
            <td>${overallTotal}</td>
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
                <td class="cum-val">${data.cumulativeAverage ?? overallPercentage}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="bottom-box">
          <div class="row"><div class="label">النسبة المئوية<br/>PERCENTAGE</div><div class="val">${overallPercentage}%</div></div>
          <div class="row">
            <div class="label">التقدير<br/>GRADE</div>
            <div class="val">
              ${grade ? `<span style="font-weight: 700; margin-right: 4px;">${grade} -</span>` : ""}
              ${displayRemark}
              ${displayRemarkArabic ? `<span class="arabic" style="margin-left: 6px; font-family: 'Amiri', 'Traditional Arabic', serif;" dir="rtl">${displayRemarkArabic}</span>` : ""}
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

const buildSheetHtml = (data: ReportCardData): string => {
  if (
    data.isElementary === true ||
    data.classCategory === "elementary" ||
    isElementaryClass(data.student.class, data.classCategory)
  ) {
    return buildElementarySheetHtml(data);
  }
  return buildSecondarySheetHtml(data);
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

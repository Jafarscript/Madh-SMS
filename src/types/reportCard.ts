// Shared report-card-related types, used by ReportCardView, the admin
// Report Card page, and the Parent portal — previously each file
// declared its own copy of these interfaces, which is how the
// classTeacherComment/termAverages fields kept silently going missing
// on some pages after being added to others.

export interface SubjectResult {
  subject: string;
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

export interface TermAverage {
  termNumber: number;
  average: number | null;
}

export interface ReportCardComment {
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

export interface ReportCardAttendance {
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
  attendance: ReportCardAttendance;
  classTeacherComment: ReportCardComment | null;
  principalComment: ReportCardComment | null;
  templateSettings?: ReportCardTemplateSettings | null;
}

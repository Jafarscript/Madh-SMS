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
    schoolDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    percentage: number | null;
  };
  classTeacherComment: ReportCardComment | null;
  principalComment: ReportCardComment | null;
}

import { Response } from "express";
import Student from "../models/Student";
import Subject from "../models/Subject";
import Score from "../models/Score";
import Term from "../models/Term";
import GradingScale from "../models/GradingScale";
import { AuthRequest } from "../middleware/auth";
import { getClassCumulativePositions } from "./broadsheetController";
import { foldCascade } from "../utils/cascadeAverage";
import ReportCardRemark from "../models/ReportCardRemark";
import Attendance from "../models/Attendance";
import AttendanceSetting from "../models/AttendanceSetting";
import ReportCardSetting from "../models/ReportCardSetting";

// Returns the full report card data object, or null if the student/term
// can't be found. No `req`/`res` here on purpose — this is a plain function
// so both getReportCard (JSON) and the PDF controllers can reuse it.
export const buildReportCardData = async (
  studentId: string,
  termId: string,
  scaleId?: string,
) => {
  if (!studentId || !termId) {
    return null;
  }

  const student = await Student.findById(studentId).populate("class");
  if (!student) return null;

  const currentTerm = await Term.findById(termId);
  if (!currentTerm) return null;

  // every term in the same session up to and including the current one,
  // in chronological order — this order matters now, since the cascade
  // must fold term 1 → term 2 → term 3, not just average them all at once
  const priorTerms = await Term.find({
    session: currentTerm.session,
    termNumber: { $lte: currentTerm.termNumber },
  }).sort({ termNumber: 1 });

  const priorTermIds = priorTerms.map((t) => t._id);

  const subjects = await Subject.find({
    class: (student.class as any)._id,
  }).sort({
    nameEnglish: 1,
  });

  const scoresBySubject = await Score.find({
    student: studentId,
    subject: { $in: subjects.map((s) => s._id) },
    term: { $in: priorTermIds },
  });

  // group raw totals by subject, keyed by term, so we can look each
  // term up in chronological order below (priorTerms is already sorted
  // ascending) rather than however scoresBySubject happens to return
  const scoresBySubjectMap = new Map<string, Map<string, number>>(); // subjectId -> termId -> total
  scoresBySubject.forEach((sc) => {
    const subjectKey = sc.subject.toString();
    if (!scoresBySubjectMap.has(subjectKey))
      scoresBySubjectMap.set(subjectKey, new Map());
    scoresBySubjectMap.get(subjectKey)!.set(sc.term.toString(), sc.total);
  });

  const gradingScale = scaleId ? await GradingScale.findById(scaleId) : null;

  const subjectResults = subjects.map((subject) => {
    const subjectKey = subject._id.toString();
    const termScoreMap = scoresBySubjectMap.get(subjectKey) || new Map();

    // pull this subject's raw totals in chronological order, based on
    // priorTerms' order — this is what makes the cascade correct
    const rawScoresAscending = priorTerms
      .map((t) => termScoreMap.get(t._id.toString()))
      .filter((v): v is number => v !== undefined);

    const { priorPeriodValue, finalValue: cumulativeAverage } =
      foldCascade(rawScoresAscending);

    const currentTermScore = termScoreMap.get(termId) ?? null;
    const currentTermScoreDoc = scoresBySubject.find(
      (sc) =>
        sc.subject.toString() === subjectKey && sc.term.toString() === termId,
    );
    const combinedTotal =
  priorPeriodValue !== null && currentTermScore !== null
    ? priorPeriodValue + currentTermScore
    : null;

    let grade = null;
    let remark = null;
    let remarkArabic = null;

    if (gradingScale && cumulativeAverage !== null) {
      const band = gradingScale.bands.find(
        (b) =>
          cumulativeAverage >= b.minScore && cumulativeAverage <= b.maxScore,
      );
      if (band) {
        grade = band.grade;
        remark = band.remark;
        remarkArabic = band.remarkArabic;
      }
    }

    return {
      subject: subject._id,
      nameEnglish: subject.nameEnglish,
      nameArabic: subject.nameArabic,
      ca: currentTermScoreDoc?.ca ?? null,
      exam: currentTermScoreDoc?.exam ?? null,
      currentTermScore,
      // only present for term 2 (= term 1's raw total) and term 3
      // (= cascade through term 1+2) — term 1 has nothing prior, so null
      priorPeriodValue:
        priorPeriodValue !== null
          ? Math.round(priorPeriodValue * 100) / 100
          : null,
      combinedTotal: combinedTotal !== null ? Math.round(combinedTotal * 100) / 100 : null,
      cumulativeAverage:
        cumulativeAverage !== null
          ? Math.round(cumulativeAverage * 100) / 100
          : null,
      grade,
      remark,
      remarkArabic,
    };
  });

  const totalSubjectsCount = subjects.length;
const overallTotal = subjectResults.reduce(
  (sum, s) => sum + (s.cumulativeAverage ?? 0),
  0
);
const overallPercentage =
  totalSubjectsCount > 0 ? overallTotal / totalSubjectsCount : 0;

  const classId = (student.class as any)._id.toString();
  const positionMap = await getClassCumulativePositions(classId, termId);
  const position = positionMap.get(studentId) ?? null;

  const totalStudentsInClass = await Student.countDocuments({ class: classId });

  const remarkDoc = await ReportCardRemark.findOne({
  student: studentId,
  term: termId,
});

const classTeacherComment =
  remarkDoc?.classTeacherCommentEn && remarkDoc?.classTeacherCommentAr
    ? { en: remarkDoc.classTeacherCommentEn, ar: remarkDoc.classTeacherCommentAr }
    : null;

const principalComment =
  remarkDoc?.principalCommentEn && remarkDoc?.principalCommentAr
    ? { en: remarkDoc.principalCommentEn, ar: remarkDoc.principalCommentAr }
    : null;

  const termAverages = priorTerms.map((t) => {
  const cascadeValues: number[] = [];

  subjects.forEach((subject) => {
    const subjectKey = subject._id.toString();
    const termScoreMap = scoresBySubjectMap.get(subjectKey) || new Map();

    const scoresUpToThisTerm = priorTerms
      .filter((pt) => pt.termNumber <= t.termNumber)
      .map((pt) => termScoreMap.get(pt._id.toString()))
      .filter((v): v is number => v !== undefined);

    if (scoresUpToThisTerm.length > 0) {
      const { finalValue } = foldCascade(scoresUpToThisTerm);
      if (finalValue !== null) cascadeValues.push(finalValue);
    }
  });

  const average =
    cascadeValues.length > 0
      ? cascadeValues.reduce((a, b) => a + b, 0) / cascadeValues.length
      : null;

  return {
    termNumber: t.termNumber,
    average: average !== null ? Math.round(average * 100) / 100 : null,
  };
});

  const classBranchId = (student.class as any)?.branch;
  const [attSettingClass, attSettingBranch, attSettingGlobal, attDoc, templateSetting] =
    await Promise.all([
      AttendanceSetting.findOne({ class: classId, term: termId }),
      classBranchId
        ? AttendanceSetting.findOne({
            branch: classBranchId,
            term: termId,
            class: { $exists: false },
          })
        : null,
      AttendanceSetting.findOne({
        term: termId,
        class: { $exists: false },
        branch: { $exists: false },
      }),
      Attendance.findOne({ student: studentId, term: termId }),
      ReportCardSetting.findOne(),
    ]);

  const activeAttSetting = attSettingClass || attSettingBranch || attSettingGlobal;
  const timesSchoolOpened =
    activeAttSetting?.timesSchoolOpened !== undefined && activeAttSetting?.timesSchoolOpened !== null
      ? activeAttSetting.timesSchoolOpened
      : (currentTerm as any).timesSchoolOpened ?? null;

  const dateResumed = activeAttSetting?.dateResumed || (currentTerm as any).dateResumed || "";
  const dateClosed = activeAttSetting?.dateClosed || (currentTerm as any).dateClosed || "";
  const nextResumption = activeAttSetting?.nextResumption || (currentTerm as any).nextResumption || "";

  const timesPresent =
    attDoc?.timesPresent !== undefined && attDoc?.timesPresent !== null
      ? attDoc.timesPresent
      : null;
  const timesAbsent =
    attDoc?.timesAbsent !== undefined && attDoc?.timesAbsent !== null
      ? attDoc.timesAbsent
      : null;

  return {
    student: {
      id: student._id,
      name: student.name,
      gender: student.gender,
      numberInClass: student.numberInClass,
      class: (student.class as any).name,
      arm: (student.class as any).arm || null,
    },
    term: {
      session: currentTerm.session,
      termNumber: currentTerm.termNumber,
    },
    subjects: subjectResults,
    overallTotal: Math.round(overallTotal * 100) / 100,
    overallPercentage: Math.round(overallPercentage * 100) / 100,
    position,
    result: overallPercentage >= 50 ? "Pass" : "Fail",
    totalStudentsInClass,
    termAverages,
    attendance: {
      timesSchoolOpened,
      timesPresent,
      timesAbsent,
      dateResumed,
      dateClosed,
      nextResumption,
      schoolDays: timesSchoolOpened,
      presentDays: timesPresent,
      absentDays: timesAbsent,
    },
    classTeacherComment,   // { id, en, ar } | null
    principalComment,
    templateSettings: templateSetting
      ? {
          schoolNameArabic: templateSetting.schoolNameArabic,
          schoolNameEnglish: templateSetting.schoolNameEnglish,
          address: templateSetting.address,
          logoBase64: templateSetting.logoBase64,
          primaryColor: templateSetting.primaryColor,
          headerColor: templateSetting.headerColor,
          showPrincipalSignature: templateSetting.showPrincipalSignature,
          principalSignatureBase64: templateSetting.principalSignatureBase64,
          showStamp: templateSetting.showStamp,
          stampBase64: templateSetting.stampBase64,
          watermarkText: templateSetting.watermarkText,
        }
      : null,
  };
};

// GET /api/report-card?student=<id>&term=<termId>&gradingScale=<scaleId>
export const getReportCard = async (req: AuthRequest, res: Response) => {
  try {
    const { student, term, gradingScale } = req.query;
    const data = await buildReportCardData(
      student as string,
      term as string,
      gradingScale as string,
    );
    if (!data)
      return res.status(404).json({ message: "Student or term not found" });
    res.status(200).json(data);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

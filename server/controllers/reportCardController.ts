import { Response } from "express";
import mongoose from "mongoose";
import Student from "../models/Student";
import ClassModel from "../models/Class";
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
import User from "../models/User";
import { isElementaryClass, ensureElementarySubjectsForClass } from "./classController";
import {
  isClassGraduatingDoc,
  isSuperAdmin,
  getEffectiveSecondaryResultMode,
} from "../utils/graduatingAccess";

export interface ReportCardSharedContext {
  positionMap?: Map<string, number>;
  totalStudentsInClass?: number;
  allTermsInSession?: any[];
  priorTerms?: any[];
  gradingScale?: any;
  subjects?: any[];
  currentTerm?: any;
  attSettingClass?: any;
  attSettingBranch?: any;
  attSettingGlobal?: any;
  templateSetting?: any;
}

export const buildReportCardData = async (
  studentId: string,
  termId: string,
  scaleId?: string,
  context?: ReportCardSharedContext,
) => {
  if (!studentId || !termId) {
    return null;
  }

  const student = await Student.findById(studentId).populate("class");
  if (!student) return null;

  const currentTerm = context?.currentTerm || (await Term.findById(termId));
  if (!currentTerm) return null;

  const priorTerms =
    context?.priorTerms ||
    (await Term.find({
      session: currentTerm.session,
      termNumber: { $lte: currentTerm.termNumber },
    }).sort({ termNumber: 1 }));

  let classDoc = student.class as any;
  if (!classDoc || !classDoc.name) {
    const rawClassId = classDoc?._id || classDoc || (student as any).class;
    if (rawClassId) {
      try {
        classDoc = await ClassModel.findById(rawClassId);
      } catch {
        // ignore
      }
    }
  }

  const classId = classDoc?._id || (student as any).class;
  const className = classDoc?.name || "";
  const rawCategory = classDoc?.category;
  const isElementary =
    rawCategory === "elementary" ||
    isElementaryClass(className, rawCategory);
  const classCategory: "secondary" | "elementary" = isElementary ? "elementary" : "secondary";
  const isGraduating = isClassGraduatingDoc(classDoc);
  const secondaryResultMode = getEffectiveSecondaryResultMode(
    classDoc,
    student,
    isElementary,
    isGraduating
  );

  if (isElementary && classId && !context?.subjects) {
    await ensureElementarySubjectsForClass(classId.toString());
  }

  const allClassSubjects =
    context?.subjects ||
    (await Subject.find({
      class: classId,
    }).sort({
      order: 1,
      nameEnglish: 1,
    }));

  // Filter out subjects excluded for this student (e.g. external school doesn't offer them)
  const excludedSet = new Set(
    (student.excludedSubjects || []).map((id: any) => id.toString())
  );
  const subjects =
    excludedSet.size > 0
      ? allClassSubjects.filter((s: any) => !excludedSet.has(s._id.toString()))
      : allClassSubjects;

  const scoresBySubject = await Score.find({
    student: studentId,
    subject: { $in: subjects.map((s) => s._id) },
    term: { $in: priorTerms.map((t: any) => t._id) },
  });

  const scoresBySubjectMap = new Map<string, Map<string, number>>();
  scoresBySubject.forEach((sc) => {
    const subjectKey = sc.subject.toString();
    if (!scoresBySubjectMap.has(subjectKey))
      scoresBySubjectMap.set(subjectKey, new Map());
    scoresBySubjectMap.get(subjectKey)!.set(sc.term.toString(), sc.total);
  });

  let gradingScale: any = context?.gradingScale || null;
  if (!gradingScale && scaleId && scaleId !== "undefined" && scaleId !== "null" && mongoose.Types.ObjectId.isValid(scaleId)) {
    try {
      gradingScale = await GradingScale.findById(scaleId);
    } catch {
      gradingScale = null;
    }
  }
  if (!gradingScale) {
    gradingScale =
      (await GradingScale.findOne({ name: "التقدير" })) ||
      (await GradingScale.findOne());
  }
  if (!gradingScale) {
    try {
      const { ensureDefaultGradingScale } = await import("./gradingScaleController");
      gradingScale = await ensureDefaultGradingScale();
    } catch {
      // Fallback
    }
  }

  const getGradeRemark = (scorePercentage: number) => {
    if (gradingScale && gradingScale.bands && gradingScale.bands.length > 0) {
      const sortedBands = [...gradingScale.bands].sort((a, b) => b.minScore - a.minScore);
      let band = sortedBands.find(
        (b) => scorePercentage >= b.minScore && (b.maxScore === undefined || b.maxScore === null || scorePercentage <= b.maxScore + 0.09)
      );
      if (!band) {
        band = sortedBands.find((b) => scorePercentage >= b.minScore);
      }
      if (!band && sortedBands.length > 0) {
        band = sortedBands[sortedBands.length - 1];
      }
      if (band) {
        return {
          grade: band.grade,
          remark: band.remark,
          remarkArabic: band.remarkArabic,
        };
      }
    }

    if (scorePercentage >= 85) return { grade: "A1", remark: "Excellent", remarkArabic: "ممتاز" };
    if (scorePercentage >= 75) return { grade: "B2", remark: "V.Good", remarkArabic: "جيد جدا" };
    if (scorePercentage >= 60) return { grade: "C4", remark: "Good", remarkArabic: "جيد" };
    if (scorePercentage >= 50) return { grade: "D7", remark: "Pass", remarkArabic: "مقبول" };
    return { grade: "F9", remark: "Fail", remarkArabic: "راسب" };
  };

  const studentEnrolledTerms: number[] =
    student.enrolledTerms && Array.isArray(student.enrolledTerms) && student.enrolledTerms.length > 0
      ? student.enrolledTerms
      : student.joinedTerm
        ? [1, 2, 3].filter((t) => t >= student.joinedTerm!)
        : [1, 2, 3];

  const isEnrolledInCurrentTerm = studentEnrolledTerms.includes(currentTerm.termNumber);

  // Filter prior terms according to enrollment AND graduating secondary rule
  let applicablePriorTerms = priorTerms.filter((t) =>
    studentEnrolledTerms.includes(t.termNumber)
  );
  if (secondaryResultMode === "current_only") {
    applicablePriorTerms = applicablePriorTerms.filter(
      (t) => t.termNumber === currentTerm.termNumber
    );
  } else if (secondaryResultMode === "combine_1st_and_3rd") {
    applicablePriorTerms = applicablePriorTerms.filter((t) => t.termNumber !== 2);
  }

  const subjectResults = subjects.map((subject) => {
    const subjectKey = subject._id.toString();
    const termScoreMap = scoresBySubjectMap.get(subjectKey) || new Map();

    const rawScoresAscending = applicablePriorTerms
      .map((t) => termScoreMap.get(t._id.toString()))
      .filter((v): v is number => v !== undefined);

    const currentTermScore = isEnrolledInCurrentTerm ? (termScoreMap.get(termId) ?? null) : null;
    const currentTermScoreDoc = isEnrolledInCurrentTerm
      ? scoresBySubject.find(
          (sc) =>
            sc.subject.toString() === subjectKey && sc.term.toString() === termId,
        )
      : null;

    let priorPeriodValue: number | null = null;
    let combinedTotal: number | null = null;
    let cumulativeAverage: number | null = null;

    if (secondaryResultMode === "current_only") {
      cumulativeAverage = currentTermScore;
    } else {
      const folded = foldCascade(rawScoresAscending);
      priorPeriodValue = folded.priorPeriodValue;
      cumulativeAverage = folded.finalValue;
      combinedTotal =
        priorPeriodValue !== null && currentTermScore !== null
          ? priorPeriodValue + currentTermScore
          : null;
    }

    let grade = null;
    let remark = null;
    let remarkArabic = null;

    const scoreForGrading = isElementary || secondaryResultMode === "current_only"
      ? currentTermScore
      : cumulativeAverage;

    if (scoreForGrading !== null && scoreForGrading !== undefined) {
      if (isElementary) {
        if (scoreForGrading >= 85) {
          grade = "Excellent";
          remark = "Excellent";
          remarkArabic = "ممتاز";
        } else if (scoreForGrading >= 75) {
          grade = "V.Good";
          remark = "V. Good";
          remarkArabic = "جيد جداً";
        } else if (scoreForGrading >= 65) {
          grade = "Good";
          remark = "Good";
          remarkArabic = "جيد";
        } else if (scoreForGrading >= 50) {
          grade = "Fair";
          remark = "Fair";
          remarkArabic = "مقبول";
        } else {
          grade = "Fail";
          remark = "Fail";
          remarkArabic = "راسب";
        }
      } else {
        const band = getGradeRemark(scoreForGrading);
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

  const classIdStr = classId ? classId.toString() : "";
  const position = context?.positionMap
    ? (context.positionMap.get(studentId) ?? null)
    : ((await getClassCumulativePositions(classIdStr, termId)).get(studentId) ?? null);

  const totalStudentsInClass =
    context?.totalStudentsInClass !== undefined
      ? context.totalStudentsInClass
      : await Student.countDocuments({ class: classId });

  const remarkDoc = await ReportCardRemark.findOne({
    student: studentId,
    term: termId,
  });

  const classTeacherComment =
    remarkDoc && (remarkDoc.classTeacherCommentEn || remarkDoc.classTeacherCommentAr || remarkDoc.classTeacherCommentId)
      ? {
          id: remarkDoc.classTeacherCommentId || "",
          en: remarkDoc.classTeacherCommentEn || "",
          ar: remarkDoc.classTeacherCommentAr || "",
        }
      : null;

  const principalComment =
    remarkDoc && (remarkDoc.principalCommentEn || remarkDoc.principalCommentAr || remarkDoc.principalCommentId)
      ? {
          id: remarkDoc.principalCommentId || "",
          en: remarkDoc.principalCommentEn || "",
          ar: remarkDoc.principalCommentAr || "",
        }
      : null;

  const allTermsInSession =
    context?.allTermsInSession ||
    (await Term.find({
      session: currentTerm.session,
    }).sort({ termNumber: 1 }));

  // Build termAverages according to graduating secondary mode
  const termNumbersToCompute =
    secondaryResultMode === "current_only"
      ? [currentTerm.termNumber]
      : secondaryResultMode === "combine_1st_and_3rd"
        ? [1, 3].filter((t) => t <= currentTerm.termNumber)
        : [1, 2, 3];

  const termAverages = termNumbersToCompute.map((termNum) => {
    const isEnrolled = studentEnrolledTerms.includes(termNum);
    const termDoc = allTermsInSession.find((t: any) => t.termNumber === termNum);

    if (!isEnrolled || termNum > currentTerm.termNumber || !termDoc) {
      return {
        termNumber: termNum,
        average: null,
        isEnrolled: isEnrolled && termNum <= currentTerm.termNumber,
      };
    }

    const termScoresThisTerm: number[] = [];

    subjects.forEach((subject: any) => {
      const subjectKey = subject._id.toString();
      const termScoreMap = scoresBySubjectMap.get(subjectKey) || new Map();
      const rawScoreInTerm = termScoreMap.get(termDoc._id.toString());
      if (rawScoreInTerm !== undefined && rawScoreInTerm !== null) {
        termScoresThisTerm.push(rawScoreInTerm);
      }
    });

    const average =
      termScoresThisTerm.length > 0
        ? Math.round((termScoresThisTerm.reduce((a, b) => a + b, 0) / termScoresThisTerm.length) * 100) / 100
        : null;

    return {
      termNumber: termNum,
      average,
      isEnrolled: true,
    };
  });

  const validTermAverages = termAverages
    .filter((t) => t.average !== null && t.average !== undefined)
    .map((t) => t.average as number);

  const overallTermAverage =
    secondaryResultMode === "current_only"
      ? (isEnrolledInCurrentTerm ? Math.round(overallPercentage * 100) / 100 : 0)
      : validTermAverages.length > 0
        ? Math.round((validTermAverages.reduce((sum, v) => sum + v, 0) / validTermAverages.length) * 100) / 100
        : (isEnrolledInCurrentTerm ? Math.round(overallPercentage * 100) / 100 : 0);

  const classBranchId = (student.class as any)?.branch;
  const attSettingClass =
    context?.attSettingClass !== undefined
      ? context.attSettingClass
      : await AttendanceSetting.findOne({ class: classId, term: termId });
  const attSettingBranch =
    context?.attSettingBranch !== undefined
      ? context.attSettingBranch
      : classBranchId
        ? await AttendanceSetting.findOne({
            branch: classBranchId,
            term: termId,
            class: { $exists: false },
          })
        : null;
  const attSettingGlobal =
    context?.attSettingGlobal !== undefined
      ? context.attSettingGlobal
      : await AttendanceSetting.findOne({
          term: termId,
          class: { $exists: false },
          branch: { $exists: false },
        });
  const [attDoc, templateSetting] = await Promise.all([
    Attendance.findOne({ student: studentId, term: termId }),
    context?.templateSetting !== undefined ? Promise.resolve(context.templateSetting) : ReportCardSetting.findOne(),
  ]);

  const timesSchoolOpened =
    (currentTerm as any)?.timesSchoolOpened ??
    attSettingGlobal?.timesSchoolOpened ??
    attSettingBranch?.timesSchoolOpened ??
    attSettingClass?.timesSchoolOpened ??
    null;

  const dateResumed =
    (currentTerm as any)?.dateResumed ||
    attSettingGlobal?.dateResumed ||
    attSettingBranch?.dateResumed ||
    attSettingClass?.dateResumed ||
    "";

  const dateClosed =
    (currentTerm as any)?.dateClosed ||
    attSettingGlobal?.dateClosed ||
    attSettingBranch?.dateClosed ||
    attSettingClass?.dateClosed ||
    "";

  const nextResumption =
    (currentTerm as any)?.nextResumption ||
    attSettingGlobal?.nextResumption ||
    attSettingBranch?.nextResumption ||
    attSettingClass?.nextResumption ||
    "";

  const timesPresent =
    attDoc?.timesPresent !== undefined && attDoc?.timesPresent !== null
      ? attDoc.timesPresent
      : null;
  const timesAbsent =
    attDoc?.timesAbsent !== undefined && attDoc?.timesAbsent !== null
      ? attDoc.timesAbsent
      : null;

  let elementaryOverallTotal = 0;
  let elementarySubjectCount = 0;
  if (isElementary && isEnrolledInCurrentTerm) {
    subjectResults.forEach((s) => {
      if (s.currentTermScore !== null && s.currentTermScore !== undefined) {
        elementaryOverallTotal += s.currentTermScore;
        elementarySubjectCount += 1;
      }
    });
  }
  const effectiveOverallTotal = isElementary
    ? (isEnrolledInCurrentTerm ? elementaryOverallTotal : 0)
    : (isEnrolledInCurrentTerm ? Math.round(overallTotal * 100) / 100 : 0);

  const effectiveOverallPercentage = isElementary
    ? (elementarySubjectCount > 0
        ? Math.round((elementaryOverallTotal / elementarySubjectCount) * 100) / 100
        : 0)
    : (isEnrolledInCurrentTerm ? Math.round(overallPercentage * 100) / 100 : 0);

  const overallGradeRemark = isEnrolledInCurrentTerm
    ? (isElementary
        ? (effectiveOverallPercentage >= 85
            ? { grade: "Excellent", remark: "Excellent", remarkArabic: "ممتاز" }
            : effectiveOverallPercentage >= 75
            ? { grade: "V.Good", remark: "V. Good", remarkArabic: "جيد جداً" }
            : effectiveOverallPercentage >= 65
            ? { grade: "Good", remark: "Good", remarkArabic: "جيد" }
            : effectiveOverallPercentage >= 50
            ? { grade: "Fair", remark: "Fair", remarkArabic: "مقبول" }
            : { grade: "Fail", remark: "Fail", remarkArabic: "راسب" })
        : getGradeRemark(effectiveOverallPercentage))
    : { grade: "—", remark: "Not Enrolled", remarkArabic: "لم يلتحق" };

  return {
    isElementary,
    classCategory,
    isGraduating,
    graduatingLevel: classDoc?.graduatingLevel || null,
    secondaryResultMode,
    student: {
      id: student._id,
      name: student.name,
      gender: student.gender,
      numberInClass: student.numberInClass,
      seatNumber: student.seatNumber || null,
      sourceSchool: student.sourceSchool || classDoc?.sourceSchool || null,
      class: className || (student.class as any)?.name || "",
      arm: classDoc?.arm || (student.class as any)?.arm || null,
      enrolledTerms: studentEnrolledTerms,
      joinedTerm: student.joinedTerm || 1,
      isEnrolledInCurrentTerm,
    },
    term: {
      session: currentTerm.session,
      termNumber: currentTerm.termNumber,
    },
    subjects: subjectResults,
    overallTotal: effectiveOverallTotal,
    overallPercentage: effectiveOverallPercentage,
    cumulativeAverage: isElementary ? effectiveOverallPercentage : overallTermAverage,
    overallAverage: isElementary ? effectiveOverallPercentage : overallTermAverage,
    grade: overallGradeRemark.grade,
    remark: overallGradeRemark.remark,
    remarkArabic: overallGradeRemark.remarkArabic,
    position: isEnrolledInCurrentTerm ? position : null,
    result: !isEnrolledInCurrentTerm
      ? "Not Enrolled"
      : effectiveOverallPercentage >= 50
        ? "Pass"
        : "Fail",
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
    classTeacherComment,
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
    affectiveScores: (() => {
      const defaultAffective: Record<string, number> = {
        "Punctuality": 5,
        "Neatness": 4,
        "Attitude to sch. Work": 5,
        "Attentiveness": 4,
        "Speaking Habit/Writing": 4,
        "Verbal Fluency": 5,
        "Games / Sports": 4,
      };
      const saved = remarkDoc?.affectiveScores;
      if (saved && typeof saved === "object") {
        return { ...defaultAffective, ...saved };
      }
      return defaultAffective;
    })(),
  };
};

// GET /api/report-card?student=<id>&term=<termId>&gradingScale=<scaleId>
export const getReportCard = async (req: AuthRequest, res: Response) => {
  try {
    const { student, term, gradingScale } = req.query;

    if (!student || !term) {
      return res.status(400).json({ message: "student and term are required" });
    }

    const studentDoc = await Student.findById(student).select("class branch");
    if (!studentDoc) return res.status(404).json({ message: "Student not found" });

    if (studentDoc.class) {
      const cls = await ClassModel.findById(studentDoc.class);
      if (isClassGraduatingDoc(cls) && !isSuperAdmin(req)) {
        return res.status(403).json({
          message: "Forbidden: Graduating class report cards are restricted to Super Admin.",
        });
      }
    }

    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (studentDoc.branch && studentDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Student is not in your branch" });
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User.findById(req.user.id);
      const isAssigned = (teacher?.classes || []).some((c) => c.toString() === studentDoc.class.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: "Forbidden: You are not assigned to this student's class" });
      }
    }

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

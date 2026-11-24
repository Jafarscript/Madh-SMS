import { Response } from "express";
import mongoose from "mongoose";
import Student from "../models/Student";
import Subject from "../models/Subject";
import Score from "../models/Score";
import Term from "../models/Term";
import ClassModel from "../models/Class";
import User from "../models/User";
import GradingScale from "../models/GradingScale";
import { AuthRequest } from "../middleware/auth";
import { computePositions } from "../utils/ranking";
import { foldCascade } from "../utils/cascadeAverage";
import { isElementaryClass } from "./classController";
import {
  isClassGraduatingDoc,
  isSuperAdmin,
  getEffectiveSecondaryResultMode,
} from "../utils/graduatingAccess";

export const getBroadsheet = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, term: termId } = req.query;

    if (!classId || !termId) {
      return res.status(400).json({ message: "class and term are required" });
    }

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const isGraduating = isClassGraduatingDoc(cls);
    if (isGraduating && !isSuperAdmin(req)) {
      return res.status(403).json({
        message: "Forbidden: Graduating class broadsheets are restricted to Super Admin.",
      });
    }

    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (cls.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Class does not belong to your branch" });
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User.findById(req.user.id);
      const isAssigned = (teacher?.classes || []).some((c) => c.toString() === classId.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: "Forbidden: You are not assigned to this class" });
      }
    } else if (req.user?.role === "subject_teacher") {
      const teacher = await User.findById(req.user.id);
      const teacherClassIds = (teacher?.classes || []).map((c) => c.toString());
      const teacherSubjectIds = teacher?.subjects || [];
      let subjectClassIds: string[] = [];
      if (teacherSubjectIds.length > 0) {
        const subjs = await Subject.find({ _id: { $in: teacherSubjectIds } }).select("class");
        subjectClassIds = subjs.filter((s) => s.class).map((s) => s.class.toString());
      }
      const allowedClassIds = Array.from(new Set([...teacherClassIds, ...subjectClassIds]));
      if (!allowedClassIds.includes(classId.toString())) {
        return res.status(403).json({ message: "Forbidden: You are not assigned to this class or its subjects" });
      }
    }

    const currentTerm = await Term.findById(termId);
    if (!currentTerm) {
      return res.status(404).json({ message: "Term not found" });
    }

    const isElementary = cls.category === "elementary" || isElementaryClass(cls.name, cls.category);
    const onlyPresentTerms = req.query.onlyPresentTerms !== "false";

    const students = await Student.find({ class: classId as any }).sort({ numberInClass: 1, name: 1 });
    const subjects = await Subject.find({ class: classId as any }).sort({ order: 1, nameEnglish: 1 });

    if (students.length === 0 || subjects.length === 0) {
      return res.status(200).json({
        subjects,
        rows: [],
        currentTerm,
        sessionTerms: [currentTerm],
        summary: null,
        classMeta: {
          isGraduating,
          isElementary,
          sourceSchool: cls.sourceSchool || null,
          secondaryResultMode: cls.secondaryResultMode || "current_only",
        },
      });
    }

    const sessionTerms = await Term.find({ session: currentTerm.session }).sort({ termNumber: 1 });
    const sessionTermIds = sessionTerms.map((t) => t._id);
    const priorTerms = sessionTerms.filter((t) => t.termNumber <= currentTerm.termNumber);

    const studentIds = students.map((s) => s._id);
    const subjectIds = subjects.map((s) => s._id);

    const scores = await Score.find({
      student: { $in: studentIds } as any,
      subject: { $in: subjectIds } as any,
      term: { $in: sessionTermIds } as any,
    });

    const scaleId = (req.query.scaleId || req.query.gradingScale) as string | undefined;
    let gradingScale: any = null;
    if (scaleId && scaleId !== "undefined" && scaleId !== "null" && mongoose.Types.ObjectId.isValid(scaleId)) {
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
      if (scorePercentage >= 75) return { grade: "B2", remark: "Very Good", remarkArabic: "جيد جدا" };
      if (scorePercentage >= 60) return { grade: "C4", remark: "Good", remarkArabic: "جيد" };
      if (scorePercentage >= 50) return { grade: "D7", remark: "Pass", remarkArabic: "مقبول" };
      return { grade: "F9", remark: "Fail", remarkArabic: "راسب" };
    };

    const scoreMap = new Map<string, { total: number; ca?: number; exam?: number }>();
    scores.forEach((sc) => {
      const key = `${sc.term.toString()}_${sc.student.toString()}_${sc.subject.toString()}`;
      scoreMap.set(key, { total: sc.total, ca: sc.ca, exam: sc.exam });
    });

    const rows = students.map((student) => {
      const studentIdStr = student._id.toString();
      const excludedSet = new Set(
        (student.excludedSubjects || []).map((id: any) => id.toString())
      );
      const offeredSubjects = subjects.filter((s) => !excludedSet.has(s._id.toString()));
      const studentSubjectCount = offeredSubjects.length;

      let studentEnrolledTerms: number[] = [1, 2, 3];
      if (student.enrolledTerms && Array.isArray(student.enrolledTerms) && student.enrolledTerms.length > 0) {
        studentEnrolledTerms = student.enrolledTerms;
      } else if (student.joinedTerm) {
        studentEnrolledTerms = [1, 2, 3].filter((t) => t >= student.joinedTerm!);
      }

      const isEnrolledInCurrentTerm = studentEnrolledTerms.includes(currentTerm.termNumber);
      const effectiveMode = getEffectiveSecondaryResultMode(
        cls,
        student,
        isElementary,
        isGraduating
      );

      // 1. Current term subject scores
      const subjectScores = subjects.map((subject) => {
        const isExcluded = excludedSet.has(subject._id.toString());
        const key = `${currentTerm._id.toString()}_${studentIdStr}_${subject._id.toString()}`;
        const scoreDoc = isEnrolledInCurrentTerm && !isExcluded ? scoreMap.get(key) : undefined;

        const termScoresList: { termNumber: number; termId: string; score: number | null }[] = [];
        sessionTerms.forEach((st) => {
          const stKey = `${st._id.toString()}_${studentIdStr}_${subject._id.toString()}`;
          const isEnrolledInSt = studentEnrolledTerms.includes(st.termNumber);
          const stDoc = isEnrolledInSt && !isExcluded ? scoreMap.get(stKey) : undefined;
          termScoresList.push({
            termNumber: st.termNumber,
            termId: st._id.toString(),
            score: stDoc?.total ?? null,
          });
        });

        return {
          subject: subject._id,
          nameEnglish: subject.nameEnglish,
          nameArabic: subject.nameArabic,
          order: subject.order ?? 0,
          isExcluded,
          score: scoreDoc?.total ?? null,
          ca: scoreDoc?.ca ?? null,
          exam: scoreDoc?.exam ?? null,
          termScores: termScoresList,
        };
      });

      const enteredScores = subjectScores.filter((s) => !s.isExcluded && s.score !== null) as { score: number }[];
      const total = enteredScores.reduce((sum, s) => sum + s.score, 0);
      const average = studentSubjectCount > 0 ? total / studentSubjectCount : 0;
      const overallPercentage = Math.round(average * 100) / 100;

      const { grade, remark, remarkArabic } = isEnrolledInCurrentTerm
        ? getGradeRemark(overallPercentage)
        : { grade: "—", remark: "Not Enrolled", remarkArabic: "لم يلتحق" };

      // 2. Summary for each term in the session
      const termSummaries = sessionTerms.map((st) => {
        let tTotal = 0;
        let tEnteredCount = 0;

        offeredSubjects.forEach((subj) => {
          const key = `${st._id.toString()}_${studentIdStr}_${subj._id.toString()}`;
          const scDoc = scoreMap.get(key);
          if (scDoc && scDoc.total !== undefined && scDoc.total !== null) {
            tTotal += scDoc.total;
            tEnteredCount++;
          }
        });

        const isEnrolledInTerm = studentEnrolledTerms.includes(st.termNumber);
        const treatAsNotEnrolled =
          !isEnrolledInTerm ||
          (onlyPresentTerms && tEnteredCount === 0 && student.joinedTerm && student.joinedTerm > st.termNumber);

        if (treatAsNotEnrolled) {
          return {
            termId: st._id.toString(),
            termNumber: st.termNumber,
            session: st.session,
            total: null as any,
            average: null as any,
            overallPercentage: null as any,
            allEntered: false,
            enteredCount: 0,
            grade: "—",
            remark: "Not Enrolled",
            remarkArabic: "لم يلتحق",
            isEnrolled: false,
          };
        }

        const tAvg = studentSubjectCount > 0 ? tTotal / studentSubjectCount : 0;
        const tPercentage = Math.round(tAvg * 100) / 100;
        const tGradeRemark = getGradeRemark(tPercentage);

        return {
          termId: st._id.toString(),
          termNumber: st.termNumber,
          session: st.session,
          total: tTotal,
          average: tPercentage,
          overallPercentage: tPercentage,
          allEntered: tEnteredCount === studentSubjectCount,
          enteredCount: tEnteredCount,
          grade: tGradeRemark.grade,
          remark: tGradeRemark.remark,
          remarkArabic: tGradeRemark.remarkArabic,
          isEnrolled: true,
        };
      });

      // 3. Cumulative calculation respecting graduating secondary mode
      let applicablePriorTerms = priorTerms.filter((t) => {
        if (!onlyPresentTerms) return true;
        return studentEnrolledTerms.includes(t.termNumber);
      });

      if (effectiveMode === "current_only") {
        applicablePriorTerms = applicablePriorTerms.filter(
          (t) => t.termNumber === currentTerm.termNumber
        );
      } else if (effectiveMode === "combine_1st_and_3rd") {
        applicablePriorTerms = applicablePriorTerms.filter((t) => t.termNumber !== 2);
      }

      let cumulativeTotal = 0;
      offeredSubjects.forEach((subject) => {
        const subjectKey = subject._id.toString();
        const rawScoresAscending = applicablePriorTerms
          .map((t) => {
            const key = `${t._id.toString()}_${studentIdStr}_${subjectKey}`;
            return scoreMap.get(key)?.total;
          })
          .filter((v): v is number => v !== undefined && v !== null);

        if (effectiveMode === "current_only") {
          const currVal = rawScoresAscending.length > 0 ? rawScoresAscending[rawScoresAscending.length - 1] : 0;
          cumulativeTotal += currVal;
        } else {
          const { finalValue } = foldCascade(rawScoresAscending);
          cumulativeTotal += finalValue ?? 0;
        }
      });

      const cumulativeAverage = studentSubjectCount > 0 ? cumulativeTotal / studentSubjectCount : 0;
      const cumulativePercentage = Math.round(cumulativeAverage * 100) / 100;
      const cumulativeGradeRemark = isEnrolledInCurrentTerm
        ? getGradeRemark(cumulativePercentage)
        : { grade: "—", remark: "Not Enrolled", remarkArabic: "لم يلتحق" };

      return {
        student: student._id,
        name: student.name,
        gender: student.gender,
        numberInClass: student.numberInClass,
        seatNumber: student.seatNumber || null,
        sourceSchool: student.sourceSchool || cls.sourceSchool || null,
        effectiveResultMode: effectiveMode,
        offeredSubjectsCount: studentSubjectCount,
        enrolledTerms: studentEnrolledTerms,
        joinedTerm: student.joinedTerm || 1,
        isEnrolledInCurrentTerm,
        subjectScores,
        total: isEnrolledInCurrentTerm ? total : 0,
        average: isEnrolledInCurrentTerm ? overallPercentage : 0,
        overallPercentage: isEnrolledInCurrentTerm ? overallPercentage : 0,
        grade,
        remark,
        remarkArabic,
        allSubjectsEntered: isEnrolledInCurrentTerm && enteredScores.length === studentSubjectCount,
        termSummaries,
        cumulativeTotal: isEnrolledInCurrentTerm ? Math.round(cumulativeTotal * 100) / 100 : null,
        cumulativeAverage: isEnrolledInCurrentTerm ? cumulativePercentage : null,
        cumulativePercentage: isEnrolledInCurrentTerm ? cumulativePercentage : null,
        cumulativeGrade: cumulativeGradeRemark.grade,
        cumulativeRemark: cumulativeGradeRemark.remark,
        cumulativeRemarkArabic: cumulativeGradeRemark.remarkArabic,
      };
    });

    const rankedCurrent = computePositions(
      rows
        .filter((r) => r.isEnrolledInCurrentTerm)
        .map((r) => ({ studentId: r.student.toString(), score: r.total }))
    );
    const currentPositionMap = new Map(rankedCurrent.map((r) => [r.studentId, r.position]));

    const rankedCumulative = computePositions(
      rows
        .filter((r) => r.isEnrolledInCurrentTerm && r.cumulativeAverage !== null)
        .map((r) => ({ studentId: r.student.toString(), score: r.cumulativeAverage ?? 0 }))
    );
    const cumulativePositionMap = new Map(rankedCumulative.map((r) => [r.studentId, r.position]));

    const termPositionMaps = new Map<number, Map<string, number>>();
    sessionTerms.forEach((st) => {
      const termRankInput = rows
        .filter((r) => {
          const tSumm = r.termSummaries.find((ts) => ts.termNumber === st.termNumber);
          return tSumm && tSumm.isEnrolled && tSumm.total !== null;
        })
        .map((r) => {
          const tSumm = r.termSummaries.find((ts) => ts.termNumber === st.termNumber);
          return {
            studentId: r.student.toString(),
            score: tSumm ? (tSumm.total ?? 0) : 0,
          };
        });
      const tRanked = computePositions(termRankInput);
      termPositionMaps.set(st.termNumber, new Map(tRanked.map((tr) => [tr.studentId, tr.position])));
    });

    const positionedRows = rows.map((row) => {
      const sId = row.student.toString();
      const updatedTermSummaries = row.termSummaries.map((ts) => ({
        ...ts,
        position: ts.isEnrolled ? (termPositionMaps.get(ts.termNumber)?.get(sId) ?? null) : null,
      }));

      return {
        ...row,
        position: row.isEnrolledInCurrentTerm ? (currentPositionMap.get(sId) ?? null) : null,
        cumulativePosition: row.isEnrolledInCurrentTerm ? (cumulativePositionMap.get(sId) ?? null) : null,
        termSummaries: updatedTermSummaries,
      };
    });

    const totalStudents = positionedRows.length;
    const totals = positionedRows.map((r) => r.total);
    const percentages = positionedRows.map((r) => r.overallPercentage);
    const highestTotal = totals.length > 0 ? Math.max(...totals) : 0;
    const lowestTotal = totals.length > 0 ? Math.min(...totals) : 0;
    const classAvgPercentage =
      percentages.length > 0
        ? Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 100) / 100
        : 0;

    const remarkDistribution: Record<string, number> = {
      "ممتاز": 0,
      "جيد جداً": 0,
      "جيد": 0,
      "مقبول": 0,
      "راسب": 0,
    };
    positionedRows.forEach((r) => {
      if (remarkDistribution[r.remarkArabic] !== undefined) {
        remarkDistribution[r.remarkArabic]++;
      } else {
        remarkDistribution[r.remarkArabic] = (remarkDistribution[r.remarkArabic] || 0) + 1;
      }
    });

    const summary = {
      totalStudents,
      totalSubjects: subjects.length,
      classAvgPercentage,
      highestTotal,
      lowestTotal,
      remarkDistribution,
    };

    res.status(200).json({
      subjects,
      rows: positionedRows,
      currentTerm,
      sessionTerms,
      summary,
      classMeta: {
        isGraduating,
        isElementary,
        sourceSchool: cls.sourceSchool || null,
        secondaryResultMode: cls.secondaryResultMode || "current_only",
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getClassCumulativePositions = async (
  classId: string,
  termId: string
): Promise<Map<string, number>> => {
  const currentTerm = await Term.findById(termId);
  if (!currentTerm) return new Map();

  const [cls, priorTerms, students, subjects] = await Promise.all([
    ClassModel.findById(classId),
    Term.find({
      session: currentTerm.session,
      termNumber: { $lte: currentTerm.termNumber },
    }).sort({ termNumber: 1 }),
    Student.find({ class: classId }).sort({ numberInClass: 1, name: 1 }),
    Subject.find({ class: classId }).sort({ order: 1, nameEnglish: 1 }),
  ]);

  const isGraduating = isClassGraduatingDoc(cls);
  const isElementary = cls ? (cls.category === "elementary" || isElementaryClass(cls.name, cls.category)) : false;

  const scores = await Score.find({
    student: { $in: students.map((s) => s._id) },
    subject: { $in: subjects.map((s) => s._id) },
    term: { $in: priorTerms.map((t) => t._id) },
  });

  const byStudentSubject = new Map<string, Map<string, Map<string, number>>>();
  scores.forEach((sc) => {
    const studentKey = sc.student.toString();
    const subjectKey = sc.subject.toString();
    if (!byStudentSubject.has(studentKey)) byStudentSubject.set(studentKey, new Map());
    const subjMap = byStudentSubject.get(studentKey)!;
    if (!subjMap.has(subjectKey)) subjMap.set(subjectKey, new Map());
    subjMap.get(subjectKey)!.set(sc.term.toString(), sc.total);
  });

  const rankInput = students
    .filter((s) => {
      const sEnrolled =
        s.enrolledTerms && Array.isArray(s.enrolledTerms) && s.enrolledTerms.length > 0
          ? s.enrolledTerms
          : s.joinedTerm
            ? [1, 2, 3].filter((t) => t >= s.joinedTerm!)
            : [1, 2, 3];
      return sEnrolled.includes(currentTerm.termNumber);
    })
    .map((s) => {
      const studentKey = s._id.toString();
      const subjMap = byStudentSubject.get(studentKey) || new Map();
      const sEnrolled =
        s.enrolledTerms && Array.isArray(s.enrolledTerms) && s.enrolledTerms.length > 0
          ? s.enrolledTerms
          : s.joinedTerm
            ? [1, 2, 3].filter((t) => t >= s.joinedTerm!)
            : [1, 2, 3];

      const excludedSet = new Set((s.excludedSubjects || []).map((id: any) => id.toString()));
      const offeredSubjects = subjects.filter((sb) => !excludedSet.has(sb._id.toString()));
      const studentSubjCount = offeredSubjects.length;

      const effectiveMode = getEffectiveSecondaryResultMode(
        cls,
        s,
        isElementary,
        isGraduating
      );

      let applicablePriorTerms = priorTerms.filter((t) => sEnrolled.includes(t.termNumber));
      if (effectiveMode === "current_only") {
        applicablePriorTerms = applicablePriorTerms.filter(
          (t) => t.termNumber === currentTerm.termNumber
        );
      } else if (effectiveMode === "combine_1st_and_3rd") {
        applicablePriorTerms = applicablePriorTerms.filter((t) => t.termNumber !== 2);
      }

      let total = 0;
      offeredSubjects.forEach((subject) => {
        const subjectKey = subject._id.toString();
        const termScoreMap = subjMap.get(subjectKey) || new Map();
        const rawScoresAscending = applicablePriorTerms
          .map((t) => termScoreMap.get(t._id.toString()))
          .filter((v): v is number => v !== undefined);

        if (effectiveMode === "current_only") {
          total += rawScoresAscending.length > 0 ? rawScoresAscending[rawScoresAscending.length - 1] : 0;
        } else {
          const { finalValue } = foldCascade(rawScoresAscending);
          total += finalValue ?? 0;
        }
      });

      const average = studentSubjCount > 0 ? total / studentSubjCount : 0;
      return { studentId: studentKey, score: average };
    });

  const ranked = computePositions(rankInput);
  return new Map(ranked.map((r) => [r.studentId, r.position]));
};
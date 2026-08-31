import { Response } from "express";
import Student from "../models/Student";
import Subject from "../models/Subject";
import Score from "../models/Score";
import Term from "../models/Term";
import GradingScale from "../models/GradingScale";
import { AuthRequest } from "../middleware/auth";
import { computePositions } from "../utils/ranking";
import { foldCascade } from "../utils/cascadeAverage";

export const getBroadsheet = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, term: termId } = req.query;

    if (!classId || !termId) {
      return res.status(400).json({ message: "class and term are required" });
    }

    const currentTerm = await Term.findById(termId);
    if (!currentTerm) {
      return res.status(404).json({ message: "Term not found" });
    }

    const students = await Student.find({ class: classId as any }).sort({ numberInClass: 1, name: 1 });
    const subjects = await Subject.find({ class: classId as any }).sort({ order: 1, nameEnglish: 1 });

    if (students.length === 0 || subjects.length === 0) {
      return res.status(200).json({
        subjects,
        rows: [],
        currentTerm,
        sessionTerms: [currentTerm],
        summary: null,
      });
    }

    // Retrieve all terms in this session to allow viewing previous terms
    const sessionTerms = await Term.find({ session: currentTerm.session }).sort({ termNumber: 1 });
    const sessionTermIds = sessionTerms.map((t) => t._id);
    const priorTerms = sessionTerms.filter((t) => t.termNumber <= currentTerm.termNumber);

    const studentIds = students.map((s) => s._id);
    const subjectIds = subjects.map((s) => s._id);

    // Fetch all scores for this class across the entire session
    const scores = await Score.find({
      student: { $in: studentIds } as any,
      subject: { $in: subjectIds } as any,
      term: { $in: sessionTermIds } as any,
    });

    // Fetch grading scale for remarks calculation
    const gradingScale = await GradingScale.findOne();

    const getGradeRemark = (scorePercentage: number) => {
      if (gradingScale && gradingScale.bands && gradingScale.bands.length > 0) {
        const band = gradingScale.bands.find(
          (b) => scorePercentage >= b.minScore && scorePercentage <= b.maxScore
        );
        if (band) {
          return {
            grade: band.grade,
            remark: band.remark,
            remarkArabic: band.remarkArabic,
          };
        }
      }

      // Default standard scale if no band matched
      if (scorePercentage >= 70) return { grade: "A", remark: "Excellent", remarkArabic: "ممتاز" };
      if (scorePercentage >= 60) return { grade: "B", remark: "Very Good", remarkArabic: "جيد جداً" };
      if (scorePercentage >= 50) return { grade: "C", remark: "Good", remarkArabic: "جيد" };
      if (scorePercentage >= 40) return { grade: "D", remark: "Pass", remarkArabic: "مقبول" };
      return { grade: "F", remark: "Fail", remarkArabic: "راسب" };
    };

    // Group scores: termId -> studentId -> subjectId -> score doc
    const scoreMap = new Map<string, { total: number; ca?: number; exam?: number }>();
    scores.forEach((sc) => {
      const key = `${sc.term.toString()}_${sc.student.toString()}_${sc.subject.toString()}`;
      scoreMap.set(key, { total: sc.total, ca: sc.ca, exam: sc.exam });
    });

    const totalSubjectsCount = subjects.length;

    // Calculate rows for current term and prior terms
    const rows = students.map((student) => {
      const studentIdStr = student._id.toString();

      // 1. Current term subject scores
      const subjectScores = subjects.map((subject) => {
        const key = `${currentTerm._id.toString()}_${studentIdStr}_${subject._id.toString()}`;
        const scoreDoc = scoreMap.get(key);

        // Also gather prior term scores for this subject
        const termScoresList: { termNumber: number; termId: string; score: number | null }[] = [];
        sessionTerms.forEach((st) => {
          const stKey = `${st._id.toString()}_${studentIdStr}_${subject._id.toString()}`;
          const stDoc = scoreMap.get(stKey);
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
          score: scoreDoc?.total ?? null,
          ca: scoreDoc?.ca ?? null,
          exam: scoreDoc?.exam ?? null,
          termScores: termScoresList,
        };
      });

      const enteredScores = subjectScores.filter((s) => s.score !== null) as { score: number }[];
      const total = enteredScores.reduce((sum, s) => sum + s.score, 0);
      const average = totalSubjectsCount > 0 ? total / totalSubjectsCount : 0;
      const overallPercentage = Math.round(average * 100) / 100;

      const { grade, remark, remarkArabic } = getGradeRemark(overallPercentage);

      // 2. Summary for each term in the session (for prior terms comparison)
      const termSummaries = sessionTerms.map((st) => {
        let tTotal = 0;
        let tEnteredCount = 0;

        subjects.forEach((subj) => {
          const key = `${st._id.toString()}_${studentIdStr}_${subj._id.toString()}`;
          const scDoc = scoreMap.get(key);
          if (scDoc && scDoc.total !== undefined && scDoc.total !== null) {
            tTotal += scDoc.total;
            tEnteredCount++;
          }
        });

        const tAvg = totalSubjectsCount > 0 ? tTotal / totalSubjectsCount : 0;
        const tPercentage = Math.round(tAvg * 100) / 100;
        const tGradeRemark = getGradeRemark(tPercentage);

        return {
          termId: st._id.toString(),
          termNumber: st.termNumber,
          session: st.session,
          total: tTotal,
          average: tPercentage,
          overallPercentage: tPercentage,
          allEntered: tEnteredCount === totalSubjectsCount,
          enteredCount: tEnteredCount,
          grade: tGradeRemark.grade,
          remark: tGradeRemark.remark,
          remarkArabic: tGradeRemark.remarkArabic,
        };
      });

      // 3. Cumulative calculation across prior terms up to current term
      let cumulativeTotal = 0;
      subjects.forEach((subject) => {
        const subjectKey = subject._id.toString();
        const rawScoresAscending = priorTerms
          .map((t) => {
            const key = `${t._id.toString()}_${studentIdStr}_${subjectKey}`;
            return scoreMap.get(key)?.total;
          })
          .filter((v): v is number => v !== undefined && v !== null);

        const { finalValue } = foldCascade(rawScoresAscending);
        cumulativeTotal += finalValue ?? 0;
      });

      const cumulativeAverage = totalSubjectsCount > 0 ? cumulativeTotal / totalSubjectsCount : 0;
      const cumulativePercentage = Math.round(cumulativeAverage * 100) / 100;
      const cumulativeGradeRemark = getGradeRemark(cumulativePercentage);

      return {
        student: student._id,
        name: student.name,
        gender: student.gender,
        numberInClass: student.numberInClass,
        subjectScores,
        total,
        average: overallPercentage,
        overallPercentage,
        grade,
        remark,
        remarkArabic,
        allSubjectsEntered: enteredScores.length === totalSubjectsCount,
        termSummaries,
        cumulativeTotal: Math.round(cumulativeTotal * 100) / 100,
        cumulativeAverage: cumulativePercentage,
        cumulativePercentage,
        cumulativeGrade: cumulativeGradeRemark.grade,
        cumulativeRemark: cumulativeGradeRemark.remark,
        cumulativeRemarkArabic: cumulativeGradeRemark.remarkArabic,
      };
    });

    // Compute current term positions based on current term total
    const rankedCurrent = computePositions(
      rows.map((r) => ({ studentId: r.student.toString(), score: r.total }))
    );
    const currentPositionMap = new Map(rankedCurrent.map((r) => [r.studentId, r.position]));

    // Compute cumulative positions based on cumulative average
    const rankedCumulative = computePositions(
      rows.map((r) => ({ studentId: r.student.toString(), score: r.cumulativeAverage }))
    );
    const cumulativePositionMap = new Map(rankedCumulative.map((r) => [r.studentId, r.position]));

    // Compute positions for each prior term
    const termPositionMaps = new Map<number, Map<string, number>>();
    sessionTerms.forEach((st) => {
      const termRankInput = rows.map((r) => {
        const tSumm = r.termSummaries.find((ts) => ts.termNumber === st.termNumber);
        return {
          studentId: r.student.toString(),
          score: tSumm ? tSumm.total : 0,
        };
      });
      const tRanked = computePositions(termRankInput);
      termPositionMaps.set(st.termNumber, new Map(tRanked.map((tr) => [tr.studentId, tr.position])));
    });

    const positionedRows = rows.map((row) => {
      const sId = row.student.toString();
      const updatedTermSummaries = row.termSummaries.map((ts) => ({
        ...ts,
        position: termPositionMaps.get(ts.termNumber)?.get(sId) ?? null,
      }));

      return {
        ...row,
        position: currentPositionMap.get(sId)!,
        cumulativePosition: cumulativePositionMap.get(sId)!,
        termSummaries: updatedTermSummaries,
      };
    });

    // Compute class broadsheet summary statistics
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
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Computes each student's overall cascading average (same formula as
// buildReportCardData: per-subject cascade through terms up to the given
// term, then averaged across subjects) and ranks the whole class by it.
// This MUST match buildReportCardData's math exactly, since a student's
// report card position comes directly from this function's output.
export const getClassCumulativePositions = async (
  classId: string,
  termId: string
): Promise<Map<string, number>> => {
  const currentTerm = await Term.findById(termId);
  if (!currentTerm) return new Map();

  const priorTerms = await Term.find({
    session: currentTerm.session,
    termNumber: { $lte: currentTerm.termNumber },
  }).sort({ termNumber: 1 });
  const priorTermIds = priorTerms.map((t) => t._id);

  const students = await Student.find({ class: classId }).sort({ numberInClass: 1, name: 1 });
  const subjects = await Subject.find({ class: classId }).sort({ order: 1, nameEnglish: 1 });
  const totalSubjectsCount = subjects.length;   // add this

  const scores = await Score.find({
    student: { $in: students.map((s) => s._id) },
    subject: { $in: subjects.map((s) => s._id) },
    term: { $in: priorTermIds },
  });

  // group by student -> subject -> termId, so we can cascade each
  // subject individually (same as buildReportCardData), not flatten
  // everything into one undifferentiated list of raw totals
  const byStudentSubject = new Map<string, Map<string, Map<string, number>>>();
  scores.forEach((sc) => {
    const studentKey = sc.student.toString();
    const subjectKey = sc.subject.toString();
    if (!byStudentSubject.has(studentKey)) byStudentSubject.set(studentKey, new Map());
    const subjMap = byStudentSubject.get(studentKey)!;
    if (!subjMap.has(subjectKey)) subjMap.set(subjectKey, new Map());
    subjMap.get(subjectKey)!.set(sc.term.toString(), sc.total);
  });

  const rankInput = students.map((s) => {
    const studentKey = s._id.toString();
    const subjMap = byStudentSubject.get(studentKey) || new Map();

    // cascade each subject the same way the report card does, then
    // average across the FULL subject count — a subject with no score
    // yet contributes 0, matching buildReportCardData's overallPercentage
    let total = 0;
    subjects.forEach((subject) => {
      const subjectKey = subject._id.toString();
      const termScoreMap = subjMap.get(subjectKey) || new Map();
      const rawScoresAscending = priorTerms
        .map((t) => termScoreMap.get(t._id.toString()))
        .filter((v): v is number => v !== undefined);

      const { finalValue } = foldCascade(rawScoresAscending);
      total += finalValue ?? 0;
    });

    const average = totalSubjectsCount > 0 ? total / totalSubjectsCount : 0;
    return { studentId: studentKey, score: average };
  });

  const ranked = computePositions(rankInput);
  return new Map(ranked.map((r) => [r.studentId, r.position]));
};
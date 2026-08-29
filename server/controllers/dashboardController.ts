import { Response } from "express";
import ClassModel from "../models/Class";
import Subject from "../models/Subject";
import Student from "../models/Student";
import Score from "../models/Score";
import Branch from "../models/Branch";
import { AuthRequest } from "../middleware/auth";

// GET /api/dashboard?term=<termId>&branch=<branchId optional>
export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const term = req.query.term as string;
    const branch = req.query.branch as string | undefined;

    if (!term) {
      return res.status(400).json({ message: "term is required" });
    }

    const classFilter: Record<string, any> = {};
    if (branch) classFilter.branch = branch;

    const classes = await ClassModel.find(classFilter).populate("branch", "name");

    const classSummaries = await Promise.all(
      classes.map(async (cls) => {
        const students = await Student.find({ class: cls._id });
        const subjects = await Subject.find({ class: cls._id });

        const expectedScoreCount = students.length * subjects.length;

        const actualScoreCount = await Score.countDocuments({
          student: { $in: students.map((s) => s._id) },
          subject: { $in: subjects.map((s) => s._id) },
          term,
        });

        const subjectCompletion = await Promise.all(
          subjects.map(async (subject) => {
            const entered = await Score.countDocuments({
              student: { $in: students.map((s) => s._id) },
              subject: subject._id,
              term,
            });
            return {
              subject: subject._id,
              subjectName: subject.nameEnglish,
              totalExpected: students.length,
              totalEntered: entered,
              isComplete: entered >= students.length && students.length > 0,
            };
          })
        );

        return {
          class: cls._id,
          className: cls.name,
          arm: cls.arm,
          branch: cls.branch,
          totalStudents: students.length,
          totalSubjects: subjects.length,
          expectedScores: expectedScoreCount,
          enteredScores: actualScoreCount,
          completionPercentage:
            expectedScoreCount > 0
              ? Math.round((actualScoreCount / expectedScoreCount) * 100)
              : 0,
          subjectCompletion,
        };
      })
    );

    const studentFilter: Record<string, any> = {};
    if (branch) studentFilter.branch = branch;

    const allStudents = await Student.find(studentFilter);
    const scoresForStudents = await Score.find({
      term,
      student: { $in: allStudents.map((s) => s._id) },
    });

    const totalsByStudent = new Map<string, number>();
    scoresForStudents.forEach((sc) => {
      const key = sc.student.toString();
      totalsByStudent.set(key, (totalsByStudent.get(key) || 0) + sc.total);
    });

    const topStudents = allStudents
      .map((s) => ({
        student: s._id,
        name: s.name,
        class: s.class,
        totalScore: totalsByStudent.get(s._id.toString()) || 0,
      }))
      .filter((s) => s.totalScore > 0)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);

    const totalStudentsCount = allStudents.length;
    const totalClassesCount = classes.length;
    const totalBranchesCount = branch ? 1 : await Branch.countDocuments();

    res.status(200).json({
      summary: {
        totalBranches: totalBranchesCount,
        totalClasses: totalClassesCount,
        totalStudents: totalStudentsCount,
      },
      classSummaries,
      topStudents,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

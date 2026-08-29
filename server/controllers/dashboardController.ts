import { Response } from "express";
import ClassModel from "../models/Class";
import Subject from "../models/Subject";
import Student from "../models/Student";
import Score from "../models/Score";
import Branch from "../models/Branch";
import { AuthRequest } from "../middleware/auth";

// GET /api/dashboard?term=<termId>&branch=<branchId optional>
// branch_admin should always pass their own branch; super_admin can omit
// it to see everything, or pass one to drill into a specific branch.
export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const { term, branch } = req.query;

    if (!term) {
      return res.status(400).json({ message: "term is required" });
    }

    const classFilter: Record<string, string> = {};
    if (branch) classFilter.branch = branch as string;

    const classes = await ClassModel.find(classFilter).populate("branch", "name");

    // For each class, work out: how many students, how many subjects,
    // how many (student x subject) score slots are actually filled in.
    const classSummaries = await Promise.all(
      classes.map(async (cls) => {
        const students = await Student.find({ class: cls._id });
        const subjects = await Subject.find({ class: cls._id });

        const expectedScoreCount = students.length * subjects.length;

        const actualScoreCount = await Score.countDocuments({
          student: { $in: students.map((s) => s._id) } as any,
          subject: { $in: subjects.map((s) => s._id) } as any,
          term: term as any,
        });

        // which specific subjects still have missing entries — useful for
        // "nudge this teacher" rather than just a vague percentage
        const subjectCompletion = await Promise.all(
          subjects.map(async (subject) => {
            const entered = await Score.countDocuments({
              student: { $in: students.map((s) => s._id) } as any,
              subject: subject._id as any,
              term: term as any,
            });
            return {
              subject: subject._id,
              nameEnglish: subject.nameEnglish,
              entered,
              expected: students.length,
              complete: entered === students.length,
            };
          })
        );

        return {
          class: cls._id,
          className: cls.name + (cls.arm ? ` ${cls.arm}` : ""),
          branch: (cls.branch as any)?.name,
          studentCount: students.length,
          subjectCount: subjects.length,
          expectedScoreCount,
          actualScoreCount,
          percentComplete:
            expectedScoreCount > 0
              ? Math.round((actualScoreCount / expectedScoreCount) * 100)
              : 0,
          subjectCompletion,
        };
      })
    );

    // top students across all classes in scope, ranked by their term total.
    // Simpler than the report card's cumulative logic — this is a quick
    // "who's doing well this term" snapshot, not the official position.
    const allStudents = await Student.find(
      branch ? ({ branch: branch as string } as any) : {}
    );
    const scoresForStudents = await Score.find({
      term: term as any,
      student: { $in: allStudents.map((s) => s._id) } as any,
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
        total: totalsByStudent.get(s._id.toString()) || 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const overallSchoolAverage =
      scoresForStudents.length > 0
        ? scoresForStudents.reduce((sum, sc) => sum + sc.total, 0) / scoresForStudents.length
        : 0;

    res.status(200).json({
      classSummaries,
      topStudents,
      overallSchoolAverage: Math.round(overallSchoolAverage * 100) / 100,
      totalClasses: classes.length,
      totalStudents: allStudents.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
import { Response } from "express";
import ClassModel from "../models/Class";
import Subject from "../models/Subject";
import Student from "../models/Student";
import Score from "../models/Score";
import Branch from "../models/Branch";
import User from "../models/User";
import Term from "../models/Term";
import { AuthRequest } from "../middleware/auth";

// GET /api/dashboard?term=<termId>&branch=<branchId optional>
export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const { term, branch } = req.query;

    if (!term) {
      return res.status(400).json({ message: "term is required" });
    }

    const termDoc = await Term.findById(term);
    const currentTermNum = termDoc?.termNumber || 1;

    const classFilter: Record<string, any> = {};

    if (req.user?.role === "branch_admin" && req.user.branch) {
      classFilter.branch = req.user.branch;
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User.findById(req.user.id);
      classFilter._id = { $in: (teacher?.classes || []).map((c) => c.toString()) };
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
      classFilter._id = { $in: allowedClassIds };
    } else if (branch) {
      classFilter.branch = branch as string;
    }

    const classes = await ClassModel.find(classFilter).populate("branch", "name");
    const classIds = classes.map((c) => c._id);

    // For each class, work out: how many students, how many subjects,
    // how many (student x subject) score slots are actually filled in.
    const classSummaries = await Promise.all(
      classes.map(async (cls) => {
        const rawStudents = await Student.find({
          class: cls._id,
          status: { $nin: ["graduated", "transferred", "archived"] },
        });
        const students = rawStudents.filter((s) => {
          if (s.enrolledTerms && s.enrolledTerms.length > 0) {
            return s.enrolledTerms.includes(currentTermNum);
          }
          if (s.joinedTerm) {
            return currentTermNum >= s.joinedTerm;
          }
          return true;
        });
        const subjects = await Subject.find({ class: cls._id });

        const expectedScoreCount = students.length * subjects.length;

        const actualScoreCount = await Score.countDocuments({
          student: { $in: students.map((s) => s._id) } as any,
          subject: { $in: subjects.map((s) => s._id) } as any,
          term: term as any,
        });

        // which specific subjects still have missing entries
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

    // Filter students scoped strictly to the accessible classes/branch
    const studentFilter: Record<string, any> = {
      status: { $nin: ["graduated", "transferred", "archived"] },
    };
    if (req.user?.role === "branch_admin" && req.user.branch) {
      studentFilter.branch = req.user.branch;
    } else if (req.user?.role === "class_teacher" || req.user?.role === "subject_teacher") {
      studentFilter.class = { $in: classIds };
    } else if (branch) {
      studentFilter.branch = branch as string;
    }

    const fetchedStudents = await Student.find(studentFilter);
    const allStudents = fetchedStudents.filter((s) => {
      if (s.enrolledTerms && s.enrolledTerms.length > 0) {
        return s.enrolledTerms.includes(currentTermNum);
      }
      if (s.joinedTerm) {
        return currentTermNum >= s.joinedTerm;
      }
      return true;
    });
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
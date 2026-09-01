import { Response } from "express";
import ClassModel from "../models/Class";
import Student from "../models/Student";
import Subject from "../models/Subject";
import Score from "../models/Score";
import Attendance from "../models/Attendance";
import AttendanceSetting from "../models/AttendanceSetting";
import ReportCardRemark from "../models/ReportCardRemark";
import ResultPublication from "../models/ResultPublication";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const { name, arm, branch } = req.body; // arm is optional
    const newClass = await ClassModel.create({ name, arm, branch });
    res.status(201).json(newClass);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

// supports filtering by branch: GET /api/classes?branch=<id>
export const getClasses = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = {};

    // branch_admin is always scoped to their own branch, regardless of
    // whatever the query string says — this is the real enforcement point,
    // not a suggestion the frontend can just choose to respect or ignore
    if (req.user?.role === "branch_admin" && req.user.branch) {
      filter.branch = req.user.branch;
    } else if (req.user?.role === "class_teacher") {
      // class_teacher only sees classes they're actually assigned to —
      // pulled from their own user record, never trusted from a query param
      const teacher = await User.findById(req.user.id);
      filter._id = { $in: (teacher?.classes || []).map((c) => c.toString()) };
    } else if (req.query.branch) {
      filter.branch = req.query.branch as string;
    }

    const classes = await ClassModel.find(filter)
      .populate("branch", "name")
      .sort({ name: 1 });
    res.status(200).json(classes);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateClass = async (req: AuthRequest, res: Response) => {
  try {
    const { name, arm, branch } = req.body;
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (branch !== undefined) updateData.branch = branch;

    const updateQuery: Record<string, any> = { $set: updateData };
    if (arm !== undefined) {
      if (typeof arm === "string" && arm.trim()) {
        updateData.arm = arm.trim();
      } else {
        updateQuery.$unset = { arm: 1 };
      }
    }

    const updated = await ClassModel.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true },
    ).populate("branch", "name");
    if (!updated) return res.status(404).json({ message: "Class not found" });
    res.status(200).json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

export const deleteClass = async (req: AuthRequest, res: Response) => {
  try {
    const classId = req.params.id;

    // Strict Admin Authorization Check
    const userRole = req.user?.role;
    if (userRole !== "super_admin" && userRole !== "branch_admin") {
      return res
        .status(403)
        .json({ message: "Only administrators can delete a class." });
    }

    const classObj = await ClassModel.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Branch Admin Scoping Check
    if (userRole === "branch_admin" && req.user?.branch) {
      if (
        classObj.branch &&
        classObj.branch.toString() !== req.user.branch.toString()
      ) {
        return res
          .status(403)
          .json({ message: "You can only delete classes in your assigned branch." });
      }
    }

    // 1. Find all students belonging to this class
    const students = await Student.find({ class: classId }).select("_id");
    const studentIds = students.map((s) => s._id);

    // 2. Find all subjects assigned to this class
    const subjects = await Subject.find({ class: classId }).select("_id");
    const subjectIds = subjects.map((s) => s._id);

    // 3. Delete all Scores for these students OR these subjects
    await Score.deleteMany({
      $or: [
        { student: { $in: studentIds } },
        { subject: { $in: subjectIds } },
      ],
    });

    // 4. Delete all Attendance records for this class or these students
    await Attendance.deleteMany({
      $or: [{ class: classId }, { student: { $in: studentIds } }],
    });

    // 5. Delete all Attendance Settings for this class
    await AttendanceSetting.deleteMany({ class: classId });

    // 6. Delete all Report Card Remarks for these students
    if (studentIds.length > 0) {
      await ReportCardRemark.deleteMany({ student: { $in: studentIds } });
    }

    // 7. Delete all Result Publications for this class
    await ResultPublication.deleteMany({ class: classId });

    // 8. Delete all Students in this class
    await Student.deleteMany({ class: classId });

    // 9. Delete all Subjects in this class
    await Subject.deleteMany({ class: classId });

    // 10. Clean up User associations
    // Unassign class from teachers
    await User.updateMany({ classes: classId }, { $pull: { classes: classId } });
    // Unassign deleted subjects from teachers
    if (subjectIds.length > 0) {
      await User.updateMany(
        { subjects: { $in: subjectIds } },
        { $pull: { subjects: { $in: subjectIds } } }
      );
    }
    // Unlink deleted students from parent accounts
    if (studentIds.length > 0) {
      await User.updateMany(
        { linkedStudent: { $in: studentIds } },
        { $unset: { linkedStudent: 1 } }
      );
    }

    // 11. Delete the Class itself
    await ClassModel.findByIdAndDelete(classId);

    res.status(200).json({
      message:
        "Class and all linked students, subjects, scores, attendance, remarks, and records have been permanently deleted.",
      deletedStudentsCount: studentIds.length,
      deletedSubjectsCount: subjectIds.length,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

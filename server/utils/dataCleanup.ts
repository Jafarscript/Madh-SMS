import ClassModel from "../models/Class";
import Student from "../models/Student";
import Subject from "../models/Subject";
import Score from "../models/Score";
import Attendance from "../models/Attendance";
import AttendanceSetting from "../models/AttendanceSetting";
import ReportCardRemark from "../models/ReportCardRemark";
import ResultPublication from "../models/ResultPublication";
import User from "../models/User";

export interface CleanupResult {
  deletedStudentsCount: number;
  deletedSubjectsCount: number;
  deletedScoresCount: number;
  deletedAttendanceCount: number;
  deletedRemarksCount: number;
}

export const purgeOrphanedData = async (): Promise<CleanupResult> => {
  try {
    // 1. Get all valid class IDs
    const validClasses = await ClassModel.find().select("_id");
    const validClassIds = validClasses.map((c) => c._id);

    // 2. Identify orphaned students (class is missing or points to a non-existent class)
    const orphanedStudents = await Student.find({
      $or: [
        { class: { $nin: validClassIds } },
        { class: { $exists: false } },
        { class: null },
      ],
    }).select("_id name");
    const orphanedStudentIds = orphanedStudents.map((s) => s._id);

    // 3. Identify orphaned subjects (class is missing or points to a non-existent class)
    const orphanedSubjects = await Subject.find({
      $or: [
        { class: { $nin: validClassIds } },
        { class: { $exists: false } },
        { class: null },
      ],
    }).select("_id");
    const orphanedSubjectIds = orphanedSubjects.map((s) => s._id);

    // 4. Delete scores linked to orphaned students or orphaned subjects
    let deletedScoresCount = 0;
    const scoreOrConditions: any[] = [];
    if (orphanedStudentIds.length > 0) {
      scoreOrConditions.push({ student: { $in: orphanedStudentIds } });
    }
    if (orphanedSubjectIds.length > 0) {
      scoreOrConditions.push({ subject: { $in: orphanedSubjectIds } });
    }
    if (scoreOrConditions.length > 0) {
      const scoreDeleteRes = await Score.deleteMany({ $or: scoreOrConditions });
      deletedScoresCount = scoreDeleteRes.deletedCount || 0;
    }

    // 5. Delete attendance records linked to orphaned students or non-existent classes
    let deletedAttendanceCount = 0;
    const attOrConditions: any[] = [];
    if (orphanedStudentIds.length > 0) {
      attOrConditions.push({ student: { $in: orphanedStudentIds } });
    }
    if (validClassIds.length > 0) {
      attOrConditions.push({ class: { $nin: validClassIds } });
    }
    if (attOrConditions.length > 0) {
      const attendanceDeleteRes = await Attendance.deleteMany({ $or: attOrConditions });
      deletedAttendanceCount = attendanceDeleteRes.deletedCount || 0;
    }

    // 6. Delete attendance settings for non-existent classes
    await AttendanceSetting.deleteMany({
      class: { $nin: validClassIds },
    });

    // 7. Delete report card remarks for orphaned students
    let remarksDeletedCount = 0;
    if (orphanedStudentIds.length > 0) {
      const remarkRes = await ReportCardRemark.deleteMany({
        student: { $in: orphanedStudentIds },
      });
      remarksDeletedCount = remarkRes.deletedCount || 0;
    }

    // 8. Delete result publications for non-existent classes
    await ResultPublication.deleteMany({
      class: { $nin: validClassIds },
    });

    // 9. Clean up User associations (parents, teachers)
    if (orphanedStudentIds.length > 0) {
      await User.updateMany(
        { linkedStudent: { $in: orphanedStudentIds } },
        { $unset: { linkedStudent: 1 } }
      );
    }
    if (orphanedSubjectIds.length > 0) {
      await User.updateMany(
        { subjects: { $in: orphanedSubjectIds } },
        { $pull: { subjects: { $in: orphanedSubjectIds } } }
      );
    }
    await User.updateMany(
      { classes: { $nin: validClassIds } },
      { $pull: { classes: { $nin: validClassIds } } }
    );

    // 10. Delete orphaned subjects
    let subjectsDeletedCount = 0;
    if (orphanedSubjectIds.length > 0) {
      const subRes = await Subject.deleteMany({ _id: { $in: orphanedSubjectIds } });
      subjectsDeletedCount = subRes.deletedCount || 0;
    }

    // 11. Delete orphaned students
    let studentsDeletedCount = 0;
    if (orphanedStudentIds.length > 0) {
      const studRes = await Student.deleteMany({ _id: { $in: orphanedStudentIds } });
      studentsDeletedCount = studRes.deletedCount || 0;
    }

    if (studentsDeletedCount > 0 || subjectsDeletedCount > 0 || deletedScoresCount > 0 || deletedAttendanceCount > 0) {
      console.log(
        `[Data Cleanup] Purged ${studentsDeletedCount} orphaned students, ${subjectsDeletedCount} orphaned subjects, ${deletedScoresCount} scores, ${deletedAttendanceCount} attendance records.`
      );
    }

    return {
      deletedStudentsCount: studentsDeletedCount,
      deletedSubjectsCount: subjectsDeletedCount,
      deletedScoresCount: deletedScoresCount,
      deletedAttendanceCount: deletedAttendanceCount,
      deletedRemarksCount: remarksDeletedCount,
    };
  } catch (error) {
    console.error("[Data Cleanup] Error purging orphaned data:", error);
    throw error;
  }
};

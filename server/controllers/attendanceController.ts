import { Response } from "express";
import Attendance from "../models/Attendance";
import AttendanceSetting from "../models/AttendanceSetting";
import Class from "../models/Class";
import Student from "../models/Student";
import User from "../models/User";
import Term from "../models/Term";
import { AuthRequest } from "../middleware/auth";
import { isClassResultLocked } from "./resultPublicationController";

const canAccessClass = async (req: AuthRequest, classId: string) => {
  if (req.user?.role === "super_admin") return true;
  const [user, classDoc] = await Promise.all([
    User.findById(req.user?.id),
    Class.findById(classId),
  ]);
  if (!user || !classDoc) return false;
  if (req.user?.role === "branch_admin")
    return user.branch?.toString() === classDoc.branch.toString();
  if (req.user?.role === "class_teacher")
    return (user.classes || []).some((id) => id.toString() === classId);
  return false;
};

// GET /api/attendance?class=<classId>&term=<termId>
export const getClassAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, term: termId } = req.query as Record<string, string>;
    if (!classId || !termId) {
      return res.status(400).json({ message: "class and term are required" });
    }
    if (!(await canAccessClass(req, classId))) {
      return res.status(403).json({ message: "You cannot access this class" });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    // 1. Resolve central settings (Term Document -> Global School-wide -> Any Branch Setting -> Class)
    const [classSetting, branchSetting, globalSetting, anySettingForTerm, termDoc] = await Promise.all([
      AttendanceSetting.findOne({ class: classId, term: termId }),
      classDoc.branch
        ? AttendanceSetting.findOne({ branch: classDoc.branch, term: termId, class: { $exists: false } })
        : null,
      AttendanceSetting.findOne({ term: termId, class: { $exists: false }, branch: { $exists: false } }),
      AttendanceSetting.findOne({
        term: termId,
        $or: [
          { nextResumption: { $exists: true, $ne: "" } },
          { dateResumed: { $exists: true, $ne: "" } },
          { timesSchoolOpened: { $exists: true, $ne: null } },
        ],
      }),
      Term.findById(termId),
    ]);

    // Calendar dates and resumption dates are unified school-wide for the whole school
    const settings = {
      timesSchoolOpened:
        (termDoc as any)?.timesSchoolOpened ??
        anySettingForTerm?.timesSchoolOpened ??
        globalSetting?.timesSchoolOpened ??
        branchSetting?.timesSchoolOpened ??
        classSetting?.timesSchoolOpened ??
        null,
      dateResumed:
        (termDoc as any)?.dateResumed ||
        anySettingForTerm?.dateResumed ||
        globalSetting?.dateResumed ||
        branchSetting?.dateResumed ||
        classSetting?.dateResumed ||
        "",
      dateClosed:
        (termDoc as any)?.dateClosed ||
        anySettingForTerm?.dateClosed ||
        globalSetting?.dateClosed ||
        branchSetting?.dateClosed ||
        classSetting?.dateClosed ||
        "",
      nextResumption:
        (termDoc as any)?.nextResumption ||
        anySettingForTerm?.nextResumption ||
        globalSetting?.nextResumption ||
        branchSetting?.nextResumption ||
        classSetting?.nextResumption ||
        "",
    };

    // 2. Fetch students & their attendance records
    const [students, records, isLocked] = await Promise.all([
      Student.find({ class: classId }).sort({ numberInClass: 1, name: 1 }).select("name numberInClass"),
      Attendance.find({ class: classId, term: termId }).select("student timesPresent timesAbsent"),
      isClassResultLocked(classId, termId),
    ]);

    const recordMap = new Map(
      records.map((r) => [
        r.student.toString(),
        {
          timesPresent: r.timesPresent ?? null,
          timesAbsent: r.timesAbsent ?? null,
        },
      ])
    );

    const studentList = students.map((student) => {
      const rec = recordMap.get(student._id.toString());
      return {
        student: student._id,
        name: student.name,
        numberInClass: student.numberInClass,
        timesPresent: rec?.timesPresent ?? null,
        timesAbsent: rec?.timesAbsent ?? null,
      };
    });

    res.status(200).json({
      settings,
      students: studentList,
      isLocked,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PUT /api/attendance/bulk
// body: {
//   class: classId,
//   term: termId,
//   settings?: { timesSchoolOpened, dateResumed, dateClosed, nextResumption },
//   records: [{ student: id, timesPresent: number | null, timesAbsent: number | null }]
// }
export const saveClassAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, term: termId, settings, records } = req.body as {
      class?: string;
      term?: string;
      settings?: {
        timesSchoolOpened?: number | null;
        dateResumed?: string;
        dateClosed?: string;
        nextResumption?: string;
        applyToWholeBranch?: boolean;
      };
      records?: Array<{
        student: string;
        timesPresent: number | string | null;
        timesAbsent: number | string | null;
      }>;
    };

    if (!classId || !termId) {
      return res.status(400).json({ message: "class and term are required" });
    }
    if (!(await canAccessClass(req, classId))) {
      return res.status(403).json({ message: "You cannot manage this class" });
    }
    if (await isClassResultLocked(classId, termId)) {
      return res.status(423).json({
        message: "This class result is locked and attendance cannot be changed",
      });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    // 1. Update central settings if supplied (applies school-wide to all branches & classes)
    if (settings) {
      const timesOpened =
        settings.timesSchoolOpened !== undefined &&
        settings.timesSchoolOpened !== null &&
        settings.timesSchoolOpened !== ("" as any)
          ? Number(settings.timesSchoolOpened)
          : null;
      const cleanDateResumed = settings.dateResumed?.trim() || "";
      const cleanDateClosed = settings.dateClosed?.trim() || "";
      const cleanNextResumption = settings.nextResumption?.trim() || "";

      // 1. Update school-wide global AttendanceSetting
      await AttendanceSetting.findOneAndUpdate(
        { term: termId, class: { $exists: false }, branch: { $exists: false } },
        {
          timesSchoolOpened: timesOpened,
          dateResumed: cleanDateResumed,
          dateClosed: cleanDateClosed,
          nextResumption: cleanNextResumption,
          updatedBy: req.user?.id,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // 2. Update Term model directly for consistency
      await Term.findByIdAndUpdate(termId, {
        timesSchoolOpened: timesOpened,
        dateResumed: cleanDateResumed,
        dateClosed: cleanDateClosed,
        nextResumption: cleanNextResumption,
      });

      // 3. Propagate to ALL existing AttendanceSetting records for this term across all branches and classes
      await AttendanceSetting.updateMany(
        { term: termId },
        {
          timesSchoolOpened: timesOpened,
          dateResumed: cleanDateResumed,
          dateClosed: cleanDateClosed,
          nextResumption: cleanNextResumption,
          updatedBy: req.user?.id,
        }
      );
    }

    // 2. Save individual student present/absent numbers
    if (Array.isArray(records) && records.length > 0) {
      const enrolled = await Student.countDocuments({
        _id: { $in: records.map((r) => r.student) },
        class: classId,
      });
      if (enrolled !== records.length) {
        return res.status(400).json({
          message: "One or more students do not belong to this class",
        });
      }

      await Promise.all(
        records.map((r) => {
          const timesPresent =
            r.timesPresent !== undefined &&
            r.timesPresent !== null &&
            r.timesPresent !== ("" as any)
              ? Number(r.timesPresent)
              : null;

          const timesAbsent =
            r.timesAbsent !== undefined &&
            r.timesAbsent !== null &&
            r.timesAbsent !== ("" as any)
              ? Number(r.timesAbsent)
              : null;

          return Attendance.findOneAndUpdate(
            { student: r.student, term: termId },
            {
              class: classId,
              timesPresent,
              timesAbsent,
              recordedBy: req.user!.id,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        })
      );
    }

    res.status(200).json({ message: "Attendance and settings saved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/attendance/settings?term=<termId>&branch=<branchId>
export const getAttendanceSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { term: termId, branch: branchId } = req.query as Record<string, string>;
    if (!termId) return res.status(400).json({ message: "term is required" });

    const query: any = { term: termId, class: { $exists: false } };
    if (req.user?.role === "branch_admin" && req.user.branch) {
      query.branch = req.user.branch;
    } else if (branchId) {
      query.branch = branchId;
    }

    const setting = await AttendanceSetting.findOne(query);
    const termDoc = await Term.findById(termId);

    res.status(200).json({
      timesSchoolOpened:
        (termDoc as any)?.timesSchoolOpened ?? setting?.timesSchoolOpened ?? null,
      dateResumed: (termDoc as any)?.dateResumed || setting?.dateResumed || "",
      dateClosed: (termDoc as any)?.dateClosed || setting?.dateClosed || "",
      nextResumption:
        (termDoc as any)?.nextResumption || setting?.nextResumption || "",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PUT /api/attendance/settings
export const saveAttendanceSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { term: termId, branch: branchId, timesSchoolOpened, dateResumed, dateClosed, nextResumption } = req.body;
    if (!termId) return res.status(400).json({ message: "term is required" });

    const timesOpened =
      timesSchoolOpened !== undefined && timesSchoolOpened !== null && timesSchoolOpened !== ""
        ? Number(timesSchoolOpened)
        : null;

    const cleanDateResumed = dateResumed?.trim() || "";
    const cleanDateClosed = dateClosed?.trim() || "";
    const cleanNextResumption = nextResumption?.trim() || "";

    // 1. Update the global school-wide AttendanceSetting for this term
    const updated = await AttendanceSetting.findOneAndUpdate(
      { term: termId, class: { $exists: false }, branch: { $exists: false } },
      {
        timesSchoolOpened: timesOpened,
        dateResumed: cleanDateResumed,
        dateClosed: cleanDateClosed,
        nextResumption: cleanNextResumption,
        updatedBy: req.user?.id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 2. Update Term model directly
    await Term.findByIdAndUpdate(termId, {
      timesSchoolOpened: timesOpened,
      dateResumed: cleanDateResumed,
      dateClosed: cleanDateClosed,
      nextResumption: cleanNextResumption,
    });

    // 3. Synchronize to all existing AttendanceSetting records for this term across all branches and classes
    await AttendanceSetting.updateMany(
      { term: termId },
      {
        timesSchoolOpened: timesOpened,
        dateResumed: cleanDateResumed,
        dateClosed: cleanDateClosed,
        nextResumption: cleanNextResumption,
        updatedBy: req.user?.id,
      }
    );

    res.status(200).json({ message: "School-wide term calendar and resumption dates saved across all branches", settings: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

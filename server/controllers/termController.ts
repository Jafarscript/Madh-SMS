import { Response } from "express";
import Term from "../models/Term";
import AttendanceSetting from "../models/AttendanceSetting";
import { AuthRequest } from "../middleware/auth";

export const createTerm = async (req: AuthRequest, res: Response) => {
  try {
    const { session, termNumber, isActive, timesSchoolOpened, dateResumed, dateClosed, nextResumption } = req.body;

    // if this term is being set active, deactivate any other active term
    // in the same session — only one term should be "current" at a time
    if (isActive) {
      await Term.updateMany({ session }, { isActive: false });
    }

    const timesOpened =
      timesSchoolOpened !== undefined && timesSchoolOpened !== null && timesSchoolOpened !== ""
        ? Number(timesSchoolOpened)
        : null;

    const term = await Term.create({
      session,
      termNumber,
      isActive: !!isActive,
      timesSchoolOpened: timesOpened,
      dateResumed: dateResumed?.trim() || "",
      dateClosed: dateClosed?.trim() || "",
      nextResumption: nextResumption?.trim() || "",
    });

    // Also seed global school-wide AttendanceSetting for this term
    await AttendanceSetting.findOneAndUpdate(
      { term: term._id, class: { $exists: false }, branch: { $exists: false } },
      {
        timesSchoolOpened: timesOpened,
        dateResumed: term.dateResumed,
        dateClosed: term.dateClosed,
        nextResumption: term.nextResumption,
        updatedBy: req.user?.id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const Branch = (await import("../models/Branch")).default;
    const allBranches = await Branch.find();
    for (const b of allBranches) {
      await AttendanceSetting.findOneAndUpdate(
        { term: term._id, branch: b._id, class: { $exists: false } },
        {
          timesSchoolOpened: timesOpened,
          dateResumed: term.dateResumed,
          dateClosed: term.dateClosed,
          nextResumption: term.nextResumption,
          updatedBy: req.user?.id,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.status(201).json(term);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getTerms = async (_req: AuthRequest, res: Response) => {
  try {
    const terms = await Term.find().sort({ session: -1, termNumber: -1 });

    // Enrich each term with calendar values if stored in AttendanceSetting
    const enriched = await Promise.all(
      terms.map(async (t) => {
        const obj: any = t.toObject();
        if (
          !obj.nextResumption ||
          !obj.dateResumed ||
          obj.timesSchoolOpened === null ||
          obj.timesSchoolOpened === undefined
        ) {
          const setting = await AttendanceSetting.findOne({
            term: t._id,
            $or: [
              { nextResumption: { $exists: true, $ne: "" } },
              { dateResumed: { $exists: true, $ne: "" } },
              { timesSchoolOpened: { $exists: true, $ne: null } },
            ],
          });
          if (setting) {
            if (!obj.nextResumption && setting.nextResumption) obj.nextResumption = setting.nextResumption;
            if (!obj.dateResumed && setting.dateResumed) obj.dateResumed = setting.dateResumed;
            if (!obj.dateClosed && setting.dateClosed) obj.dateClosed = setting.dateClosed;
            if (
              (obj.timesSchoolOpened === null || obj.timesSchoolOpened === undefined) &&
              setting.timesSchoolOpened !== null &&
              setting.timesSchoolOpened !== undefined
            ) {
              obj.timesSchoolOpened = setting.timesSchoolOpened;
            }
          }
        }
        return obj;
      })
    );

    res.status(200).json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const setActiveTerm = async (req: AuthRequest, res: Response) => {
  try {
    const term = await Term.findById(req.params.id);
    if (!term) return res.status(404).json({ message: "Term not found" });

    await Term.updateMany({ session: term.session }, { isActive: false });
    term.isActive = true;
    await term.save();

    res.status(200).json(term);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateTermCalendar = async (req: AuthRequest, res: Response) => {
  try {
    const { timesSchoolOpened, dateResumed, dateClosed, nextResumption } = req.body;
    const term = await Term.findById(req.params.id);
    if (!term) return res.status(404).json({ message: "Term not found" });

    const timesOpened =
      timesSchoolOpened !== undefined && timesSchoolOpened !== null && timesSchoolOpened !== ""
        ? Number(timesSchoolOpened)
        : null;

    term.timesSchoolOpened = timesOpened;
    term.dateResumed = dateResumed !== undefined ? dateResumed?.trim() || "" : term.dateResumed;
    term.dateClosed = dateClosed !== undefined ? dateClosed?.trim() || "" : term.dateClosed;
    term.nextResumption = nextResumption !== undefined ? nextResumption?.trim() || "" : term.nextResumption;
    await term.save();

    // Find all branches in the school
    const Branch = (await import("../models/Branch")).default;
    const allBranches = await Branch.find();

    // 1. Update/upsert the global school-wide AttendanceSetting for this term
    await AttendanceSetting.findOneAndUpdate(
      { term: term._id, class: { $exists: false }, branch: { $exists: false } },
      {
        timesSchoolOpened: term.timesSchoolOpened,
        dateResumed: term.dateResumed,
        dateClosed: term.dateClosed,
        nextResumption: term.nextResumption,
        updatedBy: req.user?.id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 2. Ensure every branch in the school has an AttendanceSetting with these exact values
    for (const b of allBranches) {
      await AttendanceSetting.findOneAndUpdate(
        { term: term._id, branch: b._id, class: { $exists: false } },
        {
          timesSchoolOpened: term.timesSchoolOpened,
          dateResumed: term.dateResumed,
          dateClosed: term.dateClosed,
          nextResumption: term.nextResumption,
          updatedBy: req.user?.id,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // 3. Synchronize to all existing class attendance settings for this term across all branches
    await AttendanceSetting.updateMany(
      { term: term._id },
      {
        timesSchoolOpened: term.timesSchoolOpened,
        dateResumed: term.dateResumed,
        dateClosed: term.dateClosed,
        nextResumption: term.nextResumption,
      }
    );

    res.status(200).json({
      message: "Term calendar & resumption dates updated school-wide across all branches",
      term,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
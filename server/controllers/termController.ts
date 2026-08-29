import { Response } from "express";
import Term from "../models/Term";
import { AuthRequest } from "../middleware/auth";

export const createTerm = async (req: AuthRequest, res: Response) => {
  try {
    const { session, termNumber, isActive } = req.body;

    // if this term is being set active, deactivate any other active term
    // in the same session — only one term should be "current" at a time
    if (isActive) {
      await Term.updateMany({ session }, { isActive: false });
    }

    const term = await Term.create({ session, termNumber, isActive: !!isActive });
    res.status(201).json(term);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getTerms = async (_req: AuthRequest, res: Response) => {
  try {
    const terms = await Term.find().sort({ session: -1, termNumber: -1 });
    res.status(200).json(terms);
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
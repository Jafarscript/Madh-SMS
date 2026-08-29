import { Response } from "express";
import GradingScale from "../models/GradingScale";
import { AuthRequest } from "../middleware/auth";

export const createGradingScale = async (req: AuthRequest, res: Response) => {
  try {
    const { name, bands } = req.body;
    // bands: [{ minScore, maxScore, grade, remark }, ...]
    const scale = await GradingScale.create({ name, bands });
    res.status(201).json(scale);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getGradingScales = async (_req: AuthRequest, res: Response) => {
  try {
    const scales = await GradingScale.find();
    res.status(200).json(scales);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateGradingScale = async (req: AuthRequest, res: Response) => {
  try {
    const updated = await GradingScale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Grading scale not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const deleteGradingScale = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await GradingScale.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Grading scale not found" });
    res.status(200).json({ message: "Grading scale deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
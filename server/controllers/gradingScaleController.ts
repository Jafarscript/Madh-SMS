import { Response } from "express";
import GradingScale from "../models/GradingScale";
import { AuthRequest } from "../middleware/auth";

export const TAQDEER_DEFAULT_BANDS = [
  { minScore: 85, maxScore: 100, grade: "A1", remark: "Excellent", remarkArabic: "ممتاز" },
  { minScore: 75, maxScore: 84.9, grade: "B2", remark: "Very Good", remarkArabic: "جيد جدا" },
  { minScore: 60, maxScore: 74.9, grade: "C4", remark: "Good", remarkArabic: "جيد" },
  { minScore: 50, maxScore: 59.9, grade: "D7", remark: "Pass", remarkArabic: "مقبول" },
  { minScore: 0, maxScore: 49.9, grade: "F9", remark: "Fail", remarkArabic: "راسب" },
];

export const ensureDefaultGradingScale = async () => {
  try {
    let taqdeer = await GradingScale.findOne({ name: "التقدير" });
    if (!taqdeer) {
      taqdeer = await GradingScale.create({
        name: "التقدير",
        bands: TAQDEER_DEFAULT_BANDS,
      });
      console.log("[GradingScale] Created default 'التقدير' scale.");
    } else {
      // If bands are empty or using old 70% threshold for top band, modernize to current scale
      const hasOldScale = taqdeer.bands.some((b) => b.minScore === 70 && (b.grade === "A1" || b.grade === "A"));
      if (!taqdeer.bands || taqdeer.bands.length === 0 || hasOldScale) {
        taqdeer.bands = TAQDEER_DEFAULT_BANDS;
        await taqdeer.save();
        console.log("[GradingScale] Updated 'التقدير' scale to standard 85-100% A1 scale.");
      }
    }
    return taqdeer;
  } catch (err) {
    console.error("[GradingScale] ensureDefaultGradingScale error:", err);
    return null;
  }
};

export const createGradingScale = async (req: AuthRequest, res: Response) => {
  try {
    const { name, bands } = req.body;
    // bands: [{ minScore, maxScore, grade, remark, remarkArabic }, ...]
    const scale = await GradingScale.create({ name, bands });
    res.status(201).json(scale);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getGradingScales = async (_req: AuthRequest, res: Response) => {
  try {
    await ensureDefaultGradingScale();
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

export const resetTaqdeerScale = async (_req: AuthRequest, res: Response) => {
  try {
    let scale = await GradingScale.findOne({ name: "التقدير" });
    if (!scale) {
      scale = await GradingScale.create({
        name: "التقدير",
        bands: TAQDEER_DEFAULT_BANDS,
      });
    } else {
      scale.bands = TAQDEER_DEFAULT_BANDS;
      await scale.save();
    }
    res.status(200).json({ message: "Reset to standard التقدير scale successfully", scale });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

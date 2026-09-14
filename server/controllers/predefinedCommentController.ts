import { Response } from "express";
import PredefinedComment, { IPredefinedComment } from "../models/PredefinedComment";
import { REPORT_CARD_COMMENTS } from "../constants/reportCardComments";
import { AuthRequest } from "../middleware/auth";

// Ensure initial seed runs if collection is empty
const ensureSeeded = async () => {
  const count = await PredefinedComment.countDocuments();
  if (count === 0) {
    const docs = REPORT_CARD_COMMENTS.map((c, index) => ({
      code: c.id,
      en: c.en,
      ar: c.ar,
      gender: c.gender,
      category: c.category || "commendable",
      targetRole: c.targetRole || "both",
      isDefault: true,
      order: index + 1,
    }));
    await PredefinedComment.insertMany(docs);
  }
};

// GET /api/predefined-comments
export const getPredefinedComments = async (req: AuthRequest, res: Response) => {
  try {
    await ensureSeeded();

    const { gender, targetRole, category, search } = req.query;
    const filter: Record<string, any> = {};

    if (gender && ["M", "F", "N"].includes(gender as string)) {
      filter.gender = { $in: [gender, "N"] };
    }

    if (targetRole && ["teacher", "principal"].includes(targetRole as string)) {
      filter.targetRole = { $in: [targetRole, "both"] };
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { en: { $regex: q, $options: "i" } },
        { ar: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } },
      ];
    }

    const comments = await PredefinedComment.find(filter).sort({ order: 1, createdAt: 1 });
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/predefined-comments (Super Admin only)
export const createPredefinedComment = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Admin can create predefined comments" });
    }

    const { en, ar, gender = "N", category = "commendable", targetRole = "both" } = req.body;

    if (!en?.trim() || !ar?.trim()) {
      return res.status(400).json({ message: "Both English and Arabic texts are required" });
    }

    const highest = await PredefinedComment.findOne().sort({ order: -1 });
    const nextOrder = (highest?.order || 0) + 1;
    const code = `c_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;

    const newComment = await PredefinedComment.create({
      code,
      en: en.trim(),
      ar: ar.trim(),
      gender,
      category,
      targetRole,
      isDefault: false,
      order: nextOrder,
    });

    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PUT /api/predefined-comments/:id (Super Admin only)
export const updatePredefinedComment = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Admin can edit predefined comments" });
    }

    const { id } = req.params;
    const { en, ar, gender, category, targetRole, order } = req.body;

    const existing = await PredefinedComment.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (en !== undefined) existing.en = en.trim();
    if (ar !== undefined) existing.ar = ar.trim();
    if (gender !== undefined) existing.gender = gender;
    if (category !== undefined) existing.category = category;
    if (targetRole !== undefined) existing.targetRole = targetRole;
    if (order !== undefined) existing.order = Number(order);

    await existing.save();
    res.status(200).json(existing);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// DELETE /api/predefined-comments/:id (Super Admin only)
export const deletePredefinedComment = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Admin can delete predefined comments" });
    }

    const { id } = req.params;
    const deleted = await PredefinedComment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json({ message: "Comment deleted successfully", comment: deleted });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/predefined-comments/reset (Super Admin only) - Resets bank to standard 36 defaults
export const resetPredefinedComments = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Admin can reset predefined comments" });
    }

    await PredefinedComment.deleteMany({});
    const docs = REPORT_CARD_COMMENTS.map((c, index) => ({
      code: c.id,
      en: c.en,
      ar: c.ar,
      gender: c.gender,
      category: c.category || "commendable",
      targetRole: c.targetRole || "both",
      isDefault: true,
      order: index + 1,
    }));
    await PredefinedComment.insertMany(docs);

    const comments = await PredefinedComment.find().sort({ order: 1 });
    res.status(200).json({ message: "Comments successfully reset to standard bank", comments });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

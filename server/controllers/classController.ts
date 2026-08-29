import { Response } from "express";
import ClassModel from "../models/Class";
import { AuthRequest } from "../middleware/auth";
import User from "../models/User";

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
    const updated = await ClassModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
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
    const deleted = await ClassModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Class not found" });
    res.status(200).json({ message: "Class deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

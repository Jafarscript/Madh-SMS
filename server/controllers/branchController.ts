import { Response } from "express";
import Branch from "../models/Branch";
import { AuthRequest } from "../middleware/auth";

export const createBranch = async (req: AuthRequest, res: Response) => {
  try {
    const { name, address } = req.body;
    const branch = await Branch.create({ name, address });
    res.status(201).json(branch);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getBranches = async (_req: AuthRequest, res: Response) => {
  try {
    const branches = await Branch.find().sort({ name: 1 });
    res.status(200).json(branches);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateBranch = async (req: AuthRequest, res: Response) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.status(200).json(branch);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const deleteBranch = async (req: AuthRequest, res: Response) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.status(200).json({ message: "Branch deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
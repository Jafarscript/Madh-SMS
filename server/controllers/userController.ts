import { Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

const generatePassword = (): string => {
  // excludes visually ambiguous characters (0/O, 1/l/I) since this
  // password gets read aloud or typed by hand when handed to a teacher
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// GET /api/users?role=<optional>
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, string> = {};
    if (req.query.role) filter.role = req.query.role as string;

    if (req.user?.role === "branch_admin" && req.user.branch) {
      filter.branch = req.user.branch;
    } else if (req.query.branch) {
      filter.branch = req.query.branch as string;
    }

    const users = await User.find(filter)
      .select("-password")
      .populate("branch", "name")
      .populate({
        path: "classes",
        select: "name arm branch",
        populate: { path: "branch", select: "name" },
      })
      .populate({
        path: "subjects",
        select: "nameEnglish nameArabic class",
        populate: {
          path: "class",
          select: "name arm branch",
          populate: { path: "branch", select: "name" },
        },
      })
      .populate("linkedStudent", "name")
      .sort({ name: 1 });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PUT /api/users/:id
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role, branch, classes, subjects, linkedStudent } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If changing email, check for uniqueness
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email already in use by another user" });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (role) user.role = role;
    user.branch = branch || undefined;
    user.classes = classes || [];
    user.subjects = subjects || [];
    user.linkedStudent = linkedStudent || undefined;

    await user.save();

    const updated = await User.findById(user._id)
      .select("-password")
      .populate("branch", "name")
      .populate("classes", "name arm branch")
      .populate("subjects", "nameEnglish nameArabic class")
      .populate("linkedStudent", "name");

    res.status(200).json({ message: "User updated successfully", user: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PUT /api/users/:id/reset-password
// Generates a brand new password since the old one can never be
// recovered — it's hashed in the database, not stored in reversible form.
// Returns the new plain-text password ONCE, same pattern as account
// creation, so the admin can copy/share it immediately.
export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newPassword = generatePassword();
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password reset", newPassword });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
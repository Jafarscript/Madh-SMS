import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { UserRole } from "../models/User";
import { AuthRequest } from "../middleware/auth";

const generateToken = (id: string, role: string, branch?: string) => {
  return jwt.sign({ id, role, branch }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, branch, classes, subjects, linkedStudent } = req.body;

    const allowedRoles: UserRole[] = [
      "super_admin",
      "branch_admin",
      "class_teacher",
      "subject_teacher",
      "parent",
    ];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      branch,
      classes,
      subjects,
      linkedStudent,
    });

    const token = generateToken(user._id.toString(), user.role, user.branch?.toString());

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id.toString(), user.role, user.branch?.toString());

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id)
      .select("-password")
      .populate({
        path: "subjects",
        populate: {
          path: "class",
          select: "name arm branch",
          populate: { path: "branch", select: "name" },
        },
      })
      .populate({
        path: "classes",
        select: "name arm branch",
        populate: { path: "branch", select: "name" },
      })
      .populate("branch");
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User, { UserRole } from "../models/User";
import Student from "../models/Student";
import ReportCardSetting from "../models/ReportCardSetting";
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

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      branch,
      classes,
      subjects,
      linkedStudent,
      linkedStudents: linkedStudent ? [linkedStudent] : [],
      status: "active",
    });

    const token = generateToken(user._id.toString(), user.role, user.branch?.toString());

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/auth/register-teacher
// Self-service registration for teachers with school passcode and admin approval queue
export const registerTeacher = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role, branch, staffCode } = req.body;

    if (!name || !email || !password || !role || !staffCode) {
      return res.status(400).json({ message: "Please fill in all required fields including the staff passcode" });
    }

    if (!["class_teacher", "subject_teacher"].includes(role)) {
      return res.status(400).json({ message: "Invalid teacher role requested" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Verify staff secret passcode
    const settings = await ReportCardSetting.findOne();
    const validStaffCode = settings?.staffRegistrationCode?.trim() || "STAFF-2026";

    if (staffCode.trim().toUpperCase() !== validStaffCode.toUpperCase()) {
      return res.status(400).json({
        message: "Invalid Staff Registration Code. Please request the official staff passcode from your school administrator.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "An account with this email address already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeacher = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim(),
      password: hashedPassword,
      role,
      branch: branch || undefined,
      status: "pending_approval",
      mustChangePassword: false,
      staffCodeUsed: staffCode.trim(),
    });

    res.status(201).json({
      message: "Registration submitted successfully! Your account is pending administrator approval before you can log in.",
      status: "pending_approval",
      teacherId: newTeacher._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/auth/lookup-student
// Helper to verify student details prior to parent registration or sibling linking
export const lookupStudent = async (req: Request, res: Response) => {
  try {
    const { identifier, classId } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: "Please provide student Admission Number, Student ID, or Name" });
    }

    const query = identifier.trim();
    let student = null;

    // Check if query is a valid Mongo ObjectId
    if (mongoose.Types.ObjectId.isValid(query)) {
      student = await Student.findById(query)
        .populate("class", "name arm")
        .populate("branch", "name");
    }

    // Check by admissionNumber or studentCode
    if (!student) {
      student = await Student.findOne({
        $or: [
          { admissionNumber: { $regex: `^${query}$`, $options: "i" } },
          { studentCode: { $regex: `^${query}$`, $options: "i" } },
        ],
      })
        .populate("class", "name arm")
        .populate("branch", "name");
    }

    // Check by name and optional class
    if (!student) {
      const nameFilter: any = {
        name: { $regex: query, $options: "i" },
      };
      if (classId) nameFilter.class = classId;

      student = await Student.findOne(nameFilter)
        .populate("class", "name arm")
        .populate("branch", "name");
    }

    if (!student) {
      return res.status(404).json({
        message: "No student matching the provided Admission Number or Name was found.",
      });
    }

    res.status(200).json({
      student: {
        _id: student._id,
        name: student.name,
        gender: student.gender,
        admissionNumber: student.admissionNumber || `STU-${student.numberInClass || "N/A"}`,
        class: student.class,
        branch: student.branch,
        numberInClass: student.numberInClass,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/auth/register-parent
// Self-service registration for parents linked to their child/children
export const registerParent = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, studentId, studentIdentifier, classId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "An account with this email address already exists" });
    }

    // Resolve target child
    let linkedStudentId: string | null = studentId || null;

    if (!linkedStudentId && studentIdentifier) {
      const query = studentIdentifier.trim();
      let matchedStudent = null;

      if (mongoose.Types.ObjectId.isValid(query)) {
        matchedStudent = await Student.findById(query);
      }
      if (!matchedStudent) {
        matchedStudent = await Student.findOne({
          $or: [
            { admissionNumber: { $regex: `^${query}$`, $options: "i" } },
            { studentCode: { $regex: `^${query}$`, $options: "i" } },
          ],
        });
      }
      if (!matchedStudent) {
        const nameFilter: any = { name: { $regex: query, $options: "i" } };
        if (classId) nameFilter.class = classId;
        matchedStudent = await Student.findOne(nameFilter);
      }

      if (matchedStudent) {
        linkedStudentId = matchedStudent._id.toString();
      }
    }

    if (!linkedStudentId) {
      return res.status(400).json({
        message: "Please specify a valid student / child to link with this parent account",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const parentUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim(),
      password: hashedPassword,
      role: "parent",
      status: "active",
      mustChangePassword: false,
      linkedStudent: linkedStudentId,
      linkedStudents: [linkedStudentId],
    });

    const token = generateToken(parentUser._id.toString(), parentUser.role);

    res.status(201).json({
      token,
      user: {
        id: parentUser._id,
        name: parentUser.name,
        email: parentUser.email,
        phone: parentUser.phone,
        role: parentUser.role,
        status: parentUser.status,
        linkedStudent: parentUser.linkedStudent,
        linkedStudents: parentUser.linkedStudents,
        mustChangePassword: false,
      },
      message: "Parent account created and linked successfully!",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = (email || "").toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Case-insensitive regex fallback in case of legacy casing or whitespace
      user = await User.findOne({
        email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check account approval status
    if (user.status === "pending_approval") {
      return res.status(403).json({
        message: "Your staff account is awaiting administrator approval. Please ask your school administrator to activate your account in the Pending Approvals tab.",
        status: "pending_approval",
      });
    }

    if (user.status === "rejected") {
      return res.status(403).json({
        message: `Your registration was declined. Reason: ${user.rejectionReason || "Please contact the administration office."}`,
        status: "rejected",
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({
        message: "This account is currently suspended. Please contact school administration.",
        status: "suspended",
      });
    }

    // Compare password (try direct and trimmed)
    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch && typeof password === "string" && password.trim() !== password) {
      isMatch = await bcrypt.compare(password.trim(), user.password);
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id.toString(), user.role, user.branch?.toString());

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
      },
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
    const cleanNew = String(newPassword).trim();
    if (cleanNew.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch && typeof currentPassword === "string" && currentPassword.trim() !== currentPassword) {
      isMatch = await bcrypt.compare(currentPassword.trim(), user.password);
    }
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(cleanNew, 10);
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
      .populate("branch")
      .populate({
        path: "linkedStudents",
        populate: [
          { path: "class", select: "name arm" },
          { path: "branch", select: "name" },
        ],
      })
      .populate({
        path: "linkedStudent",
        populate: [
          { path: "class", select: "name arm" },
          { path: "branch", select: "name" },
        ],
      });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email address is required" });
    }

    const normalizedEmail = (email || "").toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.findOne({
        email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      });
    }

    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    // Generate 6-digit numeric reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins validity
    await user.save();

    res.status(200).json({
      message: `Password reset verification code generated for ${user.name}`,
      resetCode, // Returned for instant direct use & testing
      email: user.email,
      name: user.name,
      expiresInMinutes: 15,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/auth/reset-password
export const resetPasswordWithCode = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Email, reset code, and new password are all required" });
    }

    const cleanNew = String(newPassword).trim();
    if (cleanNew.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const normalizedEmail = (email || "").toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.findOne({
        email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      });
    }

    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    if (!user.resetPasswordCode || user.resetPasswordCode !== String(code).trim()) {
      return res.status(400).json({ message: "Invalid or incorrect reset code" });
    }

    if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ message: "Reset code has expired. Please request a new code." });
    }

    user.password = await bcrypt.hash(cleanNew, 10);
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    user.mustChangePassword = false;
    await user.save();

    const token = generateToken(user._id.toString(), user.role, user.branch?.toString());

    res.status(200).json({
      message: "Your password has been successfully reset. You can now log in.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        status: user.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
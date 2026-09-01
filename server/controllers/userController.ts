import { Response } from "express";
import bcrypt from "bcryptjs";
import User, { UserRole } from "../models/User";
import Branch from "../models/Branch";
import Class from "../models/Class";
import ReportCardSetting from "../models/ReportCardSetting";
import { AuthRequest } from "../middleware/auth";

export const generatePassword = (): string => {
  // excludes visually ambiguous characters (0/O, 1/l/I) since this
  // password gets read aloud or typed by hand when handed to a teacher
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// GET /api/users?role=<optional>&status=<optional>
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = {};
    if (req.query.role) filter.role = req.query.role as string;
    if (req.query.status) {
      filter.status = req.query.status as string;
    } else {
      // By default, list active users
      filter.status = { $ne: "pending_approval" };
    }

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
      .populate("linkedStudent", "name admissionNumber")
      .populate("linkedStudents", "name admissionNumber")
      .sort({ createdAt: -1, name: 1 });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/users/pending-teachers
// Retrieves all self-registered teachers awaiting administrator approval
export const getPendingTeachers = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = { status: "pending_approval" };

    if (req.user?.role === "branch_admin" && req.user.branch) {
      filter.branch = req.user.branch;
    }

    const pending = await User.find(filter)
      .select("-password")
      .populate("branch", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PUT /api/users/:id/approve
// Approves a pending teacher and assigns classes/subjects/branch if provided
export const approveTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { role, branch, classes, subjects } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Teacher applicant not found" });

    user.status = "active";
    user.rejectionReason = undefined;
    if (role) user.role = role;
    if (branch) user.branch = branch;
    if (Array.isArray(classes)) user.classes = classes;
    if (Array.isArray(subjects)) user.subjects = subjects;

    await user.save();

    const updated = await User.findById(user._id)
      .select("-password")
      .populate("branch", "name")
      .populate("classes", "name arm branch")
      .populate("subjects", "nameEnglish nameArabic class");

    res.status(200).json({
      message: `Teacher ${user.name} has been approved and activated successfully.`,
      user: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PUT /api/users/:id/reject
// Rejects a pending teacher with an optional reason
export const rejectTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { reason, deletePermanently } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Teacher applicant not found" });

    if (deletePermanently) {
      await User.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Teacher application deleted." });
    }

    user.status = "rejected";
    user.rejectionReason = reason || "Application declined by school administration.";
    await user.save();

    res.status(200).json({ message: "Teacher application rejected.", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/users/bulk
// Bulk creates staff/teacher accounts from CSV/Excel data and returns generated credential slips
export const bulkCreateStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { staffList, defaultBranch } = req.body;

    if (!Array.isArray(staffList) || staffList.length === 0) {
      return res.status(400).json({ message: "staffList array is required" });
    }

    const allBranches = await Branch.find();
    const branchMapByName: Record<string, string> = {};
    allBranches.forEach((b) => {
      branchMapByName[b.name.toLowerCase().trim()] = b._id.toString();
    });

    const results: {
      success: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        branchName: string;
        initialPassword: string;
      }>;
      errors: Array<{ row: number; name?: string; email?: string; error: string }>;
    } = {
      success: [],
      errors: [],
    };

    for (let i = 0; i < staffList.length; i++) {
      const item = staffList[i];
      const rowNum = i + 1;

      const name = (item.name || item.Name || item.fullName || "").trim();
      const rawEmail = (item.email || item.Email || "").trim();
      const roleRaw = (item.role || item.Role || "class_teacher").trim().toLowerCase();
      const branchRaw = (item.branch || item.Branch || "").trim();
      const phone = (item.phone || item.Phone || "").trim();
      const customPassword = (item.password || item.Password || "").trim();

      if (!name) {
        results.errors.push({ row: rowNum, error: "Staff Name is missing" });
        continue;
      }

      // If email is missing or empty, generate a standardized email e.g. firstname.lastname@school.local
      let email = rawEmail.toLowerCase();
      if (!email) {
        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const rand = Math.floor(100 + Math.random() * 900);
        email = `${cleanName || "staff"}${rand}@iais.edu.ng`;
      }

      // Check if email is already taken
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        results.errors.push({ row: rowNum, name, email, error: `Email ${email} is already registered` });
        continue;
      }

      // Determine valid role
      let role: UserRole = "class_teacher";
      if (roleRaw.includes("subject") || roleRaw === "subject_teacher") {
        role = "subject_teacher";
      } else if (roleRaw.includes("branch") || roleRaw === "branch_admin") {
        role = "branch_admin";
      } else if (roleRaw.includes("super") || roleRaw === "super_admin") {
        role = "super_admin";
      }

      // Determine branch
      let branchId = defaultBranch || undefined;
      if (branchRaw) {
        const matched = branchMapByName[branchRaw.toLowerCase()];
        if (matched) branchId = matched;
      }

      const rawPassword = customPassword || generatePassword();
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const newUser = await User.create({
        name,
        email,
        phone: phone || undefined,
        password: hashedPassword,
        role,
        branch: branchId,
        status: "active",
        mustChangePassword: true,
      });

      const branchObj = allBranches.find((b) => b._id.toString() === branchId?.toString());

      results.success.push({
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        branchName: branchObj ? branchObj.name : "All Campuses",
        initialPassword: rawPassword,
      });
    }

    res.status(201).json({
      message: `Successfully created ${results.success.length} staff account(s).`,
      results,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/users/staff-code
// Retrieves the current Staff Registration Secret Code
export const getStaffCode = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await ReportCardSetting.findOne();
    if (!settings) {
      settings = await ReportCardSetting.create({});
    }
    res.status(200).json({
      staffRegistrationCode: settings.staffRegistrationCode || "STAFF-2026",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PUT /api/users/staff-code
// Updates the school-wide Staff Registration Secret Code
export const updateStaffCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Staff registration code cannot be empty" });
    }

    let settings = await ReportCardSetting.findOne();
    if (!settings) {
      settings = await ReportCardSetting.create({ staffRegistrationCode: code.trim() });
    } else {
      settings.staffRegistrationCode = code.trim();
      await settings.save();
    }

    res.status(200).json({
      message: "Staff registration passcode updated successfully",
      staffRegistrationCode: settings.staffRegistrationCode,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PUT /api/users/:id
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, role, status, branch, classes, subjects, linkedStudent, linkedStudents, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If changing email, check for uniqueness
    if (email && email.toLowerCase().trim() !== user.email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ message: "Email already in use by another user" });
      }
      user.email = normalizedEmail;
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;
    user.branch = branch || undefined;
    user.classes = classes || [];
    user.subjects = subjects || [];
    user.linkedStudent = linkedStudent || undefined;
    if (Array.isArray(linkedStudents)) {
      user.linkedStudents = linkedStudents;
    }

    // Optional direct password change by admin
    if (password && typeof password === "string" && password.trim().length >= 6) {
      user.password = await bcrypt.hash(password.trim(), 10);
      user.mustChangePassword = false;
    }

    await user.save();

    const updated = await User.findById(user._id)
      .select("-password")
      .populate("branch", "name")
      .populate("classes", "name arm branch")
      .populate("subjects", "nameEnglish nameArabic class")
      .populate("linkedStudent", "name admissionNumber")
      .populate("linkedStudents", "name admissionNumber");

    res.status(200).json({ message: "User updated successfully", user: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PUT /api/users/:id/reset-password
export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { newPassword: customPassword } = req.body || {};
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newPassword = (typeof customPassword === "string" && customPassword.trim().length >= 6)
      ? customPassword.trim()
      : generatePassword();

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({
      message: `Password for ${user.name} has been updated successfully`,
      newPassword,
    });
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
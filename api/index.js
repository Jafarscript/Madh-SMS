// server/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// server/config/db.ts
import mongoose10 from "mongoose";

// server/seed.ts
import bcrypt from "bcryptjs";

// server/models/User.ts
import mongoose, { Schema } from "mongoose";
var UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["super_admin", "branch_admin", "class_teacher", "subject_teacher", "parent"],
    required: true
  },
  branch: { type: Schema.Types.ObjectId, ref: "Branch" },
  classes: [{ type: Schema.Types.ObjectId, ref: "Class" }],
  subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
  linkedStudent: { type: Schema.Types.ObjectId, ref: "Student" },
  mustChangePassword: { type: Boolean, default: true }
});
var User_default = mongoose.model("User", UserSchema);

// server/models/Branch.ts
import mongoose2, { Schema as Schema2 } from "mongoose";
var BranchSchema = new Schema2({
  name: { type: String, required: true, unique: true },
  address: { type: String },
  createdAt: { type: Date, default: Date.now }
});
var Branch_default = mongoose2.model("Branch", BranchSchema);

// server/models/Class.ts
import mongoose3, { Schema as Schema3 } from "mongoose";
var ClassSchema = new Schema3({
  name: { type: String, required: true },
  arm: { type: String },
  // optional on purpose
  branch: { type: Schema3.Types.ObjectId, ref: "Branch", required: true },
  createdAt: { type: Date, default: Date.now }
});
var Class_default = mongoose3.model("Class", ClassSchema);

// server/models/Subject.ts
import mongoose4, { Schema as Schema4 } from "mongoose";
var SubjectSchema = new Schema4({
  nameEnglish: { type: String, required: true },
  nameArabic: { type: String },
  class: { type: Schema4.Types.ObjectId, ref: "Class", required: true }
});
var Subject_default = mongoose4.model("Subject", SubjectSchema);

// server/models/GradingScale.ts
import mongoose5, { Schema as Schema5 } from "mongoose";
var GradeBandSchema = new Schema5(
  {
    minScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    grade: { type: String, required: true },
    remark: { type: String, required: true },
    remarkArabic: { type: String, required: true }
  },
  { _id: false }
);
var GradingScaleSchema = new Schema5({
  name: { type: String, required: true },
  bands: [GradeBandSchema]
});
var GradingScale_default = mongoose5.model("GradingScale", GradingScaleSchema);

// server/models/Term.ts
import mongoose6, { Schema as Schema6 } from "mongoose";
var TermSchema = new Schema6({
  session: { type: String, required: true },
  termNumber: { type: Number, enum: [1, 2, 3], required: true },
  isActive: { type: Boolean, default: false }
});
var Term_default = mongoose6.model("Term", TermSchema);

// server/models/Student.ts
import mongoose7, { Schema as Schema7 } from "mongoose";
var StudentSchema = new Schema7({
  name: { type: String, required: true },
  gender: { type: String, enum: ["M", "F"], required: true },
  class: { type: Schema7.Types.ObjectId, ref: "Class", required: true },
  branch: { type: Schema7.Types.ObjectId, ref: "Branch", required: true },
  numberInClass: { type: Number }
});
var Student_default = mongoose7.model("Student", StudentSchema);

// server/models/Score.ts
import mongoose8, { Schema as Schema8 } from "mongoose";
var ScoreSchema = new Schema8({
  student: { type: Schema8.Types.ObjectId, ref: "Student", required: true },
  subject: { type: Schema8.Types.ObjectId, ref: "Subject", required: true },
  term: { type: Schema8.Types.ObjectId, ref: "Term", required: true },
  ca: { type: Number, required: true, min: 0, max: 40 },
  exam: { type: Number, required: true, min: 0, max: 60 },
  total: { type: Number, required: true, min: 0, max: 100 },
  enteredBy: { type: Schema8.Types.ObjectId, ref: "User", required: true }
});
ScoreSchema.index({ student: 1, subject: 1, term: 1 }, { unique: true });
var Score_default = mongoose8.model("Score", ScoreSchema);

// server/models/ReportCardRemark.ts
import mongoose9, { Schema as Schema9 } from "mongoose";
var ReportCardRemarkSchema = new Schema9({
  student: { type: Schema9.Types.ObjectId, ref: "Student", required: true },
  term: { type: Schema9.Types.ObjectId, ref: "Term", required: true },
  classTeacherCommentId: { type: String },
  classTeacherCommentEn: { type: String },
  classTeacherCommentAr: { type: String },
  principalCommentId: { type: String },
  principalCommentEn: { type: String },
  principalCommentAr: { type: String },
  enteredBy: { type: Schema9.Types.ObjectId, ref: "User" }
});
ReportCardRemarkSchema.index({ student: 1, term: 1 }, { unique: true });
var ReportCardRemark_default = mongoose9.model("ReportCardRemark", ReportCardRemarkSchema);

// server/seed.ts
var seedDatabase = async () => {
  try {
    const defaultHashedPassword = await bcrypt.hash("password123", 10);
    const userCount = await User_default.countDocuments();
    if (userCount > 0) {
      console.log("Database already has data. Ensuring demo passwords are valid...");
      await User_default.updateMany(
        {},
        { $set: { password: defaultHashedPassword, mustChangePassword: false } }
      );
      return;
    }
    console.log("Seeding database with initial data...");
    const mainBranch = await Branch_default.create({
      name: "Main Campus (Central)",
      address: "123 Islamic Academy Blvd, Knowledge District"
    });
    const northBranch = await Branch_default.create({
      name: "North Branch",
      address: "45 Al-Hikmah Way, North City"
    });
    const grade1A = await Class_default.create({
      name: "Grade 1",
      arm: "A",
      branch: mainBranch._id
    });
    const grade1B = await Class_default.create({
      name: "Grade 1",
      arm: "B",
      branch: mainBranch._id
    });
    const grade2A = await Class_default.create({
      name: "Grade 2",
      arm: "A",
      branch: mainBranch._id
    });
    const grade3A = await Class_default.create({
      name: "Grade 3",
      arm: "A",
      branch: mainBranch._id
    });
    const quran = await Subject_default.create({
      nameEnglish: "Quran & Tajweed",
      nameArabic: "\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0648\u0627\u0644\u062A\u062C\u0648\u064A\u062F",
      class: grade1A._id
    });
    const hadith = await Subject_default.create({
      nameEnglish: "Hadith Studies",
      nameArabic: "\u0627\u0644\u062D\u062F\u064A\u062B \u0627\u0644\u0634\u0631\u064A\u0641",
      class: grade1A._id
    });
    const islamicStudies = await Subject_default.create({
      nameEnglish: "Islamic Studies (Fiqh)",
      nameArabic: "\u0627\u0644\u0641\u0642\u0647 \u0648\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629",
      class: grade1A._id
    });
    const arabicLang = await Subject_default.create({
      nameEnglish: "Arabic Language",
      nameArabic: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      class: grade1A._id
    });
    const englishLang = await Subject_default.create({
      nameEnglish: "English Language",
      nameArabic: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629",
      class: grade1A._id
    });
    const mathematics = await Subject_default.create({
      nameEnglish: "Mathematics",
      nameArabic: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A",
      class: grade1A._id
    });
    const basicScience = await Subject_default.create({
      nameEnglish: "Basic Science",
      nameArabic: "\u0627\u0644\u0639\u0644\u0648\u0645 \u0627\u0644\u0639\u0627\u0645\u0629",
      class: grade1A._id
    });
    await Subject_default.create({
      nameEnglish: "Quran & Tajweed",
      nameArabic: "\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0648\u0627\u0644\u062A\u062C\u0648\u064A\u062F",
      class: grade1B._id
    });
    await Subject_default.create({
      nameEnglish: "Arabic Language",
      nameArabic: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      class: grade1B._id
    });
    await Subject_default.create({
      nameEnglish: "Quran & Tajweed",
      nameArabic: "\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0648\u0627\u0644\u062A\u062C\u0648\u064A\u062F",
      class: grade2A._id
    });
    const gradingScale = await GradingScale_default.create({
      name: "Standard Islamic Academy Scale",
      bands: [
        { minScore: 70, maxScore: 100, grade: "A1", remark: "Excellent Distinction", remarkArabic: "\u0645\u0645\u062A\u0627\u0632 \u0645\u0639 \u0645\u0631\u062A\u0628\u0629 \u0627\u0644\u0634\u0631\u0641" },
        { minScore: 60, maxScore: 69, grade: "B2", remark: "Very Good", remarkArabic: "\u062C\u064A\u062F \u062C\u062F\u0627\u064B" },
        { minScore: 50, maxScore: 59, grade: "C3", remark: "Good / Credit", remarkArabic: "\u062C\u064A\u062F" },
        { minScore: 40, maxScore: 49, grade: "D4", remark: "Pass", remarkArabic: "\u0645\u0642\u0628\u0648\u0644" },
        { minScore: 0, maxScore: 39, grade: "F9", remark: "Fail", remarkArabic: "\u0631\u0627\u0633\u0628" }
      ]
    });
    const term1 = await Term_default.create({
      session: "2025/2026",
      termNumber: 1,
      isActive: false
    });
    const term2 = await Term_default.create({
      session: "2025/2026",
      termNumber: 2,
      isActive: true
    });
    const term3 = await Term_default.create({
      session: "2025/2026",
      termNumber: 3,
      isActive: false
    });
    const student1 = await Student_default.create({
      name: "Amina Ibrahim",
      gender: "F",
      class: grade1A._id,
      branch: mainBranch._id,
      numberInClass: 1
    });
    const student2 = await Student_default.create({
      name: "Zaid Al-Mansoor",
      gender: "M",
      class: grade1A._id,
      branch: mainBranch._id,
      numberInClass: 2
    });
    const student3 = await Student_default.create({
      name: "Fatima Yusuf",
      gender: "F",
      class: grade1A._id,
      branch: mainBranch._id,
      numberInClass: 3
    });
    const student4 = await Student_default.create({
      name: "Bilal Hassan",
      gender: "M",
      class: grade1A._id,
      branch: mainBranch._id,
      numberInClass: 4
    });
    const student5 = await Student_default.create({
      name: "Maryam Siddiq",
      gender: "F",
      class: grade1A._id,
      branch: mainBranch._id,
      numberInClass: 5
    });
    await User_default.create({
      name: "Super Administrator",
      email: "admin@school.com",
      password: defaultHashedPassword,
      role: "super_admin",
      mustChangePassword: false
    });
    await User_default.create({
      name: "Branch Director (Main)",
      email: "branchadmin@school.com",
      password: defaultHashedPassword,
      role: "branch_admin",
      branch: mainBranch._id,
      mustChangePassword: false
    });
    const classTeacher = await User_default.create({
      name: "Ustadh Umar Farooq (Class Teacher 1A)",
      email: "classteacher@school.com",
      password: defaultHashedPassword,
      role: "class_teacher",
      branch: mainBranch._id,
      classes: [grade1A._id],
      mustChangePassword: false
    });
    const subjectTeacher = await User_default.create({
      name: "Ustadha Aisha Rahman (Arabic & Quran Teacher)",
      email: "subjectteacher@school.com",
      password: defaultHashedPassword,
      role: "subject_teacher",
      branch: mainBranch._id,
      classes: [grade1A._id, grade1B._id],
      subjects: [quran._id, arabicLang._id, hadith._id],
      mustChangePassword: false
    });
    await User_default.create({
      name: "Dr. Ibrahim Parent (Father of Amina)",
      email: "parent@school.com",
      password: defaultHashedPassword,
      role: "parent",
      linkedStudent: student1._id,
      mustChangePassword: false
    });
    const subjectsGrade1A = [quran, hadith, islamicStudies, arabicLang, englishLang, mathematics, basicScience];
    const studentsGrade1A = [student1, student2, student3, student4, student5];
    for (const student of studentsGrade1A) {
      for (const subject of subjectsGrade1A) {
        const ca = Math.floor(Math.random() * 8) + 32;
        const exam = Math.floor(Math.random() * 18) + 40;
        await Score_default.create({
          student: student._id,
          subject: subject._id,
          term: term1._id,
          ca,
          exam,
          total: ca + exam,
          enteredBy: subjectTeacher._id
        });
      }
    }
    for (const student of studentsGrade1A) {
      for (const subject of subjectsGrade1A) {
        const ca = Math.floor(Math.random() * 7) + 33;
        const exam = Math.floor(Math.random() * 16) + 42;
        await Score_default.create({
          student: student._id,
          subject: subject._id,
          term: term2._id,
          ca,
          exam,
          total: ca + exam,
          enteredBy: subjectTeacher._id
        });
      }
    }
    await ReportCardRemark_default.create({
      student: student1._id,
      term: term2._id,
      classTeacherCommentId: "1",
      classTeacherCommentEn: "An outstanding and exemplary student who demonstrates high dedication to Islamic ethics and academics.",
      classTeacherCommentAr: "\u0637\u0627\u0644\u0628\u0629 \u0645\u062A\u0645\u064A\u0632\u0629 \u0648\u062E\u0644\u0648\u0642\u0629 \u062A\u0628\u062F\u064A \u062D\u0631\u0635\u0627\u064B \u0643\u0628\u064A\u0631\u0627\u064B \u0639\u0644\u0649 \u0627\u0644\u062A\u0641\u0648\u0642 \u0648\u0627\u0644\u0623\u062E\u0644\u0627\u0642 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629.",
      principalCommentId: "1",
      principalCommentEn: "Excellent performance. Keep up the high standard and continuous progress.",
      principalCommentAr: "\u0623\u062F\u0627\u0621 \u0645\u0645\u062A\u0627\u0632 \u0648\u0645\u0628\u0627\u0631\u0643\u060C \u0646\u0631\u062C\u0648 \u0644\u0647\u0627 \u062F\u0648\u0627\u0645 \u0627\u0644\u062A\u0648\u0641\u064A\u0642 \u0648\u0627\u0644\u0646\u062C\u0627\u062D.",
      enteredBy: classTeacher._id
    });
    console.log("Database seeded successfully with demo data!");
  } catch (err) {
    console.error("Error seeding database:", err);
  }
};

// server/config/db.ts
var isConnected = false;
var connectDB = async () => {
  if (mongoose10.connection.readyState >= 1) {
    return;
  }
  try {
    const mongoUri = (process.env.MONGODB_URI || process.env.MONGO_URI)?.trim();
    if (mongoUri) {
      try {
        console.log("Connecting to MongoDB Atlas...");
        const conn = await mongoose10.connect(mongoUri, {
          serverSelectionTimeoutMS: 5e3,
          connectTimeoutMS: 5e3
        });
        console.log(`MongoDB connected successfully: ${conn.connection.host}`);
        if (!isConnected) {
          isConnected = true;
          await seedDatabase();
        }
        return;
      } catch (externalErr) {
        console.warn(
          `External MongoDB connection failed (${externalErr.message}).`
        );
        if (process.env.NODE_ENV === "production") {
          throw externalErr;
        }
      }
    }
    if (process.env.NODE_ENV !== "production") {
      console.log("Starting in-memory MongoDB server for local development...");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose10.connect(uri, {
        serverSelectionTimeoutMS: 5e3,
        connectTimeoutMS: 5e3
      });
      console.log(`In-memory MongoDB connected: ${uri}`);
      if (!isConnected) {
        isConnected = true;
        await seedDatabase();
      }
    }
  } catch (error) {
    console.error(`DB Connection Error: ${error}`);
  }
};
var db_default = connectDB;

// server/routes/authRoutes.ts
import { Router } from "express";

// server/controllers/authController.ts
import bcrypt2 from "bcryptjs";
import jwt from "jsonwebtoken";
var generateToken = (id, role, branch) => {
  return jwt.sign({ id, role, branch }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
};
var register = async (req, res) => {
  try {
    const { name, email, password, role, branch, classes, subjects, linkedStudent } = req.body;
    const allowedRoles = [
      "super_admin",
      "branch_admin",
      "class_teacher",
      "subject_teacher",
      "parent"
    ];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const existing = await User_default.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const hashedPassword = await bcrypt2.hash(password, 10);
    const user = await User_default.create({
      name,
      email,
      password: hashedPassword,
      role,
      branch,
      classes,
      subjects,
      linkedStudent
    });
    const token = generateToken(user._id.toString(), user.role, user.branch?.toString());
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User_default.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt2.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = generateToken(user._id.toString(), user.role, user.branch?.toString());
    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    const user = await User_default.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const isMatch = await bcrypt2.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    user.password = await bcrypt2.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getMe = async (req, res) => {
  try {
    const user = await User_default.findById(req.user.id).select("-password").populate("subjects").populate("classes").populate("branch");
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt2.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};
var authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
};

// server/routes/authRoutes.ts
var router = Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);
var authRoutes_default = router;

// server/routes/branchRoutes.ts
import { Router as Router2 } from "express";

// server/controllers/branchController.ts
var createBranch = async (req, res) => {
  try {
    const { name, address } = req.body;
    const branch = await Branch_default.create({ name, address });
    res.status(201).json(branch);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getBranches = async (_req, res) => {
  try {
    const branches = await Branch_default.find().sort({ name: 1 });
    res.status(200).json(branches);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var updateBranch = async (req, res) => {
  try {
    const branch = await Branch_default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.status(200).json(branch);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var deleteBranch = async (req, res) => {
  try {
    const branch = await Branch_default.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.status(200).json({ message: "Branch deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/branchRoutes.ts
var router2 = Router2();
router2.post("/", protect, authorize("super_admin"), createBranch);
router2.get("/", protect, getBranches);
router2.put("/:id", protect, authorize("super_admin"), updateBranch);
router2.delete("/:id", protect, authorize("super_admin"), deleteBranch);
var branchRoutes_default = router2;

// server/routes/classRoutes.ts
import { Router as Router3 } from "express";

// server/controllers/classController.ts
var createClass = async (req, res) => {
  try {
    const { name, arm, branch } = req.body;
    const newClass = await Class_default.create({ name, arm, branch });
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getClasses = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role === "branch_admin" && req.user.branch) {
      filter.branch = req.user.branch;
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      filter._id = { $in: (teacher?.classes || []).map((c) => c.toString()) };
    } else if (req.query.branch) {
      filter.branch = req.query.branch;
    }
    const classes = await Class_default.find(filter).populate("branch", "name").sort({ name: 1 });
    res.status(200).json(classes);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var updateClass = async (req, res) => {
  try {
    const { name, arm, branch } = req.body;
    const updateData = {};
    if (name !== void 0) updateData.name = name;
    if (branch !== void 0) updateData.branch = branch;
    const updateQuery = { $set: updateData };
    if (arm !== void 0) {
      if (typeof arm === "string" && arm.trim()) {
        updateData.arm = arm.trim();
      } else {
        updateQuery.$unset = { arm: 1 };
      }
    }
    const updated = await Class_default.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true }
    ).populate("branch", "name");
    if (!updated) return res.status(404).json({ message: "Class not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var deleteClass = async (req, res) => {
  try {
    const deleted = await Class_default.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Class not found" });
    res.status(200).json({ message: "Class deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/classRoutes.ts
var router3 = Router3();
router3.post("/", protect, authorize("super_admin", "branch_admin"), createClass);
router3.get("/", protect, getClasses);
router3.put("/:id", protect, authorize("super_admin", "branch_admin"), updateClass);
router3.delete("/:id", protect, authorize("super_admin", "branch_admin"), deleteClass);
var classRoutes_default = router3;

// server/routes/subjectRoutes.ts
import { Router as Router4 } from "express";

// server/controllers/subjectController.ts
var createSubject = async (req, res) => {
  try {
    const { nameEnglish, nameArabic, class: classId } = req.body;
    const subject = await Subject_default.create({ nameEnglish, nameArabic, class: classId });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var bulkCreateSubjects = async (req, res) => {
  try {
    const { class: classId, subjects } = req.body;
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: "subjects array is required" });
    }
    const toInsert = subjects.map((s) => ({
      nameEnglish: s.nameEnglish,
      nameArabic: s.nameArabic,
      class: classId
    }));
    const created = await Subject_default.insertMany(toInsert);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getSubjects = async (req, res) => {
  try {
    const filter = {};
    if (req.query.class) filter.class = req.query.class;
    if (req.user?.role === "subject_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const allowedSubjectIds = (teacher?.subjects || []).map((s) => s.toString());
      filter._id = { $in: allowedSubjectIds };
    }
    const subjects = await Subject_default.find(filter).sort({ nameEnglish: 1 });
    res.status(200).json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var updateSubject = async (req, res) => {
  try {
    const updated = await Subject_default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var deleteSubject = async (req, res) => {
  try {
    const deleted = await Subject_default.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/subjectRoutes.ts
var router4 = Router4();
router4.post("/", protect, authorize("super_admin", "branch_admin"), createSubject);
router4.get("/", protect, getSubjects);
router4.put("/:id", protect, authorize("super_admin", "branch_admin"), updateSubject);
router4.delete("/:id", protect, authorize("super_admin", "branch_admin"), deleteSubject);
router4.post("/bulk", protect, authorize("super_admin", "branch_admin"), bulkCreateSubjects);
var subjectRoutes_default = router4;

// server/routes/gradingScaleRoutes.ts
import { Router as Router5 } from "express";

// server/controllers/gradingScaleController.ts
var createGradingScale = async (req, res) => {
  try {
    const { name, bands } = req.body;
    const scale = await GradingScale_default.create({ name, bands });
    res.status(201).json(scale);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getGradingScales = async (_req, res) => {
  try {
    const scales = await GradingScale_default.find();
    res.status(200).json(scales);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var updateGradingScale = async (req, res) => {
  try {
    const updated = await GradingScale_default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Grading scale not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var deleteGradingScale = async (req, res) => {
  try {
    const deleted = await GradingScale_default.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Grading scale not found" });
    res.status(200).json({ message: "Grading scale deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/gradingScaleRoutes.ts
var router5 = Router5();
router5.post("/", protect, authorize("super_admin"), createGradingScale);
router5.get("/", protect, getGradingScales);
router5.put("/:id", protect, authorize("super_admin"), updateGradingScale);
router5.delete("/:id", protect, authorize("super_admin"), deleteGradingScale);
var gradingScaleRoutes_default = router5;

// server/routes/studentRoutes.ts
import { Router as Router6 } from "express";

// server/controllers/studentController.ts
var renumberClass = async (classId) => {
  const students = await Student_default.find({ class: classId });
  const collator = new Intl.Collator("ar");
  const sorted = [...students].sort((a, b) => {
    if (a.gender !== b.gender) {
      return a.gender === "M" ? -1 : 1;
    }
    return collator.compare(a.name, b.name);
  });
  await Promise.all(
    sorted.map(
      (student, index) => Student_default.findByIdAndUpdate(student._id, { numberInClass: index + 1 })
    )
  );
};
var createStudent = async (req, res) => {
  try {
    const { name, gender, class: classId, branch } = req.body;
    const student = await Student_default.create({
      name,
      gender,
      class: classId,
      branch,
      numberInClass: 0
    });
    await renumberClass(classId);
    const updated = await Student_default.findById(student._id);
    res.status(201).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var bulkCreateStudents = async (req, res) => {
  try {
    const { class: classId, branch, students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "students array is required" });
    }
    const toInsert = students.map((s) => ({
      name: s.name,
      gender: s.gender || "M",
      class: classId,
      branch,
      numberInClass: 0
      // placeholder — renumberClass fixes this right after
    }));
    const created = await Student_default.insertMany(toInsert);
    await renumberClass(classId);
    const updated = await Student_default.find({ class: classId }).sort({ numberInClass: 1 });
    res.status(201).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getStudents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.class) filter.class = req.query.class;
    if (req.user?.role === "branch_admin" && req.user.branch) {
      filter.branch = req.user.branch;
    } else if (req.query.branch) {
      filter.branch = req.query.branch;
    }
    const students = await Student_default.find(filter).populate("class", "name arm").sort({ numberInClass: 1 });
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var updateStudent = async (req, res) => {
  try {
    const updated = await Student_default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Student not found" });
    await renumberClass(updated.class.toString());
    const refreshed = await Student_default.findById(updated._id);
    res.status(200).json(refreshed);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var deleteStudent = async (req, res) => {
  try {
    const deleted = await Student_default.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Student not found" });
    await Score_default.deleteMany({ student: req.params.id });
    await renumberClass(deleted.class.toString());
    res.status(200).json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/studentRoutes.ts
var router6 = Router6();
router6.post("/", protect, authorize("super_admin", "branch_admin", "class_teacher"), createStudent);
router6.post("/bulk", protect, authorize("super_admin", "branch_admin", "class_teacher"), bulkCreateStudents);
router6.get("/", protect, getStudents);
router6.put("/:id", protect, authorize("super_admin", "branch_admin", "class_teacher"), updateStudent);
router6.delete("/:id", protect, authorize("super_admin", "branch_admin"), deleteStudent);
var studentRoutes_default = router6;

// server/routes/scoreRoutes.ts
import { Router as Router7 } from "express";

// server/models/ResultPublication.ts
import mongoose11, { Schema as Schema10 } from "mongoose";
var ResultPublicationSchema = new Schema10(
  {
    class: { type: Schema10.Types.ObjectId, ref: "Class", required: true },
    term: { type: Schema10.Types.ObjectId, ref: "Term", required: true },
    status: {
      type: String,
      enum: ["draft", "published", "locked"],
      default: "draft",
      required: true
    },
    publishedBy: { type: Schema10.Types.ObjectId, ref: "User" },
    publishedAt: { type: Date },
    lockedBy: { type: Schema10.Types.ObjectId, ref: "User" },
    lockedAt: { type: Date }
  },
  { timestamps: true }
);
ResultPublicationSchema.index({ class: 1, term: 1 }, { unique: true });
var ResultPublication_default = mongoose11.model(
  "ResultPublication",
  ResultPublicationSchema
);

// server/controllers/resultPublicationController.ts
var canManageClass = async (req, classId) => {
  if (req.user?.role === "super_admin") return true;
  const [user, classDoc] = await Promise.all([
    User_default.findById(req.user?.id),
    Class_default.findById(classId)
  ]);
  if (!user || !classDoc) return false;
  return req.user?.role === "branch_admin" && !!user.branch && user.branch.toString() === classDoc.branch.toString();
};
var getResultPublication = async (req, res) => {
  try {
    const { class: classId, term } = req.query;
    if (!term) {
      return res.status(400).json({ message: "term is required" });
    }
    if (classId) {
      const publication = await ResultPublication_default.findOne({
        class: classId,
        term
      }).populate("publishedBy", "name email").populate("lockedBy", "name email");
      return res.status(200).json(publication || { class: classId, term, status: "draft" });
    }
    let classFilter = {};
    if (req.user?.role === "branch_admin") {
      const user = await User_default.findById(req.user.id);
      if (user?.branch) {
        const branchClasses = await Class_default.find({ branch: user.branch }).select("_id");
        classFilter = { _id: { $in: branchClasses.map((c) => c._id) } };
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      classFilter = { _id: { $in: teacher?.classes || [] } };
    }
    const classes = await Class_default.find(classFilter).select("_id name arm branch");
    const classIds = classes.map((c) => c._id);
    const publications = await ResultPublication_default.find({
      class: { $in: classIds },
      term
    }).populate("publishedBy", "name email").populate("lockedBy", "name email");
    const pubMap = /* @__PURE__ */ new Map();
    publications.forEach((p) => pubMap.set(p.class.toString(), p));
    const result = classes.map((c) => {
      const pub = pubMap.get(c._id.toString());
      return pub || {
        class: c._id,
        term,
        status: "draft"
      };
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getResultOverview = async (req, res) => {
  try {
    const { term, branch } = req.query;
    if (!term) {
      return res.status(400).json({ message: "term is required" });
    }
    let classFilter = {};
    if (req.user?.role === "branch_admin") {
      const user = await User_default.findById(req.user.id);
      if (user?.branch) {
        classFilter.branch = user.branch;
      }
    } else if (branch) {
      classFilter.branch = branch;
    }
    const classes = await Class_default.find(classFilter).populate("branch", "name code").sort({ name: 1, arm: 1 });
    const classIds = classes.map((c) => c._id);
    const [publications, allStudents, allSubjects, allScores, allRemarks] = await Promise.all([
      ResultPublication_default.find({ class: { $in: classIds }, term }).populate("publishedBy", "name email").populate("lockedBy", "name email"),
      Student_default.find({ class: { $in: classIds } }).select("_id name numberInClass class"),
      Subject_default.find({ class: { $in: classIds } }).select("_id nameEnglish class"),
      Score_default.find({ term }).select("student subject ca exam total"),
      ReportCardRemark_default.find({ term }).select(
        "student classTeacherCommentEn classTeacherCommentId principalCommentEn principalCommentId"
      )
    ]);
    const pubMap = /* @__PURE__ */ new Map();
    publications.forEach((p) => pubMap.set(p.class.toString(), p));
    const scoresByStudent = /* @__PURE__ */ new Set();
    allScores.forEach((sc) => {
      scoresByStudent.add(`${sc.student.toString()}-${sc.subject.toString()}`);
    });
    const remarksByStudent = /* @__PURE__ */ new Map();
    allRemarks.forEach((rm) => {
      remarksByStudent.set(rm.student.toString(), rm);
    });
    const classOverviews = classes.map((cls) => {
      const cid = cls._id.toString();
      const studentsInClass = allStudents.filter((s) => s.class.toString() === cid);
      const subjectsInClass = allSubjects.filter((s) => s.class.toString() === cid);
      const pub = pubMap.get(cid);
      const totalStudents2 = studentsInClass.length;
      const totalSubjects = subjectsInClass.length;
      const expectedScores = totalStudents2 * totalSubjects;
      let enteredScores = 0;
      let studentsWithMissingScores = 0;
      let classTeacherRemarksCount = 0;
      let principalRemarksCount = 0;
      studentsInClass.forEach((st) => {
        const sid = st._id.toString();
        let studentScoresCount = 0;
        subjectsInClass.forEach((sb) => {
          if (scoresByStudent.has(`${sid}-${sb._id.toString()}`)) {
            studentScoresCount++;
          }
        });
        enteredScores += studentScoresCount;
        if (studentScoresCount < totalSubjects) {
          studentsWithMissingScores++;
        }
        const rm = remarksByStudent.get(sid);
        if (rm) {
          if (rm.classTeacherCommentEn || rm.classTeacherCommentId) {
            classTeacherRemarksCount++;
          }
          if (rm.principalCommentEn || rm.principalCommentId) {
            principalRemarksCount++;
          }
        }
      });
      const scoreCompletionRate = expectedScores > 0 ? Math.round(enteredScores / expectedScores * 100) : 100;
      const isReadyToPublish = totalStudents2 > 0 && totalSubjects > 0 && enteredScores >= expectedScores && classTeacherRemarksCount >= totalStudents2;
      const missingScoresCount = Math.max(0, expectedScores - enteredScores);
      const remarksPercent = totalStudents2 > 0 ? Math.round(classTeacherRemarksCount / totalStudents2 * 100) : 100;
      const missingTeacherRemarksCount = Math.max(0, totalStudents2 - classTeacherRemarksCount);
      const missingPrincipalRemarksCount = Math.max(0, totalStudents2 - principalRemarksCount);
      return {
        classId: cls._id,
        className: cls.name,
        arm: cls.arm,
        branch: cls.branch,
        branchName: cls.branch?.name || "",
        totalStudents: totalStudents2,
        studentCount: totalStudents2,
        totalSubjects,
        subjectCount: totalSubjects,
        expectedScores,
        enteredScores,
        scoreCompletionRate,
        scoresPercent: scoreCompletionRate,
        missingScoresCount,
        studentsWithMissingScores,
        classTeacherRemarksCount,
        principalRemarksCount,
        remarksPercent,
        missingTeacherRemarksCount,
        missingPrincipalRemarksCount,
        isReadyToPublish,
        isFullyReady: isReadyToPublish,
        status: pub?.status || "draft",
        publishedBy: pub?.publishedBy || null,
        publishedAt: pub?.publishedAt || null,
        lockedBy: pub?.lockedBy || null,
        lockedAt: pub?.lockedAt || null
      };
    });
    const totalClasses = classOverviews.length;
    const publishedCount = classOverviews.filter((c) => c.status === "published").length;
    const lockedCount = classOverviews.filter((c) => c.status === "locked").length;
    const draftCount = classOverviews.filter((c) => c.status === "draft").length;
    const readyCount = classOverviews.filter(
      (c) => c.status === "draft" && c.isReadyToPublish
    ).length;
    const totalStudents = classOverviews.reduce((sum, c) => sum + c.totalStudents, 0);
    const totalExpectedScores = classOverviews.reduce((sum, c) => sum + c.expectedScores, 0);
    const totalEnteredScores = classOverviews.reduce((sum, c) => sum + c.enteredScores, 0);
    const overallScoreRate = totalExpectedScores > 0 ? Math.round(totalEnteredScores / totalExpectedScores * 100) : 100;
    res.status(200).json({
      summary: {
        totalClasses,
        publishedCount,
        lockedCount,
        draftCount,
        readyCount,
        totalStudents,
        overallScoreRate
      },
      classes: classOverviews
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getClassAuditDetails = async (req, res) => {
  try {
    const { class: classId, term } = req.query;
    if (!classId || !term) {
      return res.status(400).json({ message: "class and term are required" });
    }
    const [classDoc, students, subjects, scores, remarks, publication] = await Promise.all([
      Class_default.findById(classId).populate("branch", "name code"),
      Student_default.find({ class: classId }).sort({ numberInClass: 1, name: 1 }),
      Subject_default.find({ class: classId }).sort({ nameEnglish: 1 }),
      Score_default.find({ term }),
      ReportCardRemark_default.find({ term }),
      ResultPublication_default.findOne({ class: classId, term }).populate("publishedBy", "name email").populate("lockedBy", "name email")
    ]);
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }
    const scoreMap = /* @__PURE__ */ new Map();
    scores.forEach((sc) => {
      scoreMap.set(`${sc.student.toString()}-${sc.subject.toString()}`, true);
    });
    const remarkMap = /* @__PURE__ */ new Map();
    remarks.forEach((rm) => {
      remarkMap.set(rm.student.toString(), rm);
    });
    const studentAudits = students.map((st) => {
      const sid = st._id.toString();
      const missingSubjects = subjects.filter(
        (sb) => !scoreMap.has(`${sid}-${sb._id.toString()}`)
      );
      const remark = remarkMap.get(sid);
      const hasClassTeacherRemark = !!(remark?.classTeacherCommentEn || remark?.classTeacherCommentId);
      const hasPrincipalRemark = !!(remark?.principalCommentEn || remark?.principalCommentId);
      return {
        studentId: st._id,
        name: st.name,
        numberInClass: st.numberInClass,
        missingSubjects: missingSubjects.map((s) => ({
          _id: s._id,
          nameEnglish: s.nameEnglish
        })),
        missingScoreCount: missingSubjects.length,
        isComplete: missingSubjects.length === 0,
        hasClassTeacherRemark,
        hasPrincipalRemark
      };
    });
    res.status(200).json({
      class: {
        _id: classDoc._id,
        name: classDoc.name,
        arm: classDoc.arm,
        branch: classDoc.branch
      },
      publication: publication || { class: classId, term, status: "draft" },
      totalStudents: students.length,
      totalSubjects: subjects.length,
      students: studentAudits
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var setResultPublication = async (req, res) => {
  try {
    const { class: classId, term, status } = req.body;
    if (!classId || !term || !["draft", "published", "locked"].includes(status || "")) {
      return res.status(400).json({ message: "class, term, and a valid status are required" });
    }
    if (!await canManageClass(req, classId)) {
      return res.status(403).json({ message: "You cannot manage results for this class" });
    }
    const now = /* @__PURE__ */ new Date();
    const update = { status };
    if (status === "published") {
      update.publishedBy = req.user.id;
      update.publishedAt = now;
      update.lockedBy = null;
      update.lockedAt = null;
    } else if (status === "locked") {
      update.lockedBy = req.user.id;
      update.lockedAt = now;
    } else {
      update.publishedBy = null;
      update.publishedAt = null;
      update.lockedBy = null;
      update.lockedAt = null;
    }
    const publication = await ResultPublication_default.findOneAndUpdate(
      { class: classId, term },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("publishedBy", "name email").populate("lockedBy", "name email");
    res.status(200).json(publication);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var batchSetResultPublication = async (req, res) => {
  try {
    const { classIds, term, status } = req.body;
    if (!Array.isArray(classIds) || classIds.length === 0 || !term || !["draft", "published", "locked"].includes(status || "")) {
      return res.status(400).json({ message: "classIds (array), term, and valid status are required" });
    }
    const allowedClassIds = [];
    for (const cid of classIds) {
      if (await canManageClass(req, cid)) {
        allowedClassIds.push(cid);
      }
    }
    if (allowedClassIds.length === 0) {
      return res.status(403).json({ message: "You are not authorized to manage any of the specified classes" });
    }
    const now = /* @__PURE__ */ new Date();
    const update = { status };
    if (status === "published") {
      update.publishedBy = req.user.id;
      update.publishedAt = now;
      update.lockedBy = null;
      update.lockedAt = null;
    } else if (status === "locked") {
      update.lockedBy = req.user.id;
      update.lockedAt = now;
    } else {
      update.publishedBy = null;
      update.publishedAt = null;
      update.lockedBy = null;
      update.lockedAt = null;
    }
    const operations = allowedClassIds.map((cid) => ({
      updateOne: {
        filter: { class: cid, term },
        update: { $set: update },
        upsert: true
      }
    }));
    await ResultPublication_default.bulkWrite(operations);
    const updatedPublications = await ResultPublication_default.find({
      class: { $in: allowedClassIds },
      term
    }).populate("publishedBy", "name email").populate("lockedBy", "name email");
    res.status(200).json({
      message: `Updated status to '${status}' for ${allowedClassIds.length} classes`,
      publications: updatedPublications
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var isStudentResultPublished = async (studentId, termId) => {
  const student = await Student_default.findById(studentId).select("class");
  if (!student) return false;
  const publication = await ResultPublication_default.findOne({ class: student.class, term: termId });
  return publication?.status === "published" || publication?.status === "locked";
};
var isClassResultLocked = async (classId, termId) => {
  const publication = await ResultPublication_default.findOne({ class: classId, term: termId });
  return publication?.status === "locked";
};

// server/controllers/scoreController.ts
var submitScore = async (req, res) => {
  try {
    const { student, subject, term, ca, exam } = req.body;
    if (!student || !subject || !term || !Number.isFinite(ca) || !Number.isFinite(exam) || ca < 0 || exam < 0) {
      return res.status(400).json({ message: "student, subject, term, and valid non-negative scores are required" });
    }
    const studentDoc = await Student_default.findById(student).select("class");
    if (!studentDoc) return res.status(404).json({ message: "Student not found" });
    if (await isClassResultLocked(studentDoc.class.toString(), term)) {
      return res.status(423).json({ message: "This class result is locked and scores cannot be changed" });
    }
    if (req.user?.role === "subject_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const allowedSubjects = (teacher?.subjects || []).map((s) => s.toString());
      if (allowedSubjects.length > 0 && !allowedSubjects.includes(subject)) {
        return res.status(403).json({ message: "You are not assigned to this subject" });
      }
      const allowedClasses = (teacher?.classes || []).map((c) => c.toString());
      if (allowedClasses.length > 0 && !allowedClasses.includes(studentDoc.class.toString())) {
        return res.status(403).json({ message: "You are not assigned to this student's class" });
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const allowedClasses = (teacher?.classes || []).map((c) => c.toString());
      if (allowedClasses.length > 0 && !allowedClasses.includes(studentDoc.class.toString())) {
        return res.status(403).json({ message: "You are not assigned to this class" });
      }
    }
    if (ca > 40 || exam > 60) {
      return res.status(400).json({ message: "CA must be \u2264 40 and Exam \u2264 60" });
    }
    const total = ca + exam;
    const score = await Score_default.findOneAndUpdate(
      { student, subject, term },
      { ca, exam, total, enteredBy: req.user?.id },
      { new: true, upsert: true }
    );
    res.status(200).json(score);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getScores = async (req, res) => {
  try {
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.term) filter.term = req.query.term;
    if (req.user?.role === "subject_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const allowedSubjects = (teacher?.subjects || []).map((s) => s.toString());
      if (allowedSubjects.length > 0 && filter.subject && !allowedSubjects.includes(filter.subject)) {
        return res.status(403).json({ message: "Not authorized for this subject" });
      }
    }
    const scores = await Score_default.find(filter).populate("student", "name numberInClass").populate("subject", "nameEnglish nameArabic");
    res.status(200).json(scores);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/scoreRoutes.ts
var router7 = Router7();
router7.post(
  "/",
  protect,
  authorize("super_admin", "branch_admin", "class_teacher", "subject_teacher"),
  submitScore
);
router7.get(
  "/",
  protect,
  authorize("super_admin", "branch_admin", "class_teacher", "subject_teacher"),
  getScores
);
var scoreRoutes_default = router7;

// server/routes/broadsheetRoutes.ts
import { Router as Router8 } from "express";

// server/utils/ranking.ts
var computePositions = (items) => {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  let currentPosition = 0;
  let lastScore = null;
  let studentsAtLastScore = 0;
  return sorted.map((item) => {
    if (item.score !== lastScore) {
      currentPosition += studentsAtLastScore || 1;
      studentsAtLastScore = 1;
      lastScore = item.score;
    } else {
      studentsAtLastScore += 1;
    }
    return { ...item, position: currentPosition };
  });
};

// server/utils/cascadeAverage.ts
var foldCascade = (rawScoresAscending) => {
  const scores = rawScoresAscending.filter((s) => s !== null && s !== void 0);
  if (scores.length === 0) {
    return { priorPeriodValue: null, finalValue: null };
  }
  let priorPeriodValue = null;
  let running = scores[0];
  for (let i = 1; i < scores.length; i++) {
    priorPeriodValue = running;
    running = (running + scores[i]) / 2;
  }
  return {
    priorPeriodValue: scores.length > 1 ? priorPeriodValue : null,
    finalValue: running
  };
};

// server/controllers/broadsheetController.ts
var getBroadsheet = async (req, res) => {
  try {
    const { class: classId, term } = req.query;
    if (!classId || !term) {
      return res.status(400).json({ message: "class and term are required" });
    }
    const students = await Student_default.find({ class: classId }).sort({ name: 1 });
    const subjects = await Subject_default.find({ class: classId }).sort({ nameEnglish: 1 });
    if (students.length === 0 || subjects.length === 0) {
      return res.status(200).json({ subjects, rows: [] });
    }
    const studentIds = students.map((s) => s._id);
    const subjectIds = subjects.map((s) => s._id);
    const scores = await Score_default.find({
      student: { $in: studentIds },
      subject: { $in: subjectIds },
      term
    });
    const scoreMap = /* @__PURE__ */ new Map();
    scores.forEach((sc) => {
      scoreMap.set(`${sc.student.toString()}-${sc.subject.toString()}`, sc.total);
    });
    const rows = students.map((student) => {
      const subjectScores = subjects.map((subject) => {
        const key = `${student._id.toString()}-${subject._id.toString()}`;
        return {
          subject: subject._id,
          nameEnglish: subject.nameEnglish,
          nameArabic: subject.nameArabic,
          score: scoreMap.get(key) ?? null
        };
      });
      const enteredScores = subjectScores.filter((s) => s.score !== null);
      const total = enteredScores.reduce((sum, s) => sum + s.score, 0);
      const average = enteredScores.length > 0 ? total / enteredScores.length : 0;
      return {
        student: student._id,
        name: student.name,
        numberInClass: student.numberInClass,
        subjectScores,
        total,
        average: Math.round(average * 100) / 100,
        allSubjectsEntered: enteredScores.length === subjects.length
      };
    });
    const ranked = computePositions(
      rows.map((r) => ({ studentId: r.student.toString(), score: r.total }))
    );
    const positionMap = new Map(ranked.map((r) => [r.studentId, r.position]));
    const positioned = rows.map((row) => ({
      ...row,
      position: positionMap.get(row.student.toString())
    }));
    res.status(200).json({ subjects, rows: positioned });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getClassCumulativePositions = async (classId, termId) => {
  const currentTerm = await Term_default.findById(termId);
  if (!currentTerm) return /* @__PURE__ */ new Map();
  const priorTerms = await Term_default.find({
    session: currentTerm.session,
    termNumber: { $lte: currentTerm.termNumber }
  }).sort({ termNumber: 1 });
  const priorTermIds = priorTerms.map((t) => t._id);
  const students = await Student_default.find({ class: classId });
  const subjects = await Subject_default.find({ class: classId });
  const totalSubjectsCount = subjects.length;
  const scores = await Score_default.find({
    student: { $in: students.map((s) => s._id) },
    subject: { $in: subjects.map((s) => s._id) },
    term: { $in: priorTermIds }
  });
  const byStudentSubject = /* @__PURE__ */ new Map();
  scores.forEach((sc) => {
    const studentKey = sc.student.toString();
    const subjectKey = sc.subject.toString();
    if (!byStudentSubject.has(studentKey)) byStudentSubject.set(studentKey, /* @__PURE__ */ new Map());
    const subjMap = byStudentSubject.get(studentKey);
    if (!subjMap.has(subjectKey)) subjMap.set(subjectKey, /* @__PURE__ */ new Map());
    subjMap.get(subjectKey).set(sc.term.toString(), sc.total);
  });
  const rankInput = students.map((s) => {
    const studentKey = s._id.toString();
    const subjMap = byStudentSubject.get(studentKey) || /* @__PURE__ */ new Map();
    let total = 0;
    subjects.forEach((subject) => {
      const subjectKey = subject._id.toString();
      const termScoreMap = subjMap.get(subjectKey) || /* @__PURE__ */ new Map();
      const rawScoresAscending = priorTerms.map((t) => termScoreMap.get(t._id.toString())).filter((v) => v !== void 0);
      const { finalValue } = foldCascade(rawScoresAscending);
      total += finalValue ?? 0;
    });
    const average = totalSubjectsCount > 0 ? total / totalSubjectsCount : 0;
    return { studentId: studentKey, score: average };
  });
  const ranked = computePositions(rankInput);
  return new Map(ranked.map((r) => [r.studentId, r.position]));
};

// server/routes/broadsheetRoutes.ts
var router8 = Router8();
router8.get(
  "/",
  protect,
  authorize("super_admin", "branch_admin", "class_teacher"),
  getBroadsheet
);
var broadsheetRoutes_default = router8;

// server/routes/reportCardRoutes.ts
import { Router as Router9 } from "express";

// server/models/Attendance.ts
import mongoose12, { Schema as Schema11 } from "mongoose";
var AttendanceSchema = new Schema11(
  {
    student: { type: Schema11.Types.ObjectId, ref: "Student", required: true },
    class: { type: Schema11.Types.ObjectId, ref: "Class", required: true },
    term: { type: Schema11.Types.ObjectId, ref: "Term", required: true },
    timesPresent: { type: Number, default: null },
    timesAbsent: { type: Number, default: null },
    recordedBy: { type: Schema11.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
AttendanceSchema.index({ student: 1, term: 1 }, { unique: true });
AttendanceSchema.index({ class: 1, term: 1 });
var Attendance_default = mongoose12.model("Attendance", AttendanceSchema);

// server/models/AttendanceSetting.ts
import mongoose13, { Schema as Schema12 } from "mongoose";
var AttendanceSettingSchema = new Schema12(
  {
    term: { type: Schema12.Types.ObjectId, ref: "Term", required: true },
    branch: { type: Schema12.Types.ObjectId, ref: "Branch" },
    class: { type: Schema12.Types.ObjectId, ref: "Class" },
    timesSchoolOpened: { type: Number, default: null },
    dateResumed: { type: String, default: "" },
    dateClosed: { type: String, default: "" },
    nextResumption: { type: String, default: "" },
    updatedBy: { type: Schema12.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
AttendanceSettingSchema.index({ term: 1, class: 1 }, { unique: true, sparse: true });
AttendanceSettingSchema.index({ term: 1, branch: 1 });
var AttendanceSetting_default = mongoose13.model(
  "AttendanceSetting",
  AttendanceSettingSchema
);

// server/models/ReportCardSetting.ts
import mongoose14, { Schema as Schema13 } from "mongoose";
var ReportCardSettingSchema = new Schema13(
  {
    schoolNameArabic: {
      type: String,
      default: "\u0645\u0639\u0647\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A"
    },
    schoolNameEnglish: {
      type: String,
      default: "INSTITUTE OF ARABIC AND ISLAMIC STUDIES"
    },
    address: {
      type: String,
      default: "18/20 ABEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665"
    },
    logoBase64: { type: String, default: "" },
    primaryColor: { type: String, default: "#16a34a" },
    headerColor: { type: String, default: "#1e3a8a" },
    showPrincipalSignature: { type: Boolean, default: false },
    principalSignatureBase64: { type: String, default: "" },
    showStamp: { type: Boolean, default: false },
    stampBase64: { type: String, default: "" },
    watermarkText: { type: String, default: "" },
    updatedBy: { type: Schema13.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
var ReportCardSetting_default = mongoose14.model(
  "ReportCardSetting",
  ReportCardSettingSchema
);

// server/controllers/reportCardController.ts
var buildReportCardData = async (studentId, termId, scaleId) => {
  if (!studentId || !termId) {
    return null;
  }
  const student = await Student_default.findById(studentId).populate("class");
  if (!student) return null;
  const currentTerm = await Term_default.findById(termId);
  if (!currentTerm) return null;
  const priorTerms = await Term_default.find({
    session: currentTerm.session,
    termNumber: { $lte: currentTerm.termNumber }
  }).sort({ termNumber: 1 });
  const priorTermIds = priorTerms.map((t) => t._id);
  const subjects = await Subject_default.find({
    class: student.class._id
  }).sort({
    nameEnglish: 1
  });
  const scoresBySubject = await Score_default.find({
    student: studentId,
    subject: { $in: subjects.map((s) => s._id) },
    term: { $in: priorTermIds }
  });
  const scoresBySubjectMap = /* @__PURE__ */ new Map();
  scoresBySubject.forEach((sc) => {
    const subjectKey = sc.subject.toString();
    if (!scoresBySubjectMap.has(subjectKey))
      scoresBySubjectMap.set(subjectKey, /* @__PURE__ */ new Map());
    scoresBySubjectMap.get(subjectKey).set(sc.term.toString(), sc.total);
  });
  const gradingScale = scaleId ? await GradingScale_default.findById(scaleId) : null;
  const subjectResults = subjects.map((subject) => {
    const subjectKey = subject._id.toString();
    const termScoreMap = scoresBySubjectMap.get(subjectKey) || /* @__PURE__ */ new Map();
    const rawScoresAscending = priorTerms.map((t) => termScoreMap.get(t._id.toString())).filter((v) => v !== void 0);
    const { priorPeriodValue, finalValue: cumulativeAverage } = foldCascade(rawScoresAscending);
    const currentTermScore = termScoreMap.get(termId) ?? null;
    const currentTermScoreDoc = scoresBySubject.find(
      (sc) => sc.subject.toString() === subjectKey && sc.term.toString() === termId
    );
    const combinedTotal = priorPeriodValue !== null && currentTermScore !== null ? priorPeriodValue + currentTermScore : null;
    let grade = null;
    let remark = null;
    let remarkArabic = null;
    if (gradingScale && cumulativeAverage !== null) {
      const band = gradingScale.bands.find(
        (b) => cumulativeAverage >= b.minScore && cumulativeAverage <= b.maxScore
      );
      if (band) {
        grade = band.grade;
        remark = band.remark;
        remarkArabic = band.remarkArabic;
      }
    }
    return {
      subject: subject._id,
      nameEnglish: subject.nameEnglish,
      nameArabic: subject.nameArabic,
      ca: currentTermScoreDoc?.ca ?? null,
      exam: currentTermScoreDoc?.exam ?? null,
      currentTermScore,
      // only present for term 2 (= term 1's raw total) and term 3
      // (= cascade through term 1+2) — term 1 has nothing prior, so null
      priorPeriodValue: priorPeriodValue !== null ? Math.round(priorPeriodValue * 100) / 100 : null,
      combinedTotal: combinedTotal !== null ? Math.round(combinedTotal * 100) / 100 : null,
      cumulativeAverage: cumulativeAverage !== null ? Math.round(cumulativeAverage * 100) / 100 : null,
      grade,
      remark,
      remarkArabic
    };
  });
  const totalSubjectsCount = subjects.length;
  const overallTotal = subjectResults.reduce(
    (sum, s) => sum + (s.cumulativeAverage ?? 0),
    0
  );
  const overallPercentage = totalSubjectsCount > 0 ? overallTotal / totalSubjectsCount : 0;
  const classId = student.class._id.toString();
  const positionMap = await getClassCumulativePositions(classId, termId);
  const position = positionMap.get(studentId) ?? null;
  const totalStudentsInClass = await Student_default.countDocuments({ class: classId });
  const remarkDoc = await ReportCardRemark_default.findOne({
    student: studentId,
    term: termId
  });
  const classTeacherComment = remarkDoc?.classTeacherCommentEn && remarkDoc?.classTeacherCommentAr ? { en: remarkDoc.classTeacherCommentEn, ar: remarkDoc.classTeacherCommentAr } : null;
  const principalComment = remarkDoc?.principalCommentEn && remarkDoc?.principalCommentAr ? { en: remarkDoc.principalCommentEn, ar: remarkDoc.principalCommentAr } : null;
  const termAverages = priorTerms.map((t) => {
    const cascadeValues = [];
    subjects.forEach((subject) => {
      const subjectKey = subject._id.toString();
      const termScoreMap = scoresBySubjectMap.get(subjectKey) || /* @__PURE__ */ new Map();
      const scoresUpToThisTerm = priorTerms.filter((pt) => pt.termNumber <= t.termNumber).map((pt) => termScoreMap.get(pt._id.toString())).filter((v) => v !== void 0);
      if (scoresUpToThisTerm.length > 0) {
        const { finalValue } = foldCascade(scoresUpToThisTerm);
        if (finalValue !== null) cascadeValues.push(finalValue);
      }
    });
    const average = cascadeValues.length > 0 ? cascadeValues.reduce((a, b) => a + b, 0) / cascadeValues.length : null;
    return {
      termNumber: t.termNumber,
      average: average !== null ? Math.round(average * 100) / 100 : null
    };
  });
  const classBranchId = student.class?.branch;
  const [attSettingClass, attSettingBranch, attSettingGlobal, attDoc, templateSetting] = await Promise.all([
    AttendanceSetting_default.findOne({ class: classId, term: termId }),
    classBranchId ? AttendanceSetting_default.findOne({
      branch: classBranchId,
      term: termId,
      class: { $exists: false }
    }) : null,
    AttendanceSetting_default.findOne({
      term: termId,
      class: { $exists: false },
      branch: { $exists: false }
    }),
    Attendance_default.findOne({ student: studentId, term: termId }),
    ReportCardSetting_default.findOne()
  ]);
  const activeAttSetting = attSettingClass || attSettingBranch || attSettingGlobal;
  const timesSchoolOpened = activeAttSetting?.timesSchoolOpened !== void 0 && activeAttSetting?.timesSchoolOpened !== null ? activeAttSetting.timesSchoolOpened : currentTerm.timesSchoolOpened ?? null;
  const dateResumed = activeAttSetting?.dateResumed || currentTerm.dateResumed || "";
  const dateClosed = activeAttSetting?.dateClosed || currentTerm.dateClosed || "";
  const nextResumption = activeAttSetting?.nextResumption || currentTerm.nextResumption || "";
  const timesPresent = attDoc?.timesPresent !== void 0 && attDoc?.timesPresent !== null ? attDoc.timesPresent : null;
  const timesAbsent = attDoc?.timesAbsent !== void 0 && attDoc?.timesAbsent !== null ? attDoc.timesAbsent : null;
  return {
    student: {
      id: student._id,
      name: student.name,
      gender: student.gender,
      numberInClass: student.numberInClass,
      class: student.class.name,
      arm: student.class.arm || null
    },
    term: {
      session: currentTerm.session,
      termNumber: currentTerm.termNumber
    },
    subjects: subjectResults,
    overallTotal: Math.round(overallTotal * 100) / 100,
    overallPercentage: Math.round(overallPercentage * 100) / 100,
    position,
    result: overallPercentage >= 50 ? "Pass" : "Fail",
    totalStudentsInClass,
    termAverages,
    attendance: {
      timesSchoolOpened,
      timesPresent,
      timesAbsent,
      dateResumed,
      dateClosed,
      nextResumption,
      schoolDays: timesSchoolOpened,
      presentDays: timesPresent,
      absentDays: timesAbsent
    },
    classTeacherComment,
    // { id, en, ar } | null
    principalComment,
    templateSettings: templateSetting ? {
      schoolNameArabic: templateSetting.schoolNameArabic,
      schoolNameEnglish: templateSetting.schoolNameEnglish,
      address: templateSetting.address,
      logoBase64: templateSetting.logoBase64,
      primaryColor: templateSetting.primaryColor,
      headerColor: templateSetting.headerColor,
      showPrincipalSignature: templateSetting.showPrincipalSignature,
      principalSignatureBase64: templateSetting.principalSignatureBase64,
      showStamp: templateSetting.showStamp,
      stampBase64: templateSetting.stampBase64,
      watermarkText: templateSetting.watermarkText
    } : null
  };
};
var getReportCard = async (req, res) => {
  try {
    const { student, term, gradingScale } = req.query;
    const data = await buildReportCardData(
      student,
      term,
      gradingScale
    );
    if (!data)
      return res.status(404).json({ message: "Student or term not found" });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/reportCardRoutes.ts
var router9 = Router9();
router9.get(
  "/",
  protect,
  authorize("super_admin", "branch_admin", "class_teacher"),
  getReportCard
);
var reportCardRoutes_default = router9;

// server/routes/pdfRoutes.ts
import { Router as Router10 } from "express";

// server/utils/reportCardTemplate.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var currentDir = typeof __dirname !== "undefined" ? __dirname : typeof import.meta?.url === "string" ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd();
var LOGO_PATH = path.join(currentDir, "../assets/logo.png");
var FONT_PATH = path.join(currentDir, "../assets/fonts/Amiri-Regular.ttf");
var logoBase64 = fs.existsSync(LOGO_PATH) ? fs.readFileSync(LOGO_PATH).toString("base64") : "";
var fontBase64 = fs.existsSync(FONT_PATH) ? fs.readFileSync(FONT_PATH).toString("base64") : "";
var sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;500;600;700&display=swap');

  @page {
    size: A4 portrait;
    margin: 6mm 7mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #111827;
    background: #ffffff;
    -webkit-font-smoothing: antialiased;
  }

  .arabic {
    font-family: 'Amiri', 'Traditional Arabic', serif;
    direction: rtl;
  }

  .sheet {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    border: 4px solid var(--primary-color, #16a34a);
    border-radius: 2px;
    padding: 14px 16px;
    background: #ffffff;
    page-break-after: always;
    page-break-inside: avoid;
    position: relative;
  }
  .sheet:last-child { page-break-after: auto; }

  .header { text-align: center; position: relative; margin-bottom: 10px; min-height: 60px; }
  .header .logo {
    position: absolute; top: 0; right: 0; width: 62px; height: 62px;
    border-radius: 4px; object-fit: contain;
  }
  .header .logo-placeholder {
    position: absolute; top: 0; right: 0; width: 62px; height: 62px;
    border-radius: 4px; background: #F4F1EA; color: #9ca3af;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600;
  }
  .header .school-name-ar {
    font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 24px; color: var(--header-color, #1e3a8a); font-weight: bold; line-height: 1.2;
  }
  .header .school-name-en { font-size: 12px; font-weight: bold; margin-top: 3px; color: #111827; }
  .header .address { font-size: 10px; font-weight: bold; margin-top: 2px; color: #374151; line-height: 1.3; white-space: pre-line; }

  .title-bar {
    text-align: center; font-size: 12px; font-weight: bold; color: var(--header-color, #1e3a8a);
    margin: 6px 0 10px 0; display: flex; justify-content: center; align-items: center; gap: 8px;
  }
  .title-bar .ar { font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 13px; }

  .info-section { display: flex; border: 1px solid #000; margin-bottom: 10px; font-size: 10px; }
  .attendance { flex: 1; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: space-between; }
  .attendance-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 3.5px 6px; border-bottom: 1px solid #e5e7eb; font-size: 10px;
  }
  .attendance-row:last-child { border-bottom: none; }
  .attendance-row.attendance-header { font-weight: bold; background: #f9fafb; border-bottom: 1px solid #000; }
  .attendance-row .en-label { width: 44%; text-align: left; font-weight: 500; color: #111827; line-height: 1.2; }
  .attendance-row .mid-val { width: 20%; text-align: center; font-weight: bold; color: #000; font-size: 10.5px; }
  .attendance-row .ar-label { width: 36%; text-align: right; font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 11.5px; color: #111827; line-height: 1.2; }

  .student-info { flex: 1; }
  .student-info-row { display: flex; border-bottom: 1px solid #000; height: 35px; }
  .student-info-row:last-child { border-bottom: none; }
  .student-info-row .value {
    flex: 2; display: flex; align-items: center; justify-content: center;
    font-weight: bold; font-size: 13.5px; border-right: 1px solid #000; color: #111827;
  }
  .student-info-row .label {
    flex: 1; display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: bold; text-align: center; line-height: 1.2;
  }

  table.subjects { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px; }
  table.subjects th, table.subjects td { border: 1px solid #000; padding: 4.5px 5px; text-align: center; }
  table.subjects th { font-size: 10px; font-weight: bold; background: #fafafa; line-height: 1.2; }
  table.subjects td.subject-name { text-align: left; font-weight: bold; }
  table.subjects td.subject-name .ar { font-family: 'Amiri', 'Traditional Arabic', serif; float: right; font-size: 11px; }
  table.subjects tr.total-row td { font-weight: bold; }

  .bottom-section { display: flex; margin-bottom: 10px; border: 1px solid #000; font-size: 10px; }
  .bottom-box { flex: 1; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: space-between; }
  .bottom-box:last-child { border-right: none; }
  .bottom-box .row { display: flex; border-bottom: 1px solid #000; height: 34px; }
  .bottom-box .row:last-child { border-bottom: none; }
  .bottom-box .row .label {
    flex: 1; display: flex; align-items: center; justify-content: center;
    font-weight: bold; background: #fafafa; text-align: center; line-height: 1.2;
  }
  .bottom-box .row .val {
    flex: 1; display: flex; align-items: center; justify-content: center;
    font-weight: bold; font-size: 11.5px;
  }
  .term-averages-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
    height: 100%;
  }
  .term-averages-table td {
    padding: 3.5px 8px;
    vertical-align: middle;
  }
  .term-averages-table tr.term-row {
    border-bottom: 1px solid #000;
  }
  .term-averages-table .term-name-cell {
    text-align: left;
    white-space: nowrap;
  }
  .term-averages-table .term-name-cell .en {
    font-weight: 500;
    font-size: 9.5px;
    color: #111827;
  }
  .term-averages-table .term-name-cell .ar {
    font-family: 'Amiri', 'Traditional Arabic', serif;
    font-size: 11.5px;
    margin: 0 4px;
    color: #111827;
  }
  .term-averages-table .term-name-cell .colon {
    font-weight: bold;
    font-size: 10px;
    color: #111827;
  }
  .term-averages-table .term-val-cell {
    text-align: right;
    font-weight: bold;
    font-size: 11px;
    color: #111827;
    white-space: nowrap;
  }
  .term-averages-table tr.cumulative-row {
    background: #fafafa;
    border-top: 1px solid #000;
    font-weight: bold;
  }
  .term-averages-table tr.cumulative-row td {
    padding: 4px 8px;
  }
  .term-averages-table tr.cumulative-row .cum-label {
    text-align: left;
    font-weight: bold;
    font-size: 9.5px;
    color: #111827;
  }
  .term-averages-table tr.cumulative-row .cum-val {
    text-align: right;
    font-weight: bold;
    font-size: 11px;
    color: #111827;
    white-space: nowrap;
  }

  .comment-section { border: 1px solid #000; font-size: 10px; position: relative; }
  .comment-row { display: flex; border-bottom: 1px solid #000; min-height: 42px; position: relative; }
  .comment-row:last-child { border-bottom: none; }
  .comment-row .comment-label {
    flex: 1; display: flex; align-items: center; justify-content: center;
    text-align: center; font-weight: bold; border-right: 1px solid #000; padding: 4px; line-height: 1.2;
  }
  .comment-row .comment-value {
    flex: 2; display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 4px 10px; position: relative;
  }
  .comment-row .comment-value .ar { font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 11.5px; }
  .comment-row .comment-value .en { font-size: 10px; margin-top: 1px; }
  .comment-row .comment-value .empty { color: #d1d5db; }
  .comment-row .comment-value .signature-img {
    max-height: 32px; max-width: 120px; object-fit: contain; margin-top: 2px;
  }
  .comment-row .stamp-img {
    position: absolute; right: 15px; bottom: 2px; max-height: 40px; max-width: 80px; opacity: 0.85; pointer-events: none;
  }
`;
var ordinalEn = ["1ST", "2ND", "3RD"];
var ordinalAr = ["\u0627\u0644\u0623\u0648\u0644\u0649", "\u0627\u0644\u062B\u0627\u0646\u064A\u0629", "\u0627\u0644\u062B\u0627\u0644\u062B\u0629"];
var renderComment = (comment, isPrincipal = false, signatureBase64, showStamp, stampBase64) => {
  let content = "";
  if (!comment) {
    content = `<span class="empty">\u2014</span>`;
  } else {
    content = `<span class="ar">${comment.ar}</span><span class="en">${comment.en}</span>`;
  }
  if (isPrincipal) {
    if (signatureBase64) {
      content += `<img class="signature-img" src="${signatureBase64.startsWith("data:") ? signatureBase64 : `data:image/png;base64,${signatureBase64}`}" alt="Signature" />`;
    }
    if (showStamp && stampBase64) {
      content += `<img class="stamp-img" src="${stampBase64.startsWith("data:") ? stampBase64 : `data:image/png;base64,${stampBase64}`}" alt="Stamp" />`;
    }
  }
  return content;
};
var buildSheetHtml = (data) => {
  const {
    student,
    term,
    subjects,
    overallTotal,
    overallPercentage,
    position,
    result,
    totalStudentsInClass,
    termAverages,
    classTeacherComment,
    principalComment,
    attendance,
    templateSettings
  } = data;
  const schoolNameAr = templateSettings?.schoolNameArabic || "\u0645\u0639\u0647\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A";
  const schoolNameEn = templateSettings?.schoolNameEnglish || "INSTITUTE OF ARABIC AND ISLAMIC STUDIES";
  const schoolAddress = templateSettings?.address || "18/20 ABEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665";
  const formattedAddress = schoolAddress.replace(/\n/g, "<br/>");
  const effectiveLogo = templateSettings?.logoBase64 || (logoBase64 ? `data:image/png;base64,${logoBase64}` : "");
  const primaryColor = templateSettings?.primaryColor || "#16a34a";
  const headerColor = templateSettings?.headerColor || "#1e3a8a";
  const showCascadeColumns = term.termNumber === 2 || term.termNumber === 3;
  const subjectRows = subjects.map(
    (s) => `
      <tr>
      <td class="subject-name">${s.nameEnglish} ${s.nameArabic ? `<span class="ar">${s.nameArabic}</span>` : ""}</td>
      <td>${s.ca ?? "-"}</td>
      <td>${s.exam ?? "-"}</td>
      <td>${s.currentTermScore ?? "-"}</td>
      ${showCascadeColumns ? `<td>${s.priorPeriodValue ?? "-"}</td>` : ""}
      ${showCascadeColumns ? `<td>${s.combinedTotal ?? "-"}</td>` : ""}
      <td>${s.cumulativeAverage ?? "-"}</td>
    </tr>`
  ).join("");
  const termAverageRows = termAverages.map(
    (t) => `
      <tr class="term-row">
        <td class="term-name-cell">
          <span class="en">${ordinalEn[t.termNumber - 1]}</span>
          <span class="ar arabic" dir="rtl">${ordinalAr[t.termNumber - 1]}</span>
          <span class="colon">:</span>
        </td>
        <td class="term-val-cell">${t.average ?? "-"}</td>
      </tr>`
  ).join("");
  const formatVal = (val) => {
    if (val === void 0 || val === null || val === "") return "-";
    return String(val);
  };
  const openedVal = formatVal(attendance?.timesSchoolOpened ?? attendance?.schoolDays);
  const presentVal = formatVal(attendance?.timesPresent ?? attendance?.presentDays);
  const absentVal = formatVal(attendance?.timesAbsent ?? attendance?.absentDays);
  const resumedVal = formatVal(attendance?.dateResumed);
  const closedVal = formatVal(attendance?.dateClosed);
  const nextResumptionVal = formatVal(attendance?.nextResumption);
  return `
    <div class="sheet" style="--primary-color: ${primaryColor}; --header-color: ${headerColor};">
      <div class="header">
        ${effectiveLogo ? `<img class="logo" src="${effectiveLogo.startsWith("data:") ? effectiveLogo : `data:image/png;base64,${effectiveLogo}`}" />` : `<div class="logo-placeholder">logo</div>`}
        <div class="school-name-ar">${schoolNameAr}</div>
        <div class="school-name-en">${schoolNameEn}</div>
        <div class="address">${formattedAddress}</div>
      </div>

      <div class="title-bar">
        <span class="ar">\u0643\u0634\u0641 \u062F\u0631\u062C\u0627\u062A \u0627\u0644\u0641\u062A\u0631\u0629 ${ordinalAr[term.termNumber - 1]}</span>
        <span>REPORT SHEET FOR ${ordinalEn[term.termNumber - 1]} TERM ${term.session} ACADEMIC SESSION</span>
      </div>

      <div class="info-section">
        <div class="attendance">
          <div class="attendance-row attendance-header">
            <span class="en-label">ATTENDANCE</span>
            <span class="mid-val"></span>
            <span class="ar-label">\u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628</span>
          </div>
          <div class="attendance-row">
            <span class="en-label">No. of times school opened</span>
            <span class="mid-val">${openedVal}</span>
            <span class="ar-label">\u0639\u062F\u062F \u0623\u064A\u0627\u0645 \u0627\u0644\u062F\u0648\u0627\u0645</span>
          </div>
          <div class="attendance-row">
            <span class="en-label">No. of times present</span>
            <span class="mid-val">${presentVal}</span>
            <span class="ar-label">\u0639\u062F\u062F \u0623\u064A\u0627\u0645 \u0627\u0644\u062D\u0636\u0648\u0631</span>
          </div>
          <div class="attendance-row">
            <span class="en-label">No. of times absent</span>
            <span class="mid-val">${absentVal}</span>
            <span class="ar-label">\u0639\u062F\u062F \u0623\u064A\u0627\u0645 \u0627\u0644\u063A\u064A\u0627\u0628</span>
          </div>
          <div class="attendance-row">
            <span class="en-label">Date School resumed</span>
            <span class="mid-val">${resumedVal}</span>
            <span class="ar-label">\u0628\u062F\u0621 \u0627\u0644\u062F\u0631\u0627\u0633\u0629</span>
          </div>
          <div class="attendance-row">
            <span class="en-label">Date School closes</span>
            <span class="mid-val">${closedVal}</span>
            <span class="ar-label">\u062E\u062A\u0645 \u0627\u0644\u062F\u0631\u0627\u0633\u0629</span>
          </div>
          <div class="attendance-row">
            <span class="en-label">Next resumption</span>
            <span class="mid-val">${nextResumptionVal}</span>
            <span class="ar-label">\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u062F\u0631\u0627\u0633\u0629</span>
          </div>
        </div>
        <div class="student-info">
          <div class="student-info-row">
            <div class="value arabic">${student.name}</div>
            <div class="label">\u0627\u0644\u0627\u0633\u0645<br/>NAME</div>
          </div>
          <div class="student-info-row">
            <div class="value arabic">${student.class}</div>
            <div class="label">\u0627\u0644\u0635\u0641<br/>CLASS</div>
          </div>
          <div class="student-info-row">
            <div class="value">${totalStudentsInClass ?? "-"}</div>
            <div class="label">\u0639\u062F\u062F \u0627\u0644\u0637\u0644\u0627\u0628<br/>NO IN CLASS</div>
          </div>
          ${student.arm ? `<div class="student-info-row">
                  <div class="value">${student.arm}</div>
                  <div class="label">\u0627\u0644\u0634\u0639\u0628\u0629<br/>DIVISION</div>
                </div>` : ""}
          <div class="student-info-row">
            <div class="value">${student.gender}</div>
            <div class="label">\u0627\u0644\u062C\u0646\u0633<br/>GENDER</div>
          </div>
        </div>
      </div>

      <table class="subjects">
        <thead>
          <tr>
            <th style="width: 26%">\u0627\u0644\u0645\u0648\u0627\u062F : SUBJECT</th>
            <th>CA: \u0645\u0630<br/>40</th>
            <th>EXAM :\u0645\u062A\u062D<br/>60</th>
            <th>TOTAL : \u0645\u062D\u0635<br/>100</th>
            ${term.termNumber === 2 ? `<th>\u0645\u062D\u0635\u0644\u0629 \u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u0623\u0648\u0644\u0649<br/>1st term total</th>
                   <th>\u0645\u062D\u0635\u0644\u0629 \u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 \u0648\u0627\u0644\u062B\u0627\u0646\u064A\u0629<br/>1st and 2nd term total</th>` : ""}
            ${term.termNumber === 3 ? `<th>\u0645\u062D\u0635\u0644\u0629 \u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u062B\u0627\u0646\u064A\u0629<br/>2nd term total</th>
                   <th>\u0645\u062D\u0635\u0644\u0629 \u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u062B\u0627\u0646\u064A\u0629 \u0648\u0627\u0644\u062B\u0627\u0644\u062B\u0629<br/>2nd and 3rd term total</th>` : ""}
            <th>\u0648\u0633\u0637\u0649 \u0627\u0644\u062F\u0631\u062C\u0627\u062A<br/>Average marks</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
          <tr class="total-row">
            <td class="subject-name">\u0627\u0644\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0643\u0644\u064A : TOTAL</td>
            <td></td><td></td>
            <td>${overallTotal}</td>
            ${showCascadeColumns ? `<td></td><td></td>` : ""}
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="bottom-section">
        <div class="bottom-box">
          <div class="row"><div class="label">\u0627\u0644\u062A\u0631\u062A\u064A\u0628<br/>POSITION</div><div class="val">${position ?? "-"}</div></div>
          <div class="row"><div class="label">\u0627\u0644\u0646\u062A\u064A\u062C\u0629<br/>RESULT</div><div class="val" style="color: ${result === "Pass" ? "#0B3D2E" : "#B42318"}; font-weight: bold;">${result}</div></div>
        </div>
        <div class="bottom-box">
          <table class="term-averages-table">
            <tbody>
              ${termAverageRows}
              <tr class="cumulative-row">
                <td class="cum-label">CUMULATIVE AVERAGE</td>
                <td class="cum-val">${overallTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="bottom-box">
          <div class="row"><div class="label">\u0627\u0644\u0646\u0633\u0628\u0629 \u0627\u0644\u0645\u0626\u0648\u064A\u0629<br/>PERCENTAGE</div><div class="val">${overallPercentage}%</div></div>
          <div class="row">
            <div class="label">\u0627\u0644\u062A\u0642\u062F\u064A\u0631<br/>GRADE</div>
            <div class="val">
              ${subjects[0]?.remark ?? "-"}
              ${subjects[0]?.remarkArabic ? `<span class="arabic" style="margin-left: 4px; font-family: 'Amiri', 'Traditional Arabic', serif;">${subjects[0].remarkArabic}</span>` : ""}
            </div>
          </div>
        </div>
      </div>

      <div class="comment-section">
        <div class="comment-row">
          <div class="comment-label">\u062A\u0639\u0644\u064A\u0642 \u0648\u062A\u0648\u0642\u064A\u0639 \u0623\u0633\u062A\u0627\u0630 \u0627\u0644\u0635\u0641<br/>CLASS TEACHER'S COMMENT AND SIGNATURE</div>
          <div class="comment-value">${renderComment(classTeacherComment)}</div>
        </div>
        <div class="comment-row">
          <div class="comment-label">\u062A\u0639\u0644\u064A\u0642 \u0648 \u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u0648\u0643\u064A\u0644<br/>PRINCIPAL'S COMMENT AND SIGNATURE</div>
          <div class="comment-value">${renderComment(
    principalComment,
    true,
    templateSettings?.showPrincipalSignature ? templateSettings.principalSignatureBase64 : void 0,
    templateSettings?.showStamp,
    templateSettings?.stampBase64
  )}</div>
        </div>
      </div>
    </div>
  `;
};
var buildSingleReportCardHtml = (data) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Report Card - ${data.student.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${sharedStyles}</style>
</head>
<body>${buildSheetHtml(data)}</body>
</html>
`;
var buildBulkReportCardHtml = (dataList) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Class Report Cards</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${sharedStyles}</style>
</head>
<body>${dataList.map(buildSheetHtml).join("")}</body>
</html>
`;

// server/utils/generateReportCardPdf.ts
var launchOptions = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--single-process", "--no-zygote"]
};
var generateSingleReportCardPdf = async (data) => {
  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch(launchOptions);
    try {
      const page = await browser.newPage();
      const html = buildSingleReportCardHtml(data);
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluateHandle("document.fonts.ready");
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.warn("Puppeteer PDF generation not available in current environment, falling back to HTML print rendering:", err.message);
    return null;
  }
};
var generateBulkReportCardPdf = async (dataList) => {
  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch(launchOptions);
    try {
      const page = await browser.newPage();
      const html = buildBulkReportCardHtml(dataList);
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluateHandle("document.fonts.ready");
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.warn("Puppeteer PDF generation not available in current environment, falling back to HTML print rendering:", err.message);
    return null;
  }
};

// server/controllers/pdfController.ts
var setPdfDownloadHeaders = (res, rawName) => {
  const safeAsciiFallback = "report_card.pdf";
  const encodedName = encodeURIComponent(`${rawName}_report_card.pdf`);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeAsciiFallback}"; filename*=UTF-8''${encodedName}`
  );
};
var downloadSingleReportCardPdf = async (req, res) => {
  try {
    const { student: studentId, term, gradingScale, format } = req.query;
    const reportData = await buildReportCardData(
      studentId,
      term,
      gradingScale
    );
    if (!reportData) return res.status(404).json({ message: "Report card data not found" });
    if (format === "html") {
      const html2 = buildSingleReportCardHtml(reportData);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html2);
    }
    const pdfBuffer = await generateSingleReportCardPdf(reportData);
    if (pdfBuffer) {
      setPdfDownloadHeaders(res, reportData.student.name);
      return res.send(pdfBuffer);
    }
    const html = buildSingleReportCardHtml(reportData);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var downloadBulkReportCardPdf = async (req, res) => {
  try {
    const { class: classId, term, gradingScale, format } = req.query;
    if (!classId || !term) {
      return res.status(400).json({ message: "class and term are required" });
    }
    const students = await Student_default.find({ class: classId }).sort({ numberInClass: 1 });
    if (students.length === 0) {
      return res.status(404).json({ message: "No students found in this class" });
    }
    const reportDataList = [];
    for (const student of students) {
      const data = await buildReportCardData(
        student._id.toString(),
        term,
        gradingScale
      );
      if (data) reportDataList.push(data);
    }
    if (reportDataList.length === 0) {
      return res.status(404).json({ message: "No report card data found for this class" });
    }
    if (format === "html") {
      const html2 = buildBulkReportCardHtml(reportDataList);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html2);
    }
    const pdfBuffer = await generateBulkReportCardPdf(reportDataList);
    if (pdfBuffer) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="class_report_cards.pdf"`);
      return res.send(pdfBuffer);
    }
    const html = buildBulkReportCardHtml(reportDataList);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/pdfRoutes.ts
var router10 = Router10();
router10.get(
  "/single",
  protect,
  authorize("super_admin", "branch_admin", "class_teacher"),
  downloadSingleReportCardPdf
);
router10.get(
  "/bulk",
  protect,
  authorize("super_admin", "branch_admin", "class_teacher"),
  downloadBulkReportCardPdf
);
var pdfRoutes_default = router10;

// server/routes/dashboardRoutes.ts
import { Router as Router11 } from "express";

// server/controllers/dashboardController.ts
var getDashboard = async (req, res) => {
  try {
    const { term, branch } = req.query;
    if (!term) {
      return res.status(400).json({ message: "term is required" });
    }
    const classFilter = {};
    if (branch) classFilter.branch = branch;
    const classes = await Class_default.find(classFilter).populate("branch", "name");
    const classSummaries = await Promise.all(
      classes.map(async (cls) => {
        const students = await Student_default.find({ class: cls._id });
        const subjects = await Subject_default.find({ class: cls._id });
        const expectedScoreCount = students.length * subjects.length;
        const actualScoreCount = await Score_default.countDocuments({
          student: { $in: students.map((s) => s._id) },
          subject: { $in: subjects.map((s) => s._id) },
          term
        });
        const subjectCompletion = await Promise.all(
          subjects.map(async (subject) => {
            const entered = await Score_default.countDocuments({
              student: { $in: students.map((s) => s._id) },
              subject: subject._id,
              term
            });
            return {
              subject: subject._id,
              nameEnglish: subject.nameEnglish,
              entered,
              expected: students.length,
              complete: entered === students.length
            };
          })
        );
        return {
          class: cls._id,
          className: cls.name + (cls.arm ? ` ${cls.arm}` : ""),
          branch: cls.branch?.name,
          studentCount: students.length,
          subjectCount: subjects.length,
          expectedScoreCount,
          actualScoreCount,
          percentComplete: expectedScoreCount > 0 ? Math.round(actualScoreCount / expectedScoreCount * 100) : 0,
          subjectCompletion
        };
      })
    );
    const allStudents = await Student_default.find(
      branch ? { branch } : {}
    );
    const scoresForStudents = await Score_default.find({
      term,
      student: { $in: allStudents.map((s) => s._id) }
    });
    const totalsByStudent = /* @__PURE__ */ new Map();
    scoresForStudents.forEach((sc) => {
      const key = sc.student.toString();
      totalsByStudent.set(key, (totalsByStudent.get(key) || 0) + sc.total);
    });
    const topStudents = allStudents.map((s) => ({
      student: s._id,
      name: s.name,
      total: totalsByStudent.get(s._id.toString()) || 0
    })).sort((a, b) => b.total - a.total).slice(0, 10);
    const overallSchoolAverage = scoresForStudents.length > 0 ? scoresForStudents.reduce((sum, sc) => sum + sc.total, 0) / scoresForStudents.length : 0;
    res.status(200).json({
      classSummaries,
      topStudents,
      overallSchoolAverage: Math.round(overallSchoolAverage * 100) / 100,
      totalClasses: classes.length,
      totalStudents: allStudents.length
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/dashboardRoutes.ts
var router11 = Router11();
router11.get("/", protect, authorize("super_admin", "branch_admin"), getDashboard);
var dashboardRoutes_default = router11;

// server/routes/parentPortalRoutes.ts
import { Router as Router12 } from "express";

// server/controllers/parentPortalController.ts
var getLinkedStudentId = async (userId) => {
  const user = await User_default.findById(userId);
  if (!user || !user.linkedStudent) return null;
  return user.linkedStudent.toString();
};
var getMyChildReportCard = async (req, res) => {
  try {
    const { term, gradingScale } = req.query;
    if (!term) return res.status(400).json({ message: "term is required" });
    const studentId = await getLinkedStudentId(req.user.id);
    if (!studentId) {
      return res.status(403).json({ message: "No student linked to this account" });
    }
    if (!await isStudentResultPublished(studentId, term)) {
      return res.status(403).json({ message: "This report card has not been published yet" });
    }
    const data = await buildReportCardData(studentId, term, gradingScale);
    if (!data) return res.status(404).json({ message: "Report card not found" });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var downloadMyChildReportCardPdf = async (req, res) => {
  try {
    const { term, gradingScale, format } = req.query;
    if (!term) return res.status(400).json({ message: "term is required" });
    const studentId = await getLinkedStudentId(req.user.id);
    if (!studentId) {
      return res.status(403).json({ message: "No student linked to this account" });
    }
    if (!await isStudentResultPublished(studentId, term)) {
      return res.status(403).json({ message: "This report card has not been published yet" });
    }
    const data = await buildReportCardData(studentId, term, gradingScale);
    if (!data) return res.status(404).json({ message: "Report card not found" });
    if (format === "html") {
      const html2 = buildSingleReportCardHtml(data);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html2);
    }
    const pdfBuffer = await generateSingleReportCardPdf(data);
    if (pdfBuffer) {
      const safeAsciiFallback = "report_card.pdf";
      const encodedName = encodeURIComponent(`${data.student.name}_report_card.pdf`);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeAsciiFallback}"; filename*=UTF-8''${encodedName}`
      );
      return res.send(pdfBuffer);
    }
    const html = buildSingleReportCardHtml(data);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getAvailableTerms = async (_req, res) => {
  try {
    const terms = await Term_default.find().sort({ session: -1, termNumber: -1 });
    res.status(200).json(terms);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/parentPortalRoutes.ts
var router12 = Router12();
router12.get("/report-card", protect, authorize("parent"), getMyChildReportCard);
router12.get("/report-card/pdf", protect, authorize("parent"), downloadMyChildReportCardPdf);
router12.get("/terms", protect, authorize("parent"), getAvailableTerms);
var parentPortalRoutes_default = router12;

// server/routes/termRoutes.ts
import { Router as Router13 } from "express";

// server/controllers/termController.ts
var createTerm = async (req, res) => {
  try {
    const { session, termNumber, isActive } = req.body;
    if (isActive) {
      await Term_default.updateMany({ session }, { isActive: false });
    }
    const term = await Term_default.create({ session, termNumber, isActive: !!isActive });
    res.status(201).json(term);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getTerms = async (_req, res) => {
  try {
    const terms = await Term_default.find().sort({ session: -1, termNumber: -1 });
    res.status(200).json(terms);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var setActiveTerm = async (req, res) => {
  try {
    const term = await Term_default.findById(req.params.id);
    if (!term) return res.status(404).json({ message: "Term not found" });
    await Term_default.updateMany({ session: term.session }, { isActive: false });
    term.isActive = true;
    await term.save();
    res.status(200).json(term);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/termRoutes.ts
var router13 = Router13();
router13.post("/", protect, authorize("super_admin", "branch_admin"), createTerm);
router13.get("/", protect, getTerms);
router13.put("/:id/activate", protect, authorize("super_admin"), setActiveTerm);
var termRoutes_default = router13;

// server/routes/userRoutes.ts
import { Router as Router14 } from "express";

// server/controllers/userController.ts
import bcrypt3 from "bcryptjs";
var generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
var getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.user?.role === "branch_admin" && req.user.branch) {
      filter.branch = req.user.branch;
    } else if (req.query.branch) {
      filter.branch = req.query.branch;
    }
    const users = await User_default.find(filter).select("-password").populate("branch", "name").populate("classes", "name arm").populate("subjects", "nameEnglish").populate("linkedStudent", "name").sort({ name: 1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var resetUserPassword = async (req, res) => {
  try {
    const user = await User_default.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const newPassword = generatePassword();
    user.password = await bcrypt3.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Password reset", newPassword });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var deleteUser = async (req, res) => {
  try {
    const deleted = await User_default.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/userRoutes.ts
var router14 = Router14();
router14.get("/", protect, authorize("super_admin", "branch_admin"), getUsers);
router14.put(
  "/:id/reset-password",
  protect,
  authorize("super_admin", "branch_admin"),
  resetUserPassword
);
router14.delete("/:id", protect, authorize("super_admin", "branch_admin"), deleteUser);
var userRoutes_default = router14;

// server/routes/reportCardRemarkRoutes.ts
import { Router as Router15 } from "express";

// server/constants/reportCardComments.ts
var REPORT_CARD_COMMENTS = [
  { id: "c1", en: "Outstanding performance. Keep up the excellent work.", ar: "\u0637\u0627\u0644\u0628 \u0645\u0644\u062A\u0632\u0645 \u0648\u0645\u062C\u062A\u0647\u062F", gender: "M" },
  { id: "c2", en: "An exceptional result. Continue striving for excellence.", ar: "\u0637\u0627\u0644\u0628\u0629 \u0645\u0644\u062A\u0632\u0645\u0629 \u0648\u0645\u062C\u062A\u0647\u062F\u0629", gender: "F" },
  { id: "c3", en: "An exceptional result. Continue striving for excellence.", ar: "\u064A\u062D\u0631\u0635 \u0639\u0644\u0649 \u0623\u062F\u0627\u0621 \u0648\u0627\u062C\u0628\u0627\u062A\u0647\u060C \u0648\u0646\u0634\u062C\u0639\u0647 \u0639\u0644\u0649 \u0627\u0644\u0627\u0633\u062A\u0645\u0631\u0627\u0631", gender: "M" },
  { id: "c4", en: "A very commendable performance. Keep it up", ar: "\u0623\u0638\u0647\u0631 \u062A\u0642\u062F\u0645\u064B\u0627 \u0645\u0644\u062D\u0648\u0638\u064B\u0627 \u062E\u0644\u0627\u0644 \u0647\u0630\u0627 \u0627\u0644\u0641\u0635\u0644", gender: "M" },
  { id: "c5", en: "A very commendable performance. Keep it up", ar: "\u064A\u062A\u0645\u062A\u0639 \u0628\u0623\u062E\u0644\u0627\u0642 \u062D\u0633\u0646\u0629 \u0648\u0633\u0644\u0648\u0643 \u0637\u064A\u0628 \u062F\u0627\u062E\u0644 \u0627\u0644\u0645\u062F\u0631\u0633\u0629", gender: "M" },
  { id: "c6", en: "An exceptional result. Continue striving for excellence.", ar: "\u0627\u0644\u0646\u062C\u0627\u062D \u062B\u0645\u0631\u0629 \u0627\u0644\u0635\u0628\u0631 \u0648\u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F\u060C \u0641\u0648\u0627\u0635\u0644\u064A \u0645\u0633\u064A\u0631\u062A\u0643 \u0628\u062B\u0642\u0629", gender: "F" },
  { id: "c7", en: "A good performance with room for further improvement.", ar: "\u064A\u062D\u0631\u0635 \u0639\u0644\u0649 \u0623\u062F\u0627\u0621 \u0648\u0627\u062C\u0628\u0627\u062A\u0647\u060C \u0648\u0646\u0634\u062C\u0639\u0647 \u0639\u0644\u0649 \u0627\u0644\u0627\u0633\u062A\u0645\u0631\u0627\u0631", gender: "M" },
  { id: "c8", en: "Has worked well and should continue to aim higher.", ar: "\u0623\u0638\u0647\u0631 \u062A\u0642\u062F\u0645\u064B\u0627 \u0645\u0644\u062D\u0648\u0638\u064B\u0627 \u062E\u0644\u0627\u0644 \u0647\u0630\u0627 \u0627\u0644\u0641\u0635\u0644", gender: "M" },
  { id: "c9", en: "A satisfactory performance. More effort will yield better results.", ar: "\u064A\u062A\u0645\u062A\u0639 \u0628\u0623\u062E\u0644\u0627\u0642 \u062D\u0633\u0646\u0629 \u0648\u0633\u0644\u0648\u0643 \u0637\u064A\u0628 \u062F\u0627\u062E\u0644 \u0627\u0644\u0645\u062F\u0631\u0633\u0629", gender: "M" },
  { id: "c10", en: "A good performance with room for further improvement.", ar: "\u0642\u0627\u062F\u0631\u0629 \u0639\u0644\u0649 \u062A\u062D\u0642\u064A\u0642 \u0646\u062A\u0627\u0626\u062C \u0623\u0641\u0636\u0644 \u0625\u0630\u0627 \u0648\u0627\u0635\u0644\u062A \u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F", gender: "F" },
  { id: "c11", en: "A satisfactory performance. More effort will yield better results.", ar: "\u064A\u062D\u0631\u0635 \u0639\u0644\u0649 \u0623\u062F\u0627\u0621 \u0648\u0627\u062C\u0628\u0627\u062A\u0647\u060C \u0648\u0646\u0634\u062C\u0639\u0647 \u0639\u0644\u0649 \u0627\u0644\u0627\u0633\u062A\u0645\u0631\u0627\u0631", gender: "M" },
  { id: "c12", en: "Shows potential but needs greater commitment to studies.", ar: "\u064A\u062D\u0631\u0635 \u0639\u0644\u0649 \u0623\u062F\u0627\u0621 \u0648\u0627\u062C\u0628\u0627\u062A\u0647\u060C \u0648\u0646\u0634\u062C\u0639\u0647 \u0639\u0644\u0649 \u0627\u0644\u0627\u0633\u062A\u0645\u0631\u0627\u0631", gender: "M" },
  { id: "c13", en: "Has worked well and should continue to aim higher.", ar: "\u0642\u0627\u062F\u0631\u0629 \u0639\u0644\u0649 \u062A\u062D\u0642\u064A\u0642 \u0646\u062A\u0627\u0626\u062C \u0623\u0641\u0636\u0644 \u0625\u0630\u0627 \u0648\u0627\u0635\u0644\u062A \u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F", gender: "F" },
  { id: "c14", en: "A good performance with room for further improvement.", ar: "\u0623\u0638\u0647\u0631 \u062A\u0642\u062F\u0645\u064B\u0627 \u0645\u0644\u062D\u0648\u0638\u064B\u0627 \u062E\u0644\u0627\u0644 \u0647\u0630\u0627 \u0627\u0644\u0641\u0635\u0644", gender: "M" },
  { id: "c15", en: "Can achieve better results with increased effort and dedication.", ar: "\u064A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062B\u0642\u0629 \u0628\u0627\u0644\u0646\u0641\u0633 \u0648\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u0641\u0627\u0639\u0644\u0629", gender: "M" },
  { id: "c16", en: "An average performance. More focus and hard work are required.", ar: "\u0642\u0627\u062F\u0631 \u0639\u0644\u0649 \u062A\u062D\u0642\u064A\u0642 \u0646\u062A\u0627\u0626\u062C \u0623\u0641\u0636\u0644 \u0625\u0630\u0627 \u0648\u0627\u0635\u0644 \u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F", gender: "M" },
  { id: "c17", en: "Shows potential but needs greater commitment to studies.", ar: "\u0642\u0627\u062F\u0631 \u0639\u0644\u0649 \u062A\u062D\u0642\u064A\u0642 \u0646\u062A\u0627\u0626\u062C \u0623\u0641\u0636\u0644 \u0625\u0630\u0627 \u0648\u0627\u0635\u0644 \u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F", gender: "M" },
  { id: "c18", en: "Needs to work harder and pay more attention to studies.", ar: "\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0637\u0627\u0644\u0628 \u0645\u0642\u0628\u0648\u0644\u060C \u0648\u064A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0648\u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637", gender: "M" },
  { id: "c19", en: "Must be more committed to academic work to achieve success.", ar: "\u0642\u0627\u062F\u0631\u0629 \u0639\u0644\u0649 \u062A\u062D\u0642\u064A\u0642 \u0646\u062A\u0627\u0626\u062C \u0623\u0641\u0636\u0644 \u0625\u0630\u0627 \u0648\u0627\u0635\u0644\u062A \u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F", gender: "F" },
  { id: "c20", en: "Can achieve better results with increased effort and dedication.", ar: "\u064A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u062A\u062D\u0633\u064A\u0646 \u0645\u0647\u0627\u0631\u0627\u062A\u0647 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629 \u0648\u062A\u0646\u0638\u064A\u0645 \u0648\u0642\u062A\u0647", gender: "M" },
  { id: "c21", en: "Shows potential but needs greater commitment to studies.", ar: "\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0637\u0627\u0644\u0628 \u0645\u0642\u0628\u0648\u0644\u060C \u0648\u064A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0648\u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637", gender: "M" },
  { id: "c22", en: "An average performance. More focus and hard work are required.", ar: "\u0642\u0627\u062F\u0631\u0629 \u0639\u0644\u0649 \u062A\u062D\u0642\u064A\u0642 \u0646\u062A\u0627\u0626\u062C \u0623\u0641\u0636\u0644 \u0625\u0630\u0627 \u0648\u0627\u0635\u0644\u062A \u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F", gender: "F" },
  { id: "c23", en: "Can achieve better results with increased effort and dedication.", ar: "\u0642\u0627\u062F\u0631\u0629 \u0639\u0644\u0649 \u062A\u062D\u0642\u064A\u0642 \u0646\u062A\u0627\u0626\u062C \u0623\u0641\u0636\u0644 \u0625\u0630\u0627 \u0648\u0627\u0635\u0644\u062A \u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F", gender: "F" },
  { id: "c24", en: "An average performance. More focus and hard work are required.", ar: "\u0627\u0644\u0646\u062C\u0627\u062D \u062B\u0645\u0631\u0629 \u0627\u0644\u0635\u0628\u0631 \u0648\u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F\u060C \u0641\u0648\u0627\u0635\u0644 \u0645\u0633\u064A\u0631\u062A\u0643 \u0628\u062B\u0642\u0629", gender: "M" },
  { id: "c25", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "\u0627\u0644\u0646\u062C\u0627\u062D \u062B\u0645\u0631\u0629 \u0627\u0644\u0635\u0628\u0631 \u0648\u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F\u060C \u0641\u0648\u0627\u0635\u0644\u064A \u0645\u0633\u064A\u0631\u062A\u0643 \u0628\u062B\u0642\u0629", gender: "F" },
  { id: "c26", en: "Can achieve better results with increased effort and dedication.", ar: "\u0646\u0623\u0645\u0644 \u0645\u0646 \u0627\u0644\u0637\u0627\u0644\u0628 \u0628\u0630\u0644 \u062C\u0647\u062F \u0623\u0643\u0628\u0631 \u0644\u0644\u0627\u0631\u062A\u0642\u0627\u0621 \u0628\u0645\u0633\u062A\u0648\u0627\u0647 \u0627\u0644\u062F\u0631\u0627\u0633\u064A", gender: "M" },
  { id: "c27", en: "Needs to work harder and pay more attention to studies.", ar: "\u0636\u0639\u0641 \u0627\u0644\u062A\u062D\u0635\u064A\u0644 \u064A\u062A\u0637\u0644\u0628 \u0645\u0632\u064A\u062F\u064B\u0627 \u0645\u0646 \u0627\u0644\u062C\u062F \u0648\u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F", gender: "N" },
  { id: "c28", en: "Performance is below expectation. Serious improvement is needed.", ar: "\u0646\u0648\u0635\u064A \u0628\u0627\u0644\u0645\u0648\u0627\u0638\u0628\u0629 \u0639\u0644\u0649 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u0627\u0647\u062A\u0645\u0627\u0645 \u0628\u0627\u0644\u0648\u0627\u062C\u0628\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629", gender: "N" },
  { id: "c29", en: "Must be more committed to academic work to achieve success.", ar: "\u0646\u0623\u0645\u0644 \u0645\u0646 \u0627\u0644\u0637\u0627\u0644\u0628\u0629 \u0628\u0630\u0644 \u062C\u0647\u062F \u0623\u0643\u0628\u0631 \u0644\u0644\u0627\u0631\u062A\u0642\u0627\u0621 \u0628\u0645\u0633\u062A\u0648\u0627\u0647\u0627 \u0627\u0644\u062F\u0631\u0627\u0633\u064A", gender: "F" },
  { id: "c30", en: "Needs to work harder and pay more attention to studies.", ar: "\u0646\u0648\u0635\u064A \u0628\u0627\u0644\u0645\u0648\u0627\u0638\u0628\u0629 \u0639\u0644\u0649 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u0627\u0647\u062A\u0645\u0627\u0645 \u0628\u0627\u0644\u0648\u0627\u062C\u0628\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629", gender: "N" },
  { id: "c31", en: "Needs to work harder and pay more attention to studies.", ar: "\u0627\u062D\u0631\u0635 \u0639\u0644\u0649 \u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F \u0648\u0627\u0644\u0645\u062B\u0627\u0628\u0631\u0629.", gender: "N" },
  { id: "c32", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "\u0646\u0648\u0635\u064A \u0628\u0627\u0644\u0645\u0648\u0627\u0638\u0628\u0629 \u0639\u0644\u0649 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u0627\u0647\u062A\u0645\u0627\u0645 \u0628\u0627\u0644\u0648\u0627\u062C\u0628\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629", gender: "N" },
  { id: "c33", en: "Performance is below expectation. Serious improvement is needed.", ar: "\u0627\u062D\u0631\u0635 \u0639\u0644\u0649 \u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F \u0648\u0627\u0644\u0645\u062B\u0627\u0628\u0631\u0629.", gender: "N" },
  { id: "c34", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "\u0627\u062D\u0631\u0635 \u0639\u0644\u0649 \u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F \u0648\u0627\u0644\u0645\u062B\u0627\u0628\u0631\u0629.", gender: "N" },
  { id: "c35", en: "Must be more committed to academic work to achieve success.", ar: "\u0646\u0648\u0635\u064A \u0628\u0627\u0644\u0645\u0648\u0627\u0638\u0628\u0629 \u0639\u0644\u0649 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u0627\u0647\u062A\u0645\u0627\u0645 \u0628\u0627\u0644\u0648\u0627\u062C\u0628\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629", gender: "N" },
  { id: "c36", en: "Performance is below expectation. Serious improvement is needed.", ar: "\u0646\u0623\u0645\u0644 \u0645\u0646 \u0627\u0644\u0637\u0627\u0644\u0628\u0629 \u0628\u0630\u0644 \u062C\u0647\u062F \u0623\u0643\u0628\u0631 \u0644\u0644\u0627\u0631\u062A\u0642\u0627\u0621 \u0628\u0645\u0633\u062A\u0648\u0627\u0647\u0627 \u0627\u0644\u062F\u0631\u0627\u0633\u064A", gender: "F" }
];
var getCommentById = (id) => REPORT_CARD_COMMENTS.find((c) => c.id === id);

// server/controllers/reportCardRemarkController.ts
var setRemark = async (req, res) => {
  try {
    const { student, term, field, commentId, en, ar } = req.body;
    if (!student || !term || !field) {
      return res.status(400).json({ message: "student, term, and field are required" });
    }
    if (!["classTeacherComment", "principalComment"].includes(field)) {
      return res.status(400).json({ message: "Invalid field" });
    }
    if (!commentId && !(en && ar)) {
      return res.status(400).json({ message: "Provide either a commentId, or both en and ar text" });
    }
    const studentDoc = await Student_default.findById(student).select("class");
    if (!studentDoc) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (await isClassResultLocked(studentDoc.class.toString(), term)) {
      return res.status(423).json({
        message: "This class result is locked. Remarks cannot be modified while locked."
      });
    }
    if (req.user?.role === "class_teacher") {
      if (field !== "classTeacherComment") {
        return res.status(403).json({ message: "Only super_admin/branch_admin can set the principal's comment" });
      }
      const teacher = await User_default.findById(req.user.id);
      const allowedClassIds = (teacher?.classes || []).map((c) => c.toString());
      if (!allowedClassIds.includes(studentDoc.class.toString())) {
        return res.status(403).json({ message: "This student is not in one of your classes" });
      }
    }
    let finalEn = en;
    let finalAr = ar;
    let finalId = void 0;
    if (commentId) {
      const picked = getCommentById(commentId);
      if (!picked) return res.status(400).json({ message: "Unknown commentId" });
      finalEn = picked.en;
      finalAr = picked.ar;
      finalId = commentId;
    }
    const prefix = field === "classTeacherComment" ? "classTeacherComment" : "principalComment";
    const update = {
      [`${prefix}Id`]: finalId ?? null,
      // null clears any previously-picked id when switching to custom text
      [`${prefix}En`]: finalEn,
      [`${prefix}Ar`]: finalAr,
      enteredBy: req.user?.id
    };
    const remark = await ReportCardRemark_default.findOneAndUpdate(
      { student, term },
      update,
      { new: true, upsert: true }
    );
    res.status(200).json(remark);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getRemark = async (req, res) => {
  try {
    const { student, term } = req.query;
    const remark = await ReportCardRemark_default.findOne({ student, term });
    res.status(200).json(remark || null);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/reportCardRemarkRoutes.ts
var router15 = Router15();
router15.put("/", protect, authorize("super_admin", "branch_admin", "class_teacher"), setRemark);
router15.get("/", protect, authorize("super_admin", "branch_admin", "class_teacher"), getRemark);
var reportCardRemarkRoutes_default = router15;

// server/routes/resultPublicationRoutes.ts
import { Router as Router16 } from "express";
var router16 = Router16();
router16.get("/", protect, authorize("super_admin", "branch_admin", "class_teacher"), getResultPublication);
router16.get("/overview", protect, authorize("super_admin", "branch_admin"), getResultOverview);
router16.get("/audit", protect, authorize("super_admin", "branch_admin"), getClassAuditDetails);
router16.put("/", protect, authorize("super_admin", "branch_admin"), setResultPublication);
router16.post("/batch", protect, authorize("super_admin", "branch_admin"), batchSetResultPublication);
var resultPublicationRoutes_default = router16;

// server/routes/attendanceRoutes.ts
import { Router as Router17 } from "express";

// server/controllers/attendanceController.ts
var canAccessClass = async (req, classId) => {
  if (req.user?.role === "super_admin") return true;
  const [user, classDoc] = await Promise.all([
    User_default.findById(req.user?.id),
    Class_default.findById(classId)
  ]);
  if (!user || !classDoc) return false;
  if (req.user?.role === "branch_admin")
    return user.branch?.toString() === classDoc.branch.toString();
  if (req.user?.role === "class_teacher")
    return (user.classes || []).some((id) => id.toString() === classId);
  return false;
};
var getClassAttendance = async (req, res) => {
  try {
    const { class: classId, term: termId } = req.query;
    if (!classId || !termId) {
      return res.status(400).json({ message: "class and term are required" });
    }
    if (!await canAccessClass(req, classId)) {
      return res.status(403).json({ message: "You cannot access this class" });
    }
    const classDoc = await Class_default.findById(classId);
    if (!classDoc) return res.status(404).json({ message: "Class not found" });
    const [classSetting, branchSetting, globalSetting, termDoc] = await Promise.all([
      AttendanceSetting_default.findOne({ class: classId, term: termId }),
      classDoc.branch ? AttendanceSetting_default.findOne({ branch: classDoc.branch, term: termId, class: { $exists: false } }) : null,
      AttendanceSetting_default.findOne({ term: termId, class: { $exists: false }, branch: { $exists: false } }),
      Term_default.findById(termId)
    ]);
    const activeSetting = classSetting || branchSetting || globalSetting;
    const settings = {
      timesSchoolOpened: activeSetting?.timesSchoolOpened ?? termDoc?.timesSchoolOpened ?? null,
      dateResumed: activeSetting?.dateResumed || termDoc?.dateResumed || "",
      dateClosed: activeSetting?.dateClosed || termDoc?.dateClosed || "",
      nextResumption: activeSetting?.nextResumption || termDoc?.nextResumption || ""
    };
    const [students, records, isLocked] = await Promise.all([
      Student_default.find({ class: classId }).sort({ numberInClass: 1, name: 1 }).select("name numberInClass"),
      Attendance_default.find({ class: classId, term: termId }).select("student timesPresent timesAbsent"),
      isClassResultLocked(classId, termId)
    ]);
    const recordMap = new Map(
      records.map((r) => [
        r.student.toString(),
        {
          timesPresent: r.timesPresent ?? null,
          timesAbsent: r.timesAbsent ?? null
        }
      ])
    );
    const studentList = students.map((student) => {
      const rec = recordMap.get(student._id.toString());
      return {
        student: student._id,
        name: student.name,
        numberInClass: student.numberInClass,
        timesPresent: rec?.timesPresent ?? null,
        timesAbsent: rec?.timesAbsent ?? null
      };
    });
    res.status(200).json({
      settings,
      students: studentList,
      isLocked
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var saveClassAttendance = async (req, res) => {
  try {
    const { class: classId, term: termId, settings, records } = req.body;
    if (!classId || !termId) {
      return res.status(400).json({ message: "class and term are required" });
    }
    if (!await canAccessClass(req, classId)) {
      return res.status(403).json({ message: "You cannot manage this class" });
    }
    if (await isClassResultLocked(classId, termId)) {
      return res.status(423).json({
        message: "This class result is locked and attendance cannot be changed"
      });
    }
    const classDoc = await Class_default.findById(classId);
    if (!classDoc) return res.status(404).json({ message: "Class not found" });
    if (settings) {
      const timesOpened = settings.timesSchoolOpened !== void 0 && settings.timesSchoolOpened !== null && settings.timesSchoolOpened !== "" ? Number(settings.timesSchoolOpened) : null;
      if (req.user?.role === "super_admin" || req.user?.role === "branch_admin") {
        if (settings.applyToWholeBranch && classDoc.branch) {
          await AttendanceSetting_default.findOneAndUpdate(
            { term: termId, branch: classDoc.branch, class: { $exists: false } },
            {
              timesSchoolOpened: timesOpened,
              dateResumed: settings.dateResumed?.trim() || "",
              dateClosed: settings.dateClosed?.trim() || "",
              nextResumption: settings.nextResumption?.trim() || "",
              updatedBy: req.user.id
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      }
      await AttendanceSetting_default.findOneAndUpdate(
        { term: termId, class: classId },
        {
          branch: classDoc.branch,
          timesSchoolOpened: timesOpened,
          dateResumed: settings.dateResumed?.trim() || "",
          dateClosed: settings.dateClosed?.trim() || "",
          nextResumption: settings.nextResumption?.trim() || "",
          updatedBy: req.user?.id
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    if (Array.isArray(records) && records.length > 0) {
      const enrolled = await Student_default.countDocuments({
        _id: { $in: records.map((r) => r.student) },
        class: classId
      });
      if (enrolled !== records.length) {
        return res.status(400).json({
          message: "One or more students do not belong to this class"
        });
      }
      await Promise.all(
        records.map((r) => {
          const timesPresent = r.timesPresent !== void 0 && r.timesPresent !== null && r.timesPresent !== "" ? Number(r.timesPresent) : null;
          const timesAbsent = r.timesAbsent !== void 0 && r.timesAbsent !== null && r.timesAbsent !== "" ? Number(r.timesAbsent) : null;
          return Attendance_default.findOneAndUpdate(
            { student: r.student, term: termId },
            {
              class: classId,
              timesPresent,
              timesAbsent,
              recordedBy: req.user.id
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        })
      );
    }
    res.status(200).json({ message: "Attendance and settings saved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getAttendanceSettings = async (req, res) => {
  try {
    const { term: termId, branch: branchId } = req.query;
    if (!termId) return res.status(400).json({ message: "term is required" });
    const query = { term: termId, class: { $exists: false } };
    if (branchId) query.branch = branchId;
    const setting = await AttendanceSetting_default.findOne(query);
    const termDoc = await Term_default.findById(termId);
    res.status(200).json({
      timesSchoolOpened: setting?.timesSchoolOpened ?? termDoc?.timesSchoolOpened ?? null,
      dateResumed: setting?.dateResumed || termDoc?.dateResumed || "",
      dateClosed: setting?.dateClosed || termDoc?.dateClosed || "",
      nextResumption: setting?.nextResumption || termDoc?.nextResumption || ""
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var saveAttendanceSettings = async (req, res) => {
  try {
    const { term: termId, branch: branchId, timesSchoolOpened, dateResumed, dateClosed, nextResumption } = req.body;
    if (!termId) return res.status(400).json({ message: "term is required" });
    const timesOpened = timesSchoolOpened !== void 0 && timesSchoolOpened !== null && timesSchoolOpened !== "" ? Number(timesSchoolOpened) : null;
    const query = { term: termId, class: { $exists: false } };
    if (branchId) query.branch = branchId;
    const updated = await AttendanceSetting_default.findOneAndUpdate(
      query,
      {
        timesSchoolOpened: timesOpened,
        dateResumed: dateResumed?.trim() || "",
        dateClosed: dateClosed?.trim() || "",
        nextResumption: nextResumption?.trim() || "",
        updatedBy: req.user?.id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ message: "Central attendance settings saved", settings: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/attendanceRoutes.ts
var router17 = Router17();
router17.get("/", protect, authorize("super_admin", "branch_admin", "class_teacher"), getClassAttendance);
router17.put("/bulk", protect, authorize("super_admin", "branch_admin", "class_teacher"), saveClassAttendance);
router17.get("/settings", protect, authorize("super_admin", "branch_admin"), getAttendanceSettings);
router17.put("/settings", protect, authorize("super_admin", "branch_admin"), saveAttendanceSettings);
var attendanceRoutes_default = router17;

// server/routes/reportCardSettingRoutes.ts
import { Router as Router18 } from "express";

// server/controllers/reportCardSettingController.ts
var getReportCardSetting = async (_req, res) => {
  try {
    let setting = await ReportCardSetting_default.findOne();
    if (!setting) {
      setting = await ReportCardSetting_default.create({
        schoolNameArabic: "\u0645\u0639\u0647\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A",
        schoolNameEnglish: "INSTITUTE OF ARABIC AND ISLAMIC STUDIES",
        address: "18/20 ABEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665",
        logoBase64: "",
        primaryColor: "#16a34a",
        headerColor: "#1e3a8a",
        showPrincipalSignature: false,
        principalSignatureBase64: "",
        showStamp: false,
        stampBase64: "",
        watermarkText: ""
      });
    }
    res.status(200).json(setting);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var updateReportCardSetting = async (req, res) => {
  try {
    const {
      schoolNameArabic,
      schoolNameEnglish,
      address,
      logoBase64: logoBase642,
      primaryColor,
      headerColor,
      showPrincipalSignature,
      principalSignatureBase64,
      showStamp,
      stampBase64,
      watermarkText
    } = req.body;
    let setting = await ReportCardSetting_default.findOne();
    if (!setting) {
      setting = new ReportCardSetting_default({});
    }
    if (schoolNameArabic !== void 0) setting.schoolNameArabic = schoolNameArabic;
    if (schoolNameEnglish !== void 0) setting.schoolNameEnglish = schoolNameEnglish;
    if (address !== void 0) setting.address = address;
    if (logoBase642 !== void 0) setting.logoBase64 = logoBase642;
    if (primaryColor !== void 0) setting.primaryColor = primaryColor;
    if (headerColor !== void 0) setting.headerColor = headerColor;
    if (showPrincipalSignature !== void 0)
      setting.showPrincipalSignature = showPrincipalSignature;
    if (principalSignatureBase64 !== void 0)
      setting.principalSignatureBase64 = principalSignatureBase64;
    if (showStamp !== void 0) setting.showStamp = showStamp;
    if (stampBase64 !== void 0) setting.stampBase64 = stampBase64;
    if (watermarkText !== void 0) setting.watermarkText = watermarkText;
    if (req.user) {
      setting.updatedBy = req.user._id;
    }
    await setting.save();
    res.status(200).json(setting);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var resetReportCardSetting = async (req, res) => {
  try {
    let setting = await ReportCardSetting_default.findOne();
    if (setting) {
      await ReportCardSetting_default.deleteOne({ _id: setting._id });
    }
    const defaultSetting = await ReportCardSetting_default.create({
      schoolNameArabic: "\u0645\u0639\u0647\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A",
      schoolNameEnglish: "INSTITUTE OF ARABIC AND ISLAMIC STUDIES",
      address: "18/20 ABEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665",
      logoBase64: "",
      primaryColor: "#16a34a",
      headerColor: "#1e3a8a",
      showPrincipalSignature: false,
      principalSignatureBase64: "",
      showStamp: false,
      stampBase64: "",
      watermarkText: "",
      updatedBy: req.user ? req.user._id : void 0
    });
    res.status(200).json(defaultSetting);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/reportCardSettingRoutes.ts
var router18 = Router18();
router18.get("/", getReportCardSetting);
router18.put(
  "/",
  protect,
  authorize("super_admin", "branch_admin"),
  updateReportCardSetting
);
router18.post(
  "/reset",
  protect,
  authorize("super_admin"),
  resetReportCardSetting
);
var reportCardSettingRoutes_default = router18;

// server/middleware/errorHandler.ts
var errorHandler = (err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
};

// server/app.ts
dotenv.config();
var app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));
app.use(async (_req, _res, next) => {
  try {
    await db_default();
    next();
  } catch (err) {
    console.error("Database connection middleware error:", err);
    next();
  }
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "School Management System API is healthy" });
});
app.use("/api/auth", authRoutes_default);
app.use("/api/users", userRoutes_default);
app.use("/api/branches", branchRoutes_default);
app.use("/api/classes", classRoutes_default);
app.use("/api/subjects", subjectRoutes_default);
app.use("/api/grading-scales", gradingScaleRoutes_default);
app.use("/api/students", studentRoutes_default);
app.use("/api/scores", scoreRoutes_default);
app.use("/api/broadsheet", broadsheetRoutes_default);
app.use("/api/report-card", reportCardRoutes_default);
app.use("/api/report-card/pdf", pdfRoutes_default);
app.use("/api/report-card-settings", reportCardSettingRoutes_default);
app.use("/api/dashboard", dashboardRoutes_default);
app.use("/api/parent-portal", parentPortalRoutes_default);
app.use("/api/terms", termRoutes_default);
app.use("/api/report-card-remarks", reportCardRemarkRoutes_default);
app.use("/api/result-publications", resultPublicationRoutes_default);
app.use("/api/attendance", attendanceRoutes_default);
app.use("/api", errorHandler);
var app_default = app;
export {
  app,
  app_default as default
};

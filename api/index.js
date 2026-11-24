var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/models/User.ts
var User_exports = {};
__export(User_exports, {
  default: () => User_default
});
import mongoose2, { Schema } from "mongoose";
var UserSchema, User_default;
var init_User = __esm({
  "server/models/User.ts"() {
    UserSchema = new Schema(
      {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String },
        password: { type: String, required: true },
        role: {
          type: String,
          enum: ["super_admin", "branch_admin", "class_teacher", "subject_teacher", "parent"],
          required: true
        },
        status: {
          type: String,
          enum: ["active", "pending_approval", "rejected", "suspended"],
          default: "active"
        },
        rejectionReason: { type: String },
        branch: { type: Schema.Types.ObjectId, ref: "Branch" },
        classes: [{ type: Schema.Types.ObjectId, ref: "Class" }],
        subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
        linkedStudent: { type: Schema.Types.ObjectId, ref: "Student" },
        linkedStudents: [{ type: Schema.Types.ObjectId, ref: "Student" }],
        mustChangePassword: { type: Boolean, default: true },
        staffCodeUsed: { type: String },
        resetPasswordCode: { type: String },
        resetPasswordExpires: { type: Date }
      },
      { timestamps: true }
    );
    User_default = mongoose2.model("User", UserSchema);
  }
});

// server/models/Student.ts
import mongoose3, { Schema as Schema2 } from "mongoose";
var StudentSchema, Student_default;
var init_Student = __esm({
  "server/models/Student.ts"() {
    StudentSchema = new Schema2(
      {
        name: { type: String, required: true },
        gender: { type: String, enum: ["M", "F"], required: true },
        class: { type: Schema2.Types.ObjectId, ref: "Class", required: true },
        branch: { type: Schema2.Types.ObjectId, ref: "Branch", required: true },
        numberInClass: { type: Number },
        admissionNumber: { type: String, trim: true },
        studentCode: { type: String, trim: true },
        seatNumber: { type: String, trim: true },
        sourceSchool: { type: String, trim: true },
        resultModeOverride: {
          type: String,
          enum: ["default", "current_only", "combine_1st_and_3rd"],
          default: "default"
        },
        excludedSubjects: [
          {
            type: Schema2.Types.ObjectId,
            ref: "Subject"
          }
        ],
        parentPhone: { type: String, trim: true },
        parentEmail: { type: String, trim: true },
        status: {
          type: String,
          enum: ["active", "graduated", "transferred", "archived"],
          default: "active"
        },
        graduationSession: { type: String },
        enrolledTerms: {
          type: [Number],
          default: [1, 2, 3]
        },
        joinedTerm: {
          type: Number,
          enum: [1, 2, 3],
          default: 1
        }
      },
      { timestamps: true }
    );
    Student_default = mongoose3.model("Student", StudentSchema);
  }
});

// server/models/Class.ts
import mongoose4, { Schema as Schema3 } from "mongoose";
var ClassSchema, Class_default;
var init_Class = __esm({
  "server/models/Class.ts"() {
    ClassSchema = new Schema3({
      name: { type: String, required: true },
      arm: { type: String },
      // optional on purpose
      category: {
        type: String,
        enum: ["secondary", "elementary"],
        default: "secondary"
      },
      branch: { type: Schema3.Types.ObjectId, ref: "Branch", required: true },
      isGraduating: { type: Boolean, default: false },
      graduatingLevel: {
        type: String,
        enum: ["elementary", "junior_secondary", "senior_secondary"]
      },
      sourceSchool: { type: String, trim: true },
      secondaryResultMode: {
        type: String,
        enum: ["current_only", "combine_1st_and_3rd"],
        default: "current_only"
      },
      createdAt: { type: Date, default: Date.now }
    });
    Class_default = mongoose4.model("Class", ClassSchema);
  }
});

// server/models/Subject.ts
import mongoose5, { Schema as Schema4 } from "mongoose";
var SubjectSchema, Subject_default;
var init_Subject = __esm({
  "server/models/Subject.ts"() {
    SubjectSchema = new Schema4({
      nameEnglish: { type: String, required: true },
      nameArabic: { type: String },
      class: { type: Schema4.Types.ObjectId, ref: "Class", required: true },
      order: { type: Number, default: 0 }
    });
    Subject_default = mongoose5.model("Subject", SubjectSchema);
  }
});

// server/models/Branch.ts
var Branch_exports = {};
__export(Branch_exports, {
  default: () => Branch_default
});
import mongoose8, { Schema as Schema6 } from "mongoose";
var BranchSchema, Branch_default;
var init_Branch = __esm({
  "server/models/Branch.ts"() {
    BranchSchema = new Schema6({
      name: { type: String, required: true, unique: true },
      address: { type: String },
      createdAt: { type: Date, default: Date.now }
    });
    Branch_default = mongoose8.model("Branch", BranchSchema);
  }
});

// server/models/Score.ts
import mongoose9, { Schema as Schema7 } from "mongoose";
var ScoreSchema, Score_default;
var init_Score = __esm({
  "server/models/Score.ts"() {
    ScoreSchema = new Schema7({
      student: { type: Schema7.Types.ObjectId, ref: "Student", required: true },
      subject: { type: Schema7.Types.ObjectId, ref: "Subject", required: true },
      term: { type: Schema7.Types.ObjectId, ref: "Term", required: true },
      ca: { type: Number, required: true, min: 0, max: 40 },
      exam: { type: Number, required: true, min: 0, max: 60 },
      total: { type: Number, required: true, min: 0, max: 100 },
      enteredBy: { type: Schema7.Types.ObjectId, ref: "User", required: true }
    });
    ScoreSchema.index({ student: 1, subject: 1, term: 1 }, { unique: true });
    Score_default = mongoose9.model("Score", ScoreSchema);
  }
});

// server/models/Attendance.ts
import mongoose10, { Schema as Schema8 } from "mongoose";
var AttendanceSchema, Attendance_default;
var init_Attendance = __esm({
  "server/models/Attendance.ts"() {
    AttendanceSchema = new Schema8(
      {
        student: { type: Schema8.Types.ObjectId, ref: "Student", required: true },
        class: { type: Schema8.Types.ObjectId, ref: "Class", required: true },
        term: { type: Schema8.Types.ObjectId, ref: "Term", required: true },
        timesPresent: { type: Number, default: null },
        timesAbsent: { type: Number, default: null },
        recordedBy: { type: Schema8.Types.ObjectId, ref: "User" }
      },
      { timestamps: true }
    );
    AttendanceSchema.index({ student: 1, term: 1 }, { unique: true });
    AttendanceSchema.index({ class: 1, term: 1 });
    Attendance_default = mongoose10.model("Attendance", AttendanceSchema);
  }
});

// server/models/AttendanceSetting.ts
import mongoose11, { Schema as Schema9 } from "mongoose";
var AttendanceSettingSchema, AttendanceSetting_default;
var init_AttendanceSetting = __esm({
  "server/models/AttendanceSetting.ts"() {
    AttendanceSettingSchema = new Schema9(
      {
        term: { type: Schema9.Types.ObjectId, ref: "Term", required: true },
        branch: { type: Schema9.Types.ObjectId, ref: "Branch" },
        class: { type: Schema9.Types.ObjectId, ref: "Class" },
        timesSchoolOpened: { type: Number, default: null },
        dateResumed: { type: String, default: "" },
        dateClosed: { type: String, default: "" },
        nextResumption: { type: String, default: "" },
        updatedBy: { type: Schema9.Types.ObjectId, ref: "User" }
      },
      { timestamps: true }
    );
    AttendanceSettingSchema.index(
      { term: 1, class: 1 },
      { unique: true, partialFilterExpression: { class: { $type: "objectId" } } }
    );
    AttendanceSettingSchema.index({ term: 1, branch: 1 });
    AttendanceSettingSchema.index({ term: 1 });
    AttendanceSetting_default = mongoose11.model(
      "AttendanceSetting",
      AttendanceSettingSchema
    );
  }
});

// server/models/ReportCardRemark.ts
import mongoose12, { Schema as Schema10 } from "mongoose";
var ReportCardRemarkSchema, ReportCardRemark_default;
var init_ReportCardRemark = __esm({
  "server/models/ReportCardRemark.ts"() {
    ReportCardRemarkSchema = new Schema10({
      student: { type: Schema10.Types.ObjectId, ref: "Student", required: true },
      term: { type: Schema10.Types.ObjectId, ref: "Term", required: true },
      classTeacherCommentId: { type: String },
      classTeacherCommentEn: { type: String },
      classTeacherCommentAr: { type: String },
      principalCommentId: { type: String },
      principalCommentEn: { type: String },
      principalCommentAr: { type: String },
      affectiveScores: { type: Schema10.Types.Mixed, default: {} },
      enteredBy: { type: Schema10.Types.ObjectId, ref: "User" }
    });
    ReportCardRemarkSchema.index({ student: 1, term: 1 }, { unique: true });
    ReportCardRemark_default = mongoose12.model("ReportCardRemark", ReportCardRemarkSchema);
  }
});

// server/models/ResultPublication.ts
import mongoose13, { Schema as Schema11 } from "mongoose";
var ResultPublicationSchema, ResultPublication_default;
var init_ResultPublication = __esm({
  "server/models/ResultPublication.ts"() {
    ResultPublicationSchema = new Schema11(
      {
        class: { type: Schema11.Types.ObjectId, ref: "Class", required: true },
        term: { type: Schema11.Types.ObjectId, ref: "Term", required: true },
        status: {
          type: String,
          enum: ["draft", "published", "locked"],
          default: "draft",
          required: true
        },
        publishedBy: { type: Schema11.Types.ObjectId, ref: "User" },
        publishedAt: { type: Date },
        lockedBy: { type: Schema11.Types.ObjectId, ref: "User" },
        lockedAt: { type: Date }
      },
      { timestamps: true }
    );
    ResultPublicationSchema.index({ class: 1, term: 1 }, { unique: true });
    ResultPublication_default = mongoose13.model(
      "ResultPublication",
      ResultPublicationSchema
    );
  }
});

// server/models/GradingScale.ts
import mongoose14, { Schema as Schema12 } from "mongoose";
var GradeBandSchema, GradingScaleSchema, GradingScale_default;
var init_GradingScale = __esm({
  "server/models/GradingScale.ts"() {
    GradeBandSchema = new Schema12(
      {
        minScore: { type: Number, required: true },
        maxScore: { type: Number, required: true },
        grade: { type: String, required: true },
        remark: { type: String, required: true },
        remarkArabic: { type: String, required: true }
      },
      { _id: false }
    );
    GradingScaleSchema = new Schema12({
      name: { type: String, required: true },
      bands: [GradeBandSchema]
    });
    GradingScale_default = mongoose14.model("GradingScale", GradingScaleSchema);
  }
});

// server/controllers/gradingScaleController.ts
var gradingScaleController_exports = {};
__export(gradingScaleController_exports, {
  TAQDEER_DEFAULT_BANDS: () => TAQDEER_DEFAULT_BANDS,
  createGradingScale: () => createGradingScale,
  deleteGradingScale: () => deleteGradingScale,
  ensureDefaultGradingScale: () => ensureDefaultGradingScale,
  getGradingScales: () => getGradingScales,
  resetTaqdeerScale: () => resetTaqdeerScale,
  updateGradingScale: () => updateGradingScale
});
var TAQDEER_DEFAULT_BANDS, ensureDefaultGradingScale, createGradingScale, getGradingScales, updateGradingScale, deleteGradingScale, resetTaqdeerScale;
var init_gradingScaleController = __esm({
  "server/controllers/gradingScaleController.ts"() {
    init_GradingScale();
    TAQDEER_DEFAULT_BANDS = [
      { minScore: 85, maxScore: 100, grade: "A1", remark: "Excellent", remarkArabic: "\u0645\u0645\u062A\u0627\u0632" },
      { minScore: 75, maxScore: 84.9, grade: "B2", remark: "Very Good", remarkArabic: "\u062C\u064A\u062F \u062C\u062F\u0627" },
      { minScore: 60, maxScore: 74.9, grade: "C4", remark: "Good", remarkArabic: "\u062C\u064A\u062F" },
      { minScore: 50, maxScore: 59.9, grade: "D7", remark: "Pass", remarkArabic: "\u0645\u0642\u0628\u0648\u0644" },
      { minScore: 0, maxScore: 49.9, grade: "F9", remark: "Fail", remarkArabic: "\u0631\u0627\u0633\u0628" }
    ];
    ensureDefaultGradingScale = async () => {
      try {
        let taqdeer = await GradingScale_default.findOne({ name: "\u0627\u0644\u062A\u0642\u062F\u064A\u0631" });
        if (!taqdeer) {
          taqdeer = await GradingScale_default.create({
            name: "\u0627\u0644\u062A\u0642\u062F\u064A\u0631",
            bands: TAQDEER_DEFAULT_BANDS
          });
          console.log("[GradingScale] Created default '\u0627\u0644\u062A\u0642\u062F\u064A\u0631' scale.");
        } else {
          const hasOldScale = taqdeer.bands.some((b) => b.minScore === 70 && (b.grade === "A1" || b.grade === "A"));
          if (!taqdeer.bands || taqdeer.bands.length === 0 || hasOldScale) {
            taqdeer.bands = TAQDEER_DEFAULT_BANDS;
            await taqdeer.save();
            console.log("[GradingScale] Updated '\u0627\u0644\u062A\u0642\u062F\u064A\u0631' scale to standard 85-100% A1 scale.");
          }
        }
        return taqdeer;
      } catch (err) {
        console.error("[GradingScale] ensureDefaultGradingScale error:", err);
        return null;
      }
    };
    createGradingScale = async (req, res) => {
      try {
        const { name, bands } = req.body;
        const scale = await GradingScale_default.create({ name, bands });
        res.status(201).json(scale);
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    };
    getGradingScales = async (_req, res) => {
      try {
        await ensureDefaultGradingScale();
        const scales = await GradingScale_default.find();
        res.status(200).json(scales);
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    };
    updateGradingScale = async (req, res) => {
      try {
        const updated = await GradingScale_default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: "Grading scale not found" });
        res.status(200).json(updated);
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    };
    deleteGradingScale = async (req, res) => {
      try {
        const deleted = await GradingScale_default.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Grading scale not found" });
        res.status(200).json({ message: "Grading scale deleted" });
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    };
    resetTaqdeerScale = async (_req, res) => {
      try {
        let scale = await GradingScale_default.findOne({ name: "\u0627\u0644\u062A\u0642\u062F\u064A\u0631" });
        if (!scale) {
          scale = await GradingScale_default.create({
            name: "\u0627\u0644\u062A\u0642\u062F\u064A\u0631",
            bands: TAQDEER_DEFAULT_BANDS
          });
        } else {
          scale.bands = TAQDEER_DEFAULT_BANDS;
          await scale.save();
        }
        res.status(200).json({ message: "Reset to standard \u0627\u0644\u062A\u0642\u062F\u064A\u0631 scale successfully", scale });
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    };
  }
});

// server/utils/dataCleanup.ts
var dataCleanup_exports = {};
__export(dataCleanup_exports, {
  purgeOrphanedData: () => purgeOrphanedData
});
var purgeOrphanedData;
var init_dataCleanup = __esm({
  "server/utils/dataCleanup.ts"() {
    init_Class();
    init_Student();
    init_Subject();
    init_Score();
    init_Attendance();
    init_AttendanceSetting();
    init_ReportCardRemark();
    init_ResultPublication();
    init_User();
    purgeOrphanedData = async () => {
      try {
        const validClasses = await Class_default.find().select("_id");
        const validClassIds = validClasses.map((c) => c._id);
        const orphanedStudents = await Student_default.find({
          $or: [
            { class: { $nin: validClassIds } },
            { class: { $exists: false } },
            { class: null }
          ]
        }).select("_id name");
        const orphanedStudentIds = orphanedStudents.map((s) => s._id);
        const orphanedSubjects = await Subject_default.find({
          $or: [
            { class: { $nin: validClassIds } },
            { class: { $exists: false } },
            { class: null }
          ]
        }).select("_id");
        const orphanedSubjectIds = orphanedSubjects.map((s) => s._id);
        let deletedScoresCount = 0;
        const scoreOrConditions = [];
        if (orphanedStudentIds.length > 0) {
          scoreOrConditions.push({ student: { $in: orphanedStudentIds } });
        }
        if (orphanedSubjectIds.length > 0) {
          scoreOrConditions.push({ subject: { $in: orphanedSubjectIds } });
        }
        if (scoreOrConditions.length > 0) {
          const scoreDeleteRes = await Score_default.deleteMany({ $or: scoreOrConditions });
          deletedScoresCount = scoreDeleteRes.deletedCount || 0;
        }
        let deletedAttendanceCount = 0;
        const attOrConditions = [];
        if (orphanedStudentIds.length > 0) {
          attOrConditions.push({ student: { $in: orphanedStudentIds } });
        }
        if (validClassIds.length > 0) {
          attOrConditions.push({ class: { $nin: validClassIds } });
        }
        if (attOrConditions.length > 0) {
          const attendanceDeleteRes = await Attendance_default.deleteMany({ $or: attOrConditions });
          deletedAttendanceCount = attendanceDeleteRes.deletedCount || 0;
        }
        await AttendanceSetting_default.deleteMany({
          class: { $nin: validClassIds }
        });
        let remarksDeletedCount = 0;
        if (orphanedStudentIds.length > 0) {
          const remarkRes = await ReportCardRemark_default.deleteMany({
            student: { $in: orphanedStudentIds }
          });
          remarksDeletedCount = remarkRes.deletedCount || 0;
        }
        await ResultPublication_default.deleteMany({
          class: { $nin: validClassIds }
        });
        if (orphanedStudentIds.length > 0) {
          await User_default.updateMany(
            { linkedStudent: { $in: orphanedStudentIds } },
            { $unset: { linkedStudent: 1 } }
          );
        }
        if (orphanedSubjectIds.length > 0) {
          await User_default.updateMany(
            { subjects: { $in: orphanedSubjectIds } },
            { $pull: { subjects: { $in: orphanedSubjectIds } } }
          );
        }
        await User_default.updateMany(
          { classes: { $nin: validClassIds } },
          { $pull: { classes: { $nin: validClassIds } } }
        );
        let subjectsDeletedCount = 0;
        if (orphanedSubjectIds.length > 0) {
          const subRes = await Subject_default.deleteMany({ _id: { $in: orphanedSubjectIds } });
          subjectsDeletedCount = subRes.deletedCount || 0;
        }
        let studentsDeletedCount = 0;
        if (orphanedStudentIds.length > 0) {
          const studRes = await Student_default.deleteMany({ _id: { $in: orphanedStudentIds } });
          studentsDeletedCount = studRes.deletedCount || 0;
        }
        if (studentsDeletedCount > 0 || subjectsDeletedCount > 0 || deletedScoresCount > 0 || deletedAttendanceCount > 0) {
          console.log(
            `[Data Cleanup] Purged ${studentsDeletedCount} orphaned students, ${subjectsDeletedCount} orphaned subjects, ${deletedScoresCount} scores, ${deletedAttendanceCount} attendance records.`
          );
        }
        return {
          deletedStudentsCount: studentsDeletedCount,
          deletedSubjectsCount: subjectsDeletedCount,
          deletedScoresCount,
          deletedAttendanceCount,
          deletedRemarksCount: remarksDeletedCount
        };
      } catch (error) {
        console.error("[Data Cleanup] Error purging orphaned data:", error);
        throw error;
      }
    };
  }
});

// server/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose22 from "mongoose";

// server/config/db.ts
import mongoose from "mongoose";
var cached = globalThis._mongooseConnectionCache;
if (!cached) {
  cached = globalThis._mongooseConnectionCache = { conn: null, promise: null };
}
var connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return mongoose;
  }
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (err) {
      cached.promise = null;
      cached.conn = null;
      throw err;
    }
  }
  const mongoUri = (process.env.MONGODB_URI || process.env.MONGO_URI)?.trim();
  let uriDbName;
  if (mongoUri) {
    try {
      const parsedUrl = new URL(mongoUri.replace(/^mongodb(\+srv)?:\/\//, "https://"));
      const extractedPath = parsedUrl.pathname.replace(/^\//, "").trim();
      if (extractedPath) {
        uriDbName = decodeURIComponent(extractedPath);
      }
    } catch {
    }
  }
  const targetDbName = process.env.MONGODB_DB_NAME?.trim() || uriDbName || "test";
  const maxPoolSize = Math.max(1, Math.min(20, Number(process.env.MONGODB_MAX_POOL_SIZE) || 10));
  const connectionOptions = {
    dbName: targetDbName,
    maxPoolSize,
    minPoolSize: 0,
    maxIdleTimeMS: 2e4,
    serverSelectionTimeoutMS: 8e3,
    connectTimeoutMS: 8e3,
    socketTimeoutMS: 3e4
  };
  cached.promise = (async () => {
    if (mongoUri) {
      try {
        console.log(`[Database] Connecting to MongoDB Atlas (Pool: ${maxPoolSize}, DB: ${targetDbName || "default"})...`);
        const conn = await mongoose.connect(mongoUri, connectionOptions);
        const activeDb = conn.connection.db?.databaseName || conn.connection.name;
        console.log(`[Database] Connected successfully (Host: ${conn.connection.host}, DB: ${activeDb})`);
        return conn;
      } catch (externalErr) {
        console.warn(`[Database] External MongoDB connection failed: ${externalErr.message}`);
        if (process.env.NODE_ENV === "production") {
          throw externalErr;
        }
      }
    }
    if (process.env.NODE_ENV !== "production") {
      console.log("[Database] Starting in-memory MongoDB server for local development...");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      const conn = await mongoose.connect(uri, {
        dbName: targetDbName || "test",
        serverSelectionTimeoutMS: 1e4,
        connectTimeoutMS: 1e4
      });
      console.log(`[Database] In-memory MongoDB connected: ${uri}, DB: ${targetDbName || "test"}`);
      return conn;
    }
    throw new Error(
      "No MongoDB connection URI provided (missing MONGODB_URI) and not running in development mode."
    );
  })();
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    console.error("[Database] DB Connection Error:", err.message);
    throw err;
  }
};
var db_default = connectDB;

// server/routes/authRoutes.ts
import { Router } from "express";

// server/controllers/authController.ts
init_User();
init_Student();
init_Class();
init_Subject();
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose7 from "mongoose";

// server/models/ReportCardSetting.ts
import mongoose6, { Schema as Schema5 } from "mongoose";
var ReportCardSettingSchema = new Schema5(
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
      default: "18/20 ADEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665"
    },
    logoBase64: { type: String, default: "" },
    primaryColor: { type: String, default: "#16a34a" },
    headerColor: { type: String, default: "#1e3a8a" },
    showPrincipalSignature: { type: Boolean, default: false },
    principalSignatureBase64: { type: String, default: "" },
    showStamp: { type: Boolean, default: false },
    stampBase64: { type: String, default: "" },
    watermarkText: { type: String, default: "" },
    staffRegistrationCode: { type: String, default: "STAFF-2026" },
    resendApiKey: { type: String, default: "" },
    resendFromEmail: { type: String, default: "" },
    updatedBy: { type: Schema5.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
var ReportCardSetting_default = mongoose6.model(
  "ReportCardSetting",
  ReportCardSettingSchema
);

// server/services/emailService.ts
import { Resend } from "resend";
var sendPasswordResetEmail = async (toEmail, userName, resetCode) => {
  let apiKey = process.env.RESEND_API_KEY?.trim() || "";
  let customFrom = process.env.RESEND_FROM_EMAIL?.trim() || "";
  let schoolEnglish = "Institute of Arabic and Islamic Studies";
  let schoolArabic = "\u0645\u0639\u0647\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A";
  try {
    const setting = await ReportCardSetting_default.findOne().lean();
    if (setting?.schoolNameEnglish) schoolEnglish = setting.schoolNameEnglish;
    if (setting?.schoolNameArabic) schoolArabic = setting.schoolNameArabic;
    if (setting?.resendApiKey?.trim()) apiKey = setting.resendApiKey.trim();
    if (setting?.resendFromEmail?.trim()) customFrom = setting.resendFromEmail.trim();
  } catch {
  }
  if (!apiKey) {
    console.warn("[EmailService] RESEND_API_KEY is not defined in environment variables or database settings. Email will not be sent.");
    return {
      success: false,
      reason: "MISSING_API_KEY",
      error: "RESEND_API_KEY is not configured. Please set it in Admin Settings or in .env file."
    };
  }
  try {
    const resend = new Resend(apiKey);
    const fromAddress = customFrom || `${schoolEnglish} <onboarding@resend.dev>`;
    const subject = `Your Password Reset Verification Code: ${resetCode}`;
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0c4a6e, #0369a1); padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #bae6fd; font-family: 'Amiri', serif, Arial; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
    .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .code-card { background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
    .code-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #15803d; font-weight: 700; margin-bottom: 8px; }
    .code-value { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #166534; font-family: monospace, Courier; margin: 0; }
    .expiry { font-size: 12px; color: #64748b; margin-top: 8px; }
    .security-note { font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; }
    .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${schoolEnglish}</h1>
      <p dir="rtl">${schoolArabic}</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${userName || "User"},</div>
      <div class="message">
        We received a request to reset your password for the school management portal. Use the 6-digit verification code below to complete your password reset:
      </div>
      
      <div class="code-card">
        <div class="code-label">Verification Code</div>
        <div class="code-value">${resetCode}</div>
        <div class="expiry">This code will expire in <strong>15 minutes</strong>.</div>
      </div>

      <div class="security-note">
        <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email or notify your school administrator immediately. Your password remains safe and unchanged.
      </div>
    </div>
    <div class="footer">
      &copy; ${(/* @__PURE__ */ new Date()).getFullYear()} ${schoolEnglish}. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;
    const textContent = `
${schoolEnglish}
${schoolArabic}

Hello ${userName || "User"},

We received a request to reset the password for your school portal account.

Your verification code is: ${resetCode}

This code will expire in 15 minutes.

If you did not request a password reset, please ignore this email or contact your administrator.
    `.trim();
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject,
      html: htmlContent,
      text: textContent
    });
    if (error) {
      console.error("[EmailService] Resend API returned error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email via Resend"
      };
    }
    console.log(`[EmailService] Password reset verification code email sent successfully to ${toEmail}. Message ID: ${data?.id}`);
    return {
      success: true,
      id: data?.id
    };
  } catch (err) {
    console.error("[EmailService] Exception while sending email with Resend:", err);
    return {
      success: false,
      error: err.message || "Unexpected error while sending email"
    };
  }
};
var sendTestEmail = async (toEmail) => {
  let apiKey = process.env.RESEND_API_KEY?.trim() || "";
  let customFrom = process.env.RESEND_FROM_EMAIL?.trim() || "";
  let schoolEnglish = "Institute of Arabic and Islamic Studies";
  try {
    const setting = await ReportCardSetting_default.findOne().lean();
    if (setting?.schoolNameEnglish) schoolEnglish = setting.schoolNameEnglish;
    if (setting?.resendApiKey?.trim()) apiKey = setting.resendApiKey.trim();
    if (setting?.resendFromEmail?.trim()) customFrom = setting.resendFromEmail.trim();
  } catch {
  }
  if (!apiKey) {
    return {
      success: false,
      reason: "MISSING_API_KEY",
      error: "RESEND_API_KEY is not configured."
    };
  }
  try {
    const resend = new Resend(apiKey);
    const fromAddress = customFrom || `${schoolEnglish} <onboarding@resend.dev>`;
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: `Resend Test Email - ${schoolEnglish}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #0369a1;">Resend Email Configuration Verified!</h2>
          <p>This is a test email sent from <strong>${schoolEnglish}</strong>.</p>
          <p>Your Resend API key and email dispatch are functioning properly for password resets.</p>
          <p style="color: #64748b; font-size: 12px; margin-top: 24px;">Sent at: ${(/* @__PURE__ */ new Date()).toISOString()}</p>
        </div>
      `
    });
    if (error) {
      return { success: false, error: error.message || "Failed to send test email" };
    }
    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: err.message || "Unexpected error" };
  }
};

// server/controllers/authController.ts
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
    const existing = await User_default.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    let finalBranch = branch;
    const authReq = req;
    if (authReq.user?.role === "branch_admin" && authReq.user.branch) {
      finalBranch = authReq.user.branch;
    } else if (!finalBranch && Array.isArray(classes) && classes.length > 0) {
      const cls = await Class_default.findOne({ _id: { $in: classes } }).select("branch");
      if (cls && cls.branch) finalBranch = cls.branch;
    } else if (!finalBranch && Array.isArray(subjects) && subjects.length > 0) {
      const sub = await Subject_default.findOne({ _id: { $in: subjects } }).populate("class");
      if (sub && sub.class?.branch) finalBranch = sub.class.branch;
    }
    const user = await User_default.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      branch: finalBranch,
      classes,
      subjects,
      linkedStudent,
      linkedStudents: linkedStudent ? [linkedStudent] : [],
      status: "active"
    });
    const token = generateToken(user._id.toString(), user.role, user.branch?.toString());
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        status: user.status,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var registerTeacher = async (req, res) => {
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
    const settings = await ReportCardSetting_default.findOne();
    const validStaffCode = settings?.staffRegistrationCode?.trim() || "STAFF-2026";
    if (staffCode.trim().toUpperCase() !== validStaffCode.toUpperCase()) {
      return res.status(400).json({
        message: "Invalid Staff Registration Code. Please request the official staff passcode from your school administrator."
      });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User_default.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "An account with this email address already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newTeacher = await User_default.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim(),
      password: hashedPassword,
      role,
      branch: branch || void 0,
      status: "pending_approval",
      mustChangePassword: false,
      staffCodeUsed: staffCode.trim()
    });
    res.status(201).json({
      message: "Registration submitted successfully! Your account is pending administrator approval before you can log in.",
      status: "pending_approval",
      teacherId: newTeacher._id
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var lookupStudent = async (req, res) => {
  try {
    const { identifier, classId } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: "Please provide student Admission Number, Student ID, or Name" });
    }
    const query = identifier.trim();
    let student = null;
    if (mongoose7.Types.ObjectId.isValid(query)) {
      student = await Student_default.findById(query).populate("class", "name arm").populate("branch", "name");
    }
    if (!student) {
      student = await Student_default.findOne({
        $or: [
          { admissionNumber: { $regex: `^${query}$`, $options: "i" } },
          { studentCode: { $regex: `^${query}$`, $options: "i" } }
        ]
      }).populate("class", "name arm").populate("branch", "name");
    }
    if (!student) {
      const nameFilter = {
        name: { $regex: query, $options: "i" }
      };
      if (classId) nameFilter.class = classId;
      student = await Student_default.findOne(nameFilter).populate("class", "name arm").populate("branch", "name");
    }
    if (!student) {
      return res.status(404).json({
        message: "No student matching the provided Admission Number or Name was found."
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
        numberInClass: student.numberInClass
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var registerParent = async (req, res) => {
  try {
    const { name, email, phone, password, studentId, studentIdentifier, classId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User_default.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "An account with this email address already exists" });
    }
    let linkedStudentId = studentId || null;
    if (!linkedStudentId && studentIdentifier) {
      const query = studentIdentifier.trim();
      let matchedStudent = null;
      if (mongoose7.Types.ObjectId.isValid(query)) {
        matchedStudent = await Student_default.findById(query);
      }
      if (!matchedStudent) {
        matchedStudent = await Student_default.findOne({
          $or: [
            { admissionNumber: { $regex: `^${query}$`, $options: "i" } },
            { studentCode: { $regex: `^${query}$`, $options: "i" } }
          ]
        });
      }
      if (!matchedStudent) {
        const nameFilter = { name: { $regex: query, $options: "i" } };
        if (classId) nameFilter.class = classId;
        matchedStudent = await Student_default.findOne(nameFilter);
      }
      if (matchedStudent) {
        linkedStudentId = matchedStudent._id.toString();
      }
    }
    if (!linkedStudentId) {
      return res.status(400).json({
        message: "Please specify a valid student / child to link with this parent account"
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const parentUser = await User_default.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim(),
      password: hashedPassword,
      role: "parent",
      status: "active",
      mustChangePassword: false,
      linkedStudent: linkedStudentId,
      linkedStudents: [linkedStudentId]
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
        mustChangePassword: false
      },
      message: "Parent account created and linked successfully!"
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const normalizedEmail = (email || "").toLowerCase().trim();
    let user = await User_default.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User_default.findOne({
        email: { $regex: `^\\s*${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, $options: "i" }
      });
    }
    if (!user) {
      console.warn(`[Auth] Login attempt failed: No user found with email "${normalizedEmail}" in DB "${mongoose7.connection.name}"`);
      return res.status(401).json({
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS"
      });
    }
    if (user.status === "pending_approval") {
      return res.status(403).json({
        message: "Your staff account is awaiting administrator approval. Please ask your school administrator to activate your account in the Pending Approvals tab.",
        status: "pending_approval"
      });
    }
    if (user.status === "rejected") {
      return res.status(403).json({
        message: `Your registration was declined. Reason: ${user.rejectionReason || "Please contact the administration office."}`,
        status: "rejected"
      });
    }
    if (user.status === "suspended") {
      return res.status(403).json({
        message: "This account is currently suspended. Please contact school administration.",
        status: "suspended"
      });
    }
    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch && typeof password === "string" && password.trim() !== password) {
      isMatch = await bcrypt.compare(password.trim(), user.password);
    }
    if (!isMatch) {
      console.warn(`[Auth] Login attempt failed: Incorrect password for "${normalizedEmail}"`);
      return res.status(401).json({
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS"
      });
    }
    const token = generateToken(user._id.toString(), user.role, user.branch?.toString());
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        status: user.status,
        mustChangePassword: user.mustChangePassword
      }
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
    const cleanNew = String(newPassword).trim();
    if (cleanNew.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    const user = await User_default.findById(req.user.id);
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getMe = async (req, res) => {
  try {
    const user = await User_default.findById(req.user.id).select("-password").populate({
      path: "subjects",
      populate: {
        path: "class",
        select: "name arm branch",
        populate: { path: "branch", select: "name" }
      }
    }).populate({
      path: "classes",
      select: "name arm branch",
      populate: { path: "branch", select: "name" }
    }).populate("branch").populate({
      path: "linkedStudents",
      populate: [
        { path: "class", select: "name arm" },
        { path: "branch", select: "name" }
      ]
    }).populate({
      path: "linkedStudent",
      populate: [
        { path: "class", select: "name arm" },
        { path: "branch", select: "name" }
      ]
    });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email address is required" });
    }
    const normalizedEmail = (email || "").toLowerCase().trim();
    let user = await User_default.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User_default.findOne({
        email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
      });
    }
    if (!user) {
      return res.status(200).json({
        message: "If an account exists with this email address, a password reset code has been sent.",
        email: normalizedEmail,
        emailSent: false,
        expiresInMinutes: 15
      });
    }
    const resetCode = Math.floor(1e5 + Math.random() * 9e5).toString();
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1e3);
    await user.save();
    const emailResult = await sendPasswordResetEmail(user.email, user.name, resetCode);
    res.status(200).json({
      message: emailResult.success ? `A 6-digit verification code has been sent to ${user.email}. Please check your email inbox.` : `A password reset code has been generated. Please check your inbox or use the code below.`,
      emailSent: emailResult.success,
      email: user.email,
      name: user.name,
      // Provide resetCode only when email sending was not successful or in development without key:
      resetCode: emailResult.success ? void 0 : resetCode,
      expiresInMinutes: 15
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var resetPasswordWithCode = async (req, res) => {
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
    let user = await User_default.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User_default.findOne({
        email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
      });
    }
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }
    if (!user.resetPasswordCode || user.resetPasswordCode !== String(code).trim()) {
      return res.status(400).json({ message: "Invalid or incorrect reset code" });
    }
    if (!user.resetPasswordExpires || /* @__PURE__ */ new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ message: "Reset code has expired. Please request a new code." });
    }
    user.password = await bcrypt.hash(cleanNew, 10);
    user.resetPasswordCode = void 0;
    user.resetPasswordExpires = void 0;
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
        status: user.status
      }
    });
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
var optionalProtect = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt2.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch {
  }
  next();
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
router.post("/register-teacher", registerTeacher);
router.post("/register-parent", registerParent);
router.post("/lookup-student", lookupStudent);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordWithCode);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);
var authRoutes_default = router;

// server/routes/branchRoutes.ts
import { Router as Router2 } from "express";

// server/controllers/branchController.ts
init_Branch();
var createBranch = async (req, res) => {
  try {
    const { name, address } = req.body;
    const branch = await Branch_default.create({ name, address });
    res.status(201).json(branch);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getBranches = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role === "branch_admin" && req.user.branch) {
      filter._id = req.user.branch;
    }
    const branches = await Branch_default.find(filter).sort({ name: 1 });
    res.status(200).json(branches);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var updateBranch = async (req, res) => {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Administrators can update branch information." });
    }
    const branch = await Branch_default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.status(200).json(branch);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var deleteBranch = async (req, res) => {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Administrators can delete a branch." });
    }
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
router2.get("/", optionalProtect, getBranches);
router2.put("/:id", protect, authorize("super_admin"), updateBranch);
router2.delete("/:id", protect, authorize("super_admin"), deleteBranch);
var branchRoutes_default = router2;

// server/routes/classRoutes.ts
import { Router as Router3 } from "express";

// server/controllers/classController.ts
init_Class();
init_Student();
init_Subject();
init_Score();
init_Attendance();
init_AttendanceSetting();
init_ReportCardRemark();
init_ResultPublication();
init_Branch();
init_User();

// server/constants/elementarySubjects.ts
var ELEMENTARY_FIXED_SUBJECTS = [
  { nameEnglish: "Q. MEMORIZATION", nameArabic: "\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 (\u0627\u0644\u0627\u0633\u062A\u062D\u0641\u0627\u0638)", order: 1 },
  { nameEnglish: "HADITH", nameArabic: "\u0627\u0644\u062D\u062F\u064A\u062B \u0627\u0644\u0634\u0631\u064A\u0641", order: 2 },
  { nameEnglish: "READING SKILL", nameArabic: "\u0645\u0647\u0627\u0631\u0629 \u0627\u0644\u0642\u0631\u0627\u0621\u0629", order: 3 },
  { nameEnglish: "WRITING SKILL", nameArabic: "\u0645\u0647\u0627\u0631\u0629 \u0627\u0644\u0643\u062A\u0627\u0628\u0629", order: 4 },
  { nameEnglish: "ARABIC", nameArabic: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", order: 5 },
  { nameEnglish: "HYMNS", nameArabic: "\u0627\u0644\u0623\u0646\u0627\u0634\u064A\u062F", order: 6 }
];

// server/utils/graduatingAccess.ts
init_Class();
init_Subject();
var normalizeArabicText = (text) => {
  if (!text) return "";
  return text.toLowerCase().replace(/[أإآٱ]/g, "\u0627").replace(/ة/g, "\u0647").replace(/ى/g, "\u064A").replace(/[\u064B-\u065F]/g, "").trim();
};
var detectGraduatingLevel = (name) => {
  const n = normalizeArabicText(name || "");
  const raw = (name || "").toLowerCase();
  if (/ثالث|3/.test(n) && n.includes("\u0627\u0639\u062F\u0627\u062F\u064A") || /\bjss\s*3\b/i.test(raw) || /3rd.*junior\s*secondary/i.test(raw)) {
    return "junior_secondary";
  }
  if (/ثالث|3/.test(n) && n.includes("\u062B\u0627\u0646\u0648\u064A") || /\bsss\s*3\b/i.test(raw) || /3rd.*senior\s*secondary/i.test(raw)) {
    return "senior_secondary";
  }
  if (!n.includes("\u0627\u0639\u062F\u0627\u062F\u064A") && !n.includes("\u062B\u0627\u0646\u0648\u064A") && (n.includes("\u0627\u0628\u062A\u062F\u0627\u0626") || /\bgraduating\b.*\belementary\b/i.test(raw))) {
    return "elementary";
  }
  return void 0;
};
var isGraduatingClass = (name, explicitFlag) => {
  if (explicitFlag === true) return true;
  if (detectGraduatingLevel(name) !== void 0) return true;
  const n = normalizeArabicText(name || "");
  const raw = (name || "").toLowerCase();
  if (n.includes("\u0634\u0647\u0627\u062F\u0647") || raw.includes("graduating")) {
    return true;
  }
  return false;
};
var isClassGraduatingDoc = (cls) => {
  if (!cls) return false;
  return isGraduatingClass(cls.name || "", cls.isGraduating);
};
var isSuperAdmin = (req) => {
  return req.user?.role === "super_admin";
};
var getAllGraduatingClassIds = async () => {
  const allClasses = await Class_default.find().select("_id name isGraduating").lean();
  return allClasses.filter((c) => isClassGraduatingDoc(c)).map((c) => c._id.toString());
};
var assertSuperAdminForClass = async (req, classId) => {
  const classDoc = await Class_default.findById(classId);
  if (!classDoc) {
    return { allowed: false, classDoc: null, isGraduating: false };
  }
  const grad = isClassGraduatingDoc(classDoc);
  if (grad && !isSuperAdmin(req)) {
    return { allowed: false, classDoc, isGraduating: true };
  }
  return { allowed: true, classDoc, isGraduating: grad };
};
var getEffectiveSecondaryResultMode = (classDoc, studentDoc, isElementary, isGraduating) => {
  if (isElementary || !isGraduating) {
    return "cascade";
  }
  if (studentDoc?.resultModeOverride && (studentDoc.resultModeOverride === "current_only" || studentDoc.resultModeOverride === "combine_1st_and_3rd")) {
    return studentDoc.resultModeOverride;
  }
  return classDoc?.secondaryResultMode || "current_only";
};
var DEFAULT_JUNIOR_SECONDARY_SUBJECTS = [
  { nameEnglish: "Quran Recitation", nameArabic: "\u0627\u0644\u062A\u0644\u0627\u0648\u0629", order: 1 },
  { nameEnglish: "Quran Memorization", nameArabic: "\u0627\u0644\u0627\u0633\u062A\u062D\u0641\u0627\u0638", order: 2 },
  { nameEnglish: "Quran Translation", nameArabic: "\u0627\u0644\u062A\u0641\u0633\u064A\u0631", order: 3 },
  { nameEnglish: "Hadith", nameArabic: "\u0627\u0644\u062D\u062F\u064A\u062B", order: 4 },
  { nameEnglish: "Islamic Jurisprudence", nameArabic: "\u0627\u0644\u0641\u0642\u0647", order: 5 },
  { nameEnglish: "History of Prophet", nameArabic: "\u0627\u0644\u0633\u064A\u0631\u0629", order: 6 },
  { nameEnglish: "Islamic History", nameArabic: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A", order: 7 },
  { nameEnglish: "Islam in Nigeria", nameArabic: "\u0627\u0644\u0625\u0633\u0644\u0627\u0645 \u0641\u064A \u0646\u064A\u062C\u064A\u0631\u064A\u0627", order: 8 },
  { nameEnglish: "Arabic Language", nameArabic: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", order: 9 },
  { nameEnglish: "Grammar", nameArabic: "\u0627\u0644\u0646\u062D\u0648", order: 10 },
  { nameEnglish: "Morphology", nameArabic: "\u0627\u0644\u0635\u0631\u0641", order: 11 },
  { nameEnglish: "Reading", nameArabic: "\u0627\u0644\u0642\u0631\u0627\u0621\u0629", order: 12 },
  { nameEnglish: "Writing", nameArabic: "\u0627\u0644\u0643\u062A\u0627\u0628\u0629", order: 13 },
  { nameEnglish: "Conversation", nameArabic: "\u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629", order: 14 },
  { nameEnglish: "Language drills", nameArabic: "\u0627\u0644\u062A\u062F\u0631\u064A\u0628\u0627\u062A \u0627\u0644\u0644\u063A\u0648\u064A\u0629", order: 15 }
];
var DEFAULT_SENIOR_SECONDARY_SUBJECTS = [
  { nameEnglish: "Quran Recitation", nameArabic: "\u0627\u0644\u062A\u0644\u0627\u0648\u0629", order: 1 },
  { nameEnglish: "Quran Memorization", nameArabic: "\u0627\u0644\u0627\u0633\u062A\u062D\u0641\u0627\u0638", order: 2 },
  { nameEnglish: "Quran Translation", nameArabic: "\u0627\u0644\u062A\u0641\u0633\u064A\u0631", order: 3 },
  { nameEnglish: "Science of Quran", nameArabic: "\u0639\u0644\u0648\u0645 \u0627\u0644\u0642\u0631\u0622\u0646", order: 4 },
  { nameEnglish: "Tajweed", nameArabic: "\u0627\u0644\u062A\u062C\u0648\u064A\u062F", order: 5 },
  { nameEnglish: "Hadith", nameArabic: "\u0627\u0644\u062D\u062F\u064A\u062B", order: 6 },
  { nameEnglish: "Science of Hadith", nameArabic: "\u0645\u0635\u0637\u0644\u062D \u0627\u0644\u062D\u062F\u064A\u062B", order: 7 },
  { nameEnglish: "Islamic Jurisprudence", nameArabic: "\u0627\u0644\u0641\u0642\u0647", order: 8 },
  { nameEnglish: "Rule of Jurisprudence", nameArabic: "\u0623\u0635\u0648\u0644 \u0627\u0644\u0641\u0642\u0647", order: 9 },
  { nameEnglish: "Islamic History", nameArabic: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A", order: 10 },
  { nameEnglish: "Islam in Nigeria", nameArabic: "\u0627\u0644\u0625\u0633\u0644\u0627\u0645 \u0641\u064A \u0646\u064A\u062C\u064A\u0631\u064A\u0627", order: 11 },
  { nameEnglish: "Arabic Language", nameArabic: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", order: 12 },
  { nameEnglish: "Grammar", nameArabic: "\u0627\u0644\u0646\u062D\u0648", order: 13 },
  { nameEnglish: "Morphology", nameArabic: "\u0627\u0644\u0635\u0631\u0641", order: 14 },
  { nameEnglish: "Rhetoric", nameArabic: "\u0627\u0644\u0628\u0644\u0627\u063A\u0629", order: 15 },
  { nameEnglish: "Arabic Literature", nameArabic: "\u0627\u0644\u0623\u062F\u0628 \u0627\u0644\u0639\u0631\u0628\u064A", order: 16 },
  { nameEnglish: "Language drills", nameArabic: "\u0627\u0644\u062A\u062F\u0631\u064A\u0628\u0627\u062A \u0627\u0644\u0644\u063A\u0648\u064A\u0629", order: 17 }
];
var seedGraduatingClassSubjects = async (classId, level, preferredBranchId) => {
  const existingCount = await Subject_default.countDocuments({ class: classId });
  if (existingCount > 0) return 0;
  if (level === "elementary") {
    const docs = ELEMENTARY_FIXED_SUBJECTS.map((s) => ({
      nameEnglish: s.nameEnglish,
      nameArabic: s.nameArabic,
      class: classId,
      order: s.order
    }));
    await Subject_default.insertMany(docs);
    return docs.length;
  }
  const allClasses = await Class_default.find().lean();
  const isJunior = level === "junior_secondary";
  const candidateClasses = allClasses.filter((c) => c._id.toString() !== classId).sort((a, b) => {
    const scoreClass = (cls) => {
      const n = normalizeArabicText(cls.name || "");
      let score = 0;
      if (preferredBranchId && cls.branch?.toString() === preferredBranchId) score += 20;
      if (isJunior) {
        if (n.includes("\u062B\u0627\u0644\u062B") && n.includes("\u0627\u0639\u062F\u0627\u062F\u064A")) score += 100;
        else if (n.includes("\u062B\u0627\u0646\u064A") && n.includes("\u0627\u0639\u062F\u0627\u062F\u064A")) score += 80;
        else if (n.includes("\u0627\u0639\u062F\u0627\u062F\u064A")) score += 50;
      } else {
        if (n.includes("\u062B\u0627\u0644\u062B") && n.includes("\u062B\u0627\u0646\u0648\u064A")) score += 100;
        else if (n.includes("\u062B\u0627\u0646\u064A") && n.includes("\u062B\u0627\u0646\u0648\u064A")) score += 80;
        else if (n.includes("\u062B\u0627\u0646\u0648\u064A")) score += 50;
      }
      return score;
    };
    return scoreClass(b) - scoreClass(a);
  });
  for (const candidate of candidateClasses) {
    const n = normalizeArabicText(candidate.name || "");
    const matchesLevel = isJunior ? n.includes("\u0627\u0639\u062F\u0627\u062F\u064A") : n.includes("\u062B\u0627\u0646\u0648\u064A");
    if (!matchesLevel) continue;
    const sourceSubjects = await Subject_default.find({ class: candidate._id }).sort({ order: 1, nameEnglish: 1 }).lean();
    if (sourceSubjects.length > 0) {
      const toInsert2 = sourceSubjects.map((s, idx) => ({
        nameEnglish: s.nameEnglish,
        nameArabic: s.nameArabic,
        class: classId,
        order: s.order ?? idx + 1
      }));
      await Subject_default.insertMany(toInsert2);
      return toInsert2.length;
    }
  }
  const fallback = isJunior ? DEFAULT_JUNIOR_SECONDARY_SUBJECTS : DEFAULT_SENIOR_SECONDARY_SUBJECTS;
  const toInsert = fallback.map((s) => ({
    nameEnglish: s.nameEnglish,
    nameArabic: s.nameArabic,
    class: classId,
    order: s.order
  }));
  await Subject_default.insertMany(toInsert);
  return toInsert.length;
};

// server/utils/seedGraduating2026.ts
init_Branch();
init_Class();
init_Student();

// server/data/graduatingRoster2026.ts
var GRADUATING_ROSTER_2026 = [
  // 1. المقر الدائم (Main / Ronik) — الإبتدائي (34 named)
  {
    key: "ronik-elementary",
    className: "\u0627\u0644\u0625\u0628\u062A\u062F\u0627\u0626\u064A",
    arm: "\u0627\u0644\u0645\u0642\u0631 \u0627\u0644\u062F\u0627\u0626\u0645",
    category: "elementary",
    graduatingLevel: "elementary",
    sourceSchool: "\u0645\u0639\u0647\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A \u2014 \u0627\u0644\u0645\u0642\u0631 \u0627\u0644\u062F\u0627\u0626\u0645 (Ronik)",
    students: [
      { seatNumber: "M103426", name: "\u0628\u0634\u064A\u0631 \u0634\u0639\u064A\u0628", gender: "M" },
      { seatNumber: "M103326", name: "\u062C\u0627\u0645\u0639 \u0639\u062B\u0645\u0627\u0646", gender: "M" },
      { seatNumber: "M103226", name: "\u062D\u0628\u064A\u0628 \u0627\u0644\u0644\u0647 \u064A\u0648\u0633\u0641", gender: "M" },
      { seatNumber: "M103126", name: "\u062E\u0627\u0641\u0636 \u0639\u0628\u062F \u0627\u0644\u0633\u0644\u0627\u0645", gender: "M" },
      { seatNumber: "M103026", name: "\u0639\u0628\u062F \u0627\u0644\u0633\u0644\u0627\u0645 \u0634\u0626\u062B", gender: "M" },
      { seatNumber: "M102926", name: "\u0639\u0628\u062F \u0627\u0644\u063A\u0646\u064A \u0628\u0628\u062A\u0646\u062F\u064A", gender: "M" },
      { seatNumber: "M102826", name: "\u0639\u0628\u062F \u0627\u0644\u0642\u062F\u0648\u0633 \u0634\u0639\u064A\u0628", gender: "M" },
      { seatNumber: "M102726", name: "\u0639\u0628\u062F \u0627\u0644\u0642\u064A\u0648\u0645 \u0623\u062F\u064A\u0646\u064A\u062C\u064A", gender: "M" },
      { seatNumber: "M102626", name: "\u0639\u0628\u062F \u0627\u0644\u0645\u0624\u0645\u0646 \u062A\u0642\u0649", gender: "M" },
      { seatNumber: "M102526", name: "\u0639\u0628\u062F \u0627\u0644\u0648\u0627\u0631\u062B \u0623\u0643\u0646\u0633\u0646\u064A\u0627", gender: "M" },
      { seatNumber: "M102426", name: "\u0639\u0628\u062F \u0627\u0644\u0648\u0647\u0627\u0628 \u0628\u062F\u0645\u0627\u0635", gender: "M" },
      { seatNumber: "M102326", name: "\u0639\u062B\u0645\u0627\u0646 \u0639\u0628\u062F \u0627\u0644\u0631\u0641\u064A\u0639", gender: "M" },
      { seatNumber: "M102226", name: "\u063A\u064A\u0627\u062B \u0639\u0628\u062F \u0627\u0644\u063A\u0646\u064A", gender: "M" },
      { seatNumber: "M102126", name: "\u0641\u0627\u0626\u0632 \u0628\u0643\u0631", gender: "M" },
      { seatNumber: "M102026", name: "\u0641\u0627\u062A\u062D \u0623\u062F\u064A\u0628\u064A\u0633\u064A", gender: "M" },
      { seatNumber: "M101926", name: "\u0641\u062E\u0631 \u0627\u0644\u062F\u064A\u0646 \u0623\u0644\u0627\u0628\u064A", gender: "M" },
      { seatNumber: "M101826", name: "\u0645\u0628\u0627\u0631\u0643 \u0623\u0648\u0644\u0627\u0628\u0648\u062F\u064A", gender: "M" },
      { seatNumber: "M101726", name: "\u0645\u062D\u0641\u0648\u0638 \u0623\u0631\u0648\u063A\u0646\u062F\u0627\u062F\u064A", gender: "M" },
      { seatNumber: "M101626", name: "\u0645\u062D\u0645\u062F \u0623\u0628\u0648 \u0628\u0643\u0631", gender: "M" },
      { seatNumber: "M101526", name: "\u0645\u062D\u0645\u062F \u0642\u0627\u0633\u0645", gender: "M" },
      { seatNumber: "M101426", name: "\u0645\u0635\u0637\u0641\u0649 \u0623\u064A\u0646\u0634\u064A\u0644\u0649", gender: "M" },
      { seatNumber: "M101326", name: "\u0625\u062F\u0631\u064A\u0633 \u0639\u0628\u062F \u0627\u0644\u0644\u0637\u064A\u0641", gender: "M" },
      { seatNumber: "M101226", name: "\u062D\u0644\u064A\u0645\u0629 \u0634\u0639\u064A\u0628", gender: "F" },
      { seatNumber: "M101126", name: "\u0634\u0643\u0631\u0629 \u0634\u0639\u064A\u0628", gender: "F" },
      { seatNumber: "M101026", name: "\u0635\u0641\u064A\u0629 \u0639\u0628\u062F \u0627\u0644\u0631\u062D\u064A\u0645", gender: "F" },
      { seatNumber: "M100926", name: "\u0639\u0627\u0626\u0634\u0629 \u0623\u0648\u0644\u0627\u0644\u064A\u0643\u0646", gender: "F" },
      { seatNumber: "M100826", name: "\u0639\u0627\u0626\u0634\u0629 \u0623\u0648\u064A\u0646\u0644\u0648\u064A\u064A", gender: "F" },
      { seatNumber: "M100726", name: "\u0641\u0631\u064A\u062F\u0629 \u0639\u0628\u062F \u0627\u0644\u0633\u0644\u0627\u0645", gender: "F" },
      { seatNumber: "M100626", name: "\u0641\u0631\u064A\u062F\u0629 \u0639\u0628\u062F \u0627\u0644\u0648\u0627\u062D\u062F", gender: "F" },
      { seatNumber: "M100526", name: "\u0641\u0631\u064A\u062F\u0629 \u064A\u0648\u0633\u0641", gender: "F" },
      { seatNumber: "M100426", name: "\u0645\u0631\u064A\u0645 \u0639\u0628\u062F \u0627\u0644\u0643\u0631\u064A\u0645", gender: "F" },
      { seatNumber: "M100326", name: "\u0646\u0627\u062F\u064A\u0629 \u0623\u0628\u0648 \u0628\u0643\u0631", gender: "F" },
      { seatNumber: "M100226", name: "\u0646\u0633\u064A\u0628\u0629 \u0645\u062D\u0645\u062F \u0627\u0644\u0623\u0648\u0644", gender: "F" },
      { seatNumber: "M100126", name: "\u0639\u0627\u0626\u0634\u0629 \u0632\u0643\u0631\u064A\u0627\u0621", gender: "F" }
    ]
  },
  // 2. المقر الدائم (Main / Ronik) — الثالث الإعدادي (34 named)
  {
    key: "ronik-junior-secondary",
    className: "\u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A",
    arm: "\u0627\u0644\u0645\u0642\u0631 \u0627\u0644\u062F\u0627\u0626\u0645",
    category: "secondary",
    graduatingLevel: "junior_secondary",
    sourceSchool: "\u0645\u0639\u0647\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A \u2014 \u0627\u0644\u0645\u0642\u0631 \u0627\u0644\u062F\u0627\u0626\u0645 (Ronik)",
    students: [
      { seatNumber: "M206826", name: "\u0623\u062D\u0645\u062F \u0639\u062B\u0645\u0627\u0646", gender: "M" },
      { seatNumber: "M206726", name: "\u0625\u0628\u0631\u0627\u0647\u064A\u0645 \u0645\u062D\u062F \u0627\u0644\u062C\u0627\u0645\u0639", gender: "M" },
      { seatNumber: "M206626", name: "\u062D\u0628\u064A\u0628 \u0627\u0644\u0644\u0647 \u0631\u0627\u062C\u064A", gender: "M" },
      { seatNumber: "M206526", name: "\u0631\u0627\u062C\u064A \u0628\u0634\u064A\u0631", gender: "M" },
      { seatNumber: "M206426", name: "\u0631\u0636\u0649 \u0627\u0644\u0644\u0647 \u062D\u0645\u0632\u0629", gender: "M" },
      { seatNumber: "M206326", name: "\u0634\u0639\u064A\u0628 \u0639\u0628\u062F \u0627\u0644\u0633\u0645\u064A\u0639", gender: "M" },
      { seatNumber: "M206226", name: "\u0639\u0628\u062F \u0627\u0644\u062D\u0645\u064A\u062F \u0633\u0646\u0648\u0633\u064A", gender: "M" },
      { seatNumber: "M206126", name: "\u0639\u0628\u062F \u0627\u0644\u0639\u0632\u064A\u0632 \u0639\u0628\u062F \u0627\u0644\u0639\u0632\u064A\u0632", gender: "M" },
      { seatNumber: "M206026", name: "\u0639\u0628\u062F \u0627\u0644\u063A\u0641\u0627\u0631 \u0645\u0635\u0637\u0641\u0649", gender: "M" },
      { seatNumber: "M205926", name: "\u0639\u0628\u062F \u0627\u0644\u0642\u0627\u062F\u0631 \u0645\u0635\u0637\u0641\u0649", gender: "M" },
      { seatNumber: "M205826", name: "\u0639\u0628\u062F \u0627\u0644\u0645\u0627\u0644\u0643 \u0631\u0641\u0627\u0639\u064A", gender: "M" },
      { seatNumber: "M205726", name: "\u0639\u0628\u062F \u0627\u0644\u0645\u062A\u064A\u0646 \u0639\u0628\u062F \u0627\u0644\u0631\u062D\u064A\u0645", gender: "M" },
      { seatNumber: "M205626", name: "\u0645\u062D\u0645\u062F \u0627\u0644\u0623\u0648\u0644 \u0645\u062D\u0645\u062F \u0627\u0644\u0623\u0648\u0644", gender: "M" },
      { seatNumber: "M205526", name: "\u0645\u0639\u0632 \u0627\u0644\u062F\u064A\u0646 \u0623\u064A\u0648\u0631\u0646\u062F\u0649", gender: "M" },
      { seatNumber: "M205426", name: "\u064A\u0627\u0633\u0631 \u0639\u0628\u062F \u0627\u0644\u0648\u0627\u062D\u062F", gender: "M" },
      { seatNumber: "M205326", name: "\u064A\u0633\u064A\u0631 \u0639\u0628\u062F \u0627\u0644\u063A\u0646\u064A", gender: "M" },
      { seatNumber: "M205226", name: "\u0639\u0628\u062F \u0627\u0644\u0644\u0647 \u0639\u0628\u062F \u0627\u0644\u062D\u0643\u064A\u0645", gender: "M" },
      { seatNumber: "M205126", name: "\u0645\u062D\u0645\u062F \u0623\u0648\u0644\u0627\u0628\u0648\u062F\u0649", gender: "M" },
      { seatNumber: "M205026", name: "\u0628\u0627\u0639\u062B\u0629 \u0627\u0644\u062E\u064A\u0631 \u0639\u0628\u062F \u0627\u0644\u0641\u062A\u0627\u062D", gender: "F" },
      { seatNumber: "M204926", name: "\u062D\u0641\u0635\u0629 \u0623\u062C\u064A\u0628\u0627\u062F\u0649", gender: "F" },
      { seatNumber: "M204826", name: "\u0631\u0627\u0636\u064A\u0629 \u062D\u0645\u0632\u0629", gender: "F" },
      { seatNumber: "M204726", name: "\u0631\u0641\u064A\u0639\u0629 \u0623\u0645\u0631\u064A", gender: "F" },
      { seatNumber: "M204626", name: "\u0632\u0644\u064A\u062E\u0629 \u0623\u0648\u0644\u0627\u0644\u064A\u0643\u0646", gender: "F" },
      { seatNumber: "M204526", name: "\u0635\u0641\u064A\u0629 \u0623\u064A\u0646\u0644\u0627", gender: "F" },
      { seatNumber: "M204426", name: "\u0641\u0627\u062A\u062D\u0629 \u0642\u0627\u0633\u0645", gender: "F" },
      { seatNumber: "M204326", name: "\u0641\u0627\u062A\u062D\u0629 \u0645\u0641\u062A\u0627\u062D \u0627\u0644\u062F\u064A\u0646", gender: "F" },
      { seatNumber: "M204226", name: "\u0641\u0631\u062F\u0648\u0633 \u0642\u0627\u0633\u0645", gender: "F" },
      { seatNumber: "M204126", name: "\u0641\u0648\u0632\u064A\u0629 \u0623\u062D\u0645\u062F", gender: "F" },
      { seatNumber: "M204026", name: "\u0645\u0628\u0627\u0631\u0643\u0629 \u062D\u0646\u0628\u0644\u064A", gender: "F" },
      { seatNumber: "M203926", name: "\u0645\u0631\u064A\u0645 \u0623\u0648\u0644\u0627\u0628\u0648\u062F\u0649", gender: "F" },
      { seatNumber: "M203826", name: "\u0645\u0646\u064A\u0628\u0629 \u062A\u062C\u0627\u0646\u064A", gender: "F" },
      { seatNumber: "M203726", name: "\u0645\u0646\u064A\u0631\u0629 \u0623\u0628\u0648 \u0628\u0643\u0631", gender: "F" },
      { seatNumber: "M203626", name: "\u0645\u0631\u0632\u0648\u0642\u0629 \u0645\u0639\u0631\u0648\u0641", gender: "F" },
      { seatNumber: "M203526", name: "\u0645\u0639\u0631\u0648\u0641\u0629 \u0623\u0648\u0644\u0627\u0628\u0648\u062F\u0649", gender: "F" }
    ]
  },
  // 3. المقر الدائم (Main / Ronik) — الثالث الثانوي (16 named)
  {
    key: "ronik-senior-secondary",
    className: "\u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u062B\u0627\u0646\u0648\u064A",
    arm: "\u0627\u0644\u0645\u0642\u0631 \u0627\u0644\u062F\u0627\u0626\u0645",
    category: "secondary",
    graduatingLevel: "senior_secondary",
    sourceSchool: "\u0645\u0639\u0647\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A \u2014 \u0627\u0644\u0645\u0642\u0631 \u0627\u0644\u062F\u0627\u0626\u0645 (Ronik)",
    students: [
      { seatNumber: "M308426", name: "\u0627\u0644\u062D\u0645\u064A\u062F \u0639\u0628\u062F \u0625\u0628\u0631\u0627\u0647\u064A\u0645", gender: "M" },
      { seatNumber: "M308326", name: "\u0623\u062D\u0645\u062F \u0625\u0633\u062D\u0627\u0642", gender: "M" },
      { seatNumber: "M308226", name: "\u0627\u0644\u0631\u0632\u0627\u0642 \u0639\u0628\u062F \u062A\u0648\u0641\u064A\u0642", gender: "M" },
      { seatNumber: "M308126", name: "\u0639\u0644\u064A \u062C\u0627\u0645\u0639", gender: "M" },
      { seatNumber: "M308026", name: "\u0641\u0627\u0632\u0627\u0632\u064A \u0631\u0642\u064A\u0628", gender: "M" },
      { seatNumber: "M307926", name: "\u0627\u0644\u0641\u062A\u0627\u062D \u0639\u0628\u062F \u0634\u0627\u0630\u0644\u064A", gender: "M" },
      { seatNumber: "M307826", name: "\u0627\u0644\u0623\u0648\u0644 \u0645\u062D\u0645\u062F \u0627\u0644\u0631\u062D\u064A\u0645 \u0639\u0628\u062F", gender: "M" },
      { seatNumber: "M307726", name: "\u0625\u0628\u0631\u0627\u0647\u064A\u0645 \u0627\u0644\u0635\u0645\u062F \u0639\u0628\u062F", gender: "M" },
      { seatNumber: "M307626", name: "\u0627\u0644\u0623\u0648\u0644 \u0645\u062D\u0645\u062F \u0627\u0644\u0645\u0639\u0632 \u0639\u0628\u062F", gender: "M" },
      { seatNumber: "M307526", name: "\u0633\u0644\u064A\u0645\u0627\u0646 \u0645\u062D\u0645\u062F", gender: "M" },
      { seatNumber: "M307426", name: "\u0623\u064A\u0648\u0645\u064A\u062F\u0649 \u0642\u0627\u0633\u0645 \u0645\u062D\u0645\u062F", gender: "M" },
      { seatNumber: "M307326", name: "\u0627\u0644\u0628\u0631\u0643\u0629 \u0627\u0644\u0647\u0627\u062F\u064A \u0645\u062D\u0645\u062F", gender: "M" },
      { seatNumber: "M307226", name: "\u0645\u062E\u062A\u0627\u0631 \u0635\u0644\u0627\u062D \u0627\u0644\u062F\u064A\u0646", gender: "M" },
      { seatNumber: "M307126", name: "\u0645\u0639\u0631\u0648\u0641 \u0631\u0627\u0636\u064A\u0629", gender: "F" },
      { seatNumber: "M307026", name: "\u0645\u062D\u0645\u062F \u0632\u064A\u0646\u0628", gender: "F" },
      { seatNumber: "M306926", name: "\u0642\u0627\u0633\u0645 \u0645\u0637\u0645\u0626\u0646\u0629", gender: "F" }
    ]
  },
  // 4. فرع لافنوا (Lafenwa) — الإبتدائي (28 named)
  {
    key: "lafenwa-elementary",
    className: "\u0627\u0644\u0625\u0628\u062A\u062F\u0627\u0626\u064A",
    arm: "\u0641\u0631\u0639 \u0644\u0627\u0641\u0646\u0648\u0627",
    category: "elementary",
    graduatingLevel: "elementary",
    sourceSchool: "\u0645\u0639\u0647\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A \u2014 \u0641\u0631\u0639 \u0644\u0627\u0641\u0646\u0648\u0627",
    students: [
      { seatNumber: "M111226", name: "\u0623\u062D\u0645\u062F \u0635\u0627\u0644\u062D", gender: "M" },
      { seatNumber: "M111126", name: "\u0627\u0644\u0623\u0645\u064A\u0646 \u0645\u062D\u0645\u062F \u0642\u0627\u0633\u0645", gender: "M" },
      { seatNumber: "M111026", name: "\u062A\u0633\u0644\u064A\u0645 \u0639\u0628\u062F \u0627\u0644\u0642\u0627\u062F\u0631", gender: "M" },
      { seatNumber: "M110926", name: "\u0627\u0648\u064A\u0646 \u0645\u062D\u0645\u062F \u0642\u0627\u0633\u0645", gender: "M" },
      { seatNumber: "M110826", name: "\u062D\u0628\u064A\u0628 \u0627\u0644\u0644\u0647 \u0623\u062A\u0646\u062F\u0627", gender: "M" },
      { seatNumber: "M110726", name: "\u062D\u0645\u0632\u0629 \u0635\u0627\u0644\u062D \u0627\u0644\u062F\u064A\u0646", gender: "M" },
      { seatNumber: "M110626", name: "\u0635\u0627\u062F\u0642 \u0645\u0637\u064A\u0639", gender: "M" },
      { seatNumber: "M110526", name: "\u0631\u0636\u0648\u0627\u0646 \u0627\u0644\u0644\u0647 \u0633\u0644\u064A\u0645\u0627\u0646", gender: "M" },
      { seatNumber: "M110426", name: "\u0639\u0628\u062F \u0627\u0644\u0631\u0624\u0648\u0641 \u064A\u0648\u0646\u0633", gender: "M" },
      { seatNumber: "M110326", name: "\u0639\u0628\u062F \u0627\u0644\u0631\u0642\u064A\u0628 \u0645\u062D\u0645\u062F \u0627\u0644\u0623\u0648\u0644", gender: "M" },
      { seatNumber: "M110226", name: "\u0639\u0628\u062F \u0627\u0644\u0633\u0644\u0627\u0645 \u0645\u062D\u0645\u062F \u0627\u0644\u0631\u0627\u0628\u0639", gender: "M" },
      { seatNumber: "M110126", name: "\u0639\u0628\u062F \u0627\u0644\u0643\u0631\u064A\u0645 \u0633\u0639\u064A\u062F \u0627\u0644\u062F\u064A\u0646", gender: "M" },
      { seatNumber: "M110026", name: "\u0639\u0628\u062F \u0627\u0644\u063A\u0646\u064A \u0628\u062F\u0645\u0627\u0633", gender: "M" },
      { seatNumber: "M109926", name: "\u0641\u0627\u0631\u0648\u0642 \u0645\u062D\u0645\u062F \u0627\u0644\u062C\u0627\u0645\u0639", gender: "M" },
      { seatNumber: "M109826", name: "\u0641\u0648\u0627\u0632 \u0634\u0627\u0643\u0631 \u0627\u0644\u062F\u064A\u0646", gender: "M" },
      { seatNumber: "M109726", name: "\u0645\u0627\u0644\u0643 \u062C\u0645\u0639\u0629", gender: "M" },
      { seatNumber: "M109626", name: "\u0645\u0634\u0631\u0641 \u064A\u0648\u0633\u0641", gender: "M" },
      { seatNumber: "M109526", name: "\u0645\u062D\u0645\u062F \u0627\u0644\u0623\u0648\u0644 \u0623\u0643\u0648\u0631\u064A\u062F\u064A", gender: "M" },
      { seatNumber: "M109426", name: "\u0645\u0635\u0637\u0641\u0649 \u0645\u0635\u0637\u0641\u0649", gender: "M" },
      { seatNumber: "M109326", name: "\u0623\u0646\u064A\u0633\u0629 \u0645\u0634\u0647\u0648\u062F", gender: "F" },
      { seatNumber: "M109226", name: "\u0631\u0627\u0636\u064A\u0629 \u0639\u0628\u062F \u0627\u0644\u0643\u0631\u064A\u0645", gender: "F" },
      { seatNumber: "M109126", name: "\u0631\u0642\u064A\u0628\u0629 \u0639\u0628\u062F \u0627\u0644\u0641\u062A\u0627\u062D", gender: "F" },
      { seatNumber: "M109026", name: "\u0632\u064A\u0646\u0628 \u0639\u0628\u062F \u0627\u0644\u0643\u0631\u064A\u0645", gender: "F" },
      { seatNumber: "M108926", name: "\u0639\u0627\u0626\u0634\u0629 \u0628\u062F\u0645\u0627\u0633", gender: "F" },
      { seatNumber: "M108826", name: "\u0641\u0627\u0637\u0645\u0629 \u0644\u0642\u0645\u0627\u0646", gender: "F" },
      { seatNumber: "M108726", name: "\u0641\u0631\u064A\u062F\u0629 \u0644\u0642\u0645\u0627\u0646", gender: "F" },
      { seatNumber: "M108626", name: "\u0645\u0633\u062A\u0648\u0631\u0629 \u0645\u062D\u064A \u0627\u0644\u062F\u064A\u0646", gender: "F" },
      { seatNumber: "M108526", name: "\u0645\u0631\u064A\u0645 \u0634\u0648\u064A\u0648\u062F\u064A", gender: "F" }
    ]
  },
  // 5. فرع لافنوا (Lafenwa) — الثالث الإعدادي (47 named)
  {
    key: "lafenwa-junior-secondary",
    className: "\u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A",
    arm: "\u0641\u0631\u0639 \u0644\u0627\u0641\u0646\u0648\u0627",
    category: "secondary",
    graduatingLevel: "junior_secondary",
    sourceSchool: "\u0645\u0639\u0647\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A \u2014 \u0641\u0631\u0639 \u0644\u0627\u0641\u0646\u0648\u0627",
    students: [
      { seatNumber: "M215726", name: "\u0641\u0648\u0627\u0632 - \u0645\u0635\u0637\u0641\u0649", gender: "M" },
      { seatNumber: "M215626", name: "\u0645\u0628\u0627\u0631\u0643 - \u0645\u062D\u0645\u062F \u0642\u0627\u0633\u0645", gender: "M" },
      { seatNumber: "M215526", name: "\u0639\u0644\u064A - \u0628\u0644\u0648\u063A\u0646", gender: "M" },
      { seatNumber: "M215426", name: "\u0630\u0643\u0631 \u0627\u0644\u0644\u0647 \u0639\u0628\u062F \u0627\u0644\u062D\u0645\u064A\u062F", gender: "M" },
      { seatNumber: "M215326", name: "\u0623\u062D\u0645\u062F \u0639\u0628\u062F \u0627\u0644\u0648\u0627\u062D\u062F", gender: "M" },
      { seatNumber: "M215226", name: "\u0639\u0628\u062F \u0627\u0644\u0631\u062D\u064A\u0645 - \u0623\u0628\u0648 \u0628\u0643\u0631", gender: "M" },
      { seatNumber: "M215126", name: "\u0633\u0644\u064A\u0645\u0627\u0646 - \u0639\u0644\u064A", gender: "M" },
      { seatNumber: "M215026", name: "\u0625\u0633\u062D\u0627\u0642 \u0645\u062D\u0645\u062F \u0627\u0644\u0631\u0627\u0628\u0639", gender: "M" },
      { seatNumber: "M214926", name: "\u0625\u0633\u062D\u0627\u0642 \u0648\u0644\u064A \u0627\u0644\u0644\u0647", gender: "M" },
      { seatNumber: "M214826", name: "\u062E\u0627\u0644\u062F \u0639\u0628\u062F \u0627\u0644\u0631\u0627\u0641\u0639", gender: "M" },
      { seatNumber: "M214726", name: "\u0634\u0645\u0633 \u0627\u0644\u062F\u064A\u0646 \u064A\u0648\u0633\u0641", gender: "M" },
      { seatNumber: "M214626", name: "\u0639\u0628\u062F \u0627\u0644\u063A\u0641\u0627\u0631 \u0639\u0628\u062F \u0627\u0644\u0644\u0637\u064A\u0641", gender: "M" },
      { seatNumber: "M214526", name: "\u0641\u0627\u0631\u0648\u0642 - \u0645\u0637\u064A\u0639 \u0627\u0644\u0644\u0647", gender: "M" },
      { seatNumber: "M214426", name: "\u0648\u0647\u064A\u0629 \u062A\u064A\u062C\u0627\u0646\u064A", gender: "M" },
      { seatNumber: "M214326", name: "\u0642\u064A\u0648\u0645 \u0639\u0628\u062F\u0627\u0644\u0643\u0631\u064A\u0645", gender: "M" },
      { seatNumber: "M214226", name: "\u0639\u0628\u062F \u0627\u0644\u0644\u0647 \u0645\u062D\u0645\u062F \u0627\u0644\u0631\u0627\u062C\u064A", gender: "M" },
      { seatNumber: "M214126", name: "\u0645\u062D\u0645\u062F \u0639\u0628\u062F\u0627\u0644\u0633\u0644\u064A\u0645", gender: "M" },
      { seatNumber: "M214026", name: "\u0631\u0641\u064A\u0628\u0629 \u0639\u0628\u062F \u0627\u0644\u062D\u0645\u064A\u062F", gender: "F" },
      { seatNumber: "M213926", name: "\u0631\u0627\u0636\u064A\u0629 \u0645\u062F\u062B\u0631", gender: "F" },
      { seatNumber: "M213826", name: "\u0646\u0639\u0645\u0629 \u0627\u0644\u0644\u0647 \u0645\u0635\u0637\u0641\u0649", gender: "F" },
      { seatNumber: "M213726", name: "\u0642\u064A\u0648\u0645\u0629 \u0625\u0633\u062D\u0627\u0642", gender: "F" },
      { seatNumber: "M213626", name: "\u0639\u0627\u0626\u0634\u0629 \u0639\u0628\u062F \u0627\u0644\u0633\u0644\u064A\u0645", gender: "F" },
      { seatNumber: "M213526", name: "\u062D\u0628\u064A\u0628\u0629 \u0639\u0628\u062F \u0627\u0644\u0643\u0631\u064A\u0645", gender: "F" },
      { seatNumber: "M213426", name: "\u0641\u0631\u064A\u062F\u0629 - \u0645\u0634\u0647\u0648\u062F", gender: "F" },
      { seatNumber: "M213326", name: "\u0631\u062D\u0645\u0629 \u0627\u0644\u0644\u0647 \u0639\u064A\u0633\u0649", gender: "F" },
      { seatNumber: "M213226", name: "\u0632\u0644\u064A\u062E\u0629 \u062D\u0645\u0632\u0629", gender: "F" },
      { seatNumber: "M213126", name: "\u062A\u0648\u0643\u0644\u062A \u0645\u062D\u0645\u062F \u0627\u0644\u062B\u0627\u0646\u064A", gender: "F" },
      { seatNumber: "M213026", name: "\u0631\u0642\u064A\u0629 \u0645\u062D\u0645\u062F \u0627\u0644\u0631\u0627\u062C\u064A", gender: "F" },
      { seatNumber: "M212926", name: "\u0645\u0631\u064A\u0645 \u0628\u0648\u0635\u064A\u0631\u064A", gender: "F" },
      { seatNumber: "M212826", name: "\u062D\u0627\u0646\u0629 \u0639\u0628\u062F \u0627\u0644\u0631\u0632\u0627\u0642", gender: "F" },
      { seatNumber: "M212726", name: "\u062E\u062F\u064A\u062C\u0629 \u0645\u062D\u0645\u062F \u062C\u0645\u0639\u0629", gender: "F" },
      { seatNumber: "M212626", name: "\u0645\u0633\u0637\u0648\u0631\u0629 \u0635\u0644\u0627\u062D \u0627\u0644\u062F\u064A\u0646", gender: "F" },
      { seatNumber: "M212526", name: "\u0631\u0642\u064A\u0629 \u0639\u0628\u062F \u0627\u0644\u062D\u0645\u064A\u062F", gender: "F" },
      { seatNumber: "M212426", name: "\u062D\u0645\u062F\u0644\u0629 \u0639\u0628\u062F \u0627\u0644\u0648\u0627\u0633\u0639", gender: "F" },
      { seatNumber: "M212326", name: "\u0633\u0643\u064A\u0646\u0629 \u063A\u0632\u0627\u0644\u064A", gender: "F" },
      { seatNumber: "M212226", name: "\u0639\u0632\u064A\u0632\u0629 \u0639\u0628\u062F \u0627\u0644\u0644\u0647", gender: "F" },
      { seatNumber: "M212126", name: "\u0623\u0645\u064A\u0631\u0629 \u0639\u0628\u062F \u0627\u0644\u0644\u0647", gender: "F" },
      { seatNumber: "M212026", name: "\u0631\u0642\u064A\u0629 \u0628\u0644\u0644\u0648", gender: "F" },
      { seatNumber: "M211926", name: "\u0623\u0645 \u0643\u0644\u062B\u0648\u0645 \u0645\u0648\u0633\u0649", gender: "F" },
      { seatNumber: "M211826", name: "\u0639\u0632\u064A\u0632\u0629 \u0639\u0628\u062F \u0627\u0644\u0639\u0632\u064A\u0632", gender: "F" },
      { seatNumber: "M211726", name: "\u0639\u0631\u0641\u0629 \u0645\u0639\u0627\u0630", gender: "F" },
      { seatNumber: "M211626", name: "\u0631\u064A\u062D\u0627\u0646\u0629 \u062A\u064A\u062C\u0627\u0646\u064A", gender: "F" },
      { seatNumber: "M211526", name: "\u0639\u0627\u0626\u0634\u0629 \u0639\u0628\u062F \u0627\u0644\u0643\u0631\u064A\u0645", gender: "F" },
      { seatNumber: "M211426", name: "\u0641\u0631\u064A\u062F\u0629 \u062D\u0641\u064A\u0638", gender: "F" },
      { seatNumber: "M211326", name: "\u0641\u0627\u0637\u0645\u0629 \u0625\u0628\u0631\u0627\u0647\u064A\u0645", gender: "F" },
      { seatNumber: "M218926", name: "\u0631\u0642\u064A\u0629 \u0625\u0633\u062D\u0627\u0642", gender: "F" },
      { seatNumber: "M219026", name: "\u0643\u0641\u064A\u0644\u0629 \u0623\u0648\u062F\u064A\u0631\u0648\u0646\u062A\u064A", gender: "F" }
    ]
  },
  // 6. فرع لافنوا (Lafenwa) — الثالث الثانوي (13 named)
  {
    key: "lafenwa-senior-secondary",
    className: "\u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u062B\u0627\u0646\u0648\u064A",
    arm: "\u0641\u0631\u0639 \u0644\u0627\u0641\u0646\u0648\u0627",
    category: "secondary",
    graduatingLevel: "senior_secondary",
    sourceSchool: "\u0645\u0639\u0647\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A \u2014 \u0641\u0631\u0639 \u0644\u0627\u0641\u0646\u0648\u0627",
    students: [
      { seatNumber: "M317026", name: "\u0639\u0628\u062F \u0627\u0644\u0631\u062D\u0645\u0646 \u0639\u0628\u062F \u0627\u0644\u0648\u0627\u0633\u0639", gender: "M" },
      { seatNumber: "M316926", name: "\u0642\u064A\u0633 \u0639\u0628\u062F \u0627\u0644\u0631\u0632\u0627\u0642", gender: "M" },
      { seatNumber: "M316826", name: "\u0645\u0641\u0644\u062D \u0627\u0644\u062F\u064A\u0646 \u0639\u0628\u062F \u0627\u0644\u0643\u0631\u064A\u0645", gender: "M" },
      { seatNumber: "M316726", name: "\u0628\u0644\u0642\u064A\u0633 \u0644\u0642\u0645\u0627\u0646", gender: "F" },
      { seatNumber: "M316626", name: "\u0628\u0644\u0642\u064A\u0633 \u0645\u062D\u0645\u062F", gender: "F" },
      { seatNumber: "M316526", name: "\u0631\u0627\u0636\u064A\u0629 \u063A\u0632\u0627\u0644\u064A", gender: "F" },
      { seatNumber: "M316426", name: "\u0632\u064A\u0646\u0628 \u062C\u0646\u064A\u062F", gender: "F" },
      { seatNumber: "M316326", name: "\u0632\u064A\u0646\u0628 \u0645\u0648\u0633\u0649", gender: "F" },
      { seatNumber: "M316226", name: "\u0639\u0648\u0646\u0629 \u062A\u064A\u062C\u0627\u0646\u064A", gender: "F" },
      { seatNumber: "M316126", name: "\u0645\u0631\u064A\u0645 \u0628\u062F\u0631\u0627\u0644\u062F\u064A\u0646", gender: "F" },
      { seatNumber: "M316026", name: "\u0645\u0631\u064A\u0645 \u064A\u0644\u0644\u0648", gender: "F" },
      { seatNumber: "M315926", name: "\u0645\u0637\u0645\u0626\u0646\u0629 \u0639\u0628\u062F \u0627\u0644\u0644\u0647", gender: "F" },
      { seatNumber: "M315826", name: "\u0645\u0646\u064A\u0631\u0629 \u0639\u062B\u0645\u0627\u0646", gender: "F" }
    ]
  },
  // 7. معهد الثقافة وتعليم القرآن (إصولو) — الإبتدائي (2 named)
  {
    key: "isolo-elementary",
    className: "\u0627\u0644\u0625\u0628\u062A\u062F\u0627\u0626\u064A",
    arm: "\u0645\u0639\u0647\u062F \u0627\u0644\u062B\u0642\u0627\u0641\u0629 (\u0625\u0635\u0648\u0644\u0648)",
    category: "elementary",
    graduatingLevel: "elementary",
    sourceSchool: "\u0645\u0639\u0647\u062F \u0627\u0644\u062B\u0642\u0627\u0641\u0629 \u0648\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0642\u0631\u0622\u0646 \u2014 \u0625\u0635\u0648\u0644\u0648",
    students: [
      { seatNumber: "T117326", name: "\u062D\u0633\u0646 \u0645\u062D\u0645\u062F \u0627\u0644\u0623\u0648\u0644", gender: "M" },
      { seatNumber: "T117226", name: "\u0641\u0631\u064A\u062F \u0623\u062F\u064A\u0644\u064A\u064A\u064A", gender: "M" }
    ]
  },
  // 8. معهد الثقافة وتعليم القرآن (إصولو) — الثالث الإعدادي (1 named)
  {
    key: "isolo-junior-secondary",
    className: "\u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A",
    arm: "\u0645\u0639\u0647\u062F \u0627\u0644\u062B\u0642\u0627\u0641\u0629 (\u0625\u0635\u0648\u0644\u0648)",
    category: "secondary",
    graduatingLevel: "junior_secondary",
    sourceSchool: "\u0645\u0639\u0647\u062F \u0627\u0644\u062B\u0642\u0627\u0641\u0629 \u0648\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0642\u0631\u0622\u0646 \u2014 \u0625\u0635\u0648\u0644\u0648",
    students: [
      { seatNumber: "T217126", name: "\u0645\u062D\u0645\u062F \u0627\u0644\u0623\u0648\u0644 \u0645\u062D\u0645\u062F", gender: "M" }
    ]
  },
  // 9. معهد اقرأ — الإبتدائي (8 named)
  {
    key: "iqra-elementary",
    className: "\u0627\u0644\u0625\u0628\u062A\u062F\u0627\u0626\u064A",
    arm: "\u0645\u0639\u0647\u062F \u0627\u0642\u0631\u0623",
    category: "elementary",
    graduatingLevel: "elementary",
    sourceSchool: "\u0645\u0639\u0647\u062F \u0627\u0642\u0631\u0623",
    students: [
      { seatNumber: "Q118126", name: "\u0627\u0644\u0623\u0645\u064A\u0646 \u0641\u0627\u062F\u064A\u064A\u064A", gender: "M" },
      { seatNumber: "Q118026", name: "\u062C\u0645\u0627\u0644 \u0627\u0644\u062F\u064A\u0646 \u0623\u0648\u0644\u0627\u0643\u0644\u064A", gender: "M" },
      { seatNumber: "Q117926", name: "\u0639\u0628\u062F \u0627\u0644\u062D\u0645\u064A\u062F \u0628\u062F\u0645\u0627\u0635", gender: "M" },
      { seatNumber: "Q117826", name: "\u0639\u0628\u062F \u0627\u0644\u0631\u062D\u0645\u0646 \u0639\u0628\u062F \u0627\u0644\u0644\u0637\u064A\u0641", gender: "M" },
      { seatNumber: "Q117726", name: "\u0645\u0628\u0627\u0631\u0643 \u0635\u0627\u0644\u062D", gender: "M" },
      { seatNumber: "Q117626", name: "\u0633\u0645\u064A\u0629 \u0639\u0628\u062F \u0627\u0644\u0648\u0627\u0633\u0639", gender: "F" },
      { seatNumber: "Q117526", name: "\u0631\u0636\u0648\u0627\u0646 \u0627\u0644\u0644\u0647 \u0639\u0628\u062F \u0627\u0644\u062D\u0645\u064A\u062F", gender: "M" },
      { seatNumber: "Q117426", name: "\u0635\u0641\u064A\u0629 \u0639\u0628\u062F \u0627\u0644\u0648\u0627\u0633\u0639", gender: "F" }
    ]
  },
  // 10. معهد الرحيم — الإبتدائي (5 named)
  {
    key: "al-raheem-elementary",
    className: "\u0627\u0644\u0625\u0628\u062A\u062F\u0627\u0626\u064A",
    arm: "\u0645\u0639\u0647\u062F \u0627\u0644\u0631\u062D\u064A\u0645",
    category: "elementary",
    graduatingLevel: "elementary",
    sourceSchool: "\u0645\u0639\u0647\u062F \u0627\u0644\u0631\u062D\u064A\u0645",
    students: [
      { seatNumber: "R118626", name: "\u0639\u0628\u062F \u0627\u0644\u0628\u0627\u0633\u0637 \u0625\u062F\u0631\u064A\u0633", gender: "M" },
      { seatNumber: "R118526", name: "\u0639\u0628\u062F \u0627\u0644\u062D\u0645\u064A\u062F \u064A\u0648\u0633\u0641", gender: "M" },
      { seatNumber: "R118426", name: "\u062D\u0633\u0646 \u0623\u0648\u0644\u0648\u062C\u064A\u062F\u0649", gender: "M" },
      { seatNumber: "R118326", name: "\u062D\u0644\u064A\u0645\u0629 \u0623\u0648\u0644\u0648\u064A\u064A\u062F\u0649", gender: "F" },
      { seatNumber: "R118226", name: "\u0641\u0631\u064A\u062F\u0629 \u0639\u0644\u064A", gender: "F" }
    ]
  }
];

// server/utils/seedGraduating2026.ts
var renumberClassStudents = async (classId) => {
  const students = await Student_default.find({ class: classId, status: "active" });
  const collator = new Intl.Collator("ar");
  const sorted = [...students].sort((a, b) => {
    if (a.gender !== b.gender) {
      return a.gender === "M" ? -1 : 1;
    }
    return collator.compare(a.name, b.name);
  });
  await Promise.all(
    sorted.map(
      (st, idx) => Student_default.updateOne({ _id: st._id }, { $set: { numberInClass: idx + 1 } })
    )
  );
};
var ensureGraduating2026Setup = async () => {
  let ronikBranch = await Branch_default.findOne({ name: /ronik/i }) || await Branch_default.findOne({ name: /permanent/i }) || await Branch_default.findOne();
  if (!ronikBranch) {
    ronikBranch = await Branch_default.create({
      name: "Permanent site (Ronik)",
      address: "Ronik Campus, Ejigbo, Lagos"
    });
  }
  const branchId = ronikBranch._id.toString();
  let classesCreated = 0;
  let classesExisting = 0;
  let studentsInserted = 0;
  let studentsUpdated = 0;
  let subjectsSeeded = 0;
  for (const group of GRADUATING_ROSTER_2026) {
    let classDoc = await Class_default.findOne({
      branch: branchId,
      name: group.className,
      $or: [{ arm: group.arm }, { sourceSchool: group.sourceSchool }]
    });
    if (!classDoc) {
      classDoc = await Class_default.create({
        name: group.className,
        arm: group.arm,
        category: group.category,
        branch: branchId,
        isGraduating: true,
        graduatingLevel: group.graduatingLevel,
        sourceSchool: group.sourceSchool,
        secondaryResultMode: "current_only"
      });
      classesCreated++;
    } else {
      classesExisting++;
      const updates = {};
      if (!classDoc.isGraduating) updates.isGraduating = true;
      if (!classDoc.graduatingLevel) updates.graduatingLevel = group.graduatingLevel;
      if (!classDoc.sourceSchool) updates.sourceSchool = group.sourceSchool;
      if (!classDoc.arm) updates.arm = group.arm;
      if (classDoc.category !== group.category) updates.category = group.category;
      if (Object.keys(updates).length > 0) {
        await Class_default.updateOne({ _id: classDoc._id }, { $set: updates });
      }
    }
    const classId = classDoc._id.toString();
    const seededCount = await seedGraduatingClassSubjects(classId, group.graduatingLevel, branchId);
    subjectsSeeded += seededCount;
    for (const s of group.students) {
      const existingStudent = await Student_default.findOne({
        $or: [
          { seatNumber: s.seatNumber },
          { admissionNumber: s.seatNumber }
        ]
      });
      if (!existingStudent) {
        await Student_default.create({
          name: s.name,
          gender: s.gender,
          class: classId,
          branch: branchId,
          seatNumber: s.seatNumber,
          admissionNumber: s.seatNumber,
          studentCode: s.seatNumber,
          sourceSchool: group.sourceSchool,
          numberInClass: 0,
          status: "active",
          joinedTerm: 1,
          enrolledTerms: [1, 2, 3],
          resultModeOverride: "default"
        });
        studentsInserted++;
      } else {
        const stUpdates = {};
        if (existingStudent.seatNumber !== s.seatNumber) stUpdates.seatNumber = s.seatNumber;
        if (!existingStudent.sourceSchool) stUpdates.sourceSchool = group.sourceSchool;
        if (existingStudent.branch?.toString() !== branchId) stUpdates.branch = branchId;
        if (existingStudent.class?.toString() !== classId) stUpdates.class = classId;
        if (Object.keys(stUpdates).length > 0) {
          await Student_default.updateOne({ _id: existingStudent._id }, { $set: stUpdates });
          studentsUpdated++;
        }
      }
    }
    await renumberClassStudents(classId);
  }
  return {
    branchName: ronikBranch.name,
    classesCreated,
    classesExisting,
    studentsInserted,
    studentsUpdated,
    subjectsSeeded
  };
};

// server/controllers/classController.ts
var normalizeArabic = (text) => {
  if (!text) return "";
  return text.toLowerCase().replace(/[أإآٱ]/g, "\u0627").replace(/ة/g, "\u0647").replace(/ى/g, "\u064A").replace(/[\u064B-\u065F]/g, "").trim();
};
var isElementaryClass = (name, category) => {
  if (category === "elementary") return true;
  const n = normalizeArabic(name || "");
  const raw = (name || "").toLowerCase();
  const isExplicitSecondary = n.includes("\u0627\u0639\u062F\u0627\u062F\u064A") || // إعدادي / اعدادي / الاعدادية
  n.includes("\u062B\u0627\u0646\u0648\u064A") || // ثانوي / الثانوية
  raw.includes("jss") || raw.includes("sss") || raw.includes("junior secondary") || raw.includes("senior secondary") || raw.includes("high school") || raw.includes("college");
  if (isExplicitSecondary) return false;
  const isElementaryName = n.includes("\u0645\u0633\u062A\u0648\u064A") || // matches مستوى and المستوي
  n.includes("\u0645\u0633\u062A\u0648\u0649") || n.includes("\u0627\u0628\u062A\u062F\u0627\u0626") || // matches ابتدائي, ابتدائيه, الابتدائي
  n.includes("\u0631\u0648\u0636") || // matches روضة, رياض
  n.includes("\u062A\u0645\u0647\u064A\u062F") || // matches تمهيدي, التمهيدي
  n.includes("\u062D\u0636\u0627\u0646\u0647") || // matches حضانة, حضانه
  n.includes("\u0637\u0641\u0648\u0644") || // طفولة
  raw.includes("stage") || raw.includes("elementary") || raw.includes("primary") || raw.includes("pry") || raw.includes("basic") || raw.includes("nursery") || raw.includes("nur") || raw.includes("kg") || raw.includes("kindergarten") || raw.includes("creche") || raw.includes("reception") || raw.includes("preschool") || raw.includes("pre-school") || raw.includes("playgroup") || raw.includes("toddler") || /\bgrade\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) || /\byear\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) || /\bclass\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) || /\bpri(mary)?\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) || /\bbasic\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) || /(صف|الفصل|المرحله|مرحله|المستوي|مستوي)?\s*(ال)?(اول|اولي|ثاني|ثانيه|ثالث|ثالثه|رابع|رابعه|خامس|خامسه|سادس|سادسه|[1-6])/.test(n);
  if (isElementaryName) return true;
  if (category === "secondary") return false;
  return false;
};
var ensureElementarySubjectsForClass = async (classId) => {
  try {
    const existing = await Subject_default.find({ class: classId });
    const existingNames = new Set(
      existing.map((s) => s.nameEnglish.trim().toLowerCase())
    );
    const toInsert = [];
    for (let i = 0; i < ELEMENTARY_FIXED_SUBJECTS.length; i++) {
      const fixed = ELEMENTARY_FIXED_SUBJECTS[i];
      if (!existingNames.has(fixed.nameEnglish.toLowerCase())) {
        toInsert.push({
          nameEnglish: fixed.nameEnglish,
          nameArabic: fixed.nameArabic,
          class: classId,
          order: fixed.order
        });
      }
    }
    if (toInsert.length > 0) {
      await Subject_default.insertMany(toInsert);
    }
  } catch (err) {
    console.error("Failed to auto-seed elementary subjects for class:", classId, err);
  }
};
var createClass = async (req, res) => {
  try {
    let {
      name,
      arm,
      branch,
      category,
      isGraduating,
      graduatingLevel,
      sourceSchool,
      secondaryResultMode
    } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Class name is required" });
    }
    name = name.trim();
    const gradFlag = isGraduatingClass(name, Boolean(isGraduating));
    if (gradFlag && !isSuperAdmin(req)) {
      return res.status(403).json({
        message: "Forbidden: Only the main administrator (Super Admin) can create graduating classes."
      });
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      branch = req.user.branch;
    }
    if (gradFlag && !branch) {
      const ronikBranch = await Branch_default.findOne({ name: /ronik/i }) || await Branch_default.findOne({ name: /permanent/i }) || await Branch_default.findOne();
      if (ronikBranch) branch = ronikBranch._id;
    }
    if (!category || category === "secondary" && isElementaryClass(name)) {
      category = isElementaryClass(name) ? "elementary" : "secondary";
    }
    const resolvedGradLevel = gradFlag ? graduatingLevel || detectGraduatingLevel(name) || (category === "elementary" ? "elementary" : "junior_secondary") : void 0;
    const validSecondaryMode = secondaryResultMode === "combine_1st_and_3rd" ? "combine_1st_and_3rd" : "current_only";
    const newClass = await Class_default.create({
      name,
      arm: typeof arm === "string" && arm.trim() ? arm.trim() : void 0,
      branch,
      category,
      isGraduating: gradFlag,
      graduatingLevel: resolvedGradLevel,
      sourceSchool: typeof sourceSchool === "string" && sourceSchool.trim() ? sourceSchool.trim() : void 0,
      secondaryResultMode: validSecondaryMode
    });
    if (category === "elementary") {
      await ensureElementarySubjectsForClass(newClass._id.toString());
    } else if (gradFlag) {
      await seedGraduatingClassSubjects(
        newClass._id.toString(),
        resolvedGradLevel,
        branch?.toString()
      );
    }
    const populated = await Class_default.findById(newClass._id).populate("branch", "name");
    res.status(201).json(populated || newClass);
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
    } else if (req.user?.role === "subject_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const teacherClassIds = (teacher?.classes || []).map((c) => c.toString());
      const teacherSubjectIds = teacher?.subjects || [];
      let subjectClassIds = [];
      if (teacherSubjectIds.length > 0) {
        const subjs = await Subject_default.find({ _id: { $in: teacherSubjectIds } }).select("class");
        subjectClassIds = subjs.filter((s) => s.class).map((s) => s.class.toString());
      }
      const allowedClassIds = Array.from(/* @__PURE__ */ new Set([...teacherClassIds, ...subjectClassIds]));
      filter._id = { $in: allowedClassIds };
    } else if (req.query.branch) {
      filter.branch = req.query.branch;
    }
    const classes = await Class_default.find(filter).populate("branch", "name").sort({ name: 1, arm: 1 });
    const userIsSuperAdmin = isSuperAdmin(req);
    const processed = await Promise.all(
      classes.map(async (cls) => {
        const clsObj = cls.toObject();
        const isGrad = isClassGraduatingDoc(clsObj);
        if (isGrad && !clsObj.isGraduating) {
          clsObj.isGraduating = true;
          const level = detectGraduatingLevel(clsObj.name);
          if (level && !clsObj.graduatingLevel) clsObj.graduatingLevel = level;
          Class_default.updateOne(
            { _id: cls._id },
            {
              $set: {
                isGraduating: true,
                ...level ? { graduatingLevel: level } : {}
              }
            }
          ).catch(() => {
          });
        }
        if (isGrad && !userIsSuperAdmin) {
          return null;
        }
        const isElem = clsObj.category === "elementary" || isElementaryClass(clsObj.name);
        if (clsObj.category !== "elementary" && isElem) {
          clsObj.category = "elementary";
          Class_default.updateOne({ _id: cls._id }, { $set: { category: "elementary" } }).catch(() => {
          });
        }
        if (isElem) {
          ensureElementarySubjectsForClass(cls._id.toString()).catch(() => {
          });
        }
        return clsObj;
      })
    );
    res.status(200).json(processed.filter(Boolean));
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var updateClass = async (req, res) => {
  try {
    const {
      name,
      arm,
      branch,
      category,
      isGraduating,
      graduatingLevel,
      sourceSchool,
      secondaryResultMode
    } = req.body;
    const existing = await Class_default.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Class not found" });
    const targetIsGrad = isClassGraduatingDoc(existing) || isGraduatingClass(name ?? existing.name, isGraduating);
    if (targetIsGrad && !isSuperAdmin(req)) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can manage graduating classes."
      });
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (existing.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: You can only edit classes in your assigned branch." });
      }
    }
    const updateData = {};
    if (name !== void 0) updateData.name = String(name).trim();
    if (category !== void 0) {
      updateData.category = category;
    } else if (name !== void 0) {
      updateData.category = isElementaryClass(name, existing.category) ? "elementary" : "secondary";
    }
    if (branch !== void 0) {
      updateData.branch = req.user?.role === "branch_admin" && req.user.branch ? req.user.branch : branch;
    }
    if (isGraduating !== void 0 || name !== void 0) {
      updateData.isGraduating = targetIsGrad;
      if (targetIsGrad && !existing.graduatingLevel && !graduatingLevel) {
        updateData.graduatingLevel = detectGraduatingLevel(updateData.name || existing.name);
      }
    }
    if (graduatingLevel !== void 0 && ["elementary", "junior_secondary", "senior_secondary"].includes(graduatingLevel)) {
      updateData.graduatingLevel = graduatingLevel;
    }
    if (secondaryResultMode !== void 0 && ["current_only", "combine_1st_and_3rd"].includes(secondaryResultMode)) {
      updateData.secondaryResultMode = secondaryResultMode;
    }
    const updateQuery = { $set: updateData };
    const unsetFields = {};
    if (arm !== void 0) {
      if (typeof arm === "string" && arm.trim()) {
        updateData.arm = arm.trim();
      } else {
        unsetFields.arm = 1;
      }
    }
    if (sourceSchool !== void 0) {
      if (typeof sourceSchool === "string" && sourceSchool.trim()) {
        updateData.sourceSchool = sourceSchool.trim();
      } else {
        unsetFields.sourceSchool = 1;
      }
    }
    if (Object.keys(unsetFields).length > 0) {
      updateQuery.$unset = unsetFields;
    }
    const updated = await Class_default.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true, returnDocument: "after" }
    ).populate("branch", "name");
    if (updated && (updated.category === "elementary" || isElementaryClass(updated.name))) {
      await ensureElementarySubjectsForClass(updated._id.toString());
    }
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const userRole = req.user?.role;
    if (userRole !== "super_admin" && userRole !== "branch_admin") {
      return res.status(403).json({ message: "Only administrators can delete a class." });
    }
    const classObj = await Class_default.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: "Class not found" });
    }
    if (isClassGraduatingDoc(classObj) && !isSuperAdmin(req)) {
      return res.status(403).json({ message: "Forbidden: Only Super Admin can delete a graduating class." });
    }
    if (userRole === "branch_admin" && req.user?.branch) {
      if (classObj.branch && classObj.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "You can only delete classes in your assigned branch." });
      }
    }
    const students = await Student_default.find({ class: classId }).select("_id");
    const studentIds = students.map((s) => s._id);
    const subjects = await Subject_default.find({ class: classId }).select("_id");
    const subjectIds = subjects.map((s) => s._id);
    await Score_default.deleteMany({
      $or: [
        { student: { $in: studentIds } },
        { subject: { $in: subjectIds } }
      ]
    });
    await Attendance_default.deleteMany({
      $or: [{ class: classId }, { student: { $in: studentIds } }]
    });
    await AttendanceSetting_default.deleteMany({ class: classId });
    if (studentIds.length > 0) {
      await ReportCardRemark_default.deleteMany({ student: { $in: studentIds } });
    }
    await ResultPublication_default.deleteMany({ class: classId });
    await Student_default.deleteMany({ class: classId });
    await Subject_default.deleteMany({ class: classId });
    await User_default.updateMany({ classes: classId }, { $pull: { classes: classId } });
    if (subjectIds.length > 0) {
      await User_default.updateMany(
        { subjects: { $in: subjectIds } },
        { $pull: { subjects: { $in: subjectIds } } }
      );
    }
    if (studentIds.length > 0) {
      await User_default.updateMany(
        { linkedStudent: { $in: studentIds } },
        { $unset: { linkedStudent: 1 } }
      );
    }
    await Class_default.findByIdAndDelete(classId);
    res.status(200).json({
      message: "Class and all linked students, subjects, scores, attendance, remarks, and records have been permanently deleted.",
      deletedStudentsCount: studentIds.length,
      deletedSubjectsCount: subjectIds.length
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var setupGraduating2026 = async (req, res) => {
  try {
    if (!isSuperAdmin(req)) {
      return res.status(403).json({ message: "Forbidden: Super Admin access required." });
    }
    const summary = await ensureGraduating2026Setup();
    res.status(200).json({
      message: `Graduating classes & 2026 roster synced under ${summary.branchName}.`,
      summary
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var cloneClassSubjects = async (req, res) => {
  try {
    if (!isSuperAdmin(req)) {
      return res.status(403).json({ message: "Forbidden: Super Admin access required." });
    }
    const targetClass = await Class_default.findById(req.params.id);
    if (!targetClass) return res.status(404).json({ message: "Target class not found" });
    const { sourceClassId } = req.body || {};
    if (!sourceClassId) {
      const level = targetClass.graduatingLevel || detectGraduatingLevel(targetClass.name) || (targetClass.category === "elementary" ? "elementary" : "junior_secondary");
      const count = await seedGraduatingClassSubjects(
        targetClass._id.toString(),
        level,
        targetClass.branch?.toString()
      );
      const updated2 = await Subject_default.find({ class: targetClass._id }).sort({ order: 1, nameEnglish: 1 });
      return res.status(200).json({
        message: `Added ${count} subject(s) from level curriculum.`,
        addedCount: count,
        subjects: updated2
      });
    }
    const sourceSubjects = await Subject_default.find({ class: sourceClassId }).sort({ order: 1, nameEnglish: 1 });
    if (sourceSubjects.length === 0) {
      return res.status(404).json({ message: "Source class has no subjects to copy." });
    }
    const existingSubjects = await Subject_default.find({ class: targetClass._id });
    const existingSet = new Set(existingSubjects.map((s) => s.nameEnglish.trim().toLowerCase()));
    let nextOrder = existingSubjects.length + 1;
    const toInsert = sourceSubjects.filter((s) => !existingSet.has(s.nameEnglish.trim().toLowerCase())).map((s) => ({
      nameEnglish: s.nameEnglish,
      nameArabic: s.nameArabic,
      class: targetClass._id,
      order: nextOrder++
    }));
    if (toInsert.length > 0) {
      await Subject_default.insertMany(toInsert);
    }
    const updated = await Subject_default.find({ class: targetClass._id }).sort({ order: 1, nameEnglish: 1 });
    res.status(200).json({
      message: `Copied ${toInsert.length} new subject(s) into ${targetClass.name}.`,
      addedCount: toInsert.length,
      subjects: updated
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/classRoutes.ts
var router3 = Router3();
router3.post("/graduating/setup-2026", protect, authorize("super_admin"), setupGraduating2026);
router3.post("/:id/clone-subjects", protect, authorize("super_admin"), cloneClassSubjects);
router3.post("/", protect, authorize("super_admin", "branch_admin"), createClass);
router3.get("/", optionalProtect, getClasses);
router3.put("/:id", protect, authorize("super_admin", "branch_admin"), updateClass);
router3.delete("/:id", protect, authorize("super_admin", "branch_admin"), deleteClass);
var classRoutes_default = router3;

// server/routes/subjectRoutes.ts
import { Router as Router4 } from "express";

// server/controllers/subjectController.ts
init_Subject();
init_Class();
init_Student();
init_Score();
init_User();
var createSubject = async (req, res) => {
  try {
    const { nameEnglish, nameArabic, class: classId, order } = req.body;
    const access = await assertSuperAdminForClass(req, classId);
    if (!access.classDoc) return res.status(404).json({ message: "Class not found" });
    if (!access.allowed) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can manage graduating class subjects."
      });
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (access.classDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Class does not belong to your branch" });
      }
    }
    let finalOrder = order;
    if (finalOrder === void 0 || finalOrder === null) {
      const count = await Subject_default.countDocuments({ class: classId });
      finalOrder = count + 1;
    }
    const subject = await Subject_default.create({
      nameEnglish,
      nameArabic,
      class: classId,
      order: Number(finalOrder) || 0
    });
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
    const access = await assertSuperAdminForClass(req, classId);
    if (!access.classDoc) return res.status(404).json({ message: "Class not found" });
    if (!access.allowed) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can manage graduating class subjects."
      });
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (access.classDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Class does not belong to your branch" });
      }
    }
    const currentCount = await Subject_default.countDocuments({ class: classId });
    const toInsert = subjects.map((s, idx) => ({
      nameEnglish: s.nameEnglish,
      nameArabic: s.nameArabic,
      class: classId,
      order: s.order !== void 0 ? s.order : currentCount + idx + 1
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
    const userIsSuperAdmin = isSuperAdmin(req);
    const gradClassIds = userIsSuperAdmin ? [] : await getAllGraduatingClassIds();
    if (req.query.class && !userIsSuperAdmin && gradClassIds.includes(req.query.class)) {
      return res.status(403).json({
        message: "Forbidden: Graduating class subjects are restricted to Super Admin."
      });
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      const branchClasses = await Class_default.find({ branch: req.user.branch }).select("_id");
      const branchClassIds = branchClasses.map((c) => c._id.toString()).filter((cid) => !gradClassIds.includes(cid));
      if (req.query.class) {
        if (!branchClassIds.includes(req.query.class)) {
          return res.status(403).json({ message: "Forbidden: Class does not belong to your branch" });
        }
        filter.class = req.query.class;
      } else {
        filter.class = { $in: branchClassIds };
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const teacherClassIds = (teacher?.classes || []).map((c) => c.toString()).filter((cid) => !gradClassIds.includes(cid));
      if (req.query.class) {
        if (!teacherClassIds.includes(req.query.class)) {
          return res.status(403).json({ message: "Forbidden: You are not assigned to this class" });
        }
        filter.class = req.query.class;
      } else {
        filter.class = { $in: teacherClassIds };
      }
    } else if (req.user?.role === "subject_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const allowedSubjectIds = (teacher?.subjects || []).map((s) => s.toString());
      filter._id = { $in: allowedSubjectIds };
      if (req.query.class) {
        filter.class = req.query.class;
      } else if (gradClassIds.length > 0) {
        filter.class = { $nin: gradClassIds };
      }
    } else if (req.query.class) {
      filter.class = req.query.class;
    } else if (!userIsSuperAdmin && gradClassIds.length > 0) {
      filter.class = { $nin: gradClassIds };
    }
    if (req.query.class) {
      const cls = await Class_default.findById(req.query.class);
      if (cls && (cls.category === "elementary" || isElementaryClass(cls.name))) {
        await ensureElementarySubjectsForClass(cls._id.toString());
      }
    }
    const subjects = await Subject_default.find(filter).sort({ order: 1, nameEnglish: 1 });
    res.status(200).json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var reorderSubjects = async (req, res) => {
  try {
    const { class: classId, subjectIds } = req.body;
    if (!classId || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res.status(400).json({ message: "class and subjectIds array are required" });
    }
    const access = await assertSuperAdminForClass(req, classId);
    if (!access.classDoc) return res.status(404).json({ message: "Class not found" });
    if (!access.allowed) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can reorder graduating class subjects."
      });
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (access.classDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Class does not belong to your branch" });
      }
    }
    const bulkOps = subjectIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, class: classId },
        update: { $set: { order: index + 1 } }
      }
    }));
    await Subject_default.bulkWrite(bulkOps);
    const updatedSubjects = await Subject_default.find({ class: classId }).sort({ order: 1, nameEnglish: 1 });
    res.status(200).json(updatedSubjects);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var updateSubject = async (req, res) => {
  try {
    const subject = await Subject_default.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    const access = await assertSuperAdminForClass(req, subject.class.toString());
    if (!access.allowed) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can edit graduating class subjects."
      });
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (!access.classDoc || access.classDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Subject does not belong to your branch" });
      }
    }
    const updated = await Subject_default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var deleteSubject = async (req, res) => {
  try {
    const subject = await Subject_default.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    const access = await assertSuperAdminForClass(req, subject.class.toString());
    if (!access.allowed) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can delete graduating class subjects."
      });
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (!access.classDoc || access.classDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Subject does not belong to your branch" });
      }
    }
    await Subject_default.findByIdAndDelete(req.params.id);
    await Promise.all([
      Score_default.deleteMany({ subject: req.params.id }),
      Student_default.updateMany(
        { excludedSubjects: req.params.id },
        { $pull: { excludedSubjects: req.params.id } }
      ),
      User_default.updateMany(
        { subjects: req.params.id },
        { $pull: { subjects: req.params.id } }
      )
    ]);
    res.status(200).json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/subjectRoutes.ts
var router4 = Router4();
router4.post("/", protect, authorize("super_admin", "branch_admin"), createSubject);
router4.get("/", protect, getSubjects);
router4.put("/reorder", protect, authorize("super_admin", "branch_admin"), reorderSubjects);
router4.put("/:id", protect, authorize("super_admin", "branch_admin"), updateSubject);
router4.delete("/:id", protect, authorize("super_admin", "branch_admin"), deleteSubject);
router4.post("/bulk", protect, authorize("super_admin", "branch_admin"), bulkCreateSubjects);
var subjectRoutes_default = router4;

// server/routes/gradingScaleRoutes.ts
import { Router as Router5 } from "express";
init_gradingScaleController();
var router5 = Router5();
router5.post("/", protect, authorize("super_admin", "branch_admin"), createGradingScale);
router5.get("/", protect, getGradingScales);
router5.post("/reset-taqdeer", protect, authorize("super_admin", "branch_admin"), resetTaqdeerScale);
router5.put("/:id", protect, authorize("super_admin", "branch_admin"), updateGradingScale);
router5.delete("/:id", protect, authorize("super_admin", "branch_admin"), deleteGradingScale);
var gradingScaleRoutes_default = router5;

// server/routes/studentRoutes.ts
import { Router as Router6 } from "express";

// server/controllers/studentController.ts
init_Student();
init_Class();
init_Subject();
init_Score();
init_Attendance();
init_ReportCardRemark();
init_User();
import mongoose16 from "mongoose";

// server/models/Term.ts
import mongoose15, { Schema as Schema13 } from "mongoose";
var TermSchema = new Schema13({
  session: { type: String, required: true },
  termNumber: { type: Number, enum: [1, 2, 3], required: true },
  isActive: { type: Boolean, default: false },
  timesSchoolOpened: { type: Number, default: null },
  dateResumed: { type: String, default: "" },
  dateClosed: { type: String, default: "" },
  nextResumption: { type: String, default: "" }
});
var Term_default = mongoose15.model("Term", TermSchema);

// server/controllers/studentController.ts
var renumberClass = async (classId) => {
  const students = await Student_default.find({ class: classId, status: "active" });
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
    let {
      name,
      gender,
      class: classId,
      branch,
      admissionNumber,
      seatNumber,
      sourceSchool,
      resultModeOverride,
      excludedSubjects,
      parentPhone,
      parentEmail
    } = req.body;
    const classDoc = await Class_default.findById(classId);
    if (!classDoc) return res.status(404).json({ message: "Class not found" });
    if (isClassGraduatingDoc(classDoc) && !isSuperAdmin(req)) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can add students to graduating classes."
      });
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (classDoc.branch && classDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Class does not belong to your branch" });
      }
      branch = req.user.branch;
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const isAssigned = (teacher?.classes || []).some((c) => c.toString() === classId.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: "Forbidden: You can only add students to your assigned classes" });
      }
      branch = classDoc.branch;
    }
    const cleanSeat = typeof seatNumber === "string" && seatNumber.trim() ? seatNumber.trim() : void 0;
    const countInClass = await Student_default.countDocuments({ class: classId });
    const admNum = admissionNumber?.trim() || cleanSeat || `IAIS/${(/* @__PURE__ */ new Date()).getFullYear()}/${String(countInClass + 1).padStart(3, "0")}`;
    const validExcluded = Array.isArray(excludedSubjects) ? excludedSubjects.filter((id) => mongoose16.Types.ObjectId.isValid(String(id))) : [];
    const student = await Student_default.create({
      name: name.trim(),
      gender: gender || "M",
      class: classId,
      branch: branch || classDoc.branch,
      admissionNumber: admNum,
      studentCode: admNum,
      seatNumber: cleanSeat,
      sourceSchool: typeof sourceSchool === "string" && sourceSchool.trim() ? sourceSchool.trim() : classDoc.sourceSchool || void 0,
      resultModeOverride: resultModeOverride && ["default", "current_only", "combine_1st_and_3rd"].includes(resultModeOverride) ? resultModeOverride : "default",
      excludedSubjects: validExcluded,
      parentPhone: parentPhone?.trim(),
      parentEmail: parentEmail?.trim()?.toLowerCase(),
      numberInClass: 0,
      status: "active",
      joinedTerm: Number(req.body.joinedTerm) || 1,
      enrolledTerms: req.body.enrolledTerms && Array.isArray(req.body.enrolledTerms) && req.body.enrolledTerms.length > 0 ? req.body.enrolledTerms : req.body.joinedTerm ? [1, 2, 3].filter((t) => t >= Number(req.body.joinedTerm)) : [1, 2, 3]
    });
    await renumberClass(classId);
    const updated = await Student_default.findById(student?._id).populate(
      "class",
      "name arm isGraduating category sourceSchool secondaryResultMode graduatingLevel"
    );
    res.status(201).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var bulkCreateStudents = async (req, res) => {
  try {
    const { class: defaultClassId, branch: defaultBranchId, students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "students array is required" });
    }
    const userIsSuperAdmin = isSuperAdmin(req);
    const allClasses = await Class_default.find().populate("branch");
    const classMapById = /* @__PURE__ */ new Map();
    const classMapByName = {};
    allClasses.forEach((c) => {
      classMapById.set(c._id.toString(), c);
      const armSuffix = c.arm ? ` ${c.arm}` : "";
      const fullName = `${c.name}${armSuffix}`.toLowerCase().trim();
      classMapByName[fullName] = c;
      if (!classMapByName[c.name.toLowerCase().trim()]) {
        classMapByName[c.name.toLowerCase().trim()] = c;
      }
    });
    if (defaultClassId) {
      const defCls = classMapById.get(defaultClassId.toString());
      if (defCls && isClassGraduatingDoc(defCls) && !userIsSuperAdmin) {
        return res.status(403).json({
          message: "Forbidden: Only Super Admin can bulk upload into graduating classes."
        });
      }
    }
    const affectedClassIds = /* @__PURE__ */ new Set();
    const toInsert = [];
    const importErrors = [];
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const rowNum = i + 1;
      const rawName = String(s.name || s.Name || s.fullName || "").trim();
      const rawGender = String(s.gender || s.Gender || "M").trim().toUpperCase();
      const gender = rawGender === "F" || rawGender === "FEMALE" || rawGender === "\u0623\u0646\u062B\u0649" ? "F" : "M";
      const rawClass = String(s.class || s.Class || s.className || "").trim().toLowerCase();
      const seatNumber = String(
        s.seatNumber || s.SeatNumber || s.seatNo || s.SeatNo || s.sitNumber || s.SitNumber || s["Seat Number"] || s["\u0631\u0642\u0645 \u0627\u0644\u062C\u0644\u0648\u0633"] || ""
      ).trim();
      const sourceSchool = String(
        s.sourceSchool || s.SourceSchool || s.school || s.School || s["Source School"] || ""
      ).trim();
      const admissionNum = String(
        s.admissionNumber || s.AdmissionNumber || s.admNo || s.studentId || seatNumber || ""
      ).trim();
      const parentPhone = String(s.parentPhone || s.ParentPhone || s.phone || "").trim();
      const parentEmail = String(s.parentEmail || s.ParentEmail || s.email || "").trim().toLowerCase();
      if (!rawName) {
        importErrors.push({ row: rowNum, error: "Student name is missing" });
        continue;
      }
      let targetClassId = defaultClassId;
      let targetBranchId = defaultBranchId;
      let matchedClassDoc = defaultClassId ? classMapById.get(defaultClassId.toString()) : null;
      if (rawClass && classMapByName[rawClass]) {
        const matched = classMapByName[rawClass];
        matchedClassDoc = matched;
        targetClassId = matched._id.toString();
        targetBranchId = matched.branch?._id || matched.branch || defaultBranchId;
      }
      if (!targetClassId) {
        importErrors.push({
          row: rowNum,
          name: rawName,
          error: `No valid class assigned or matched for class '${rawClass || "None"}'`
        });
        continue;
      }
      if (matchedClassDoc && isClassGraduatingDoc(matchedClassDoc) && !userIsSuperAdmin) {
        importErrors.push({
          row: rowNum,
          name: rawName,
          error: "Only Super Admin can import into graduating classes"
        });
        continue;
      }
      affectedClassIds.add(targetClassId);
      const generatedAdm = admissionNum || `IAIS/${(/* @__PURE__ */ new Date()).getFullYear()}/${Math.floor(1e3 + Math.random() * 9e3)}`;
      toInsert.push({
        name: rawName,
        gender,
        class: targetClassId,
        branch: targetBranchId || matchedClassDoc?.branch?._id || matchedClassDoc?.branch,
        admissionNumber: generatedAdm,
        studentCode: generatedAdm,
        seatNumber: seatNumber || void 0,
        sourceSchool: sourceSchool || matchedClassDoc?.sourceSchool || void 0,
        parentPhone: parentPhone || void 0,
        parentEmail: parentEmail || void 0,
        numberInClass: 0,
        status: "active"
      });
    }
    if (toInsert.length === 0) {
      return res.status(400).json({
        message: "No valid students could be imported. Please check your data format.",
        errors: importErrors
      });
    }
    const created = await Student_default.insertMany(toInsert);
    for (const cid of Array.from(affectedClassIds)) {
      await renumberClass(cid);
    }
    let returnedStudents = [];
    if (defaultClassId) {
      returnedStudents = await Student_default.find({ class: defaultClassId, status: "active" }).populate("class", "name arm isGraduating category sourceSchool secondaryResultMode graduatingLevel").sort({ numberInClass: 1 });
    }
    res.status(201).json({
      message: `Successfully imported ${created.length} students into ${affectedClassIds.size} class(es).`,
      importedCount: created.length,
      errors: importErrors,
      students: returnedStudents
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getStudents = async (req, res) => {
  try {
    const filter = {};
    const userIsSuperAdmin = isSuperAdmin(req);
    const gradClassIds = userIsSuperAdmin ? [] : await getAllGraduatingClassIds();
    if (req.query.class && !userIsSuperAdmin && gradClassIds.includes(req.query.class)) {
      return res.status(403).json({
        message: "Forbidden: Graduating classes are restricted to Super Admin."
      });
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      filter.branch = req.user.branch;
      if (req.query.class) {
        const classDoc = await Class_default.findById(req.query.class);
        if (!classDoc || classDoc.branch?.toString() !== req.user.branch.toString()) {
          return res.status(403).json({ message: "Forbidden: Class not in your branch" });
        }
        filter.class = req.query.class;
      } else if (gradClassIds.length > 0) {
        filter.class = { $nin: gradClassIds };
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const assignedClassIds = (teacher?.classes || []).map((c) => c.toString()).filter((cid) => !gradClassIds.includes(cid));
      if (req.query.class) {
        if (!assignedClassIds.includes(req.query.class)) {
          return res.status(403).json({ message: "Forbidden: You are not assigned to this class" });
        }
        filter.class = req.query.class;
      } else {
        filter.class = { $in: assignedClassIds };
      }
    } else if (req.user?.role === "subject_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const assignedClassIds = (teacher?.classes || []).map((c) => c.toString());
      const teacherSubjectIds = teacher?.subjects || [];
      let subjectClassIds = [];
      if (teacherSubjectIds.length > 0) {
        const subjs = await Subject_default.find({ _id: { $in: teacherSubjectIds } }).select("class");
        subjectClassIds = subjs.filter((s) => s.class).map((s) => s.class.toString());
      }
      const allowedClassIds = Array.from(/* @__PURE__ */ new Set([...assignedClassIds, ...subjectClassIds])).filter(
        (cid) => !gradClassIds.includes(cid)
      );
      if (req.query.class) {
        if (!allowedClassIds.includes(req.query.class)) {
          return res.status(403).json({ message: "Forbidden: You are not assigned to this class or its subjects" });
        }
        filter.class = req.query.class;
      } else {
        filter.class = { $in: allowedClassIds };
      }
    } else {
      if (req.query.class) {
        filter.class = req.query.class;
      } else if (!userIsSuperAdmin && gradClassIds.length > 0) {
        filter.class = { $nin: gradClassIds };
      }
      if (req.query.branch) filter.branch = req.query.branch;
    }
    const students = await Student_default.find(filter).populate("class", "name arm isGraduating category sourceSchool secondaryResultMode graduatingLevel").sort({ numberInClass: 1, name: 1 });
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var updateStudent = async (req, res) => {
  try {
    const existing = await Student_default.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Student not found" });
    const existingClassDoc = await Class_default.findById(existing.class);
    const destClassDoc = req.body.class && req.body.class.toString() !== existing.class.toString() ? await Class_default.findById(req.body.class) : existingClassDoc;
    if ((isClassGraduatingDoc(existingClassDoc) || isClassGraduatingDoc(destClassDoc)) && !isSuperAdmin(req)) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can edit graduating class students."
      });
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (existing.branch && existing.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Student not in your branch" });
      }
      if (req.body.class && req.body.class !== existing.class.toString()) {
        if (!destClassDoc || destClassDoc.branch?.toString() !== req.user.branch.toString()) {
          return res.status(403).json({ message: "Forbidden: Destination class is not in your branch" });
        }
      }
      req.body.branch = req.user.branch;
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const isAssigned = (teacher?.classes || []).some((c) => c.toString() === existing.class.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: "Forbidden: Student is not in your assigned class" });
      }
    }
    if (req.body.joinedTerm && !req.body.enrolledTerms) {
      req.body.enrolledTerms = [1, 2, 3].filter((t) => t >= Number(req.body.joinedTerm));
    } else if (req.body.enrolledTerms && Array.isArray(req.body.enrolledTerms) && req.body.enrolledTerms.length > 0) {
      req.body.joinedTerm = Math.min(...req.body.enrolledTerms);
    }
    const allowedUpdates = {};
    const unsetUpdates = {};
    const directFields = [
      "name",
      "gender",
      "class",
      "branch",
      "admissionNumber",
      "studentCode",
      "parentPhone",
      "parentEmail",
      "status",
      "graduationSession",
      "enrolledTerms",
      "joinedTerm"
    ];
    for (const f of directFields) {
      if (req.body[f] !== void 0) allowedUpdates[f] = req.body[f];
    }
    if (req.body.seatNumber !== void 0) {
      const cleanSeat = String(req.body.seatNumber || "").trim();
      if (cleanSeat) allowedUpdates.seatNumber = cleanSeat;
      else unsetUpdates.seatNumber = 1;
    }
    if (req.body.sourceSchool !== void 0) {
      const cleanSchool = String(req.body.sourceSchool || "").trim();
      if (cleanSchool) allowedUpdates.sourceSchool = cleanSchool;
      else unsetUpdates.sourceSchool = 1;
    }
    if (req.body.resultModeOverride !== void 0 && ["default", "current_only", "combine_1st_and_3rd"].includes(req.body.resultModeOverride)) {
      allowedUpdates.resultModeOverride = req.body.resultModeOverride;
    }
    if (req.body.excludedSubjects !== void 0 && Array.isArray(req.body.excludedSubjects)) {
      const targetClassId = req.body.class || existing.class;
      const validClassSubjs = await Subject_default.find({ class: targetClassId }).select("_id");
      const validSet = new Set(validClassSubjs.map((s) => s._id.toString()));
      allowedUpdates.excludedSubjects = req.body.excludedSubjects.map((id) => String(id)).filter((id) => validSet.has(id));
    }
    const updateQuery = { $set: allowedUpdates };
    if (Object.keys(unsetUpdates).length > 0) {
      updateQuery.$unset = unsetUpdates;
    }
    const updated = await Student_default.findByIdAndUpdate(req.params.id, updateQuery, { new: true });
    if (!updated) return res.status(404).json({ message: "Student not found" });
    await renumberClass(updated.class.toString());
    if (existing.class.toString() !== updated.class.toString()) {
      await renumberClass(existing.class.toString());
    }
    const refreshed = await Student_default.findById(updated._id).populate(
      "class",
      "name arm isGraduating category sourceSchool secondaryResultMode graduatingLevel"
    );
    res.status(200).json(refreshed);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var updateStudentGraduatingOptions = async (req, res) => {
  try {
    if (!isSuperAdmin(req)) {
      return res.status(403).json({ message: "Forbidden: Super Admin access required." });
    }
    const student = await Student_default.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    const { seatNumber, sourceSchool, resultModeOverride, excludedSubjects } = req.body || {};
    if (seatNumber !== void 0) {
      const cleanSeat = String(seatNumber || "").trim();
      student.seatNumber = cleanSeat || void 0;
    }
    if (sourceSchool !== void 0) {
      const cleanSchool = String(sourceSchool || "").trim();
      student.sourceSchool = cleanSchool || void 0;
    }
    if (resultModeOverride !== void 0 && ["default", "current_only", "combine_1st_and_3rd"].includes(resultModeOverride)) {
      student.resultModeOverride = resultModeOverride;
    }
    if (excludedSubjects !== void 0) {
      if (!Array.isArray(excludedSubjects)) {
        return res.status(400).json({ message: "excludedSubjects must be an array" });
      }
      const classSubjects = await Subject_default.find({ class: student.class }).select("_id");
      const validIds = new Set(classSubjects.map((s) => s._id.toString()));
      student.excludedSubjects = excludedSubjects.map((id) => String(id)).filter((id) => validIds.has(id));
    }
    await student.save();
    const populated = await Student_default.findById(student._id).populate(
      "class",
      "name arm isGraduating category sourceSchool secondaryResultMode graduatingLevel"
    );
    res.status(200).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const userRole = req.user?.role;
    if (userRole !== "super_admin" && userRole !== "branch_admin") {
      return res.status(403).json({ message: "Only administrators can delete a student." });
    }
    const student = await Student_default.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });
    const classDoc = await Class_default.findById(student.class);
    if (isClassGraduatingDoc(classDoc) && !isSuperAdmin(req)) {
      return res.status(403).json({ message: "Forbidden: Only Super Admin can delete graduating class students." });
    }
    if (userRole === "branch_admin" && req.user?.branch) {
      if (student.branch && student.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "You can only delete students in your assigned branch." });
      }
    }
    await Student_default.findByIdAndDelete(studentId);
    await Score_default.deleteMany({ student: studentId });
    await Attendance_default.deleteMany({ student: studentId });
    await ReportCardRemark_default.deleteMany({ student: studentId });
    await User_default.updateMany({ linkedStudent: studentId }, { $unset: { linkedStudent: 1 } });
    await renumberClass(student.class.toString());
    res.status(200).json({ message: "Student and all associated records deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var cleanupOrphanedStudents = async (_req, res) => {
  try {
    const { purgeOrphanedData: purgeOrphanedData2 } = await Promise.resolve().then(() => (init_dataCleanup(), dataCleanup_exports));
    const result = await purgeOrphanedData2();
    res.status(200).json({
      message: `Database cleaned: removed ${result.deletedStudentsCount} orphaned students, ${result.deletedSubjectsCount} subjects, and ${result.deletedScoresCount} score records.`,
      result
    });
  } catch (err) {
    res.status(500).json({ message: "Server error during cleanup", error: err.message });
  }
};
var promoteStudents = async (req, res) => {
  try {
    const { studentIds, action, sourceClassId, targetClassId, graduationSession } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "studentIds array is required" });
    }
    if (!action || !["promote", "graduate", "retain", "transfer"].includes(action)) {
      return res.status(400).json({ message: "Valid action is required (promote, graduate, retain, transfer)" });
    }
    if (!isSuperAdmin(req)) {
      const gradIds = await getAllGraduatingClassIds();
      if (sourceClassId && gradIds.includes(sourceClassId.toString()) || targetClassId && gradIds.includes(targetClassId.toString())) {
        return res.status(403).json({
          message: "Forbidden: Only Super Admin can manage graduating class students."
        });
      }
      const inGrad = await Student_default.exists({ _id: { $in: studentIds }, class: { $in: gradIds } });
      if (inGrad) {
        return res.status(403).json({
          message: "Forbidden: Only Super Admin can promote or graduate graduating class students."
        });
      }
    }
    if (action === "promote" || action === "transfer") {
      if (!targetClassId) {
        return res.status(400).json({ message: "targetClassId is required for promotion or transfer" });
      }
      await Student_default.updateMany(
        { _id: { $in: studentIds } },
        { class: targetClassId, status: "active" }
      );
      if (sourceClassId) {
        await renumberClass(sourceClassId);
      }
      await renumberClass(targetClassId);
      return res.status(200).json({
        message: `Successfully moved ${studentIds.length} student(s) to destination class.`,
        count: studentIds.length
      });
    }
    if (action === "graduate") {
      await Student_default.updateMany(
        { _id: { $in: studentIds } },
        { status: "graduated", graduationSession: graduationSession || "" }
      );
      if (sourceClassId) {
        await renumberClass(sourceClassId);
      }
      return res.status(200).json({
        message: `Successfully marked ${studentIds.length} student(s) as Graduated.`,
        count: studentIds.length
      });
    }
    if (action === "retain") {
      await Student_default.updateMany(
        { _id: { $in: studentIds } },
        { status: "active" }
      );
      if (sourceClassId) {
        await renumberClass(sourceClassId);
      }
      return res.status(200).json({
        message: `Successfully retained ${studentIds.length} student(s) in current class.`,
        count: studentIds.length
      });
    }
    res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    res.status(500).json({ message: "Server error during promotion", error: err.message });
  }
};
var updateStudentEnrolledTerms = async (req, res) => {
  try {
    const { enrolledTerms, joinedTerm } = req.body;
    const student = await Student_default.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    const classDoc = await Class_default.findById(student.class);
    if (isClassGraduatingDoc(classDoc) && !isSuperAdmin(req)) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can manage graduating class students."
      });
    }
    let finalEnrolled = enrolledTerms;
    let finalJoined = joinedTerm ? Number(joinedTerm) : void 0;
    if (!finalEnrolled && finalJoined) {
      finalEnrolled = [1, 2, 3].filter((t) => t >= finalJoined);
    } else if (finalEnrolled && finalEnrolled.length > 0) {
      finalJoined = Math.min(...finalEnrolled);
    } else {
      finalEnrolled = [1, 2, 3];
      finalJoined = 1;
    }
    student.enrolledTerms = finalEnrolled;
    student.joinedTerm = finalJoined;
    await student.save();
    res.status(200).json({
      message: "Enrolled terms updated successfully",
      student: {
        _id: student._id,
        name: student.name,
        enrolledTerms: student.enrolledTerms,
        joinedTerm: student.joinedTerm
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var autoDetectEnrolledTerms = async (req, res) => {
  try {
    const { classId } = req.body;
    if (classId && !isSuperAdmin(req)) {
      const cls = await Class_default.findById(classId);
      if (isClassGraduatingDoc(cls)) {
        return res.status(403).json({
          message: "Forbidden: Only Super Admin can manage graduating class students."
        });
      }
    }
    const studentFilter = {
      status: { $nin: ["graduated", "transferred", "archived"] }
    };
    if (classId) {
      studentFilter.class = classId;
    } else if (!isSuperAdmin(req)) {
      const gradIds = await getAllGraduatingClassIds();
      if (gradIds.length > 0) studentFilter.class = { $nin: gradIds };
    }
    const students = await Student_default.find(studentFilter);
    const terms = await Term_default.find().sort({ termNumber: 1 });
    const t1 = terms.find((t) => t.termNumber === 1);
    const t2 = terms.find((t) => t.termNumber === 2);
    const t3 = terms.find((t) => t.termNumber === 3);
    let updatedCount = 0;
    const updates = [];
    for (const student of students) {
      const countT1 = t1 ? await Score_default.countDocuments({ student: student._id, term: t1._id }) : 0;
      const countT2 = t2 ? await Score_default.countDocuments({ student: student._id, term: t2._id }) : 0;
      const countT3 = t3 ? await Score_default.countDocuments({ student: student._id, term: t3._id }) : 0;
      let detectedJoined = 1;
      let detectedEnrolled = [1, 2, 3];
      if (countT1 > 0) {
        detectedJoined = 1;
        detectedEnrolled = [1, 2, 3];
      } else if (countT2 > 0) {
        detectedJoined = 2;
        detectedEnrolled = [2, 3];
      } else if (countT3 > 0) {
        detectedJoined = 3;
        detectedEnrolled = [3];
      } else {
        continue;
      }
      if (student.joinedTerm !== detectedJoined || JSON.stringify(student.enrolledTerms) !== JSON.stringify(detectedEnrolled)) {
        student.joinedTerm = detectedJoined;
        student.enrolledTerms = detectedEnrolled;
        await student.save();
        updatedCount++;
        updates.push({
          studentId: student._id,
          name: student.name,
          joinedTerm: detectedJoined,
          enrolledTerms: detectedEnrolled
        });
      }
    }
    res.status(200).json({
      message: `Auto-detected enrolled terms for ${updatedCount} student(s).`,
      updatedCount,
      updates
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/studentRoutes.ts
var router6 = Router6();
router6.post("/cleanup-orphaned", protect, authorize("super_admin", "branch_admin"), cleanupOrphanedStudents);
router6.post("/promote", protect, authorize("super_admin", "branch_admin"), promoteStudents);
router6.post("/auto-detect-enrolled-terms", protect, authorize("super_admin", "branch_admin", "class_teacher"), autoDetectEnrolledTerms);
router6.post("/", protect, authorize("super_admin", "branch_admin", "class_teacher"), createStudent);
router6.post("/bulk", protect, authorize("super_admin", "branch_admin", "class_teacher"), bulkCreateStudents);
router6.get("/", protect, getStudents);
router6.put("/:id/graduating-options", protect, authorize("super_admin"), updateStudentGraduatingOptions);
router6.put("/:id/enrolled-terms", protect, authorize("super_admin", "branch_admin", "class_teacher"), updateStudentEnrolledTerms);
router6.put("/:id", protect, authorize("super_admin", "branch_admin", "class_teacher"), updateStudent);
router6.delete("/:id", protect, authorize("super_admin", "branch_admin"), deleteStudent);
var studentRoutes_default = router6;

// server/routes/scoreRoutes.ts
import { Router as Router7 } from "express";

// server/controllers/scoreController.ts
init_Score();

// server/models/ScoreAudit.ts
import mongoose17, { Schema as Schema14 } from "mongoose";
var ScoreAuditSchema = new Schema14(
  {
    student: { type: Schema14.Types.ObjectId, ref: "Student", required: true },
    subject: { type: Schema14.Types.ObjectId, ref: "Subject", required: true },
    term: { type: Schema14.Types.ObjectId, ref: "Term", required: true },
    class: { type: Schema14.Types.ObjectId, ref: "Class" },
    action: {
      type: String,
      enum: ["create", "update", "delete", "bulk_import"],
      default: "create",
      required: true
    },
    previousScore: {
      ca: { type: Number },
      exam: { type: Number },
      total: { type: Number }
    },
    newScore: {
      ca: { type: Number },
      exam: { type: Number },
      total: { type: Number }
    },
    changedBy: { type: Schema14.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, default: "" }
  },
  { timestamps: true }
);
ScoreAuditSchema.index({ student: 1, subject: 1, term: 1 });
ScoreAuditSchema.index({ class: 1, term: 1 });
ScoreAuditSchema.index({ changedBy: 1 });
ScoreAuditSchema.index({ createdAt: -1 });
var ScoreAudit_default = mongoose17.model("ScoreAudit", ScoreAuditSchema);

// server/controllers/scoreController.ts
init_User();
init_Student();
init_Class();
init_Subject();

// server/controllers/resultPublicationController.ts
init_Class();
init_ResultPublication();
init_Student();
init_Subject();
init_Score();
init_ReportCardRemark();
init_User();
var canManageClass = async (req, classId) => {
  if (req.user?.role === "super_admin") return true;
  const [user, classDoc] = await Promise.all([
    User_default.findById(req.user?.id),
    Class_default.findById(classId)
  ]);
  if (!user || !classDoc) return false;
  if (isClassGraduatingDoc(classDoc)) return false;
  return req.user?.role === "branch_admin" && !!user.branch && user.branch.toString() === classDoc.branch.toString();
};
var getResultPublication = async (req, res) => {
  try {
    const { class: classId, term } = req.query;
    if (!term) {
      return res.status(400).json({ message: "term is required" });
    }
    const userIsSuperAdmin = isSuperAdmin(req);
    const gradClassIds = userIsSuperAdmin ? [] : await getAllGraduatingClassIds();
    if (classId) {
      if (!userIsSuperAdmin && gradClassIds.includes(classId.toString())) {
        return res.status(403).json({
          message: "Forbidden: Graduating classes are restricted to Super Admin."
        });
      }
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
        classFilter = {
          _id: {
            $in: branchClasses.map((c) => c._id.toString()).filter((id) => !gradClassIds.includes(id))
          }
        };
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const allowed = (teacher?.classes || []).map((c) => c.toString()).filter((id) => !gradClassIds.includes(id));
      classFilter = { _id: { $in: allowed } };
    } else if (!userIsSuperAdmin && gradClassIds.length > 0) {
      classFilter = { _id: { $nin: gradClassIds } };
    }
    const classes = await Class_default.find(classFilter).select("_id name arm branch isGraduating");
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
    const userIsSuperAdmin = isSuperAdmin(req);
    const gradClassIds = userIsSuperAdmin ? [] : await getAllGraduatingClassIds();
    let classFilter = {};
    if (req.user?.role === "branch_admin") {
      const user = await User_default.findById(req.user.id);
      if (user?.branch) {
        classFilter.branch = user.branch;
      }
      if (gradClassIds.length > 0) {
        classFilter._id = { $nin: gradClassIds };
      }
    } else {
      if (branch) classFilter.branch = branch;
      if (!userIsSuperAdmin && gradClassIds.length > 0) {
        classFilter._id = { $nin: gradClassIds };
      }
    }
    const classes = await Class_default.find(classFilter).populate("branch", "name code").sort({ name: 1, arm: 1 });
    const classIds = classes.map((c) => c._id);
    const currentTermDoc = await Term_default.findById(term);
    const currentTermNum = currentTermDoc?.termNumber || 1;
    const [publications, allStudents, allSubjects, allScores, allRemarks] = await Promise.all([
      ResultPublication_default.find({ class: { $in: classIds }, term }).populate("publishedBy", "name email").populate("lockedBy", "name email"),
      Student_default.find({ class: { $in: classIds } }).select(
        "_id name numberInClass class enrolledTerms joinedTerm status excludedSubjects"
      ),
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
      const studentsInClass = allStudents.filter((s) => {
        if (s.class.toString() !== cid) return false;
        if (s.status === "graduated" || s.status === "transferred" || s.status === "archived") return false;
        const enrolled = s.enrolledTerms && Array.isArray(s.enrolledTerms) && s.enrolledTerms.length > 0 ? s.enrolledTerms : s.joinedTerm ? [1, 2, 3].filter((t) => t >= s.joinedTerm) : [1, 2, 3];
        return enrolled.includes(currentTermNum);
      });
      const subjectsInClass = allSubjects.filter((s) => s.class.toString() === cid);
      const pub = pubMap.get(cid);
      const totalStudents2 = studentsInClass.length;
      const totalSubjects = subjectsInClass.length;
      let expectedScores = 0;
      let enteredScores = 0;
      let studentsWithMissingScores = 0;
      let classTeacherRemarksCount = 0;
      let principalRemarksCount = 0;
      studentsInClass.forEach((st) => {
        const sid = st._id.toString();
        const excludedSet = new Set(
          (st.excludedSubjects || []).map((id) => id.toString())
        );
        const activeSubjsForStudent = subjectsInClass.filter(
          (sb) => !excludedSet.has(sb._id.toString())
        );
        expectedScores += activeSubjsForStudent.length;
        let studentScoresCount = 0;
        activeSubjsForStudent.forEach((sb) => {
          if (scoresByStudent.has(`${sid}-${sb._id.toString()}`)) {
            studentScoresCount++;
          }
        });
        enteredScores += studentScoresCount;
        if (studentScoresCount < activeSubjsForStudent.length) {
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
        isGraduating: isClassGraduatingDoc(cls),
        sourceSchool: cls.sourceSchool,
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
    if (isClassGraduatingDoc(classDoc) && !isSuperAdmin(req)) {
      return res.status(403).json({
        message: "Forbidden: Graduating class audits are restricted to Super Admin."
      });
    }
    const termDoc = await Term_default.findById(term);
    const termNum = termDoc?.termNumber || 1;
    const activeStudents = students.filter((s) => {
      if (s.status === "graduated" || s.status === "transferred" || s.status === "archived") return false;
      const enrolled = s.enrolledTerms && Array.isArray(s.enrolledTerms) && s.enrolledTerms.length > 0 ? s.enrolledTerms : s.joinedTerm ? [1, 2, 3].filter((t) => t >= s.joinedTerm) : [1, 2, 3];
      return enrolled.includes(termNum);
    });
    const scoreMap = /* @__PURE__ */ new Map();
    scores.forEach((sc) => {
      scoreMap.set(`${sc.student.toString()}-${sc.subject.toString()}`, true);
    });
    const remarkMap = /* @__PURE__ */ new Map();
    remarks.forEach((rm) => {
      remarkMap.set(rm.student.toString(), rm);
    });
    const studentAudits = activeStudents.map((st) => {
      const sid = st._id.toString();
      const excludedSet = new Set(
        (st.excludedSubjects || []).map((id) => id.toString())
      );
      const offeredSubjects = subjects.filter((sb) => !excludedSet.has(sb._id.toString()));
      const missingSubjects = offeredSubjects.filter(
        (sb) => !scoreMap.has(`${sid}-${sb._id.toString()}`)
      );
      const remark = remarkMap.get(sid);
      const hasClassTeacherRemark = !!(remark?.classTeacherCommentEn || remark?.classTeacherCommentId);
      const hasPrincipalRemark = !!(remark?.principalCommentEn || remark?.principalCommentId);
      return {
        studentId: st._id,
        name: st.name,
        seatNumber: st.seatNumber,
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
      totalStudents: activeStudents.length,
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
    const { student, subject, term, ca, exam, reason } = req.body;
    if (!student || !subject || !term || !Number.isFinite(ca) || !Number.isFinite(exam) || ca < 0 || exam < 0) {
      return res.status(400).json({ message: "student, subject, term, and valid non-negative scores are required" });
    }
    const studentDoc = await Student_default.findById(student).select("class branch");
    if (!studentDoc) return res.status(404).json({ message: "Student not found" });
    const access = await assertSuperAdminForClass(req, studentDoc.class.toString());
    if (!access.allowed) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can enter or modify graduating class scores."
      });
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (studentDoc.branch && studentDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Student is not in your assigned branch" });
      }
    }
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
      const allowedSubjects = (teacher?.subjects || []).map((s) => s.toString());
      const isInAllowedClass = allowedClasses.includes(studentDoc.class.toString());
      const isAllowedSubject = allowedSubjects.includes(subject);
      if (!isInAllowedClass && !isAllowedSubject && (allowedClasses.length > 0 || allowedSubjects.length > 0)) {
        return res.status(403).json({ message: "You are not assigned to this class or subject" });
      }
    }
    if (ca > 40 || exam > 60) {
      return res.status(400).json({ message: "CA must be \u2264 40 and Exam \u2264 60" });
    }
    const total = ca + exam;
    const existingScore = await Score_default.findOne({ student, subject, term });
    if (existingScore) {
      const caChanged = existingScore.ca !== ca;
      const examChanged = existingScore.exam !== exam;
      if (caChanged || examChanged) {
        await ScoreAudit_default.create({
          student,
          subject,
          term,
          class: studentDoc.class,
          action: "update",
          previousScore: {
            ca: existingScore.ca,
            exam: existingScore.exam,
            total: existingScore.total
          },
          newScore: { ca, exam, total },
          changedBy: req.user?.id,
          reason: reason || "Score adjustment"
        });
      }
    } else {
      await ScoreAudit_default.create({
        student,
        subject,
        term,
        class: studentDoc.class,
        action: "create",
        newScore: { ca, exam, total },
        changedBy: req.user?.id,
        reason: reason || "Initial score entry"
      });
    }
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
    const userIsSuperAdmin = isSuperAdmin(req);
    const gradClassIds = userIsSuperAdmin ? [] : await getAllGraduatingClassIds();
    if (!userIsSuperAdmin && filter.subject) {
      const subj = await Subject_default.findById(filter.subject).select("class");
      if (subj?.class && gradClassIds.includes(subj.class.toString())) {
        return res.status(403).json({
          message: "Forbidden: Graduating class scores are restricted to Super Admin."
        });
      }
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      const branchStudents = await Student_default.find({
        branch: req.user.branch,
        ...gradClassIds.length > 0 ? { class: { $nin: gradClassIds } } : {}
      }).select("_id");
      filter.student = { $in: branchStudents.map((s) => s._id) };
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const teacherClasses = (teacher?.classes || []).map((c) => c.toString()).filter((cid) => !gradClassIds.includes(cid));
      const classStudents = await Student_default.find({ class: { $in: teacherClasses } }).select("_id");
      filter.student = { $in: classStudents.map((s) => s._id) };
    } else if (req.user?.role === "subject_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const allowedSubjects = (teacher?.subjects || []).map((s) => s.toString());
      if (allowedSubjects.length > 0 && filter.subject && !allowedSubjects.includes(filter.subject)) {
        return res.status(403).json({ message: "Not authorized for this subject" });
      }
      if (!filter.subject) {
        filter.subject = { $in: allowedSubjects };
      }
      if (gradClassIds.length > 0) {
        const nonGradStudents = await Student_default.find({ class: { $nin: gradClassIds } }).select("_id");
        filter.student = { $in: nonGradStudents.map((s) => s._id) };
      }
    }
    const scores = await Score_default.find(filter).populate("student", "name numberInClass seatNumber").populate("subject", "nameEnglish nameArabic");
    res.status(200).json(scores);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getScoreAuditLogs = async (req, res) => {
  try {
    const { class: classId, subject: subjectId, term: termId, student: studentId, changedBy, limit = "100", page = "1" } = req.query;
    const userIsSuperAdmin = isSuperAdmin(req);
    const gradClassIds = userIsSuperAdmin ? [] : await getAllGraduatingClassIds();
    if (!userIsSuperAdmin && classId && gradClassIds.includes(classId.toString())) {
      return res.status(403).json({
        message: "Forbidden: Graduating class audit logs are restricted to Super Admin."
      });
    }
    const filter = {};
    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;
    if (termId) filter.term = termId;
    if (studentId) filter.student = studentId;
    if (changedBy) filter.changedBy = changedBy;
    if (req.user?.role === "branch_admin" && req.user.branch) {
      const branchClasses = await Class_default.find({ branch: req.user.branch }).select("_id");
      const allowed = branchClasses.map((c) => c._id.toString()).filter((cid) => !gradClassIds.includes(cid));
      filter.class = { $in: allowed };
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const allowed = (teacher?.classes || []).map((c) => c.toString()).filter((cid) => !gradClassIds.includes(cid));
      filter.class = { $in: allowed };
    } else if (req.user?.role === "subject_teacher") {
      const teacher = await User_default.findById(req.user.id);
      filter.subject = { $in: teacher?.subjects || [] };
      if (gradClassIds.length > 0 && !filter.class) {
        filter.class = { $nin: gradClassIds };
      }
    } else if (!userIsSuperAdmin && gradClassIds.length > 0 && !filter.class) {
      filter.class = { $nin: gradClassIds };
    }
    const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
    const p = Math.max(1, parseInt(page, 10) || 1);
    const skip = (p - 1) * lim;
    const total = await ScoreAudit_default.countDocuments(filter);
    const logs = await ScoreAudit_default.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).populate("student", "name numberInClass gender seatNumber").populate("subject", "nameEnglish nameArabic").populate("term", "session termNumber isActive").populate("class", "name arm").populate("changedBy", "name email role");
    res.status(200).json({
      total,
      page: p,
      limit: lim,
      totalPages: Math.ceil(total / lim),
      logs
    });
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
router7.get(
  "/audit-logs",
  protect,
  authorize("super_admin", "branch_admin", "class_teacher"),
  getScoreAuditLogs
);
var scoreRoutes_default = router7;

// server/routes/broadsheetRoutes.ts
import { Router as Router8 } from "express";

// server/controllers/broadsheetController.ts
init_Student();
init_Subject();
init_Score();
import mongoose18 from "mongoose";
init_Class();
init_User();
init_GradingScale();

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
    const { class: classId, term: termId } = req.query;
    if (!classId || !termId) {
      return res.status(400).json({ message: "class and term are required" });
    }
    const cls = await Class_default.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    const isGraduating = isClassGraduatingDoc(cls);
    if (isGraduating && !isSuperAdmin(req)) {
      return res.status(403).json({
        message: "Forbidden: Graduating class broadsheets are restricted to Super Admin."
      });
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (cls.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Class does not belong to your branch" });
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const isAssigned = (teacher?.classes || []).some((c) => c.toString() === classId.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: "Forbidden: You are not assigned to this class" });
      }
    } else if (req.user?.role === "subject_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const teacherClassIds = (teacher?.classes || []).map((c) => c.toString());
      const teacherSubjectIds = teacher?.subjects || [];
      let subjectClassIds = [];
      if (teacherSubjectIds.length > 0) {
        const subjs = await Subject_default.find({ _id: { $in: teacherSubjectIds } }).select("class");
        subjectClassIds = subjs.filter((s) => s.class).map((s) => s.class.toString());
      }
      const allowedClassIds = Array.from(/* @__PURE__ */ new Set([...teacherClassIds, ...subjectClassIds]));
      if (!allowedClassIds.includes(classId.toString())) {
        return res.status(403).json({ message: "Forbidden: You are not assigned to this class or its subjects" });
      }
    }
    const currentTerm = await Term_default.findById(termId);
    if (!currentTerm) {
      return res.status(404).json({ message: "Term not found" });
    }
    const isElementary = cls.category === "elementary" || isElementaryClass(cls.name, cls.category);
    const onlyPresentTerms = req.query.onlyPresentTerms !== "false";
    const students = await Student_default.find({ class: classId }).sort({ numberInClass: 1, name: 1 });
    const subjects = await Subject_default.find({ class: classId }).sort({ order: 1, nameEnglish: 1 });
    if (students.length === 0 || subjects.length === 0) {
      return res.status(200).json({
        subjects,
        rows: [],
        currentTerm,
        sessionTerms: [currentTerm],
        summary: null,
        classMeta: {
          isGraduating,
          isElementary,
          sourceSchool: cls.sourceSchool || null,
          secondaryResultMode: cls.secondaryResultMode || "current_only"
        }
      });
    }
    const sessionTerms = await Term_default.find({ session: currentTerm.session }).sort({ termNumber: 1 });
    const sessionTermIds = sessionTerms.map((t) => t._id);
    const priorTerms = sessionTerms.filter((t) => t.termNumber <= currentTerm.termNumber);
    const studentIds = students.map((s) => s._id);
    const subjectIds = subjects.map((s) => s._id);
    const scores = await Score_default.find({
      student: { $in: studentIds },
      subject: { $in: subjectIds },
      term: { $in: sessionTermIds }
    });
    const scaleId = req.query.scaleId || req.query.gradingScale;
    let gradingScale = null;
    if (scaleId && scaleId !== "undefined" && scaleId !== "null" && mongoose18.Types.ObjectId.isValid(scaleId)) {
      try {
        gradingScale = await GradingScale_default.findById(scaleId);
      } catch {
        gradingScale = null;
      }
    }
    if (!gradingScale) {
      gradingScale = await GradingScale_default.findOne({ name: "\u0627\u0644\u062A\u0642\u062F\u064A\u0631" }) || await GradingScale_default.findOne();
    }
    if (!gradingScale) {
      try {
        const { ensureDefaultGradingScale: ensureDefaultGradingScale2 } = await Promise.resolve().then(() => (init_gradingScaleController(), gradingScaleController_exports));
        gradingScale = await ensureDefaultGradingScale2();
      } catch {
      }
    }
    const getGradeRemark = (scorePercentage) => {
      if (gradingScale && gradingScale.bands && gradingScale.bands.length > 0) {
        const sortedBands = [...gradingScale.bands].sort((a, b) => b.minScore - a.minScore);
        let band = sortedBands.find(
          (b) => scorePercentage >= b.minScore && (b.maxScore === void 0 || b.maxScore === null || scorePercentage <= b.maxScore + 0.09)
        );
        if (!band) {
          band = sortedBands.find((b) => scorePercentage >= b.minScore);
        }
        if (!band && sortedBands.length > 0) {
          band = sortedBands[sortedBands.length - 1];
        }
        if (band) {
          return {
            grade: band.grade,
            remark: band.remark,
            remarkArabic: band.remarkArabic
          };
        }
      }
      if (scorePercentage >= 85) return { grade: "A1", remark: "Excellent", remarkArabic: "\u0645\u0645\u062A\u0627\u0632" };
      if (scorePercentage >= 75) return { grade: "B2", remark: "Very Good", remarkArabic: "\u062C\u064A\u062F \u062C\u062F\u0627" };
      if (scorePercentage >= 60) return { grade: "C4", remark: "Good", remarkArabic: "\u062C\u064A\u062F" };
      if (scorePercentage >= 50) return { grade: "D7", remark: "Pass", remarkArabic: "\u0645\u0642\u0628\u0648\u0644" };
      return { grade: "F9", remark: "Fail", remarkArabic: "\u0631\u0627\u0633\u0628" };
    };
    const scoreMap = /* @__PURE__ */ new Map();
    scores.forEach((sc) => {
      const key = `${sc.term.toString()}_${sc.student.toString()}_${sc.subject.toString()}`;
      scoreMap.set(key, { total: sc.total, ca: sc.ca, exam: sc.exam });
    });
    const rows = students.map((student) => {
      const studentIdStr = student._id.toString();
      const excludedSet = new Set(
        (student.excludedSubjects || []).map((id) => id.toString())
      );
      const offeredSubjects = subjects.filter((s) => !excludedSet.has(s._id.toString()));
      const studentSubjectCount = offeredSubjects.length;
      let studentEnrolledTerms = [1, 2, 3];
      if (student.enrolledTerms && Array.isArray(student.enrolledTerms) && student.enrolledTerms.length > 0) {
        studentEnrolledTerms = student.enrolledTerms;
      } else if (student.joinedTerm) {
        studentEnrolledTerms = [1, 2, 3].filter((t) => t >= student.joinedTerm);
      }
      const isEnrolledInCurrentTerm = studentEnrolledTerms.includes(currentTerm.termNumber);
      const effectiveMode = getEffectiveSecondaryResultMode(
        cls,
        student,
        isElementary,
        isGraduating
      );
      const subjectScores = subjects.map((subject) => {
        const isExcluded = excludedSet.has(subject._id.toString());
        const key = `${currentTerm._id.toString()}_${studentIdStr}_${subject._id.toString()}`;
        const scoreDoc = isEnrolledInCurrentTerm && !isExcluded ? scoreMap.get(key) : void 0;
        const termScoresList = [];
        sessionTerms.forEach((st) => {
          const stKey = `${st._id.toString()}_${studentIdStr}_${subject._id.toString()}`;
          const isEnrolledInSt = studentEnrolledTerms.includes(st.termNumber);
          const stDoc = isEnrolledInSt && !isExcluded ? scoreMap.get(stKey) : void 0;
          termScoresList.push({
            termNumber: st.termNumber,
            termId: st._id.toString(),
            score: stDoc?.total ?? null
          });
        });
        return {
          subject: subject._id,
          nameEnglish: subject.nameEnglish,
          nameArabic: subject.nameArabic,
          order: subject.order ?? 0,
          isExcluded,
          score: scoreDoc?.total ?? null,
          ca: scoreDoc?.ca ?? null,
          exam: scoreDoc?.exam ?? null,
          termScores: termScoresList
        };
      });
      const enteredScores = subjectScores.filter((s) => !s.isExcluded && s.score !== null);
      const total = enteredScores.reduce((sum, s) => sum + s.score, 0);
      const average = studentSubjectCount > 0 ? total / studentSubjectCount : 0;
      const overallPercentage = Math.round(average * 100) / 100;
      const { grade, remark, remarkArabic } = isEnrolledInCurrentTerm ? getGradeRemark(overallPercentage) : { grade: "\u2014", remark: "Not Enrolled", remarkArabic: "\u0644\u0645 \u064A\u0644\u062A\u062D\u0642" };
      const termSummaries = sessionTerms.map((st) => {
        let tTotal = 0;
        let tEnteredCount = 0;
        offeredSubjects.forEach((subj) => {
          const key = `${st._id.toString()}_${studentIdStr}_${subj._id.toString()}`;
          const scDoc = scoreMap.get(key);
          if (scDoc && scDoc.total !== void 0 && scDoc.total !== null) {
            tTotal += scDoc.total;
            tEnteredCount++;
          }
        });
        const isEnrolledInTerm = studentEnrolledTerms.includes(st.termNumber);
        const treatAsNotEnrolled = !isEnrolledInTerm || onlyPresentTerms && tEnteredCount === 0 && student.joinedTerm && student.joinedTerm > st.termNumber;
        if (treatAsNotEnrolled) {
          return {
            termId: st._id.toString(),
            termNumber: st.termNumber,
            session: st.session,
            total: null,
            average: null,
            overallPercentage: null,
            allEntered: false,
            enteredCount: 0,
            grade: "\u2014",
            remark: "Not Enrolled",
            remarkArabic: "\u0644\u0645 \u064A\u0644\u062A\u062D\u0642",
            isEnrolled: false
          };
        }
        const tAvg = studentSubjectCount > 0 ? tTotal / studentSubjectCount : 0;
        const tPercentage = Math.round(tAvg * 100) / 100;
        const tGradeRemark = getGradeRemark(tPercentage);
        return {
          termId: st._id.toString(),
          termNumber: st.termNumber,
          session: st.session,
          total: tTotal,
          average: tPercentage,
          overallPercentage: tPercentage,
          allEntered: tEnteredCount === studentSubjectCount,
          enteredCount: tEnteredCount,
          grade: tGradeRemark.grade,
          remark: tGradeRemark.remark,
          remarkArabic: tGradeRemark.remarkArabic,
          isEnrolled: true
        };
      });
      let applicablePriorTerms = priorTerms.filter((t) => {
        if (!onlyPresentTerms) return true;
        return studentEnrolledTerms.includes(t.termNumber);
      });
      if (effectiveMode === "current_only") {
        applicablePriorTerms = applicablePriorTerms.filter(
          (t) => t.termNumber === currentTerm.termNumber
        );
      } else if (effectiveMode === "combine_1st_and_3rd") {
        applicablePriorTerms = applicablePriorTerms.filter((t) => t.termNumber !== 2);
      }
      let cumulativeTotal = 0;
      offeredSubjects.forEach((subject) => {
        const subjectKey = subject._id.toString();
        const rawScoresAscending = applicablePriorTerms.map((t) => {
          const key = `${t._id.toString()}_${studentIdStr}_${subjectKey}`;
          return scoreMap.get(key)?.total;
        }).filter((v) => v !== void 0 && v !== null);
        if (effectiveMode === "current_only") {
          const currVal = rawScoresAscending.length > 0 ? rawScoresAscending[rawScoresAscending.length - 1] : 0;
          cumulativeTotal += currVal;
        } else {
          const { finalValue } = foldCascade(rawScoresAscending);
          cumulativeTotal += finalValue ?? 0;
        }
      });
      const cumulativeAverage = studentSubjectCount > 0 ? cumulativeTotal / studentSubjectCount : 0;
      const cumulativePercentage = Math.round(cumulativeAverage * 100) / 100;
      const cumulativeGradeRemark = isEnrolledInCurrentTerm ? getGradeRemark(cumulativePercentage) : { grade: "\u2014", remark: "Not Enrolled", remarkArabic: "\u0644\u0645 \u064A\u0644\u062A\u062D\u0642" };
      return {
        student: student._id,
        name: student.name,
        gender: student.gender,
        numberInClass: student.numberInClass,
        seatNumber: student.seatNumber || null,
        sourceSchool: student.sourceSchool || cls.sourceSchool || null,
        effectiveResultMode: effectiveMode,
        offeredSubjectsCount: studentSubjectCount,
        enrolledTerms: studentEnrolledTerms,
        joinedTerm: student.joinedTerm || 1,
        isEnrolledInCurrentTerm,
        subjectScores,
        total: isEnrolledInCurrentTerm ? total : 0,
        average: isEnrolledInCurrentTerm ? overallPercentage : 0,
        overallPercentage: isEnrolledInCurrentTerm ? overallPercentage : 0,
        grade,
        remark,
        remarkArabic,
        allSubjectsEntered: isEnrolledInCurrentTerm && enteredScores.length === studentSubjectCount,
        termSummaries,
        cumulativeTotal: isEnrolledInCurrentTerm ? Math.round(cumulativeTotal * 100) / 100 : null,
        cumulativeAverage: isEnrolledInCurrentTerm ? cumulativePercentage : null,
        cumulativePercentage: isEnrolledInCurrentTerm ? cumulativePercentage : null,
        cumulativeGrade: cumulativeGradeRemark.grade,
        cumulativeRemark: cumulativeGradeRemark.remark,
        cumulativeRemarkArabic: cumulativeGradeRemark.remarkArabic
      };
    });
    const rankedCurrent = computePositions(
      rows.filter((r) => r.isEnrolledInCurrentTerm).map((r) => ({ studentId: r.student.toString(), score: r.total }))
    );
    const currentPositionMap = new Map(rankedCurrent.map((r) => [r.studentId, r.position]));
    const rankedCumulative = computePositions(
      rows.filter((r) => r.isEnrolledInCurrentTerm && r.cumulativeAverage !== null).map((r) => ({ studentId: r.student.toString(), score: r.cumulativeAverage ?? 0 }))
    );
    const cumulativePositionMap = new Map(rankedCumulative.map((r) => [r.studentId, r.position]));
    const termPositionMaps = /* @__PURE__ */ new Map();
    sessionTerms.forEach((st) => {
      const termRankInput = rows.filter((r) => {
        const tSumm = r.termSummaries.find((ts) => ts.termNumber === st.termNumber);
        return tSumm && tSumm.isEnrolled && tSumm.total !== null;
      }).map((r) => {
        const tSumm = r.termSummaries.find((ts) => ts.termNumber === st.termNumber);
        return {
          studentId: r.student.toString(),
          score: tSumm ? tSumm.total ?? 0 : 0
        };
      });
      const tRanked = computePositions(termRankInput);
      termPositionMaps.set(st.termNumber, new Map(tRanked.map((tr) => [tr.studentId, tr.position])));
    });
    const positionedRows = rows.map((row) => {
      const sId = row.student.toString();
      const updatedTermSummaries = row.termSummaries.map((ts) => ({
        ...ts,
        position: ts.isEnrolled ? termPositionMaps.get(ts.termNumber)?.get(sId) ?? null : null
      }));
      return {
        ...row,
        position: row.isEnrolledInCurrentTerm ? currentPositionMap.get(sId) ?? null : null,
        cumulativePosition: row.isEnrolledInCurrentTerm ? cumulativePositionMap.get(sId) ?? null : null,
        termSummaries: updatedTermSummaries
      };
    });
    const totalStudents = positionedRows.length;
    const totals = positionedRows.map((r) => r.total);
    const percentages = positionedRows.map((r) => r.overallPercentage);
    const highestTotal = totals.length > 0 ? Math.max(...totals) : 0;
    const lowestTotal = totals.length > 0 ? Math.min(...totals) : 0;
    const classAvgPercentage = percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length * 100) / 100 : 0;
    const remarkDistribution = {
      "\u0645\u0645\u062A\u0627\u0632": 0,
      "\u062C\u064A\u062F \u062C\u062F\u0627\u064B": 0,
      "\u062C\u064A\u062F": 0,
      "\u0645\u0642\u0628\u0648\u0644": 0,
      "\u0631\u0627\u0633\u0628": 0
    };
    positionedRows.forEach((r) => {
      if (remarkDistribution[r.remarkArabic] !== void 0) {
        remarkDistribution[r.remarkArabic]++;
      } else {
        remarkDistribution[r.remarkArabic] = (remarkDistribution[r.remarkArabic] || 0) + 1;
      }
    });
    const summary = {
      totalStudents,
      totalSubjects: subjects.length,
      classAvgPercentage,
      highestTotal,
      lowestTotal,
      remarkDistribution
    };
    res.status(200).json({
      subjects,
      rows: positionedRows,
      currentTerm,
      sessionTerms,
      summary,
      classMeta: {
        isGraduating,
        isElementary,
        sourceSchool: cls.sourceSchool || null,
        secondaryResultMode: cls.secondaryResultMode || "current_only"
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getClassCumulativePositions = async (classId, termId) => {
  const currentTerm = await Term_default.findById(termId);
  if (!currentTerm) return /* @__PURE__ */ new Map();
  const [cls, priorTerms, students, subjects] = await Promise.all([
    Class_default.findById(classId),
    Term_default.find({
      session: currentTerm.session,
      termNumber: { $lte: currentTerm.termNumber }
    }).sort({ termNumber: 1 }),
    Student_default.find({ class: classId }).sort({ numberInClass: 1, name: 1 }),
    Subject_default.find({ class: classId }).sort({ order: 1, nameEnglish: 1 })
  ]);
  const isGraduating = isClassGraduatingDoc(cls);
  const isElementary = cls ? cls.category === "elementary" || isElementaryClass(cls.name, cls.category) : false;
  const scores = await Score_default.find({
    student: { $in: students.map((s) => s._id) },
    subject: { $in: subjects.map((s) => s._id) },
    term: { $in: priorTerms.map((t) => t._id) }
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
  const rankInput = students.filter((s) => {
    const sEnrolled = s.enrolledTerms && Array.isArray(s.enrolledTerms) && s.enrolledTerms.length > 0 ? s.enrolledTerms : s.joinedTerm ? [1, 2, 3].filter((t) => t >= s.joinedTerm) : [1, 2, 3];
    return sEnrolled.includes(currentTerm.termNumber);
  }).map((s) => {
    const studentKey = s._id.toString();
    const subjMap = byStudentSubject.get(studentKey) || /* @__PURE__ */ new Map();
    const sEnrolled = s.enrolledTerms && Array.isArray(s.enrolledTerms) && s.enrolledTerms.length > 0 ? s.enrolledTerms : s.joinedTerm ? [1, 2, 3].filter((t) => t >= s.joinedTerm) : [1, 2, 3];
    const excludedSet = new Set((s.excludedSubjects || []).map((id) => id.toString()));
    const offeredSubjects = subjects.filter((sb) => !excludedSet.has(sb._id.toString()));
    const studentSubjCount = offeredSubjects.length;
    const effectiveMode = getEffectiveSecondaryResultMode(
      cls,
      s,
      isElementary,
      isGraduating
    );
    let applicablePriorTerms = priorTerms.filter((t) => sEnrolled.includes(t.termNumber));
    if (effectiveMode === "current_only") {
      applicablePriorTerms = applicablePriorTerms.filter(
        (t) => t.termNumber === currentTerm.termNumber
      );
    } else if (effectiveMode === "combine_1st_and_3rd") {
      applicablePriorTerms = applicablePriorTerms.filter((t) => t.termNumber !== 2);
    }
    let total = 0;
    offeredSubjects.forEach((subject) => {
      const subjectKey = subject._id.toString();
      const termScoreMap = subjMap.get(subjectKey) || /* @__PURE__ */ new Map();
      const rawScoresAscending = applicablePriorTerms.map((t) => termScoreMap.get(t._id.toString())).filter((v) => v !== void 0);
      if (effectiveMode === "current_only") {
        total += rawScoresAscending.length > 0 ? rawScoresAscending[rawScoresAscending.length - 1] : 0;
      } else {
        const { finalValue } = foldCascade(rawScoresAscending);
        total += finalValue ?? 0;
      }
    });
    const average = studentSubjCount > 0 ? total / studentSubjCount : 0;
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

// server/controllers/reportCardController.ts
init_Student();
init_Class();
init_Subject();
init_Score();
import mongoose19 from "mongoose";
init_GradingScale();
init_ReportCardRemark();
init_Attendance();
init_AttendanceSetting();
init_User();
var buildReportCardData = async (studentId, termId, scaleId, context) => {
  if (!studentId || !termId) {
    return null;
  }
  const student = await Student_default.findById(studentId).populate("class");
  if (!student) return null;
  const currentTerm = context?.currentTerm || await Term_default.findById(termId);
  if (!currentTerm) return null;
  const priorTerms = context?.priorTerms || await Term_default.find({
    session: currentTerm.session,
    termNumber: { $lte: currentTerm.termNumber }
  }).sort({ termNumber: 1 });
  let classDoc = student.class;
  if (!classDoc || !classDoc.name) {
    const rawClassId = classDoc?._id || classDoc || student.class;
    if (rawClassId) {
      try {
        classDoc = await Class_default.findById(rawClassId);
      } catch {
      }
    }
  }
  const classId = classDoc?._id || student.class;
  const className = classDoc?.name || "";
  const rawCategory = classDoc?.category;
  const isElementary = rawCategory === "elementary" || isElementaryClass(className, rawCategory);
  const classCategory = isElementary ? "elementary" : "secondary";
  const isGraduating = isClassGraduatingDoc(classDoc);
  const secondaryResultMode = getEffectiveSecondaryResultMode(
    classDoc,
    student,
    isElementary,
    isGraduating
  );
  if (isElementary && classId && !context?.subjects) {
    await ensureElementarySubjectsForClass(classId.toString());
  }
  const allClassSubjects = context?.subjects || await Subject_default.find({
    class: classId
  }).sort({
    order: 1,
    nameEnglish: 1
  });
  const excludedSet = new Set(
    (student.excludedSubjects || []).map((id) => id.toString())
  );
  const subjects = excludedSet.size > 0 ? allClassSubjects.filter((s) => !excludedSet.has(s._id.toString())) : allClassSubjects;
  const scoresBySubject = await Score_default.find({
    student: studentId,
    subject: { $in: subjects.map((s) => s._id) },
    term: { $in: priorTerms.map((t) => t._id) }
  });
  const scoresBySubjectMap = /* @__PURE__ */ new Map();
  scoresBySubject.forEach((sc) => {
    const subjectKey = sc.subject.toString();
    if (!scoresBySubjectMap.has(subjectKey))
      scoresBySubjectMap.set(subjectKey, /* @__PURE__ */ new Map());
    scoresBySubjectMap.get(subjectKey).set(sc.term.toString(), sc.total);
  });
  let gradingScale = context?.gradingScale || null;
  if (!gradingScale && scaleId && scaleId !== "undefined" && scaleId !== "null" && mongoose19.Types.ObjectId.isValid(scaleId)) {
    try {
      gradingScale = await GradingScale_default.findById(scaleId);
    } catch {
      gradingScale = null;
    }
  }
  if (!gradingScale) {
    gradingScale = await GradingScale_default.findOne({ name: "\u0627\u0644\u062A\u0642\u062F\u064A\u0631" }) || await GradingScale_default.findOne();
  }
  if (!gradingScale) {
    try {
      const { ensureDefaultGradingScale: ensureDefaultGradingScale2 } = await Promise.resolve().then(() => (init_gradingScaleController(), gradingScaleController_exports));
      gradingScale = await ensureDefaultGradingScale2();
    } catch {
    }
  }
  const getGradeRemark = (scorePercentage) => {
    if (gradingScale && gradingScale.bands && gradingScale.bands.length > 0) {
      const sortedBands = [...gradingScale.bands].sort((a, b) => b.minScore - a.minScore);
      let band = sortedBands.find(
        (b) => scorePercentage >= b.minScore && (b.maxScore === void 0 || b.maxScore === null || scorePercentage <= b.maxScore + 0.09)
      );
      if (!band) {
        band = sortedBands.find((b) => scorePercentage >= b.minScore);
      }
      if (!band && sortedBands.length > 0) {
        band = sortedBands[sortedBands.length - 1];
      }
      if (band) {
        return {
          grade: band.grade,
          remark: band.remark,
          remarkArabic: band.remarkArabic
        };
      }
    }
    if (scorePercentage >= 85) return { grade: "A1", remark: "Excellent", remarkArabic: "\u0645\u0645\u062A\u0627\u0632" };
    if (scorePercentage >= 75) return { grade: "B2", remark: "V.Good", remarkArabic: "\u062C\u064A\u062F \u062C\u062F\u0627" };
    if (scorePercentage >= 60) return { grade: "C4", remark: "Good", remarkArabic: "\u062C\u064A\u062F" };
    if (scorePercentage >= 50) return { grade: "D7", remark: "Pass", remarkArabic: "\u0645\u0642\u0628\u0648\u0644" };
    return { grade: "F9", remark: "Fail", remarkArabic: "\u0631\u0627\u0633\u0628" };
  };
  const studentEnrolledTerms = student.enrolledTerms && Array.isArray(student.enrolledTerms) && student.enrolledTerms.length > 0 ? student.enrolledTerms : student.joinedTerm ? [1, 2, 3].filter((t) => t >= student.joinedTerm) : [1, 2, 3];
  const isEnrolledInCurrentTerm = studentEnrolledTerms.includes(currentTerm.termNumber);
  let applicablePriorTerms = priorTerms.filter(
    (t) => studentEnrolledTerms.includes(t.termNumber)
  );
  if (secondaryResultMode === "current_only") {
    applicablePriorTerms = applicablePriorTerms.filter(
      (t) => t.termNumber === currentTerm.termNumber
    );
  } else if (secondaryResultMode === "combine_1st_and_3rd") {
    applicablePriorTerms = applicablePriorTerms.filter((t) => t.termNumber !== 2);
  }
  const subjectResults = subjects.map((subject) => {
    const subjectKey = subject._id.toString();
    const termScoreMap = scoresBySubjectMap.get(subjectKey) || /* @__PURE__ */ new Map();
    const rawScoresAscending = applicablePriorTerms.map((t) => termScoreMap.get(t._id.toString())).filter((v) => v !== void 0);
    const currentTermScore = isEnrolledInCurrentTerm ? termScoreMap.get(termId) ?? null : null;
    const currentTermScoreDoc = isEnrolledInCurrentTerm ? scoresBySubject.find(
      (sc) => sc.subject.toString() === subjectKey && sc.term.toString() === termId
    ) : null;
    let priorPeriodValue = null;
    let combinedTotal = null;
    let cumulativeAverage = null;
    if (secondaryResultMode === "current_only") {
      cumulativeAverage = currentTermScore;
    } else {
      const folded = foldCascade(rawScoresAscending);
      priorPeriodValue = folded.priorPeriodValue;
      cumulativeAverage = folded.finalValue;
      combinedTotal = priorPeriodValue !== null && currentTermScore !== null ? priorPeriodValue + currentTermScore : null;
    }
    let grade = null;
    let remark = null;
    let remarkArabic = null;
    const scoreForGrading = isElementary || secondaryResultMode === "current_only" ? currentTermScore : cumulativeAverage;
    if (scoreForGrading !== null && scoreForGrading !== void 0) {
      if (isElementary) {
        if (scoreForGrading >= 85) {
          grade = "Excellent";
          remark = "Excellent";
          remarkArabic = "\u0645\u0645\u062A\u0627\u0632";
        } else if (scoreForGrading >= 75) {
          grade = "V.Good";
          remark = "V. Good";
          remarkArabic = "\u062C\u064A\u062F \u062C\u062F\u0627\u064B";
        } else if (scoreForGrading >= 65) {
          grade = "Good";
          remark = "Good";
          remarkArabic = "\u062C\u064A\u062F";
        } else if (scoreForGrading >= 50) {
          grade = "Fair";
          remark = "Fair";
          remarkArabic = "\u0645\u0642\u0628\u0648\u0644";
        } else {
          grade = "Fail";
          remark = "Fail";
          remarkArabic = "\u0631\u0627\u0633\u0628";
        }
      } else {
        const band = getGradeRemark(scoreForGrading);
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
  const classIdStr = classId ? classId.toString() : "";
  const position = context?.positionMap ? context.positionMap.get(studentId) ?? null : (await getClassCumulativePositions(classIdStr, termId)).get(studentId) ?? null;
  const totalStudentsInClass = context?.totalStudentsInClass !== void 0 ? context.totalStudentsInClass : await Student_default.countDocuments({ class: classId });
  const remarkDoc = await ReportCardRemark_default.findOne({
    student: studentId,
    term: termId
  });
  const classTeacherComment = remarkDoc && (remarkDoc.classTeacherCommentEn || remarkDoc.classTeacherCommentAr || remarkDoc.classTeacherCommentId) ? {
    id: remarkDoc.classTeacherCommentId || "",
    en: remarkDoc.classTeacherCommentEn || "",
    ar: remarkDoc.classTeacherCommentAr || ""
  } : null;
  const principalComment = remarkDoc && (remarkDoc.principalCommentEn || remarkDoc.principalCommentAr || remarkDoc.principalCommentId) ? {
    id: remarkDoc.principalCommentId || "",
    en: remarkDoc.principalCommentEn || "",
    ar: remarkDoc.principalCommentAr || ""
  } : null;
  const allTermsInSession = context?.allTermsInSession || await Term_default.find({
    session: currentTerm.session
  }).sort({ termNumber: 1 });
  const termNumbersToCompute = secondaryResultMode === "current_only" ? [currentTerm.termNumber] : secondaryResultMode === "combine_1st_and_3rd" ? [1, 3].filter((t) => t <= currentTerm.termNumber) : [1, 2, 3];
  const termAverages = termNumbersToCompute.map((termNum) => {
    const isEnrolled = studentEnrolledTerms.includes(termNum);
    const termDoc = allTermsInSession.find((t) => t.termNumber === termNum);
    if (!isEnrolled || termNum > currentTerm.termNumber || !termDoc) {
      return {
        termNumber: termNum,
        average: null,
        isEnrolled: isEnrolled && termNum <= currentTerm.termNumber
      };
    }
    const termScoresThisTerm = [];
    subjects.forEach((subject) => {
      const subjectKey = subject._id.toString();
      const termScoreMap = scoresBySubjectMap.get(subjectKey) || /* @__PURE__ */ new Map();
      const rawScoreInTerm = termScoreMap.get(termDoc._id.toString());
      if (rawScoreInTerm !== void 0 && rawScoreInTerm !== null) {
        termScoresThisTerm.push(rawScoreInTerm);
      }
    });
    const average = termScoresThisTerm.length > 0 ? Math.round(termScoresThisTerm.reduce((a, b) => a + b, 0) / termScoresThisTerm.length * 100) / 100 : null;
    return {
      termNumber: termNum,
      average,
      isEnrolled: true
    };
  });
  const validTermAverages = termAverages.filter((t) => t.average !== null && t.average !== void 0).map((t) => t.average);
  const overallTermAverage = secondaryResultMode === "current_only" ? isEnrolledInCurrentTerm ? Math.round(overallPercentage * 100) / 100 : 0 : validTermAverages.length > 0 ? Math.round(validTermAverages.reduce((sum, v) => sum + v, 0) / validTermAverages.length * 100) / 100 : isEnrolledInCurrentTerm ? Math.round(overallPercentage * 100) / 100 : 0;
  const classBranchId = student.class?.branch;
  const attSettingClass = context?.attSettingClass !== void 0 ? context.attSettingClass : await AttendanceSetting_default.findOne({ class: classId, term: termId });
  const attSettingBranch = context?.attSettingBranch !== void 0 ? context.attSettingBranch : classBranchId ? await AttendanceSetting_default.findOne({
    branch: classBranchId,
    term: termId,
    class: { $exists: false }
  }) : null;
  const attSettingGlobal = context?.attSettingGlobal !== void 0 ? context.attSettingGlobal : await AttendanceSetting_default.findOne({
    term: termId,
    class: { $exists: false },
    branch: { $exists: false }
  });
  const [attDoc, templateSetting] = await Promise.all([
    Attendance_default.findOne({ student: studentId, term: termId }),
    context?.templateSetting !== void 0 ? Promise.resolve(context.templateSetting) : ReportCardSetting_default.findOne()
  ]);
  const timesSchoolOpened = currentTerm?.timesSchoolOpened ?? attSettingGlobal?.timesSchoolOpened ?? attSettingBranch?.timesSchoolOpened ?? attSettingClass?.timesSchoolOpened ?? null;
  const dateResumed = currentTerm?.dateResumed || attSettingGlobal?.dateResumed || attSettingBranch?.dateResumed || attSettingClass?.dateResumed || "";
  const dateClosed = currentTerm?.dateClosed || attSettingGlobal?.dateClosed || attSettingBranch?.dateClosed || attSettingClass?.dateClosed || "";
  const nextResumption = currentTerm?.nextResumption || attSettingGlobal?.nextResumption || attSettingBranch?.nextResumption || attSettingClass?.nextResumption || "";
  const timesPresent = attDoc?.timesPresent !== void 0 && attDoc?.timesPresent !== null ? attDoc.timesPresent : null;
  const timesAbsent = attDoc?.timesAbsent !== void 0 && attDoc?.timesAbsent !== null ? attDoc.timesAbsent : null;
  let elementaryOverallTotal = 0;
  let elementarySubjectCount = 0;
  if (isElementary && isEnrolledInCurrentTerm) {
    subjectResults.forEach((s) => {
      if (s.currentTermScore !== null && s.currentTermScore !== void 0) {
        elementaryOverallTotal += s.currentTermScore;
        elementarySubjectCount += 1;
      }
    });
  }
  const effectiveOverallTotal = isElementary ? isEnrolledInCurrentTerm ? elementaryOverallTotal : 0 : isEnrolledInCurrentTerm ? Math.round(overallTotal * 100) / 100 : 0;
  const effectiveOverallPercentage = isElementary ? elementarySubjectCount > 0 ? Math.round(elementaryOverallTotal / elementarySubjectCount * 100) / 100 : 0 : isEnrolledInCurrentTerm ? Math.round(overallPercentage * 100) / 100 : 0;
  const overallGradeRemark = isEnrolledInCurrentTerm ? isElementary ? effectiveOverallPercentage >= 85 ? { grade: "Excellent", remark: "Excellent", remarkArabic: "\u0645\u0645\u062A\u0627\u0632" } : effectiveOverallPercentage >= 75 ? { grade: "V.Good", remark: "V. Good", remarkArabic: "\u062C\u064A\u062F \u062C\u062F\u0627\u064B" } : effectiveOverallPercentage >= 65 ? { grade: "Good", remark: "Good", remarkArabic: "\u062C\u064A\u062F" } : effectiveOverallPercentage >= 50 ? { grade: "Fair", remark: "Fair", remarkArabic: "\u0645\u0642\u0628\u0648\u0644" } : { grade: "Fail", remark: "Fail", remarkArabic: "\u0631\u0627\u0633\u0628" } : getGradeRemark(effectiveOverallPercentage) : { grade: "\u2014", remark: "Not Enrolled", remarkArabic: "\u0644\u0645 \u064A\u0644\u062A\u062D\u0642" };
  return {
    isElementary,
    classCategory,
    isGraduating,
    graduatingLevel: classDoc?.graduatingLevel || null,
    secondaryResultMode,
    student: {
      id: student._id,
      name: student.name,
      gender: student.gender,
      numberInClass: student.numberInClass,
      seatNumber: student.seatNumber || null,
      sourceSchool: student.sourceSchool || classDoc?.sourceSchool || null,
      class: className || student.class?.name || "",
      arm: classDoc?.arm || student.class?.arm || null,
      enrolledTerms: studentEnrolledTerms,
      joinedTerm: student.joinedTerm || 1,
      isEnrolledInCurrentTerm
    },
    term: {
      session: currentTerm.session,
      termNumber: currentTerm.termNumber
    },
    subjects: subjectResults,
    overallTotal: effectiveOverallTotal,
    overallPercentage: effectiveOverallPercentage,
    cumulativeAverage: isElementary ? effectiveOverallPercentage : overallTermAverage,
    overallAverage: isElementary ? effectiveOverallPercentage : overallTermAverage,
    grade: overallGradeRemark.grade,
    remark: overallGradeRemark.remark,
    remarkArabic: overallGradeRemark.remarkArabic,
    position: isEnrolledInCurrentTerm ? position : null,
    result: !isEnrolledInCurrentTerm ? "Not Enrolled" : effectiveOverallPercentage >= 50 ? "Pass" : "Fail",
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
    } : null,
    affectiveScores: (() => {
      const defaultAffective = {
        "Punctuality": 5,
        "Neatness": 4,
        "Attitude to sch. Work": 5,
        "Attentiveness": 4,
        "Speaking Habit/Writing": 4,
        "Verbal Fluency": 5,
        "Games / Sports": 4
      };
      const saved = remarkDoc?.affectiveScores;
      if (saved && typeof saved === "object") {
        return { ...defaultAffective, ...saved };
      }
      return defaultAffective;
    })()
  };
};
var getReportCard = async (req, res) => {
  try {
    const { student, term, gradingScale } = req.query;
    if (!student || !term) {
      return res.status(400).json({ message: "student and term are required" });
    }
    const studentDoc = await Student_default.findById(student).select("class branch");
    if (!studentDoc) return res.status(404).json({ message: "Student not found" });
    if (studentDoc.class) {
      const cls = await Class_default.findById(studentDoc.class);
      if (isClassGraduatingDoc(cls) && !isSuperAdmin(req)) {
        return res.status(403).json({
          message: "Forbidden: Graduating class report cards are restricted to Super Admin."
        });
      }
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (studentDoc.branch && studentDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Student is not in your branch" });
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const isAssigned = (teacher?.classes || []).some((c) => c.toString() === studentDoc.class.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: "Forbidden: You are not assigned to this student's class" });
      }
    }
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

// server/controllers/pdfController.ts
init_Student();
init_Class();
init_User();
init_Subject();
init_GradingScale();
init_AttendanceSetting();

// server/utils/reportCardTemplate.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var currentDir = typeof __dirname !== "undefined" ? __dirname : typeof import.meta?.url === "string" ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd();
var LOGO_PATH = path.join(currentDir, "../assets/logo.png");
var FONT_PATH = path.join(currentDir, "../assets/fonts/Amiri-Regular.ttf");
var logoBase64 = fs.existsSync(LOGO_PATH) ? fs.readFileSync(LOGO_PATH).toString("base64") : "";
var fontBase64 = fs.existsSync(FONT_PATH) ? fs.readFileSync(FONT_PATH).toString("base64") : "";
var escHtml = (val) => {
  if (val === null || val === void 0) return "";
  return String(val).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};
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
  table.subjects td.subject-name { text-align: left; font-weight: 700;}
  table.subjects td.subject-name .ar { font-family: 'Amiri', 'Traditional Arabic', serif; float: right; font-size: 12px; }
  table.subjects tr.total-row td { font-size: 12px; font-weight: bold; }
  td.score {font-size: 14px; font-weight: bold;}
   
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
  .comment-row .comment-value .ar { font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 14px; font-weight: bold; }
  .comment-row .comment-value .en { font-size: 14px; margin-top: 1px; font-weight: bold; }
  .comment-row .comment-value .empty { color: #d1d5db; }
  .comment-row .comment-value .signature-img {
    max-height: 32px; max-width: 120px; object-fit: contain; margin-top: 2px;
  }
  .comment-row .stamp-img {
    position: absolute; right: 15px; bottom: 2px; max-height: 40px; max-width: 80px; opacity: 0.85; pointer-events: none;
  }

  /* Elementary Report Card Specific Styles matching ElementaryReportCardView.tsx */
  .elem-sheet {
    border: 1px solid #000 !important;
    padding: 20px;
    background: #ffffff;
    color: #030712;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    box-sizing: border-box;
    max-width: 794px;
    margin: 0 auto;
    min-height: 1000px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .elem-school-header {
    position: relative;
    text-align: center;
    padding-bottom: 6px;
    margin-bottom: 8px;
    border-bottom: 1px solid #d1d5db;
  }
  .elem-school-header .school-name-ar {
    font-family: 'Amiri', serif;
    font-size: 24px;
    font-weight: bold;
    color: #030712;
    line-height: 1.2;
    direction: rtl;
    margin: 0;
  }
  .elem-school-header .school-city-ar {
    font-family: 'Amiri', serif;
    font-size: 14px;
    font-weight: bold;
    color: #1f2937;
    margin-top: 2px;
    direction: rtl;
  }
  .elem-school-header .school-name-en {
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 0.5px;
    color: #111827;
    margin-top: 3px;
    text-transform: uppercase;
  }
  .elem-school-header .school-charity-en {
    font-size: 11px;
    letter-spacing: 0.8px;
    color: #374151;
    font-weight: 600;
    text-transform: uppercase;
    margin-top: 1px;
  }
  .elem-school-header .school-address-en {
    font-size: 9px;
    color: #4b5563;
    margin-top: 2px;
    line-height: 1.35;
  }
  .elem-school-header .elem-logo-img {
    position: absolute;
    right: 0;
    top: 0;
    width: 80px;
    height: 80px;
    object-fit: contain;
  }
  .elem-school-header .elem-logo-placeholder {
    position: absolute;
    right: 0;
    top: 0;
    width: 68px;
    height: 68px;
    border: 1px dashed #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #9ca3af;
  }

  .elem-banner {
    background-color: #1e3a5f;
    color: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 16px;
    font-weight: bold;
    font-size: 14px;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    border: 1px solid #000;
  }
  .elem-banner .banner-en {
    letter-spacing: 1px;
  }
  .elem-banner .banner-ar {
    font-family: 'Amiri', serif;
    font-size: 16px;
    direction: rtl;
  }

  .elem-top-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 8px;
  }
  .attendance-box {
    border: 1px solid #000;
  }
  .attendance-table {
    width: 100%;
    font-size: 10px;
    text-align: center;
    border-collapse: collapse;
  }
  .attendance-table th, .attendance-table td {
    padding: 3.5px 5px;
  }
  .att-head-row {
    border-bottom: 1px solid #000;
    font-weight: bold;
    background: #ffffff;
  }
  .att-th-left {
    text-align: left;
    width: 46%;
  }
  .att-th-mid {
    width: 18%;
    border-left: 1px solid #000;
    border-right: 1px solid #000;
  }
  .att-th-right {
    text-align: right;
    width: 36%;
    font-size: 11.5px;
    font-family: 'Amiri', serif;
    direction: rtl;
  }
  .attendance-table tbody tr {
    border-bottom: 1px solid #000;
  }
  .attendance-table tbody tr:last-child {
    border-bottom: none;
  }
  .att-td-left {
    text-align: left;
  }
  .att-td-mid {
    border-left: 1px solid #000;
    border-right: 1px solid #000;
    font-weight: bold;
    font-size: 11px;
    text-align: center;
    color: #000;
  }
  .att-td-right {
    text-align: right;
    font-family: 'Amiri', serif;
    direction: rtl;
    font-size: 11px;
  }

  .elem-meta-col {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 6px;
  }
  .elem-info-table {
    width: 100%;
    font-size: 10.5px;
    border: 1px solid #000;
    border-collapse: collapse;
  }
  .elem-info-table td {
    padding: 4px 6px;
    font-weight: bold;
  }
  .elem-info-table tr.border-b {
    border-bottom: 1px solid #000;
  }
  .info-td-label {
    text-align: left;
    font-weight: bold;
    color: #374151;
  }
  .info-td-val {
    text-align: center;
    font-weight: bold;
    font-size: 13px;
    color: #000;
  }
  .info-td-val.name-val {
    font-size: 14.5px;
    font-weight: bold;
    font-family: 'Amiri', serif;
    color: #000;
  }
  .info-td-val.class-val {
    font-size: 13.5px;
    font-weight: bold;
    color: #000;
  }
  .term-ar-val {
    font-family: 'Amiri', serif;
    margin-left: 6px;
    margin-right: 6px;
    font-weight: bold;
  }
  .info-td-ar {
    text-align: right;
    font-family: 'Amiri', serif;
    font-weight: bold;
  }

  .elem-mini-aff-table {
    width: 100%;
    font-size: 10px;
    text-align: center;
    border: 1px solid #000;
    border-collapse: collapse;
  }
  .elem-mini-aff-table th, .elem-mini-aff-table td {
    padding: 3px 4px;
  }
  .elem-mini-aff-table thead tr {
    background: #f1f5f9;
    border-bottom: 1px solid #000;
  }
  .mini-aff-th-label {
    text-align: left;
    border-right: 1px solid #000;
    font-weight: bold;
    padding-left: 6px;
  }
  .mini-aff-th-num {
    width: 22px;
    border-right: 1px solid #000;
    font-weight: bold;
  }
  .mini-aff-th-num.last {
    border-right: none;
  }
  .elem-mini-aff-table tbody tr.border-b {
    border-bottom: 1px solid #000;
  }
  .mini-aff-td-label {
    text-align: left;
    border-right: 1px solid #000;
    font-weight: 500;
    padding-left: 6px;
  }
  .mini-aff-td-check {
    border-right: 1px solid #000;
    font-weight: bold;
    color: #1e3a8a;
  }
  .mini-aff-td-check.last {
    border-right: none;
  }

  .elem-subjects-box {
    border: 1px solid #000;
    overflow: hidden;
    margin-bottom: 8px;
  }
  .elem-sub-table {
    width: 100%;
    font-size: 11px;
    border-collapse: collapse;
  }
  .sub-head-row {
    background: #e2e8f0;
    border-bottom: 1px solid #000;
    text-align: center;
    font-weight: bold;
  }
  .sub-th {
    padding: 4px;
    border-right: 1px solid #000;
  }
  .sub-th.grade-col { width: 14%; }
  .sub-th.total-col { width: 13%; }
  .sub-th.exam-col { width: 15%; }
  .sub-th.ca-col { width: 16%; }
  .sub-th .ar-lbl {
    font-family: 'Amiri', serif;
    font-size: 11.5px;
  }
  .sub-th .en-lbl {
    font-size: 9.5px;
    font-weight: 600;
  }
  .sub-th-subject {
    padding: 4px 12px;
    text-align: right;
  }
  .sub-head-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }
  .sub-head-en {
    letter-spacing: 0.5px;
  }
  .sub-head-ar {
    font-family: 'Amiri', serif;
    font-size: 13.5px;
    direction: rtl;
  }
  .sub-data-row {
    border-bottom: 1px solid #000;
    text-align: center;
    font-weight: bold;
    height: 40px;
  }
  .sub-td {
    padding: 8px 4px;
    border-right: 1px solid #000;
    font-weight: bold;
    font-size: 12px;
    color: #000;
  }
  .sub-td.grade-val {
    font-weight: bold;
    font-size: 12px;
    color: #111827;
  }
  .sub-td.total-val {
    font-weight: bold;
    font-size: 14px;
    color: #000;
  }
  .sub-td.exam-val {
    font-weight: bold;
    font-size: 14px;
    color: #000;
  }
  .sub-td.ca-val {
    font-weight: bold;
    font-size: 14px;
    color: #000;
  }
  .sub-td-name {
    padding: 8px 12px;
    text-align: right;
  }
  .sub-name-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }
  .sub-name-en {
    letter-spacing: 0.5px;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 12px;
  }
  .sub-name-ar {
    font-family: 'Amiri', serif;
    font-size: 14px;
    font-weight: bold;
    direction: rtl;
  }
  .sub-total-row {
    border-top: 2px solid #000;
    background: #ffffff;
    font-weight: bold;
    text-align: center;
    height: 40px;
  }
  .sub-td.total-result {
    color: #be123c;
    font-weight: bold;
    font-size: 14px;
  }
  .sub-td.total-sum {
    font-weight: bold;
    font-size: 14.5px;
    color: #000;
  }
  .total-label-cell {
    font-weight: bold;
  }
  .total-en {
    letter-spacing: 0.5px;
    font-weight: bold;
    font-size: 11.5px;
  }
  .total-ar {
    font-family: 'Amiri', serif;
    font-size: 14px;
    font-weight: bold;
    direction: rtl;
  }

  .elem-bottom-grid {
    display: grid;
    grid-template-columns: 5fr 2fr 5fr;
    gap: 8px;
    font-size: 10px;
  }
  .elem-skills-col {
    border: 1px solid #000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .elem-psych-table {
    width: 100%;
    font-size: 9.5px;
    text-align: center;
    border-collapse: collapse;
  }
  .psych-top-head {
    background: #f1f5f9;
    border-bottom: 1px solid #000;
    font-weight: bold;
  }
  .psych-top-head th {
    padding: 4px 2px;
    font-size: 10px;
  }
  .psych-top-head .ar {
    font-family: 'Amiri', serif;
  }
  .psych-sub-head {
    background: #f8fafc;
    border-bottom: 1px solid #000;
    font-weight: bold;
  }
  .psych-sub-head th.p-num {
    width: 20px;
    padding: 3px 0;
    border-right: 1px solid #000;
  }
  .psych-sub-head th.p-title {
    padding: 3px 4px;
    text-align: right;
  }
  .elem-psych-table tbody tr {
    border-bottom: 1px solid #000;
  }
  .elem-psych-table tbody tr.last-row {
    border-bottom: none;
  }
  .p-check {
    padding: 3.5px 0;
    border-right: 1px solid #000;
    font-weight: bold;
    color: #1e3a8a;
    font-size: 11px;
  }
  .p-label-cell {
    padding: 3.5px 5px;
    text-align: right;
  }
  .p-label-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .p-en {
    font-size: 8.5px;
    color: #374151;
  }
  .p-ar {
    font-family: 'Amiri', serif;
    font-weight: 600;
    font-size: 10.5px;
    direction: rtl;
  }

  .elem-seal-col {
    border: 1px solid #000;
    padding: 5px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    text-align: center;
    background: #ffffff;
  }
  .scale-list {
    font-size: 9px;
    font-weight: bold;
    line-height: 1.55;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 4px;
    width: 100%;
    text-align: left;
    padding-left: 3px;
  }
  .seal-container {
    margin: 3px 0;
  }
  .seal-container .stamp-img {
    max-height: 65px;
    max-width: 65px;
    object-fit: contain;
  }
  .official-seal-svg {
    width: 68px;
    height: 68px;
    margin: 0 auto;
    display: block;
  }

  .elem-summary-col {
    border: 1px solid #000;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .sum-grid-box {
    border-bottom: 1px solid #000;
    font-size: 9.5px;
    font-weight: 600;
  }
  .sum-grid-row {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
  .sum-grid-row.border-b {
    border-bottom: 1px solid #000;
  }
  .sum-cell {
    padding: 3.5px 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sum-cell.border-r {
    border-right: 1px solid #000;
  }
  .sum-cell .sum-val {
    font-size: 11px;
    font-weight: bold;
    color: #000;
  }
  .sum-cell .sum-val.text-rose {
    color: #be123c;
    font-weight: bold;
  }
  .sum-cell .remark-value {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    flex-wrap: wrap;
    gap: 4px;
    min-width: 0;
    font-size: 11px;
    line-height: 1.1;
  }
  .sum-cell .remark-value span {
    white-space: nowrap;
  }
  .sum-cell .ar {
    font-family: 'Amiri', serif;
  }

  .teacher-comment-box {
    padding: 4px 6px;
    border-bottom: 1px solid #000;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 46px;
  }
  .comment-title-ar {
    text-align: right;
    font-weight: bold;
    font-size: 9.5px;
    font-family: 'Amiri', serif;
  }
  .comment-title-en {
    font-weight: bold;
    font-family: 'Inter', sans-serif;
    font-size: 8.5px;
    direction: ltr;
  }
  .comment-body {
    text-align: center;
    padding: 2px 0;
    font-weight: bold;
    font-size: 10px;
    color: #111827;
  }
  .comment-ar {
    font-family: 'Amiri', serif;
    font-size: 11.5px;
    font-weight: bold;
  }
  .comment-placeholder {
    color: #6b7280;
    font-weight: bold;
  }
  .sig-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8.5px;
    color: #374151;
  }
  .sig-row .ar {
    font-family: 'Amiri', serif;
  }

  .principal-comment-box {
    padding: 4px 6px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 46px;
    position: relative;
  }
  .princ-prompt {
    font-size: 9px;
    color: #374151;
    font-weight: bold;
  }
  .princ-prompt .ar-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .princ-prompt .ar-line .ar {
    font-family: 'Amiri', serif;
    direction: rtl;
    font-weight: bold;
  }
  .princ-prompt .en-line {
    text-align: left;
    margin-top: 1px;
    font-weight: bold;
  }
  .princ-body {
    text-align: center;
    padding: 2px 0;
    font-weight: bold;
  }
  .princ-text {
    font-size: 10px;
    font-weight: bold;
    color: #111827;
  }
  .princ-text .ar {
    font-family: 'Amiri', serif;
    margin: 0 4px;
    font-size: 11.5px;
    font-weight: bold;
  }
  .princ-sig-img {
    max-height: 25px;
    max-width: 90px;
    object-fit: contain;
    margin: 2px auto 0;
    display: block;
  }

  /* ---------- Density tiers for secondary report cards ----------
     Applied only when a card has many subjects, so everything still fits on
     one A4 page. Row padding / section heights shrink; score digits stay
     12px+ and pure black so they remain readable on paper. */
  .sheet.density-1 { --row-pad: 5px;   --score-fs: 13px;   --info-h: 30px; --att-pad: 10px; --cmt-h: 38px; --gap: 7px; }
  .sheet.density-2 { --row-pad: 3px;   --score-fs: 12.5px; --info-h: 28px; --att-pad: 8px; --cmt-h: 34px; --gap: 5px; }
  .sheet.density-3 { --row-pad: 2.5px; --score-fs: 12px;   --info-h: 24px; --att-pad: 6px;   --cmt-h: 30px; --gap: 4px; }
  .sheet.density-4 { --row-pad: 1px;   --score-fs: 12px;   --info-h: 21px; --att-pad: 1.5px;   --cmt-h: 24px; --gap: 3px; zoom: 0.92; }

  .sheet[class*="density-"] { padding: 10px 14px; }

  /* header */
  .sheet[class*="density-"] .header { margin-bottom: var(--gap); min-height: 50px; }
  .sheet[class*="density-"] .header .logo,
  .sheet[class*="density-"] .header .logo-placeholder { width: 50px; height: 50px; }
  .sheet[class*="density-"] .header .school-name-ar { font-size: 20px; }
  .sheet[class*="density-"] .title-bar { margin: var(--gap) 0; }

  /* attendance + student info */
  .sheet[class*="density-"] .info-section { margin-bottom: var(--gap); }
  .sheet[class*="density-"] .attendance-row { padding: var(--att-pad) 6px; }
  .sheet[class*="density-"] .student-info { display: flex; flex-direction: column; }
  .sheet[class*="density-"] .student-info-row { height: auto; flex: 1; min-height: var(--info-h); }
  .sheet[class*="density-"] .student-info-row .value { font-size: 12px; }

  /* subjects table: the main saver */
  .sheet[class*="density-"] table.subjects { margin-bottom: var(--gap); }
  .sheet[class*="density-"] table.subjects th { padding: 2px 3px; font-size: 9.5px; }
  .sheet[class*="density-"] table.subjects td { padding: var(--row-pad) 4px; line-height: 1.15; }
  .sheet[class*="density-"] table.subjects td.score { font-size: var(--score-fs); color: #000; }
  .sheet[class*="density-"] table.subjects tr { page-break-inside: avoid; }
  .sheet[class*="density-"] table.subjects tr.total-row td { font-size: 11.5px; }

  /* bottom + comments */
  .sheet[class*="density-"] .bottom-section { margin-bottom: var(--gap); }
  .sheet[class*="density-"] .bottom-box .row { height: var(--info-h); }
  .sheet[class*="density-"] .term-averages-table td { padding: 5px 8px; }
  .sheet[class*="density-"] .comment-row { min-height: var(--cmt-h); }
  .sheet[class*="density-"] .comment-row .comment-value { padding: 2px 10px; }
  .sheet[class*="density-"] .comment-row .comment-value .ar,
  .sheet[class*="density-"] .comment-row .comment-value .en { font-size: 12px; }
  .sheet[class*="density-"] .comment-row .comment-value .signature-img { max-height: 22px; }
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
var getElementaryGrade = (score, existingGrade) => {
  if (score !== null && score !== void 0 && !isNaN(score)) {
    if (score >= 85) return "Excellent";
    if (score >= 75) return "V.Good";
    if (score >= 65) return "Good";
    if (score >= 50) return "Fair";
    return "Fail";
  }
  if (existingGrade) {
    if (existingGrade === "A1" || existingGrade === "A") return "Excellent";
    if (existingGrade === "B2" || existingGrade === "B" || existingGrade.includes("Very Good") || existingGrade.includes("V. Good") || existingGrade.includes("V.Good")) {
      return "V.Good";
    }
    if (existingGrade === "C4" || existingGrade === "C") return "Good";
    if (existingGrade === "D7" || existingGrade === "D" || existingGrade === "Pass") return "Fair";
    if (existingGrade === "F9" || existingGrade === "F" || existingGrade === "Fail" || existingGrade === "Poor") return "Fail";
    return existingGrade;
  }
  return "";
};
var buildElementarySheetHtml = (data) => {
  const {
    student,
    term,
    subjects,
    overallTotal,
    overallPercentage,
    position,
    result,
    totalStudentsInClass,
    classTeacherComment,
    principalComment,
    attendance,
    templateSettings,
    affectiveScores = {}
  } = data;
  const schoolNameAr = templateSettings?.schoolNameArabic || "\u0645\u0639\u0647\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A";
  const schoolNameEn = templateSettings?.schoolNameEnglish || "INSTITUTE OF ARABIC AND ISLAMIC STUDIES";
  const effectiveLogo = templateSettings?.logoBase64 || (logoBase64 ? `data:image/png;base64,${logoBase64}` : "");
  const timesOpened = attendance?.timesSchoolOpened ?? attendance?.schoolDays ?? "";
  const timesPresent = attendance?.timesPresent ?? attendance?.presentDays ?? "";
  const timesAbsent = attendance?.timesAbsent ?? attendance?.absentDays ?? "";
  const dateResumed = attendance?.dateResumed || "";
  const dateClosed = attendance?.dateClosed || "";
  const nextResumption = attendance?.nextResumption || "";
  const fallbackRemark = overallPercentage >= 85 ? "Excellent" : overallPercentage >= 75 ? "V.Good" : overallPercentage >= 65 ? "Good" : overallPercentage >= 50 ? "Fair" : "Fail";
  const fallbackRemarkArabic = overallPercentage >= 85 ? "\u0645\u0645\u062A\u0627\u0632" : overallPercentage >= 75 ? "\u062C\u064A\u062F \u062C\u062F\u0627\u064B" : overallPercentage >= 65 ? "\u062C\u064A\u062F" : overallPercentage >= 50 ? "\u0645\u0642\u0628\u0648\u0644" : "\u0631\u0627\u0633\u0628";
  const isEnrolled = data.student?.isEnrolledInCurrentTerm !== false;
  const displayRemark = data.remark || (!isEnrolled ? "Not Enrolled" : fallbackRemark);
  const displayRemarkArabic = data.remarkArabic || (!isEnrolled ? "\u0644\u0645 \u064A\u0644\u062A\u062D\u0642" : fallbackRemarkArabic);
  const subjectMap = /* @__PURE__ */ new Map();
  subjects.forEach((s) => {
    const key = (s.nameEnglish || "").trim().toLowerCase();
    subjectMap.set(key, s);
    if (s.nameArabic) {
      subjectMap.set(s.nameArabic.trim(), s);
    }
  });
  const displaySubjects = [];
  const matchedKeys = /* @__PURE__ */ new Set();
  ELEMENTARY_FIXED_SUBJECTS.forEach((fixed) => {
    const keyEn = fixed.nameEnglish.trim().toLowerCase();
    const keyAr = fixed.nameArabic.trim();
    let found = subjectMap.get(keyEn) || subjectMap.get(keyAr);
    if (!found) {
      for (const [sKey, sVal] of subjectMap.entries()) {
        if (keyEn.includes("memorization") && sKey.includes("memorization") || keyEn.includes("hadith") && sKey.includes("hadith") || keyEn.includes("reading") && sKey.includes("reading") || keyEn.includes("writing") && sKey.includes("writing") || keyEn.includes("arabic") && sKey === "arabic" || keyEn.includes("hymns") && sKey.includes("hymn")) {
          found = sVal;
          break;
        }
      }
    }
    if (found) {
      matchedKeys.add((found.nameEnglish || "").trim().toLowerCase());
      if (found.nameArabic) matchedKeys.add(found.nameArabic.trim());
    }
    const totalVal = found?.currentTermScore ?? found?.combinedTotal ?? (found?.ca !== null && found?.exam !== null && found?.ca !== void 0 && found?.exam !== void 0 ? Number(found.ca) + Number(found.exam) : null);
    displaySubjects.push({
      nameEnglish: fixed.nameEnglish,
      nameArabic: fixed.nameArabic,
      ca: found?.ca ?? null,
      exam: found?.exam ?? null,
      total: totalVal,
      grade: getElementaryGrade(totalVal, found?.grade ?? null)
    });
  });
  subjects.forEach((s) => {
    const keyEn = (s.nameEnglish || "").trim().toLowerCase();
    const keyAr = (s.nameArabic || "").trim();
    if (!matchedKeys.has(keyEn) && (!keyAr || !matchedKeys.has(keyAr))) {
      const totalVal = s.currentTermScore ?? s.combinedTotal ?? (s.ca !== null && s.exam !== null && s.ca !== void 0 && s.exam !== void 0 ? Number(s.ca) + Number(s.exam) : null);
      displaySubjects.push({
        nameEnglish: s.nameEnglish,
        nameArabic: s.nameArabic || "",
        ca: s.ca ?? null,
        exam: s.exam ?? null,
        total: totalVal,
        grade: getElementaryGrade(totalVal, s.grade ?? null)
      });
    }
  });
  const defaultAffective = {
    "Punctuality": 5,
    "Neatness": 4,
    "Attitude to sch. Work": 5,
    "Attentiveness": 4,
    "Speaking Habit/Writing": 4,
    "Verbal Fluency": 5,
    "Games / Sports": 4
  };
  const affScores = { ...defaultAffective, ...affectiveScores };
  return `
    <div class="sheet elem-sheet">
      ${templateSettings?.watermarkText ? `<div class="watermark">${templateSettings.watermarkText}</div>` : ""}

      <!-- Top School Header exactly matching ElementaryReportCardView.tsx -->
      <div class="elem-school-header">
        <h1 class="school-name-ar">${schoolNameAr}</h1>
        <p class="school-city-ar">\u0627\u064A\u062C\u064A\u0628\u0648\u0627 - \u0644\u0627\u063A\u0648\u0633 - \u0646\u064A\u062C\u064A\u0631\u064A\u0627</p>
        <h2 class="school-name-en">${schoolNameEn}</h2>
        <p class="school-charity-en">FOR CHARITABLE ORGANIZATION</p>
        <p class="school-address-en">
          18/20 ADEWALE BELLO STREET, OFF AILEGUN ROAD, EJIGBO, LAGOS.<br />
          49 LAFENWA STREET, OFF COCA ROAD, EJIGBO, LAGOS. TEL: 08023299665
        </p>
        ${effectiveLogo ? `<img src="${effectiveLogo}" alt="School Logo" class="elem-logo-img" />` : `<div class="elem-logo-placeholder">Logo</div>`}
      </div>

      <!-- Dark Navy Blue Banner -->
      <div class="elem-banner">
        <span class="banner-en">REPORT CARD</span>
        <span class="banner-ar">\u0643\u0634\u0641 \u0627\u0644\u062F\u0631\u062C\u0627\u062A</span>
      </div>

      <!-- Top Grid: Attendance Table on Left, Meta & Mini Affective on Right -->
      <div class="elem-top-grid">
        <!-- Attendance Table -->
        <div class="attendance-box">
          <table class="attendance-table">
            <thead>
              <tr class="att-head-row">
                <th class="att-th-left">ATTENDANCE</th>
                <th class="att-th-mid"></th>
                <th class="att-th-right">\u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="att-td-left">No. of times school opened</td>
                <td class="att-td-mid"><strong>${timesOpened || "-"}</strong></td>
                <td class="att-td-right">\u0639\u062F\u062F \u0623\u064A\u0627\u0645 \u0627\u0644\u062F\u0648\u0627\u0645</td>
              </tr>
              <tr>
                <td class="att-td-left">No. of times present</td>
                <td class="att-td-mid"><strong>${timesPresent || "-"}</strong></td>
                <td class="att-td-right">\u0646\u0633\u0628\u0629 \u0627\u0644\u062D\u0636\u0648\u0631</td>
              </tr>
              <tr>
                <td class="att-td-left">No. of times absent</td>
                <td class="att-td-mid"><strong>${timesAbsent || "-"}</strong></td>
                <td class="att-td-right">\u0646\u0633\u0628\u0629 \u0627\u0644\u063A\u064A\u0627\u0628</td>
              </tr>
              <tr>
                <td class="att-td-left">No. of Students in the class</td>
                <td class="att-td-mid"><strong>${totalStudentsInClass || "-"}</strong></td>
                <td class="att-td-right">\u0639\u062F\u062F \u0627\u0644\u0637\u0644\u0627\u0628 \u0641\u064A \u0627\u0644\u0635\u0641</td>
              </tr>
              <tr>
                <td class="att-td-left">Date School resumed</td>
                <td class="att-td-mid"><strong>${dateResumed || "-"}</strong></td>
                <td class="att-td-right">\u0628\u062F\u0621 \u0627\u0644\u062F\u0631\u0627\u0633\u0629</td>
              </tr>
              <tr>
                <td class="att-td-left">Date School closes</td>
                <td class="att-td-mid"><strong>${dateClosed || "-"}</strong></td>
                <td class="att-td-right">\u062E\u062A\u0645 \u0627\u0644\u062F\u0631\u0627\u0633\u0629</td>
              </tr>
              <tr>
                <td class="att-td-left">Next resumption</td>
                <td class="att-td-mid"><strong>${nextResumption || "-"}</strong></td>
                <td class="att-td-right">\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u062F\u0631\u0627\u0633\u0629</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Right Info Boxes: Session/Term, Name/Class, Mini Affective -->
        <div class="elem-meta-col">
          <!-- Session & Term Table -->
          <table class="elem-info-table">
            <tbody>
              <tr class="border-b">
                <td class="info-td-label" style="width: 22%;">Session:</td>
                <td class="info-td-val" style="width: 56%;"><strong>${term.session}</strong></td>
                <td class="info-td-ar" style="width: 22%;">:\u0639\u0627\u0645</td>
              </tr>
              <tr>
                <td class="info-td-label">Term:</td>
                <td class="info-td-val">
                  <strong><span>${ordinalEn[term.termNumber - 1] || "1st"} Term</span>
                  <span class="term-ar-val">${ordinalAr[term.termNumber - 1] || "\u0627\u0644\u0623\u0648\u0644\u0649"}</span></strong>
                </td>
                <td class="info-td-ar">:\u0627\u0644\u0641\u062A\u0631\u0629</td>
              </tr>
            </tbody>
          </table>

          <!-- Name & Class Table -->
          <table class="elem-info-table">
            <tbody>
              <tr class="border-b">
                <td class="info-td-label" style="width: 20%;">Name:</td>
                <td class="info-td-val name-val" style="width: 60%;"><strong>${escHtml(student.name)}</strong></td>
                <td class="info-td-ar" style="width: 20%;">:\u0627\u0644\u0625\u0633\u0645</td>
              </tr>
              <tr class="${student.seatNumber ? "border-b" : ""}">
                <td class="info-td-label">Class:</td>
                <td class="info-td-val class-val">
                  <strong style="text-transform: uppercase;">${escHtml(student.class)}</strong>
                  ${student.arm ? `<strong> (${escHtml(student.arm)})</strong>` : ""}
                </td>
                <td class="info-td-ar">:\u0627\u0644\u0635\u0641</td>
              </tr>
              ${student.seatNumber ? `<tr>
                      <td class="info-td-label">Seat No:</td>
                      <td class="info-td-val"><strong>${escHtml(student.seatNumber)}</strong></td>
                      <td class="info-td-ar">:\u0631\u0642\u0645 \u0627\u0644\u062C\u0644\u0648\u0633</td>
                    </tr>` : ""}
            </tbody>
          </table>

          <!-- Mini Affective Domain Table -->
          <table class="elem-mini-aff-table">
            <thead>
              <tr>
                <th class="mini-aff-th-label">AFFECTIVE DOMAIN</th>
                <th class="mini-aff-th-num">1</th>
                <th class="mini-aff-th-num">2</th>
                <th class="mini-aff-th-num">3</th>
                <th class="mini-aff-th-num">4</th>
                <th class="mini-aff-th-num last">5</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b">
                <td class="mini-aff-td-label">Punctuality</td>
                <td class="mini-aff-td-check">${affScores["Punctuality"] === 1 ? "\u2713" : ""}</td>
                <td class="mini-aff-td-check">${affScores["Punctuality"] === 2 ? "\u2713" : ""}</td>
                <td class="mini-aff-td-check">${affScores["Punctuality"] === 3 ? "\u2713" : ""}</td>
                <td class="mini-aff-td-check">${affScores["Punctuality"] === 4 ? "\u2713" : ""}</td>
                <td class="mini-aff-td-check last">${affScores["Punctuality"] === 5 ? "\u2713" : ""}</td>
              </tr>
              <tr>
                <td class="mini-aff-td-label">Neatness</td>
                <td class="mini-aff-td-check">${affScores["Neatness"] === 1 ? "\u2713" : ""}</td>
                <td class="mini-aff-td-check">${affScores["Neatness"] === 2 ? "\u2713" : ""}</td>
                <td class="mini-aff-td-check">${affScores["Neatness"] === 3 ? "\u2713" : ""}</td>
                <td class="mini-aff-td-check">${affScores["Neatness"] === 4 ? "\u2713" : ""}</td>
                <td class="mini-aff-td-check last">${affScores["Neatness"] === 5 ? "\u2713" : ""}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Elementary Subjects Table -->
      <div class="elem-subjects-box">
        <table class="elem-sub-table">
          <thead>
            <tr class="sub-head-row">
              <th class="sub-th grade-col">
                <span class="ar-lbl">\u0627\u0644\u062A\u0642\u062F\u064A\u0631</span><br />
                <span class="en-lbl">(GRADE)</span>
              </th>
              <th class="sub-th total-col">
                <span class="ar-lbl">\u0627\u0644\u0645\u062D\u0635\u0644\u0629</span><br />
                <span class="en-lbl">(TOTAL)</span>
              </th>
              <th class="sub-th exam-col">
                <span class="ar-lbl">\u0627\u0644\u0627\u0645\u062A\u062D\u0627\u0646</span><br />
                <span class="en-lbl">(EXAM 60%)</span>
              </th>
              <th class="sub-th ca-col">
                <span class="ar-lbl">\u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0645\u0633\u062A\u0645\u0631\u0629</span><br />
                <span class="en-lbl">(CA 40%)</span>
              </th>
              <th class="sub-th-subject">
                <div class="sub-head-flex">
                  <span class="sub-head-en">SUBJECTS</span>
                  <span class="sub-head-ar">\u0627\u0644\u0645\u0648\u0627\u062F</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            ${displaySubjects.map(
    (sub) => `
              <tr class="sub-data-row">
                <td class="sub-td grade-val"><strong>${sub.grade ?? ""}</strong></td>
                <td class="sub-td total-val"><strong>${sub.total !== null && sub.total !== void 0 ? sub.total : ""}</strong></td>
                <td class="sub-td exam-val"><strong>${sub.exam !== null && sub.exam !== void 0 ? sub.exam : ""}</strong></td>
                <td class="sub-td ca-val"><strong>${sub.ca !== null && sub.ca !== void 0 ? sub.ca : ""}</strong></td>
                <td class="sub-td-name">
                  <div class="sub-name-flex">
                    <span class="sub-name-en"><strong>${sub.nameEnglish}</strong></span>
                    <span class="sub-name-ar"><strong>${sub.nameArabic}</strong></span>
                  </div>
                </td>
              </tr>
            `
  ).join("")}

            <!-- Total Row -->
            <tr class="sub-total-row">
              <td class="sub-td total-result"><strong>${result || "Fail"}</strong></td>
              <td class="sub-td total-sum"><strong>${overallTotal > 0 ? overallTotal : "."}</strong></td>
              <td class="sub-td" style="border-right: 1px solid #000;"></td>
              <td class="sub-td" style="border-right: 1px solid #000;"></td>
              <td class="sub-td-name total-label-cell">
                <div class="sub-name-flex">
                  <span class="total-en">TOTAL</span>
                  <span class="total-ar">\u0627\u0644\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0643\u0644\u064A</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bottom Section: Skills, Grading Scale, Rosette Star, Summary & Remarks -->
      <div class="elem-bottom-grid">
        <!-- Left: Psychomotor / Affective Skills Table -->
        <div class="elem-skills-col">
          <table class="elem-psych-table">
            <thead>
              <tr class="psych-top-head">
                <th colspan="6">
                  (Psychomotor / Affective Skills) &nbsp; <span class="ar">\u0627\u0644\u0633\u0644\u0648\u0643 \u0648\u0627\u0644\u0646\u0634\u0627\u0637</span>
                </th>
              </tr>
              <tr class="psych-sub-head">
                <th class="p-num">5</th>
                <th class="p-num">4</th>
                <th class="p-num">3</th>
                <th class="p-num">2</th>
                <th class="p-num">1</th>
                <th class="p-title">Skills</th>
              </tr>
            </thead>
            <tbody>
              ${[
    { en: "Punctuality", ar: "\u0627\u0644\u0645\u0648\u0627\u0638\u0628\u0629" },
    { en: "Neatness", ar: "\u0627\u0644\u0646\u0638\u0627\u0641\u0629" },
    { en: "Attitude to sch. Work", ar: "\u0627\u0644\u062A\u062C\u0627\u0648\u0628 \u0627\u0644\u062F\u0631\u0627\u0633\u064A" },
    { en: "Attentiveness", ar: "\u0627\u0644\u0627\u0646\u062A\u0628\u0627\u0647" },
    { en: "Speaking Habit/Writing", ar: "\u0627\u0644\u062A\u062D\u062F\u062B / \u0627\u0644\u062E\u0637" },
    { en: "Verbal Fluency", ar: "\u0627\u0644\u0641\u0635\u0627\u062D\u0629" },
    { en: "Games / Sports", ar: "\u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0648\u0627\u0644\u0631\u064A\u0627\u0636\u0629" }
  ].map((skill, sIdx, arr) => {
    const score = affScores[skill.en] ?? null;
    return `
                <tr class="${sIdx === arr.length - 1 ? "last-row" : ""}">
                  <td class="p-check">${score === 5 ? "\u2713" : ""}</td>
                  <td class="p-check">${score === 4 ? "\u2713" : ""}</td>
                  <td class="p-check">${score === 3 ? "\u2713" : ""}</td>
                  <td class="p-check">${score === 2 ? "\u2713" : ""}</td>
                  <td class="p-check">${score === 1 ? "\u2713" : ""}</td>
                  <td class="p-label-cell">
                    <div class="p-label-flex">
                      <span class="p-en">${skill.en}</span>
                      <span class="p-ar">${skill.ar}</span>
                    </div>
                  </td>
                </tr>
              `;
  }).join("")}
            </tbody>
          </table>
        </div>

        <!-- Center: Scale & Rosette Seal -->
        <div class="elem-seal-col">
          <div class="scale-list">
            <div>85 - 100 = Excellent</div>
            <div>75 - 84 = V.Good</div>
            <div>65 - 74 = Good</div>
            <div>50 - 64 = Fair</div>
            <div>1 - 49 = Fail</div>
          </div>

          <div class="seal-container">
            ${templateSettings?.showStamp && templateSettings?.stampBase64 ? `<img src="${templateSettings.stampBase64.startsWith("data:") ? templateSettings.stampBase64 : `data:image/png;base64,${templateSettings.stampBase64}`}" alt="Stamp" class="stamp-img" />` : `
              <svg class="official-seal-svg" viewBox="0 0 100 100">
                <polygon
                  points="50,4 61,19 79,9 80,29 98,36 88,53 97,70 77,75 73,95 54,87 37,97 30,78 10,75 18,57 5,42 22,33 21,13 40,20"
                  fill="none"
                  stroke="#1e3a8a"
                  stroke-width="1.6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="28"
                  fill="none"
                  stroke="#1e3a8a"
                  stroke-width="1.2"
                  stroke-dasharray="2,2"
                />
                <circle cx="50" cy="50" r="22" fill="#f8fafc" stroke="#1e3a8a" stroke-width="1" />
                <text
                  x="50"
                  y="47"
                  text-anchor="middle"
                  font-size="6.5"
                  font-weight="bold"
                  fill="#1e3a8a"
                >
                  OFFICIAL
                </text>
                <text
                  x="50"
                  y="56"
                  text-anchor="middle"
                  font-size="6.5"
                  font-weight="bold"
                  fill="#1e3a8a"
                >
                  SEAL
                </text>
              </svg>
            `}
          </div>
        </div>

        <!-- Right: Position/Percentage/Result/Grade & Remarks -->
        <div class="elem-summary-col">
          <!-- Summary Grid: 2 rows of 2 boxes -->
          <div class="sum-grid-box">
            <div class="sum-grid-row border-b">
              <div class="sum-cell border-r">
                <span>Position</span>
                <strong class="sum-val">${position ? position : "-"}</strong>
                <span class="ar">:\u0627\u0644\u062A\u0631\u062A\u064A\u0628</span>
              </div>
              <div class="sum-cell">
                <span>Percentage</span>
                <strong class="sum-val">${overallPercentage.toFixed(1)} %</strong>
                <span class="ar">:\u0627\u0644\u0646\u0633\u0628\u0629 \u0627\u0644\u0645\u0626\u0648\u064A\u0629</span>
              </div>
            </div>

            <div class="sum-grid-row">
              <div class="sum-cell border-r">
                <span>Result:</span>
                <strong class="sum-val text-rose">${result || "Fail"}</strong>
                <span class="ar">:\u0627\u0644\u0646\u062A\u064A\u062C\u0629</span>
              </div>
              <div class="sum-cell">
                <span>Grade:</span>
                <strong class="sum-val text-rose remark-value">
                  <span>${displayRemark}</span>
                  ${displayRemarkArabic ? `<span class="ar" style="font-family: 'Amiri', 'Traditional Arabic', serif;" dir="rtl">(${displayRemarkArabic})</span>` : ""}
                </strong>
                <span class="ar">:\u0627\u0644\u062A\u0642\u062F\u064A\u0631</span>
              </div>
            </div>
          </div>

          <!-- Teacher's comment -->
          <div class="teacher-comment-box">
            <div class="comment-title-ar">
              \u062A\u0639\u0644\u064A\u0642 \u0623\u0633\u062A\u0627\u0630 \u0627\u0644\u0635\u0641 / <span class="comment-title-en">:Teacher's comment</span>
            </div>
            <div class="comment-body">
              ${classTeacherComment?.en || classTeacherComment?.ar ? `<div>
                      ${classTeacherComment.ar ? `<div class="comment-ar font-bold">${classTeacherComment.ar}</div>` : ""}
                      ${classTeacherComment.en ? `<div class="comment-en">${classTeacherComment.en}</div>` : ""}
                    </div>` : `<span class="comment-placeholder italic">performance can improve with increased focus</span>`}
            </div>
            <div class="sig-row">
              <span>Signature: ....................................................</span>
              <span class="ar">:\u0627\u0644\u062A\u0648\u0642\u064A\u0639</span>
            </div>
          </div>

          <!-- Principal's comment -->
          <div class="principal-comment-box">
            <div class="comment-title-ar">
              \u062A\u0639\u0644\u064A\u0642 \u0627\u0644\u0648\u0643\u064A\u0644 / <span class="comment-title-en">:Principal's comment</span>
            </div>
            <div class="comment-body">
              ${principalComment?.en || principalComment?.ar ? `<div>
                      ${principalComment.ar ? `<div class="comment-ar font-bold">${principalComment.ar}</div>` : ""}
                      ${principalComment.en ? `<div class="comment-en">${principalComment.en}</div>` : ""}
                    </div>` : `<span class="comment-placeholder italic">an exemplary student demonstrating diligence and character</span>`}
              ${templateSettings?.showPrincipalSignature && templateSettings.principalSignatureBase64 ? `<img src="${templateSettings.principalSignatureBase64.startsWith("data:") ? templateSettings.principalSignatureBase64 : `data:image/png;base64,${templateSettings.principalSignatureBase64}`}" alt="Principal Signature" class="princ-sig-img" style="max-height: 20px; max-width: 80px; object-fit: contain; margin: 2px auto 0;" />` : ""}
            </div>
            <div class="sig-row">
              <span>Signature: ....................................................</span>
              <span class="ar">:\u0627\u0644\u062A\u0648\u0642\u064A\u0639</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};
var buildSecondarySheetHtml = (data) => {
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
    templateSettings,
    grade,
    remark,
    remarkArabic
  } = data;
  const fallbackRemark = overallPercentage >= 85 ? "Excellent" : overallPercentage >= 75 ? "Very Good" : overallPercentage >= 60 ? "Good" : overallPercentage >= 50 ? "Pass" : "Fail";
  const fallbackRemarkArabic = overallPercentage >= 85 ? "\u0645\u0645\u062A\u0627\u0632" : overallPercentage >= 75 ? "\u062C\u064A\u062F \u062C\u062F\u0627" : overallPercentage >= 60 ? "\u062C\u064A\u062F" : overallPercentage >= 50 ? "\u0645\u0642\u0628\u0648\u0644" : "\u0631\u0627\u0633\u0628";
  const isEnrolled = student?.isEnrolledInCurrentTerm !== false;
  const displayRemark = remark || data.remark || (!isEnrolled ? "Not Enrolled" : fallbackRemark);
  const displayRemarkArabic = remarkArabic || data.remarkArabic || (!isEnrolled ? "\u0644\u0645 \u064A\u0644\u062A\u062D\u0642" : fallbackRemarkArabic);
  const schoolNameAr = templateSettings?.schoolNameArabic || "\u0645\u0639\u0647\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A";
  const schoolNameEn = templateSettings?.schoolNameEnglish || "INSTITUTE OF ARABIC AND ISLAMIC STUDIES";
  const schoolAddress = templateSettings?.address || "18/20 ADEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665";
  const formattedAddress = schoolAddress.replace(/\n/g, "<br/>");
  const effectiveLogo = templateSettings?.logoBase64 || (logoBase64 ? `data:image/png;base64,${logoBase64}` : "");
  const primaryColor = templateSettings?.primaryColor || "#16a34a";
  const headerColor = templateSettings?.headerColor || "#1e3a8a";
  const resultMode = data.secondaryResultMode || "cascade";
  const showCascadeColumns = resultMode === "current_only" ? false : term.termNumber === 2 || term.termNumber === 3;
  const subjectCount = subjects.length;
  const density = subjectCount <= 12 ? "" : subjectCount <= 15 ? "density-1" : subjectCount <= 18 ? "density-2" : subjectCount <= 22 ? "density-3" : "density-4";
  const subjectRows = subjects.map(
    (s) => `
      <tr>
      <td class="subject-name">${escHtml(s.nameEnglish)} ${s.nameArabic ? `<span class="ar">${escHtml(s.nameArabic)}</span>` : ""}</td>
      <td class="score">${s.ca ?? "-"}</td>
      <td class="score">${s.exam ?? "-"}</td>
      <td class="score">${s.currentTermScore ?? "-"}</td>
      ${showCascadeColumns ? `<td class="score">${s.priorPeriodValue ?? "-"}</td>` : ""}
      ${showCascadeColumns ? `<td class="score">${s.combinedTotal ?? "-"}</td>` : ""}
      <td class="score">${s.cumulativeAverage ?? "-"}</td>
    </tr>`
  ).join("");
  const visibleTermAverages = (termAverages || []).filter((t) => {
    if (t.termNumber > term.termNumber) return false;
    if (resultMode === "current_only") return t.termNumber === term.termNumber;
    if (resultMode === "combine_1st_and_3rd") return t.termNumber !== 2;
    return true;
  });
  const validAvgs = visibleTermAverages.map((t) => t.average).filter((v) => v !== null && v !== void 0);
  const safeCumulative = validAvgs.length ? Math.round(validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length * 100) / 100 : null;
  const termAverageRows = visibleTermAverages.map(
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
    <div class="sheet ${density}" style="--primary-color: ${primaryColor}; --header-color: ${headerColor};">
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
            <div class="value arabic">${escHtml(student.name)}</div>
            <div class="label">\u0627\u0644\u0627\u0633\u0645<br/>NAME</div>
          </div>
          ${student.seatNumber ? `<div class="student-info-row">
                  <div class="value">${escHtml(student.seatNumber)}</div>
                  <div class="label">\u0631\u0642\u0645 \u0627\u0644\u062C\u0644\u0648\u0633<br/>SEAT NO</div>
                </div>` : ""}
          <div class="student-info-row">
            <div class="value arabic">${escHtml(student.class)}${student.arm ? ` \u2014 ${escHtml(student.arm)}` : ""}</div>
            <div class="label">\u0627\u0644\u0635\u0641<br/>CLASS</div>
          </div>
          <div class="student-info-row">
            <div class="value">${totalStudentsInClass ?? "-"}</div>
            <div class="label">\u0639\u062F\u062F \u0627\u0644\u0637\u0644\u0627\u0628<br/>NO IN CLASS</div>
          </div>
          <div class="student-info-row">
            <div class="value">${escHtml(student.gender)}</div>
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
            ${showCascadeColumns && term.termNumber === 2 ? `<th>\u0645\u062D\u0635\u0644\u0629 \u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u0623\u0648\u0644\u0649<br/>1st term total</th>
                   <th>\u0645\u062D\u0635\u0644\u0629 \u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 \u0648\u0627\u0644\u062B\u0627\u0646\u064A\u0629<br/>1st and 2nd term total</th>` : ""}
            ${showCascadeColumns && term.termNumber === 3 && resultMode === "combine_1st_and_3rd" ? `<th>\u0645\u062D\u0635\u0644\u0629 \u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u0623\u0648\u0644\u0649<br/>1st term total</th>
                   <th>\u0645\u062D\u0635\u0644\u0629 \u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 \u0648\u0627\u0644\u062B\u0627\u0644\u062B\u0629<br/>1st and 3rd term total</th>` : showCascadeColumns && term.termNumber === 3 ? `<th>\u0645\u062D\u0635\u0644\u0629 \u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u062B\u0627\u0646\u064A\u0629<br/>2nd term total</th>
                   <th>\u0645\u062D\u0635\u0644\u0629 \u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u062B\u0627\u0646\u064A\u0629 \u0648\u0627\u0644\u062B\u0627\u0644\u062B\u0629<br/>2nd and 3rd term total</th>` : ""}
            <th>\u0648\u0633\u0637\u0649 \u0627\u0644\u062F\u0631\u062C\u0627\u062A<br/>Average marks</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
          <tr class="total-row">
            <td class="subject-name">\u0627\u0644\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0643\u0644\u064A : TOTAL</td>
            <td></td><td></td>
            <td></td>
            ${showCascadeColumns ? `<td></td><td></td>` : ""}
            <td>${overallTotal}</td>
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
                <td class="cum-label">${resultMode === "current_only" ? "TERM AVERAGE" : "CUMULATIVE AVERAGE"}</td>
                <td class="cum-val">${safeCumulative ?? "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="bottom-box">
          <div class="row"><div class="label">\u0627\u0644\u0646\u0633\u0628\u0629 \u0627\u0644\u0645\u0626\u0648\u064A\u0629<br/>PERCENTAGE</div><div class="val">${overallPercentage}%</div></div>
          <div class="row">
            <div class="label">\u0627\u0644\u062A\u0642\u062F\u064A\u0631<br/>GRADE</div>
            <div class="val">
              ${displayRemark}-
              ${displayRemarkArabic ? `<span class="arabic" style="margin-left: 6px; font-family: 'Amiri', 'Traditional Arabic', serif;" dir="rtl">${displayRemarkArabic}</span>` : ""}
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
var buildSheetHtml = (data) => {
  if (data.isElementary === true || data.classCategory === "elementary" || isElementaryClass(data.student.class, data.classCategory)) {
    return buildElementarySheetHtml(data);
  }
  return buildSecondarySheetHtml(data);
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
var cachedBrowser = null;
var getBrowser = async () => {
  if (cachedBrowser && cachedBrowser.connected) {
    return cachedBrowser;
  }
  const puppeteer = await import("puppeteer");
  cachedBrowser = await puppeteer.default.launch(launchOptions);
  cachedBrowser.on("disconnected", () => {
    cachedBrowser = null;
  });
  return cachedBrowser;
};
var generateSingleReportCardPdf = async (data) => {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
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
      await page.close();
    }
  } catch (err) {
    console.warn("Puppeteer PDF generation not available in current environment, falling back to HTML print rendering:", err.message);
    return null;
  }
};
var generateBulkReportCardPdf = async (dataList) => {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
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
      await page.close();
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
    const { student: studentId, term, gradingScale, format, classCategory, isElementary: qIsElem } = req.query;
    if (!studentId || !term) {
      return res.status(400).json({ message: "student and term are required" });
    }
    const studentDoc = await Student_default.findById(studentId).select("class branch");
    if (!studentDoc) return res.status(404).json({ message: "Student not found" });
    let cls = null;
    if (studentDoc.class) {
      cls = await Class_default.findById(studentDoc.class);
      if (isClassGraduatingDoc(cls) && !isSuperAdmin(req)) {
        return res.status(403).json({
          message: "Forbidden: Graduating class report cards are restricted to Super Admin."
        });
      }
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (studentDoc.branch && studentDoc.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Student is not in your branch" });
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const isAssigned = (teacher?.classes || []).some((c) => c.toString() === studentDoc.class.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: "Forbidden: You are not assigned to this student's class" });
      }
    }
    let isClassElementary = false;
    if (cls) {
      isClassElementary = cls.category === "elementary" || isElementaryClass(cls.name, cls.category) || isElementaryClass(cls.name);
    }
    const reportData = await buildReportCardData(
      studentId,
      term,
      gradingScale
    );
    if (!reportData) return res.status(404).json({ message: "Report card data not found" });
    if (isClassElementary || classCategory === "elementary" || qIsElem === "true" || reportData.isElementary === true || reportData.classCategory === "elementary" || isElementaryClass(reportData.student?.class)) {
      reportData.isElementary = true;
      reportData.classCategory = "elementary";
    }
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
    const { class: classId, term, gradingScale, format, classCategory, isElementary: qIsElem } = req.query;
    if (!classId || !term) {
      return res.status(400).json({ message: "class and term are required" });
    }
    const cls = await Class_default.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (isClassGraduatingDoc(cls) && !isSuperAdmin(req)) {
      return res.status(403).json({
        message: "Forbidden: Graduating class report cards are restricted to Super Admin."
      });
    }
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (cls.branch && cls.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Class does not belong to your branch" });
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const isAssigned = (teacher?.classes || []).some((c) => c.toString() === classId.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: "Forbidden: You are not assigned to this class" });
      }
    }
    const isClassElementary = cls.category === "elementary" || classCategory === "elementary" || qIsElem === "true" || isElementaryClass(cls.name, cls.category) || isElementaryClass(cls.name);
    const students = await Student_default.find({ class: classId, status: "active" }).sort({ numberInClass: 1 });
    if (students.length === 0) {
      return res.status(404).json({ message: "No students found in this class" });
    }
    const termDoc = await Term_default.findById(term);
    if (!termDoc) return res.status(404).json({ message: "Term not found" });
    if (isClassElementary && classId) {
      await ensureElementarySubjectsForClass(classId.toString());
    }
    const [
      positionMap,
      subjects,
      allTermsInSession,
      priorTerms,
      totalStudentsInClass,
      gradingScaleDoc,
      attSettingClass,
      attSettingBranch,
      attSettingGlobal,
      templateSetting
    ] = await Promise.all([
      getClassCumulativePositions(classId.toString(), term.toString()),
      Subject_default.find({ class: classId }).sort({ order: 1, nameEnglish: 1 }),
      Term_default.find({ session: termDoc.session }).sort({ termNumber: 1 }),
      Term_default.find({ session: termDoc.session, termNumber: { $lte: termDoc.termNumber } }).sort({ termNumber: 1 }),
      Student_default.countDocuments({ class: classId }),
      gradingScale && gradingScale !== "undefined" ? GradingScale_default.findById(gradingScale) : await GradingScale_default.findOne({ name: "\u0627\u0644\u062A\u0642\u062F\u064A\u0631" }) || await GradingScale_default.findOne(),
      AttendanceSetting_default.findOne({ class: classId, term }),
      cls.branch ? AttendanceSetting_default.findOne({ branch: cls.branch, term, class: { $exists: false } }) : null,
      AttendanceSetting_default.findOne({ term, class: { $exists: false }, branch: { $exists: false } }),
      ReportCardSetting_default.findOne()
    ]);
    const sharedContext = {
      positionMap,
      subjects,
      allTermsInSession,
      priorTerms,
      totalStudentsInClass,
      gradingScale: gradingScaleDoc,
      currentTerm: termDoc,
      attSettingClass,
      attSettingBranch,
      attSettingGlobal,
      templateSetting
    };
    const chunkSize = 10;
    const reportDataList = [];
    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map(
          (student) => buildReportCardData(
            student._id.toString(),
            term,
            gradingScale,
            sharedContext
          )
        )
      );
      for (const data of results) {
        if (data) {
          if (isClassElementary) {
            data.isElementary = true;
            data.classCategory = "elementary";
          }
          reportDataList.push(data);
        }
      }
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
init_Class();
init_Subject();
init_Student();
init_Score();
init_User();
var getDashboard = async (req, res) => {
  try {
    const { term, branch } = req.query;
    if (!term) {
      return res.status(400).json({ message: "term is required" });
    }
    const termDoc = await Term_default.findById(term);
    const currentTermNum = termDoc?.termNumber || 1;
    const userIsSuperAdmin = isSuperAdmin(req);
    const gradClassIds = userIsSuperAdmin ? [] : await getAllGraduatingClassIds();
    const classFilter = {};
    if (req.user?.role === "branch_admin" && req.user.branch) {
      classFilter.branch = req.user.branch;
      if (gradClassIds.length > 0) classFilter._id = { $nin: gradClassIds };
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const allowed = (teacher?.classes || []).map((c) => c.toString()).filter((cid) => !gradClassIds.includes(cid));
      classFilter._id = { $in: allowed };
    } else if (req.user?.role === "subject_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const teacherClassIds = (teacher?.classes || []).map((c) => c.toString());
      const teacherSubjectIds = teacher?.subjects || [];
      let subjectClassIds = [];
      if (teacherSubjectIds.length > 0) {
        const subjs = await Subject_default.find({ _id: { $in: teacherSubjectIds } }).select("class");
        subjectClassIds = subjs.filter((s) => s.class).map((s) => s.class.toString());
      }
      const allowedClassIds = Array.from(/* @__PURE__ */ new Set([...teacherClassIds, ...subjectClassIds])).filter(
        (cid) => !gradClassIds.includes(cid)
      );
      classFilter._id = { $in: allowedClassIds };
    } else {
      if (branch) classFilter.branch = branch;
      if (!userIsSuperAdmin && gradClassIds.length > 0) {
        classFilter._id = { $nin: gradClassIds };
      }
    }
    const classes = await Class_default.find(classFilter).populate("branch", "name");
    const classIds = classes.map((c) => c._id);
    const classSummaries = await Promise.all(
      classes.map(async (cls) => {
        const rawStudents = await Student_default.find({
          class: cls._id,
          status: { $nin: ["graduated", "transferred", "archived"] }
        });
        const students = rawStudents.filter((s) => {
          if (s.enrolledTerms && s.enrolledTerms.length > 0) {
            return s.enrolledTerms.includes(currentTermNum);
          }
          if (s.joinedTerm) {
            return currentTermNum >= s.joinedTerm;
          }
          return true;
        });
        const subjects = await Subject_default.find({ class: cls._id });
        let expectedScoreCount = 0;
        students.forEach((st) => {
          const excluded = new Set((st.excludedSubjects || []).map((id) => id.toString()));
          expectedScoreCount += subjects.filter((sb) => !excluded.has(sb._id.toString())).length;
        });
        const actualScoreCount = await Score_default.countDocuments({
          student: { $in: students.map((s) => s._id) },
          subject: { $in: subjects.map((s) => s._id) },
          term
        });
        const subjectCompletion = await Promise.all(
          subjects.map(async (subject) => {
            const offeringStudents = students.filter(
              (st) => !(st.excludedSubjects || []).some((id) => id.toString() === subject._id.toString())
            );
            const entered = await Score_default.countDocuments({
              student: { $in: offeringStudents.map((s) => s._id) },
              subject: subject._id,
              term
            });
            return {
              subject: subject._id,
              nameEnglish: subject.nameEnglish,
              entered,
              expected: offeringStudents.length,
              complete: entered === offeringStudents.length
            };
          })
        );
        return {
          class: cls._id,
          className: cls.name + (cls.arm ? ` ${cls.arm}` : ""),
          branch: cls.branch?.name,
          isGraduating: Boolean(cls.isGraduating),
          studentCount: students.length,
          subjectCount: subjects.length,
          expectedScoreCount,
          actualScoreCount,
          percentComplete: expectedScoreCount > 0 ? Math.round(actualScoreCount / expectedScoreCount * 100) : 0,
          subjectCompletion
        };
      })
    );
    const studentFilter = {
      status: { $nin: ["graduated", "transferred", "archived"] },
      class: { $in: classIds }
    };
    if (req.user?.role === "branch_admin" && req.user.branch) {
      studentFilter.branch = req.user.branch;
    } else if (branch) {
      studentFilter.branch = branch;
    }
    const fetchedStudents = await Student_default.find(studentFilter);
    const allStudents = fetchedStudents.filter((s) => {
      if (s.enrolledTerms && s.enrolledTerms.length > 0) {
        return s.enrolledTerms.includes(currentTermNum);
      }
      if (s.joinedTerm) {
        return currentTermNum >= s.joinedTerm;
      }
      return true;
    });
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
init_User();
init_Student();
import mongoose20 from "mongoose";
init_Class();
var getAllLinkedStudentIds = async (userId) => {
  const user = await User_default.findById(userId);
  if (!user) return [];
  const ids = [];
  if (user.linkedStudent) ids.push(user.linkedStudent.toString());
  if (Array.isArray(user.linkedStudents)) {
    user.linkedStudents.forEach((s) => {
      const sId = s.toString();
      if (!ids.includes(sId)) ids.push(sId);
    });
  }
  return ids;
};
var getMyChildren = async (req, res) => {
  try {
    const studentIds = await getAllLinkedStudentIds(req.user.id);
    if (studentIds.length === 0) {
      return res.status(200).json([]);
    }
    const gradClassIds = await getAllGraduatingClassIds();
    const students = await Student_default.find({
      _id: { $in: studentIds },
      ...gradClassIds.length > 0 ? { class: { $nin: gradClassIds } } : {}
    }).populate("class", "name arm").populate("branch", "name");
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var linkChild = async (req, res) => {
  try {
    const { identifier, classId } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: "Admission Number, Student ID, or Name is required" });
    }
    const query = identifier.trim();
    let student = null;
    if (mongoose20.Types.ObjectId.isValid(query)) {
      student = await Student_default.findById(query);
    }
    if (!student) {
      student = await Student_default.findOne({
        $or: [
          { admissionNumber: { $regex: `^${query}$`, $options: "i" } },
          { studentCode: { $regex: `^${query}$`, $options: "i" } }
        ]
      });
    }
    if (!student) {
      const nameFilter = { name: { $regex: query, $options: "i" } };
      if (classId) nameFilter.class = classId;
      student = await Student_default.findOne(nameFilter);
    }
    if (!student) {
      return res.status(404).json({
        message: "No student matching the provided Admission Number or Name was found."
      });
    }
    const cls = await Class_default.findById(student.class);
    if (isClassGraduatingDoc(cls)) {
      return res.status(403).json({
        message: "Graduating class records are restricted to school administration."
      });
    }
    const user = await User_default.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Parent account not found" });
    const studentIdStr = student._id.toString();
    const existingList = (user.linkedStudents || []).map((s) => s.toString());
    if (existingList.includes(studentIdStr) || user.linkedStudent?.toString() === studentIdStr) {
      return res.status(400).json({ message: "This student is already linked to your account." });
    }
    if (!user.linkedStudent) {
      user.linkedStudent = student._id;
    }
    const updatedList = Array.from(/* @__PURE__ */ new Set([...existingList, studentIdStr]));
    user.linkedStudents = updatedList;
    await user.save();
    const populatedStudent = await Student_default.findById(student._id).populate("class", "name arm").populate("branch", "name");
    res.status(200).json({
      message: `Child ${student.name} linked successfully!`,
      student: populatedStudent
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getMyChildReportCard = async (req, res) => {
  try {
    const { term, gradingScale, studentId: requestedStudentId } = req.query;
    if (!term) return res.status(400).json({ message: "term is required" });
    const linkedStudentIds = await getAllLinkedStudentIds(req.user.id);
    if (linkedStudentIds.length === 0) {
      return res.status(403).json({ message: "No student linked to this account" });
    }
    let targetStudentId = linkedStudentIds[0];
    if (requestedStudentId) {
      if (!linkedStudentIds.includes(requestedStudentId)) {
        return res.status(403).json({ message: "You are not authorized to view this student's report card" });
      }
      targetStudentId = requestedStudentId;
    }
    const studentDoc = await Student_default.findById(targetStudentId).select("class");
    if (studentDoc?.class) {
      const cls = await Class_default.findById(studentDoc.class);
      if (isClassGraduatingDoc(cls)) {
        return res.status(403).json({ message: "Graduating class results are restricted to school administration." });
      }
    }
    if (!await isStudentResultPublished(targetStudentId, term)) {
      return res.status(403).json({ message: "This report card has not been published yet" });
    }
    const data = await buildReportCardData(targetStudentId, term, gradingScale);
    if (!data) return res.status(404).json({ message: "Report card not found" });
    let isClassElementary = false;
    if (studentDoc?.class) {
      const cls = await Class_default.findById(studentDoc.class);
      if (cls) {
        isClassElementary = cls.category === "elementary" || isElementaryClass(cls.name, cls.category) || isElementaryClass(cls.name);
      }
    }
    if (isClassElementary || data.isElementary === true || data.classCategory === "elementary" || isElementaryClass(data.student?.class)) {
      data.isElementary = true;
      data.classCategory = "elementary";
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var downloadMyChildReportCardPdf = async (req, res) => {
  try {
    const { term, gradingScale, format, studentId: requestedStudentId, classCategory, isElementary: qIsElem } = req.query;
    if (!term) return res.status(400).json({ message: "term is required" });
    const linkedStudentIds = await getAllLinkedStudentIds(req.user.id);
    if (linkedStudentIds.length === 0) {
      return res.status(403).json({ message: "No student linked to this account" });
    }
    let targetStudentId = linkedStudentIds[0];
    if (requestedStudentId) {
      if (!linkedStudentIds.includes(requestedStudentId)) {
        return res.status(403).json({ message: "You are not authorized to view this student's report card" });
      }
      targetStudentId = requestedStudentId;
    }
    const studentDoc = await Student_default.findById(targetStudentId).select("class");
    if (studentDoc?.class) {
      const cls = await Class_default.findById(studentDoc.class);
      if (isClassGraduatingDoc(cls)) {
        return res.status(403).json({ message: "Graduating class results are restricted to school administration." });
      }
    }
    if (!await isStudentResultPublished(targetStudentId, term)) {
      return res.status(403).json({ message: "This report card has not been published yet" });
    }
    const data = await buildReportCardData(targetStudentId, term, gradingScale);
    if (!data) return res.status(404).json({ message: "Report card not found" });
    let isClassElementary = false;
    if (studentDoc?.class) {
      const cls = await Class_default.findById(studentDoc.class);
      if (cls) {
        isClassElementary = cls.category === "elementary" || isElementaryClass(cls.name, cls.category) || isElementaryClass(cls.name);
      }
    }
    if (isClassElementary || classCategory === "elementary" || qIsElem === "true" || data.isElementary === true || data.classCategory === "elementary" || isElementaryClass(data.student?.class)) {
      data.isElementary = true;
      data.classCategory = "elementary";
    }
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
router12.get("/children", protect, authorize("parent"), getMyChildren);
router12.post("/link-child", protect, authorize("parent"), linkChild);
router12.get("/report-card", protect, authorize("parent"), getMyChildReportCard);
router12.get("/report-card/pdf", protect, authorize("parent"), downloadMyChildReportCardPdf);
router12.get("/terms", protect, authorize("parent"), getAvailableTerms);
var parentPortalRoutes_default = router12;

// server/routes/termRoutes.ts
import { Router as Router13 } from "express";

// server/controllers/termController.ts
init_AttendanceSetting();
var createTerm = async (req, res) => {
  try {
    const { session, termNumber, isActive, timesSchoolOpened, dateResumed, dateClosed, nextResumption } = req.body;
    if (isActive) {
      await Term_default.updateMany({ session }, { isActive: false });
    }
    const timesOpened = timesSchoolOpened !== void 0 && timesSchoolOpened !== null && timesSchoolOpened !== "" ? Number(timesSchoolOpened) : null;
    const term = await Term_default.create({
      session,
      termNumber,
      isActive: !!isActive,
      timesSchoolOpened: timesOpened,
      dateResumed: dateResumed?.trim() || "",
      dateClosed: dateClosed?.trim() || "",
      nextResumption: nextResumption?.trim() || ""
    });
    await AttendanceSetting_default.findOneAndUpdate(
      { term: term._id, class: { $exists: false }, branch: { $exists: false } },
      {
        timesSchoolOpened: timesOpened,
        dateResumed: term.dateResumed,
        dateClosed: term.dateClosed,
        nextResumption: term.nextResumption,
        updatedBy: req.user?.id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const Branch = (await Promise.resolve().then(() => (init_Branch(), Branch_exports))).default;
    const allBranches = await Branch.find();
    for (const b of allBranches) {
      await AttendanceSetting_default.findOneAndUpdate(
        { term: term._id, branch: b._id, class: { $exists: false } },
        {
          timesSchoolOpened: timesOpened,
          dateResumed: term.dateResumed,
          dateClosed: term.dateClosed,
          nextResumption: term.nextResumption,
          updatedBy: req.user?.id
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    res.status(201).json(term);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getTerms = async (_req, res) => {
  try {
    const terms = await Term_default.find().sort({ session: -1, termNumber: -1 });
    const enriched = await Promise.all(
      terms.map(async (t) => {
        const obj = t.toObject();
        if (!obj.nextResumption || !obj.dateResumed || obj.timesSchoolOpened === null || obj.timesSchoolOpened === void 0) {
          const setting = await AttendanceSetting_default.findOne({
            term: t._id,
            $or: [
              { nextResumption: { $exists: true, $ne: "" } },
              { dateResumed: { $exists: true, $ne: "" } },
              { timesSchoolOpened: { $exists: true, $ne: null } }
            ]
          });
          if (setting) {
            if (!obj.nextResumption && setting.nextResumption) obj.nextResumption = setting.nextResumption;
            if (!obj.dateResumed && setting.dateResumed) obj.dateResumed = setting.dateResumed;
            if (!obj.dateClosed && setting.dateClosed) obj.dateClosed = setting.dateClosed;
            if ((obj.timesSchoolOpened === null || obj.timesSchoolOpened === void 0) && setting.timesSchoolOpened !== null && setting.timesSchoolOpened !== void 0) {
              obj.timesSchoolOpened = setting.timesSchoolOpened;
            }
          }
        }
        return obj;
      })
    );
    res.status(200).json(enriched);
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
var updateTermCalendar = async (req, res) => {
  try {
    const { timesSchoolOpened, dateResumed, dateClosed, nextResumption } = req.body;
    const term = await Term_default.findById(req.params.id);
    if (!term) return res.status(404).json({ message: "Term not found" });
    const timesOpened = timesSchoolOpened !== void 0 && timesSchoolOpened !== null && timesSchoolOpened !== "" ? Number(timesSchoolOpened) : null;
    term.timesSchoolOpened = timesOpened;
    term.dateResumed = dateResumed !== void 0 ? dateResumed?.trim() || "" : term.dateResumed;
    term.dateClosed = dateClosed !== void 0 ? dateClosed?.trim() || "" : term.dateClosed;
    term.nextResumption = nextResumption !== void 0 ? nextResumption?.trim() || "" : term.nextResumption;
    await term.save();
    const Branch = (await Promise.resolve().then(() => (init_Branch(), Branch_exports))).default;
    const allBranches = await Branch.find();
    await AttendanceSetting_default.findOneAndUpdate(
      { term: term._id, class: { $exists: false }, branch: { $exists: false } },
      {
        timesSchoolOpened: term.timesSchoolOpened,
        dateResumed: term.dateResumed,
        dateClosed: term.dateClosed,
        nextResumption: term.nextResumption,
        updatedBy: req.user?.id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    for (const b of allBranches) {
      await AttendanceSetting_default.findOneAndUpdate(
        { term: term._id, branch: b._id, class: { $exists: false } },
        {
          timesSchoolOpened: term.timesSchoolOpened,
          dateResumed: term.dateResumed,
          dateClosed: term.dateClosed,
          nextResumption: term.nextResumption,
          updatedBy: req.user?.id
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    await AttendanceSetting_default.updateMany(
      { term: term._id },
      {
        timesSchoolOpened: term.timesSchoolOpened,
        dateResumed: term.dateResumed,
        dateClosed: term.dateClosed,
        nextResumption: term.nextResumption
      }
    );
    res.status(200).json({
      message: "Term calendar & resumption dates updated school-wide across all branches",
      term
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/termRoutes.ts
var router13 = Router13();
router13.post("/", protect, authorize("super_admin", "branch_admin"), createTerm);
router13.get("/", protect, getTerms);
router13.put("/:id/activate", protect, authorize("super_admin"), setActiveTerm);
router13.put("/:id/calendar", protect, authorize("super_admin", "branch_admin"), updateTermCalendar);
var termRoutes_default = router13;

// server/routes/userRoutes.ts
import { Router as Router14 } from "express";

// server/controllers/userController.ts
init_User();
init_Branch();
init_Class();
init_Subject();
init_Student();
import bcrypt2 from "bcryptjs";
var generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
var autoSyncTeacherBranches = async () => {
  try {
    const teachers = await User_default.find({
      role: { $in: ["class_teacher", "subject_teacher"] },
      $or: [{ branch: { $exists: false } }, { branch: null }]
    });
    for (const t of teachers) {
      let targetBranch = null;
      if (t.classes && t.classes.length > 0) {
        const cls = await Class_default.findOne({ _id: { $in: t.classes } });
        if (cls && cls.branch) {
          targetBranch = cls.branch;
        }
      }
      if (!targetBranch && t.subjects && t.subjects.length > 0) {
        const sub = await Subject_default.findOne({ _id: { $in: t.subjects } }).populate("class");
        if (sub && sub.class?.branch) {
          targetBranch = sub.class.branch;
        }
      }
      if (targetBranch) {
        t.branch = targetBranch;
        await t.save();
        console.log(`[AutoSync] Associated teacher ${t.name} (${t.email}) with branch ${targetBranch}`);
      }
    }
  } catch (err) {
    console.error("[AutoSync] Error syncing teacher branches:", err);
  }
};
var userBelongsToBranch = async (user, branchId) => {
  if (user.branch && user.branch.toString() === branchId.toString()) return true;
  if (user.classes && user.classes.length > 0) {
    const matchingClass = await Class_default.findOne({
      _id: { $in: user.classes },
      branch: branchId
    });
    if (matchingClass) return true;
  }
  if (user.subjects && user.subjects.length > 0) {
    const matchingSubject = await Subject_default.findOne({
      _id: { $in: user.subjects }
    }).populate("class");
    if (matchingSubject && matchingSubject.class?.branch?.toString() === branchId.toString()) {
      return true;
    }
  }
  if (!user.branch) {
    if ((!user.classes || user.classes.length === 0) && (!user.subjects || user.subjects.length === 0)) {
      return true;
    }
  }
  return false;
};
var getUsers = async (req, res) => {
  try {
    autoSyncTeacherBranches().catch(() => {
    });
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) {
      filter.status = req.query.status;
    } else {
      filter.status = { $ne: "pending_approval" };
    }
    let branchId = req.user?.role === "branch_admin" ? req.user.branch : req.query.branch;
    if (req.user?.role === "branch_admin" && !branchId) {
      const userDoc = await User_default.findById(req.user.id).select("branch");
      if (userDoc?.branch) branchId = userDoc.branch.toString();
    }
    if (branchId) {
      const branchClasses = await Class_default.find({ branch: branchId }).select("_id");
      const branchClassIds = branchClasses.map((c) => c._id);
      const branchSubjects = await Subject_default.find({ class: { $in: branchClassIds } }).select("_id");
      const branchSubjectIds = branchSubjects.map((s) => s._id);
      const branchStudents = await Student_default.find({ class: { $in: branchClassIds } }).select("_id");
      const branchStudentIds = branchStudents.map((s) => s._id);
      const otherClasses = await Class_default.find({ branch: { $ne: branchId } }).select("_id");
      const otherClassIds = otherClasses.map((c) => c._id);
      const otherSubjects = await Subject_default.find({ class: { $in: otherClassIds } }).select("_id");
      const otherSubjectIds = otherSubjects.map((s) => s._id);
      const branchScopeCondition = {
        $or: [
          { branch: branchId },
          { classes: { $in: branchClassIds } },
          { subjects: { $in: branchSubjectIds } },
          { linkedStudent: { $in: branchStudentIds } },
          { linkedStudents: { $in: branchStudentIds } },
          {
            role: { $in: ["class_teacher", "subject_teacher"] },
            branch: { $in: [null, void 0] },
            classes: { $nin: otherClassIds },
            subjects: { $nin: otherSubjectIds }
          }
        ]
      };
      const conditions = [branchScopeCondition];
      if (filter.role) conditions.push({ role: filter.role });
      if (filter.status) conditions.push({ status: filter.status });
      filter.$and = conditions;
      delete filter.role;
      delete filter.status;
    }
    const users = await User_default.find(filter).select("-password").populate("branch", "name").populate({
      path: "classes",
      select: "name arm branch",
      populate: { path: "branch", select: "name" }
    }).populate({
      path: "subjects",
      select: "nameEnglish nameArabic class",
      populate: {
        path: "class",
        select: "name arm branch",
        populate: { path: "branch", select: "name" }
      }
    }).populate("linkedStudent", "name admissionNumber").populate("linkedStudents", "name admissionNumber").sort({ createdAt: -1, name: 1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getPendingTeachers = async (req, res) => {
  try {
    const filter = { status: "pending_approval" };
    if (req.user?.role === "branch_admin" && req.user.branch) {
      filter.$or = [
        { branch: req.user.branch },
        { branch: { $in: [null, void 0] } }
      ];
    }
    const pending = await User_default.find(filter).select("-password").populate("branch", "name").sort({ createdAt: -1 });
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var approveTeacher = async (req, res) => {
  try {
    const { role, branch, classes, subjects } = req.body;
    const user = await User_default.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Teacher applicant not found" });
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (user.branch && user.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Teacher does not belong to your branch" });
      }
    }
    if (!isSuperAdmin(req)) {
      const gradIds = await getAllGraduatingClassIds();
      if (gradIds.length > 0) {
        if (Array.isArray(classes) && classes.some((cid) => gradIds.includes(cid.toString()))) {
          return res.status(403).json({
            message: "Forbidden: Only Super Admin can assign graduating classes."
          });
        }
        if (Array.isArray(subjects) && subjects.length > 0) {
          const hasGradSubj = await Subject_default.exists({
            _id: { $in: subjects },
            class: { $in: gradIds }
          });
          if (hasGradSubj) {
            return res.status(403).json({
              message: "Forbidden: Only Super Admin can assign graduating class subjects."
            });
          }
        }
      }
    }
    user.status = "active";
    user.rejectionReason = void 0;
    if (role) user.role = role;
    if (req.user?.role === "branch_admin" && req.user.branch) {
      user.branch = req.user.branch;
    } else if (branch) {
      user.branch = branch;
    }
    if (Array.isArray(classes)) user.classes = classes;
    if (Array.isArray(subjects)) user.subjects = subjects;
    await user.save();
    const updated = await User_default.findById(user._id).select("-password").populate("branch", "name").populate("classes", "name arm branch").populate("subjects", "nameEnglish nameArabic class");
    res.status(200).json({
      message: `Teacher ${user.name} has been approved and activated successfully.`,
      user: updated
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var rejectTeacher = async (req, res) => {
  try {
    const { reason, deletePermanently } = req.body;
    const user = await User_default.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Teacher applicant not found" });
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (user.branch && user.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({ message: "Forbidden: Teacher does not belong to your branch" });
      }
    }
    if (deletePermanently) {
      await User_default.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Teacher application deleted." });
    }
    user.status = "rejected";
    user.rejectionReason = reason || "Application declined by school administration.";
    await user.save();
    res.status(200).json({ message: "Teacher application rejected.", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var bulkCreateStaff = async (req, res) => {
  try {
    const { staffList, defaultBranch } = req.body;
    if (!Array.isArray(staffList) || staffList.length === 0) {
      return res.status(400).json({ message: "staffList array is required" });
    }
    const allBranches = await Branch_default.find();
    const branchMapByName = {};
    allBranches.forEach((b) => {
      branchMapByName[b.name.toLowerCase().trim()] = b._id.toString();
    });
    const results = {
      success: [],
      errors: []
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
      let email = rawEmail.toLowerCase();
      if (!email) {
        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const rand = Math.floor(100 + Math.random() * 900);
        email = `${cleanName || "staff"}${rand}@iais.edu.ng`;
      }
      const existingUser = await User_default.findOne({ email });
      if (existingUser) {
        results.errors.push({ row: rowNum, name, email, error: `Email ${email} is already registered` });
        continue;
      }
      let role = "class_teacher";
      if (roleRaw.includes("subject") || roleRaw === "subject_teacher") {
        role = "subject_teacher";
      } else if (roleRaw.includes("branch") || roleRaw === "branch_admin") {
        role = "branch_admin";
      } else if (roleRaw.includes("super") || roleRaw === "super_admin") {
        role = "super_admin";
      }
      let branchId = defaultBranch || req.body.defaultBranchId || void 0;
      if (req.user?.role === "branch_admin" && req.user.branch) {
        branchId = req.user.branch;
      } else if (branchRaw) {
        const matched = branchMapByName[branchRaw.toLowerCase()];
        if (matched) branchId = matched;
      }
      const rawPassword = customPassword || generatePassword();
      const hashedPassword = await bcrypt2.hash(rawPassword, 10);
      const newUser = await User_default.create({
        name,
        email,
        phone: phone || void 0,
        password: hashedPassword,
        role,
        branch: branchId,
        status: "active",
        mustChangePassword: true
      });
      const branchObj = allBranches.find((b) => b._id.toString() === branchId?.toString());
      results.success.push({
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        branchName: branchObj ? branchObj.name : "All Campuses",
        initialPassword: rawPassword
      });
    }
    res.status(201).json({
      message: `Successfully created ${results.success.length} staff account(s).`,
      results
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var getStaffCode = async (req, res) => {
  try {
    let settings = await ReportCardSetting_default.findOne();
    if (!settings) {
      settings = await ReportCardSetting_default.create({});
    }
    res.status(200).json({
      staffRegistrationCode: settings.staffRegistrationCode || "STAFF-2026"
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var updateStaffCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Staff registration code cannot be empty" });
    }
    let settings = await ReportCardSetting_default.findOne();
    if (!settings) {
      settings = await ReportCardSetting_default.create({ staffRegistrationCode: code.trim() });
    } else {
      settings.staffRegistrationCode = code.trim();
      await settings.save();
    }
    res.status(200).json({
      message: "Staff registration passcode updated successfully",
      staffRegistrationCode: settings.staffRegistrationCode
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, status, branch, classes, subjects, linkedStudent, linkedStudents, password } = req.body;
    const user = await User_default.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (user.role === "super_admin") {
        return res.status(403).json({ message: "Forbidden: Cannot modify super admin accounts" });
      }
      const belongs = await userBelongsToBranch(user, req.user.branch);
      if (!belongs) {
        return res.status(403).json({ message: "Forbidden: User does not belong to your branch" });
      }
      if (role === "super_admin" || role === "branch_admin") {
        return res.status(403).json({ message: "Forbidden: Cannot grant administrator roles" });
      }
    }
    if (!isSuperAdmin(req)) {
      const gradIds = await getAllGraduatingClassIds();
      if (gradIds.length > 0) {
        if (Array.isArray(classes) && classes.some((cid) => gradIds.includes(cid.toString()))) {
          return res.status(403).json({
            message: "Forbidden: Only Super Admin can assign graduating classes."
          });
        }
        if (Array.isArray(subjects) && subjects.length > 0) {
          const hasGradSubj = await Subject_default.exists({
            _id: { $in: subjects },
            class: { $in: gradIds }
          });
          if (hasGradSubj) {
            return res.status(403).json({
              message: "Forbidden: Only Super Admin can assign graduating class subjects."
            });
          }
        }
      }
    }
    if (email && email.toLowerCase().trim() !== user.email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existing = await User_default.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ message: "Email already in use by another user" });
      }
      user.email = normalizedEmail;
    }
    if (name) user.name = name.trim();
    if (phone !== void 0) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;
    let finalBranch = branch;
    if (req.user?.role === "branch_admin" && req.user.branch) {
      finalBranch = req.user.branch;
    } else if (!finalBranch && Array.isArray(classes) && classes.length > 0) {
      const cls = await Class_default.findOne({ _id: { $in: classes } }).select("branch");
      if (cls && cls.branch) finalBranch = cls.branch;
    } else if (!finalBranch && Array.isArray(subjects) && subjects.length > 0) {
      const sub = await Subject_default.findOne({ _id: { $in: subjects } }).populate("class");
      if (sub && sub.class?.branch) finalBranch = sub.class.branch;
    }
    if (finalBranch) {
      user.branch = finalBranch;
    } else if (branch !== void 0) {
      user.branch = branch || void 0;
    }
    user.classes = classes || [];
    user.subjects = subjects || [];
    user.linkedStudent = linkedStudent || void 0;
    if (Array.isArray(linkedStudents)) {
      user.linkedStudents = linkedStudents;
    }
    if (password && typeof password === "string" && password.trim().length >= 6) {
      user.password = await bcrypt2.hash(password.trim(), 10);
      user.mustChangePassword = false;
    }
    await user.save();
    const updated = await User_default.findById(user._id).select("-password").populate("branch", "name").populate("classes", "name arm branch").populate("subjects", "nameEnglish nameArabic class").populate("linkedStudent", "name admissionNumber").populate("linkedStudents", "name admissionNumber");
    res.status(200).json({ message: "User updated successfully", user: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var resetUserPassword = async (req, res) => {
  try {
    const { newPassword: customPassword } = req.body || {};
    const user = await User_default.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (user.role === "super_admin") {
        return res.status(403).json({ message: "Forbidden: Cannot reset super admin password" });
      }
      const belongs = await userBelongsToBranch(user, req.user.branch);
      if (!belongs) {
        return res.status(403).json({ message: "Forbidden: User does not belong to your branch" });
      }
    }
    const newPassword = typeof customPassword === "string" && customPassword.trim().length >= 6 ? customPassword.trim() : generatePassword();
    user.password = await bcrypt2.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();
    res.status(200).json({
      message: `Password for ${user.name} has been updated successfully`,
      newPassword
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var deleteUser = async (req, res) => {
  try {
    const user = await User_default.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (req.user?.role === "branch_admin" && req.user.branch) {
      if (user.role === "super_admin") {
        return res.status(403).json({ message: "Forbidden: Cannot delete super admin" });
      }
      const belongs = await userBelongsToBranch(user, req.user.branch);
      if (!belongs) {
        return res.status(403).json({ message: "Forbidden: User does not belong to your branch" });
      }
    }
    await User_default.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/userRoutes.ts
var router14 = Router14();
router14.get("/staff-code", protect, authorize("super_admin", "branch_admin"), getStaffCode);
router14.put("/staff-code", protect, authorize("super_admin"), updateStaffCode);
router14.get("/pending-teachers", protect, authorize("super_admin", "branch_admin"), getPendingTeachers);
router14.put("/:id/approve", protect, authorize("super_admin", "branch_admin"), approveTeacher);
router14.put("/:id/reject", protect, authorize("super_admin", "branch_admin"), rejectTeacher);
router14.post("/bulk", protect, authorize("super_admin", "branch_admin"), bulkCreateStaff);
router14.post("/bulk-staff", protect, authorize("super_admin", "branch_admin"), bulkCreateStaff);
router14.get("/", protect, authorize("super_admin", "branch_admin"), getUsers);
router14.put("/:id", protect, authorize("super_admin", "branch_admin"), updateUser);
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

// server/controllers/reportCardRemarkController.ts
init_ReportCardRemark();
init_Student();
init_User();

// server/constants/reportCardComments.ts
var REPORT_CARD_COMMENTS = [
  { id: "c1", en: "Outstanding performance. Keep up the excellent work.", ar: "\u0623\u062F\u0627\u0621 \u0645\u062A\u0645\u064A\u0632 \u0648\u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A\u060C \u0648\u0627\u0635\u0644 \u0647\u0630\u0627 \u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F \u0648\u0627\u0644\u062A\u0641\u0648\u0642.", gender: "M", category: "excellence", targetRole: "both" },
  { id: "c2", en: "An exceptional result. Continue striving for excellence.", ar: "\u0646\u062A\u064A\u062C\u0629 \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A\u0629 \u0648\u0631\u0627\u0626\u0639\u0629\u060C \u0648\u0627\u0635\u0644\u064A \u0627\u0644\u0633\u0639\u064A \u0646\u062D\u0648 \u0627\u0644\u062A\u0645\u064A\u0632 \u0648\u0627\u0644\u062A\u0641\u0648\u0642.", gender: "F", category: "excellence", targetRole: "both" },
  { id: "c3", en: "An exceptional result. Continue striving for excellence.", ar: "\u0646\u062A\u064A\u062C\u0629 \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A\u0629 \u0648\u0631\u0627\u0626\u0639\u0629\u060C \u0648\u0627\u0635\u0644 \u0627\u0644\u0633\u0639\u064A \u0646\u062D\u0648 \u0627\u0644\u062A\u0645\u064A\u0632 \u0648\u0627\u0644\u062A\u0641\u0648\u0642.", gender: "M", category: "excellence", targetRole: "both" },
  { id: "c4", en: "A very commendable performance. Keep it up.", ar: "\u0623\u062F\u0627\u0621 \u062C\u062F\u064A\u0631 \u0628\u0627\u0644\u062B\u0646\u0627\u0621 \u0648\u0627\u0644\u062A\u0642\u062F\u064A\u0631\u060C \u0627\u0633\u062A\u0645\u0631 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0639\u0637\u0627\u0621 \u0627\u0644\u0645\u062A\u0645\u064A\u0632.", gender: "M", category: "commendable", targetRole: "both" },
  { id: "c5", en: "A very commendable performance. Keep it up.", ar: "\u0623\u062F\u0627\u0621 \u062C\u062F\u064A\u0631 \u0628\u0627\u0644\u062B\u0646\u0627\u0621 \u0648\u0627\u0644\u062A\u0642\u062F\u064A\u0631\u060C \u0627\u0633\u062A\u0645\u0631\u064A \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0639\u0637\u0627\u0621 \u0627\u0644\u0645\u062A\u0645\u064A\u0632.", gender: "F", category: "commendable", targetRole: "both" },
  { id: "c6", en: "Brilliant academic achievement and dedication to learning.", ar: "\u0625\u0646\u062C\u0627\u0632 \u0623\u0643\u0627\u062F\u064A\u0645\u064A \u0628\u0627\u0647\u0631 \u0648\u062A\u0641\u0627\u0646\u064D \u0645\u0633\u062A\u0645\u0631 \u0641\u064A \u0637\u0644\u0628 \u0627\u0644\u0639\u0644\u0645 \u0648\u0627\u0644\u062A\u0639\u0644\u0645.", gender: "N", category: "excellence", targetRole: "both" },
  { id: "c7", en: "A good performance with room for further improvement.", ar: "\u0623\u062F\u0627\u0621 \u062C\u064A\u062F \u0645\u0639 \u0625\u0645\u0643\u0627\u0646\u064A\u0629 \u062A\u062D\u0642\u064A\u0642 \u062A\u0642\u062F\u0645 \u0623\u0641\u0636\u0644 \u0628\u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062C\u0647\u062F \u0648\u0627\u0644\u0645\u062B\u0627\u0628\u0631\u0629.", gender: "M", category: "progress", targetRole: "both" },
  { id: "c8", en: "Has worked well and should continue to aim higher.", ar: "\u0628\u0630\u0644 \u062C\u0647\u062F\u0627\u064B \u0637\u064A\u0628\u0627\u064B\u060C \u0648\u0639\u0644\u064A\u0647 \u0645\u0648\u0627\u0635\u0644\u0629 \u0627\u0644\u0637\u0645\u0648\u062D \u0644\u062A\u062D\u0642\u064A\u0642 \u0645\u0631\u0627\u062A\u0628 \u0623\u0639\u0644\u0649.", gender: "M", category: "progress", targetRole: "both" },
  { id: "c9", en: "A satisfactory performance. More effort will yield better results.", ar: "\u0623\u062F\u0627\u0621 \u0645\u064F\u0631\u0652\u0636\u064D\u060C \u0648\u0628\u0630\u0644 \u0627\u0644\u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062C\u0647\u062F \u0633\u064A\u062B\u0645\u0631 \u0639\u0646 \u0646\u062A\u0627\u0626\u062C \u0623\u0641\u0636\u0644.", gender: "M", category: "effort", targetRole: "both" },
  { id: "c10", en: "A good performance with room for further improvement.", ar: "\u0623\u062F\u0627\u0621 \u062C\u064A\u062F \u0645\u0639 \u0625\u0645\u0643\u0627\u0646\u064A\u0629 \u062A\u062D\u0642\u064A\u0642 \u062A\u0642\u062F\u0645 \u0623\u0641\u0636\u0644 \u0628\u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062C\u0647\u062F \u0648\u0627\u0644\u0645\u062B\u0627\u0628\u0631\u0629.", gender: "F", category: "progress", targetRole: "both" },
  { id: "c11", en: "A satisfactory performance. More effort will yield better results.", ar: "\u0623\u062F\u0627\u0621 \u0645\u064F\u0631\u0652\u0636\u064D\u060C \u0648\u0628\u0630\u0644 \u0627\u0644\u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062C\u0647\u062F \u0633\u064A\u062B\u0645\u0631 \u0639\u0646 \u0646\u062A\u0627\u0626\u062C \u0623\u0641\u0636\u0644.", gender: "F", category: "effort", targetRole: "both" },
  { id: "c12", en: "Shows potential but needs greater commitment to studies.", ar: "\u064A\u062A\u0645\u062A\u0639 \u0628\u0642\u062F\u0631\u0627\u062A \u0648\u0627\u0639\u062F\u0629 \u0648\u0644\u0643\u0646\u0647 \u064A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u062F\u0631\u0627\u0633\u0629.", gender: "M", category: "effort", targetRole: "both" },
  { id: "c13", en: "Has worked well and should continue to aim higher.", ar: "\u0628\u0630\u0644\u062A \u062C\u0647\u062F\u0627\u064B \u0637\u064A\u0628\u0627\u064B\u060C \u0648\u0639\u0644\u064A\u0647\u0627 \u0645\u0648\u0627\u0635\u0644\u0629 \u0627\u0644\u0637\u0645\u0648\u062D \u0644\u062A\u062D\u0642\u064A\u0642 \u062F\u0631\u062C\u0627\u062A \u0623\u0639\u0644\u0649.", gender: "F", category: "progress", targetRole: "both" },
  { id: "c14", en: "A good performance with room for further improvement.", ar: "\u0623\u062F\u0627\u0621 \u062C\u064A\u062F \u0648\u0645\u0628\u0634\u0631 \u0645\u0639 \u0648\u062C\u0648\u062F \u0641\u0631\u0635\u0629 \u0644\u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062A\u062D\u0633\u0646 \u0648\u0627\u0644\u062A\u0637\u0648\u0631.", gender: "N", category: "progress", targetRole: "both" },
  { id: "c15", en: "Can achieve better results with increased effort and dedication.", ar: "\u0642\u0627\u062F\u0631 \u0639\u0644\u0649 \u062A\u062D\u0642\u064A\u0642 \u0646\u062A\u0627\u0626\u062C \u0623\u0641\u0636\u0644 \u0625\u0630\u0627 \u0632\u0627\u062F \u0645\u0646 \u062C\u0647\u062F\u0647 \u0648\u0645\u062B\u0627\u0628\u0631\u062A\u0647.", gender: "M", category: "effort", targetRole: "both" },
  { id: "c16", en: "An average performance. More focus and hard work are required.", ar: "\u0623\u062F\u0627\u0621 \u0645\u062A\u0648\u0633\u0637\u060C \u0648\u064A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0648\u0627\u0644\u062C\u062F \u0648\u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F.", gender: "M", category: "effort", targetRole: "both" },
  { id: "c17", en: "Shows potential but needs greater commitment to studies.", ar: "\u062A\u062A\u0645\u062A\u0639 \u0628\u0642\u062F\u0631\u0627\u062A \u0648\u0627\u0639\u062F\u0629 \u0648\u0644\u0643\u0646\u0647\u0627 \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u062F\u0631\u0627\u0633\u0629.", gender: "F", category: "effort", targetRole: "both" },
  { id: "c18", en: "Needs to work harder and pay more attention to studies.", ar: "\u064A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0645\u0636\u0627\u0639\u0641\u0629 \u0627\u0644\u062C\u0647\u062F \u0648\u0632\u064A\u0627\u062F\u0629 \u0627\u0644\u0627\u0647\u062A\u0645\u0627\u0645 \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0644\u062F\u0631\u0648\u0633\u0647.", gender: "M", category: "effort", targetRole: "both" },
  { id: "c19", en: "Must be more committed to academic work to achieve success.", ar: "\u064A\u062C\u0628 \u0639\u0644\u064A\u0647\u0627 \u0625\u0628\u062F\u0627\u0621 \u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u0648\u0627\u062C\u0628\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 \u0644\u062A\u062D\u0642\u064A\u0642 \u0627\u0644\u0646\u062C\u0627\u062D.", gender: "F", category: "effort", targetRole: "both" },
  { id: "c20", en: "Can achieve better results with increased effort and dedication.", ar: "\u0642\u0627\u062F\u0631\u0629 \u0639\u0644\u0649 \u062A\u062D\u0642\u064A\u0642 \u0646\u062A\u0627\u0626\u062C \u0623\u0641\u0636\u0644 \u0625\u0630\u0627 \u0632\u0627\u062F\u062A \u0645\u0646 \u062C\u0647\u062F\u0647\u0627 \u0648\u0645\u062B\u0627\u0628\u0631\u062A\u0647\u0627.", gender: "F", category: "effort", targetRole: "both" },
  { id: "c21", en: "Shows potential but needs greater commitment to studies.", ar: "\u064A\u0645\u062A\u0644\u0643 \u0627\u0633\u062A\u0639\u062F\u0627\u062F\u0627\u064B \u0637\u064A\u0628\u0627\u064B \u0648\u0644\u0643\u0646\u0647 \u0628\u062D\u0627\u062C\u0629 \u0625\u0644\u0649 \u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062D\u0631\u0635 \u0648\u0627\u0644\u062A\u0631\u0643\u064A\u0632.", gender: "N", category: "effort", targetRole: "both" },
  { id: "c22", en: "An average performance. More focus and hard work are required.", ar: "\u0623\u062F\u0627\u0621 \u0645\u062A\u0648\u0633\u0637\u060C \u0648\u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0648\u0627\u0644\u062C\u062F \u0648\u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F.", gender: "F", category: "effort", targetRole: "both" },
  { id: "c23", en: "Steady progress observed. Encourage consistent revision at home.", ar: "\u0644\u0648\u062D\u0638 \u062A\u0642\u062F\u0645 \u0645\u0633\u062A\u0645\u0631\u060C \u0648\u0646\u0634\u062C\u0639 \u0639\u0644\u0649 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0645\u0646\u062A\u0638\u0645\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0632\u0644.", gender: "N", category: "progress", targetRole: "both" },
  { id: "c24", en: "Active and cooperative student with commendable conduct.", ar: "\u0637\u0627\u0644\u0628 \u0646\u0634\u064A\u0637 \u0648\u0645\u062A\u0639\u0627\u0648\u0646 \u064A\u062A\u0645\u062A\u0639 \u0628\u0633\u0644\u0648\u0643 \u0648\u062E\u0644\u0642 \u062D\u0645\u064A\u062F \u062F\u0627\u062E\u0644 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u062E\u0627\u0631\u062C\u0647\u0627.", gender: "M", category: "behavior", targetRole: "both" },
  { id: "c25", en: "Active and cooperative student with commendable conduct.", ar: "\u0637\u0627\u0644\u0628\u0629 \u0646\u0634\u064A\u0637\u0629 \u0648\u0645\u062A\u0639\u0627\u0648\u0646\u0629 \u062A\u062A\u0645\u062A\u0639 \u0628\u0633\u0644\u0648\u0643 \u0648\u062E\u0644\u0642 \u062D\u0645\u064A\u062F \u062F\u0627\u062E\u0644 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u062E\u0627\u0631\u062C\u0647\u0627.", gender: "F", category: "behavior", targetRole: "both" },
  { id: "c26", en: "Exemplary conduct, well-mannered, and respectful to all.", ar: "\u0633\u0644\u0648\u0643 \u0646\u0645\u0648\u0630\u062C\u064A \u0648\u062E\u0644\u0642 \u0631\u0641\u064A\u0639 \u0648\u0627\u062D\u062A\u0631\u0627\u0645 \u0645\u062A\u0628\u0627\u062F\u0644 \u0645\u0639 \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0648\u0627\u0644\u0632\u0645\u0644\u0627\u0621.", gender: "N", category: "behavior", targetRole: "both" },
  { id: "c27", en: "Needs to work harder and pay more attention to studies.", ar: "\u064A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0645\u0636\u0627\u0639\u0641\u0629 \u0627\u0644\u062C\u0647\u062F \u0648\u0627\u0644\u062D\u0631\u0635 \u0639\u0644\u0649 \u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u062F\u0631\u0648\u0633 \u0628\u0627\u0646\u062A\u0638\u0627\u0645.", gender: "N", category: "effort", targetRole: "both" },
  { id: "c28", en: "Performance is below expectation. Serious improvement is needed.", ar: "\u0627\u0644\u0623\u062F\u0627\u0621 \u062F\u0648\u0646 \u0627\u0644\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u060C \u0648\u064A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u062A\u062D\u0633\u0646 \u062C\u0627\u062F \u0648\u0641\u0648\u0631\u064A.", gender: "M", category: "support", targetRole: "both" },
  { id: "c29", en: "Must be more committed to academic work to achieve success.", ar: "\u064A\u062C\u0628 \u0639\u0644\u064A\u0647 \u0625\u0628\u062F\u0627\u0621 \u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u0648\u0627\u062C\u0628\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 \u0644\u062A\u062D\u0642\u064A\u0642 \u0627\u0644\u0646\u062C\u0627\u062D.", gender: "M", category: "effort", targetRole: "both" },
  { id: "c30", en: "Needs to work harder and pay more attention to studies.", ar: "\u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0645\u0636\u0627\u0639\u0641\u0629 \u0627\u0644\u062C\u0647\u062F \u0648\u0632\u064A\u0627\u062F\u0629 \u0627\u0644\u0627\u0647\u062A\u0645\u0627\u0645 \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0644\u062F\u0631\u0648\u0633\u0647\u0627.", gender: "F", category: "effort", targetRole: "both" },
  { id: "c31", en: "Punctual, attentive, and consistently completes classwork.", ar: "\u0637\u0627\u0644\u0628 \u0645\u0644\u062A\u0632\u0645 \u0628\u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0645\u0646\u062A\u0628\u0647 \u0648\u0645\u0648\u0627\u0638\u0628 \u0639\u0644\u0649 \u0623\u062F\u0627\u0621 \u0648\u0627\u062C\u0628\u0627\u062A\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629.", gender: "M", category: "commendable", targetRole: "both" },
  { id: "c32", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "\u0623\u062F\u0627\u0621 \u063A\u064A\u0631 \u0645\u064F\u0631\u0652\u0636\u064D\u060C \u0648\u064A\u062A\u0637\u0644\u0628 \u062A\u062D\u0633\u0646\u0627\u064B \u0639\u0627\u062C\u0644\u0627\u064B \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u0645\u0643\u062B\u0641\u0629 \u0641\u064A \u0627\u0644\u0628\u064A\u062A \u0648\u0627\u0644\u0645\u062F\u0631\u0633\u0629.", gender: "M", category: "support", targetRole: "both" },
  { id: "c33", en: "Performance is below expectation. Serious improvement is needed.", ar: "\u0627\u0644\u0623\u062F\u0627\u0621 \u062F\u0648\u0646 \u0627\u0644\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u060C \u0648\u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u062A\u062D\u0633\u0646 \u062C\u0627\u062F \u0648\u0641\u0648\u0631\u064A.", gender: "F", category: "support", targetRole: "both" },
  { id: "c34", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "\u0623\u062F\u0627\u0621 \u063A\u064A\u0631 \u0645\u064F\u0631\u0652\u0636\u064D\u060C \u0648\u062A\u062A\u0637\u0644\u0628 \u062A\u062D\u0633\u0646\u0627\u064B \u0639\u0627\u062C\u0644\u0627\u064B \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u0645\u0643\u062B\u0641\u0629 \u0641\u064A \u0627\u0644\u0628\u064A\u062A \u0648\u0627\u0644\u0645\u062F\u0631\u0633\u0629.", gender: "F", category: "support", targetRole: "both" },
  { id: "c35", en: "Must be more committed to academic work to achieve success.", ar: "\u064A\u0646\u0628\u063A\u064A \u0627\u0644\u062A\u062D\u0644\u064A \u0628\u0627\u0644\u062C\u062F\u064A\u0629 \u0648\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u0648\u0627\u062C\u0628\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 \u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u0646\u062C\u0627\u062D.", gender: "N", category: "support", targetRole: "both" },
  { id: "c36", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "\u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u063A\u064A\u0631 \u0645\u0631\u0636\u064A\u0629\u060C \u0648\u062A\u0633\u062A\u0644\u0632\u0645 \u062E\u0637\u0629 \u0639\u0644\u0627\u062C\u064A\u0629 \u0639\u0627\u062C\u0644\u0629 \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u0645\u0633\u062A\u0645\u0631\u0629.", gender: "N", category: "support", targetRole: "both" }
];
var getCommentById = (id) => REPORT_CARD_COMMENTS.find((c) => c.id === id);

// server/models/PredefinedComment.ts
import mongoose21, { Schema as Schema15 } from "mongoose";
var PredefinedCommentSchema = new Schema15(
  {
    code: { type: String, required: true, unique: true, index: true },
    en: { type: String, required: true, trim: true },
    ar: { type: String, required: true, trim: true },
    gender: {
      type: String,
      enum: ["M", "F", "N"],
      default: "N",
      required: true
    },
    category: {
      type: String,
      enum: ["excellence", "commendable", "progress", "effort", "behavior", "support"],
      default: "commendable",
      required: true
    },
    targetRole: {
      type: String,
      enum: ["both", "teacher", "principal"],
      default: "both",
      required: true
    },
    isDefault: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);
var PredefinedComment_default = mongoose21.model(
  "PredefinedComment",
  PredefinedCommentSchema
);

// server/controllers/reportCardRemarkController.ts
var setRemark = async (req, res) => {
  try {
    const { student, term, field, commentId, en, ar, affectiveScores } = req.body;
    if (!student || !term) {
      return res.status(400).json({ message: "student and term are required" });
    }
    const studentDoc = await Student_default.findById(student).select("class");
    if (!studentDoc) {
      return res.status(404).json({ message: "Student not found" });
    }
    const access = await assertSuperAdminForClass(req, studentDoc.class.toString());
    if (!access.allowed) {
      return res.status(403).json({
        message: "Forbidden: Only Super Admin can manage graduating class remarks."
      });
    }
    if (await isClassResultLocked(studentDoc.class.toString(), term)) {
      return res.status(423).json({
        message: "This class result is locked. Remarks cannot be modified while locked."
      });
    }
    if (req.user?.role === "class_teacher") {
      const teacher = await User_default.findById(req.user.id);
      const allowedClassIds = (teacher?.classes || []).map((c) => c.toString());
      if (!allowedClassIds.includes(studentDoc.class.toString())) {
        return res.status(403).json({ message: "This student is not in one of your classes" });
      }
    }
    if (field === "affectiveScores" || affectiveScores !== void 0 && !field) {
      const scores = affectiveScores || {};
      const remark2 = await ReportCardRemark_default.findOneAndUpdate(
        { student, term },
        { affectiveScores: scores, enteredBy: req.user?.id },
        { new: true, upsert: true }
      );
      return res.status(200).json(remark2);
    }
    if (!field) {
      return res.status(400).json({ message: "field is required" });
    }
    if (!["classTeacherComment", "principalComment"].includes(field)) {
      return res.status(400).json({ message: "Invalid field" });
    }
    if (!commentId && !(en?.trim() || ar?.trim())) {
      return res.status(400).json({ message: "Provide either a commentId, or comment text" });
    }
    let finalEn = en ? en.trim() : "";
    let finalAr = ar ? ar.trim() : "";
    let finalId = void 0;
    if (commentId) {
      let picked = null;
      try {
        const isObjId = /^[0-9a-fA-F]{24}$/.test(commentId);
        const dbComment = await PredefinedComment_default.findOne({
          $or: [
            ...isObjId ? [{ _id: commentId }] : [],
            { code: commentId }
          ]
        });
        if (dbComment) {
          picked = { en: dbComment.en, ar: dbComment.ar };
        }
      } catch {
      }
      if (!picked) {
        picked = getCommentById(commentId) || null;
      }
      if (!picked && (en?.trim() || ar?.trim())) {
        finalEn = en ? en.trim() : "";
        finalAr = ar ? ar.trim() : "";
        finalId = void 0;
      } else if (!picked) {
        return res.status(400).json({ message: "Unknown commentId" });
      } else {
        finalEn = picked.en;
        finalAr = picked.ar;
        finalId = commentId;
      }
    }
    const prefix = field === "classTeacherComment" ? "classTeacherComment" : "principalComment";
    const update = {
      [`${prefix}Id`]: finalId ?? null,
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
    if (student && req.user?.role !== "super_admin") {
      const st = await Student_default.findById(student).select("class");
      if (st?.class) {
        const access = await assertSuperAdminForClass(req, st.class.toString());
        if (!access.allowed) {
          return res.status(403).json({
            message: "Forbidden: Graduating class remarks are restricted to Super Admin."
          });
        }
      }
    }
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
init_Attendance();
init_AttendanceSetting();
init_Class();
init_Student();
init_User();
var canAccessClass = async (req, classId) => {
  if (req.user?.role === "super_admin") return true;
  const [user, classDoc] = await Promise.all([
    User_default.findById(req.user?.id),
    Class_default.findById(classId)
  ]);
  if (!user || !classDoc) return false;
  if (isClassGraduatingDoc(classDoc)) return false;
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
    const [classSetting, branchSetting, globalSetting, anySettingForTerm, termDoc] = await Promise.all([
      AttendanceSetting_default.findOne({ class: classId, term: termId }),
      classDoc.branch ? AttendanceSetting_default.findOne({ branch: classDoc.branch, term: termId, class: { $exists: false } }) : null,
      AttendanceSetting_default.findOne({ term: termId, class: { $exists: false }, branch: { $exists: false } }),
      AttendanceSetting_default.findOne({
        term: termId,
        $or: [
          { nextResumption: { $exists: true, $ne: "" } },
          { dateResumed: { $exists: true, $ne: "" } },
          { timesSchoolOpened: { $exists: true, $ne: null } }
        ]
      }),
      Term_default.findById(termId)
    ]);
    const settings = {
      timesSchoolOpened: termDoc?.timesSchoolOpened ?? anySettingForTerm?.timesSchoolOpened ?? globalSetting?.timesSchoolOpened ?? branchSetting?.timesSchoolOpened ?? classSetting?.timesSchoolOpened ?? null,
      dateResumed: termDoc?.dateResumed || anySettingForTerm?.dateResumed || globalSetting?.dateResumed || branchSetting?.dateResumed || classSetting?.dateResumed || "",
      dateClosed: termDoc?.dateClosed || anySettingForTerm?.dateClosed || globalSetting?.dateClosed || branchSetting?.dateClosed || classSetting?.dateClosed || "",
      nextResumption: termDoc?.nextResumption || anySettingForTerm?.nextResumption || globalSetting?.nextResumption || branchSetting?.nextResumption || classSetting?.nextResumption || ""
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
      const cleanDateResumed = settings.dateResumed?.trim() || "";
      const cleanDateClosed = settings.dateClosed?.trim() || "";
      const cleanNextResumption = settings.nextResumption?.trim() || "";
      await AttendanceSetting_default.findOneAndUpdate(
        { term: termId, class: { $exists: false }, branch: { $exists: false } },
        {
          timesSchoolOpened: timesOpened,
          dateResumed: cleanDateResumed,
          dateClosed: cleanDateClosed,
          nextResumption: cleanNextResumption,
          updatedBy: req.user?.id
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      await Term_default.findByIdAndUpdate(termId, {
        timesSchoolOpened: timesOpened,
        dateResumed: cleanDateResumed,
        dateClosed: cleanDateClosed,
        nextResumption: cleanNextResumption
      });
      await AttendanceSetting_default.updateMany(
        { term: termId },
        {
          timesSchoolOpened: timesOpened,
          dateResumed: cleanDateResumed,
          dateClosed: cleanDateClosed,
          nextResumption: cleanNextResumption,
          updatedBy: req.user?.id
        }
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
    if (req.user?.role === "branch_admin" && req.user.branch) {
      query.branch = req.user.branch;
    } else if (branchId) {
      query.branch = branchId;
    }
    const setting = await AttendanceSetting_default.findOne(query);
    const termDoc = await Term_default.findById(termId);
    res.status(200).json({
      timesSchoolOpened: termDoc?.timesSchoolOpened ?? setting?.timesSchoolOpened ?? null,
      dateResumed: termDoc?.dateResumed || setting?.dateResumed || "",
      dateClosed: termDoc?.dateClosed || setting?.dateClosed || "",
      nextResumption: termDoc?.nextResumption || setting?.nextResumption || ""
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
    const cleanDateResumed = dateResumed?.trim() || "";
    const cleanDateClosed = dateClosed?.trim() || "";
    const cleanNextResumption = nextResumption?.trim() || "";
    const updated = await AttendanceSetting_default.findOneAndUpdate(
      { term: termId, class: { $exists: false }, branch: { $exists: false } },
      {
        timesSchoolOpened: timesOpened,
        dateResumed: cleanDateResumed,
        dateClosed: cleanDateClosed,
        nextResumption: cleanNextResumption,
        updatedBy: req.user?.id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await Term_default.findByIdAndUpdate(termId, {
      timesSchoolOpened: timesOpened,
      dateResumed: cleanDateResumed,
      dateClosed: cleanDateClosed,
      nextResumption: cleanNextResumption
    });
    await AttendanceSetting_default.updateMany(
      { term: termId },
      {
        timesSchoolOpened: timesOpened,
        dateResumed: cleanDateResumed,
        dateClosed: cleanDateClosed,
        nextResumption: cleanNextResumption,
        updatedBy: req.user?.id
      }
    );
    res.status(200).json({ message: "School-wide term calendar and resumption dates saved across all branches", settings: updated });
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
        address: "18/20 ADEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665",
        logoBase64: "",
        primaryColor: "#16a34a",
        headerColor: "#1e3a8a",
        showPrincipalSignature: false,
        principalSignatureBase64: "",
        showStamp: false,
        stampBase64: "",
        watermarkText: "",
        resendApiKey: "",
        resendFromEmail: ""
      });
    } else if (setting.address && setting.address.includes("ABEWALE")) {
      setting.address = setting.address.replace(/ABEWALE/g, "ADEWALE");
      await setting.save();
    }
    const obj = setting.toObject();
    const effectiveApiKey = setting.resendApiKey?.trim() || process.env.RESEND_API_KEY?.trim() || "";
    obj.hasResendApiKey = Boolean(effectiveApiKey);
    if (effectiveApiKey) {
      obj.resendApiKeyMasked = `${effectiveApiKey.slice(0, 4)}\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022${effectiveApiKey.slice(-4)}`;
    } else {
      obj.resendApiKeyMasked = "";
    }
    obj.effectiveResendFromEmail = setting.resendFromEmail?.trim() || process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
    res.status(200).json(obj);
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
      watermarkText,
      resendApiKey,
      resendFromEmail
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
    if (resendApiKey !== void 0) setting.resendApiKey = String(resendApiKey).trim();
    if (resendFromEmail !== void 0) setting.resendFromEmail = String(resendFromEmail).trim();
    if (req.user) {
      setting.updatedBy = req.user._id;
    }
    await setting.save();
    const obj = setting.toObject();
    const effectiveApiKey = setting.resendApiKey?.trim() || process.env.RESEND_API_KEY?.trim() || "";
    obj.hasResendApiKey = Boolean(effectiveApiKey);
    if (effectiveApiKey) {
      obj.resendApiKeyMasked = `${effectiveApiKey.slice(0, 4)}\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022${effectiveApiKey.slice(-4)}`;
    }
    res.status(200).json(obj);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var testEmailSetting = async (req, res) => {
  try {
    const { email } = req.body;
    let targetEmail = (email || req.user?.email || "").trim();
    if (!targetEmail && req.user?.id) {
      const User = (await Promise.resolve().then(() => (init_User(), User_exports))).default;
      const u = await User.findById(req.user.id).select("email");
      if (u?.email) targetEmail = u.email;
    }
    if (!targetEmail) {
      return res.status(400).json({ message: "Recipient email is required for test email." });
    }
    const result = await sendTestEmail(targetEmail);
    if (!result.success) {
      return res.status(400).json({
        message: result.error || "Failed to dispatch test email with configured Resend API key.",
        reason: result.reason
      });
    }
    res.status(200).json({
      message: `Test email sent successfully to ${targetEmail}! Message ID: ${result.id}`,
      id: result.id
    });
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
      address: "18/20 ADEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665",
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
router18.post(
  "/test-email",
  protect,
  authorize("super_admin", "branch_admin"),
  testEmailSetting
);
router18.put(
  "/",
  protect,
  authorize("super_admin", "branch_admin"),
  updateReportCardSetting
);
router18.post(
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

// server/routes/predefinedCommentRoutes.ts
import { Router as Router19 } from "express";

// server/controllers/predefinedCommentController.ts
var ensureSeeded = async () => {
  const count = await PredefinedComment_default.countDocuments();
  if (count === 0) {
    const docs = REPORT_CARD_COMMENTS.map((c, index) => ({
      code: c.id,
      en: c.en,
      ar: c.ar,
      gender: c.gender,
      category: c.category || "commendable",
      targetRole: c.targetRole || "both",
      isDefault: true,
      order: index + 1
    }));
    await PredefinedComment_default.insertMany(docs);
  }
};
var getPredefinedComments = async (req, res) => {
  try {
    await ensureSeeded();
    const { gender, targetRole, category, search } = req.query;
    const filter = {};
    if (gender && ["M", "F", "N"].includes(gender)) {
      filter.gender = { $in: [gender, "N"] };
    }
    if (targetRole && ["teacher", "principal"].includes(targetRole)) {
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
        { code: { $regex: q, $options: "i" } }
      ];
    }
    const comments = await PredefinedComment_default.find(filter).sort({ order: 1, createdAt: 1 });
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var createPredefinedComment = async (req, res) => {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Admin can create predefined comments" });
    }
    const { en, ar, gender = "N", category = "commendable", targetRole = "both" } = req.body;
    if (!en?.trim() || !ar?.trim()) {
      return res.status(400).json({ message: "Both English and Arabic texts are required" });
    }
    const highest = await PredefinedComment_default.findOne().sort({ order: -1 });
    const nextOrder = (highest?.order || 0) + 1;
    const code = `c_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e3)}`;
    const newComment = await PredefinedComment_default.create({
      code,
      en: en.trim(),
      ar: ar.trim(),
      gender,
      category,
      targetRole,
      isDefault: false,
      order: nextOrder
    });
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var updatePredefinedComment = async (req, res) => {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Admin can edit predefined comments" });
    }
    const { id } = req.params;
    const { en, ar, gender, category, targetRole, order } = req.body;
    const existing = await PredefinedComment_default.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (en !== void 0) existing.en = en.trim();
    if (ar !== void 0) existing.ar = ar.trim();
    if (gender !== void 0) existing.gender = gender;
    if (category !== void 0) existing.category = category;
    if (targetRole !== void 0) existing.targetRole = targetRole;
    if (order !== void 0) existing.order = Number(order);
    await existing.save();
    res.status(200).json(existing);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var deletePredefinedComment = async (req, res) => {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Admin can delete predefined comments" });
    }
    const { id } = req.params;
    const deleted = await PredefinedComment_default.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.status(200).json({ message: "Comment deleted successfully", comment: deleted });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
var resetPredefinedComments = async (req, res) => {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Admin can reset predefined comments" });
    }
    await PredefinedComment_default.deleteMany({});
    const docs = REPORT_CARD_COMMENTS.map((c, index) => ({
      code: c.id,
      en: c.en,
      ar: c.ar,
      gender: c.gender,
      category: c.category || "commendable",
      targetRole: c.targetRole || "both",
      isDefault: true,
      order: index + 1
    }));
    await PredefinedComment_default.insertMany(docs);
    const comments = await PredefinedComment_default.find().sort({ order: 1 });
    res.status(200).json({ message: "Comments successfully reset to standard bank", comments });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// server/routes/predefinedCommentRoutes.ts
var router19 = Router19();
router19.get("/", protect, getPredefinedComments);
router19.post("/", protect, authorize("super_admin"), createPredefinedComment);
router19.put("/:id", protect, authorize("super_admin"), updatePredefinedComment);
router19.delete("/:id", protect, authorize("super_admin"), deletePredefinedComment);
router19.post("/reset", protect, authorize("super_admin"), resetPredefinedComments);
var predefinedCommentRoutes_default = router19;

// server/middleware/errorHandler.ts
var errorHandler = (err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
};

// server/app.ts
dotenv.config();
var app = express();
var graduatingSetupPromise = null;
var triggerGraduatingSetupOnce = () => {
  if (!graduatingSetupPromise && mongoose22.connection.readyState === 1) {
    graduatingSetupPromise = ensureGraduating2026Setup().then((res) => {
      if (res.classesCreated > 0 || res.studentsInserted > 0 || res.subjectsSeeded > 0) {
        console.log(
          `[Graduating2026] Synced under ${res.branchName}: +${res.classesCreated} classes, +${res.studentsInserted} students, +${res.subjectsSeeded} subjects`
        );
      }
    }).catch((err) => {
      console.error("[Graduating2026] Startup sync error:", err.message);
    });
  }
};
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use((req, _res, next) => {
  if (req.url.startsWith("/api/index.js")) {
    const matched = req.headers["x-matched-path"] || req.headers["x-invoke-path"];
    if (matched && !matched.startsWith("/api/index.js")) {
      req.url = matched;
    }
  }
  next();
});
app.get(["/api/health", "/health"], async (_req, res) => {
  const hasMongoUri = Boolean(process.env.MONGODB_URI || process.env.MONGO_URI);
  let dbStatus = "disconnected";
  let connectedDb = null;
  let userCount = 0;
  if (mongoose22.connection.readyState === 1 && mongoose22.connection.db) {
    dbStatus = "connected";
    connectedDb = mongoose22.connection.name;
    try {
      userCount = await mongoose22.connection.db.collection("users").countDocuments();
    } catch {
    }
  }
  res.json({
    status: "ok",
    message: "School Management System API is healthy",
    configured: hasMongoUri,
    database: {
      status: dbStatus,
      name: connectedDb,
      userCount,
      host: mongoose22.connection.host || null
    }
  });
});
app.use(async (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    await db_default();
    triggerGraduatingSetupOnce();
    next();
  } catch (err) {
    const errorMsg = err?.message || "Unknown database error";
    console.error("[Database] Connection middleware error:", errorMsg);
    let diagnostic = "Database connection error. Check server logs.";
    const hasMongoUri = Boolean(process.env.MONGODB_URI || process.env.MONGO_URI);
    if (!hasMongoUri) {
      diagnostic = "MONGODB_URI environment variable is missing on this deployment.";
    } else if (errorMsg.includes("ETIMEDOUT") || errorMsg.includes("timed out") || errorMsg.includes("selection timed out") || errorMsg.includes("querySrv ENOTFOUND")) {
      diagnostic = "Could not reach MongoDB Atlas. Please ensure IP access list allows 0.0.0.0/0 in MongoDB Atlas Network Access.";
    } else if (errorMsg.includes("bad auth") || errorMsg.includes("Authentication failed")) {
      diagnostic = "MongoDB Atlas authentication failed. Please verify database username and password in MONGODB_URI.";
    }
    return res.status(503).json({
      message: "Database connection temporarily unavailable. Please try again shortly.",
      diagnostic,
      error: errorMsg
    });
  }
});
app.use(["/api/auth", "/auth"], authRoutes_default);
app.use(["/api/users", "/users"], userRoutes_default);
app.use(["/api/branches", "/branches"], branchRoutes_default);
app.use(["/api/classes", "/classes"], classRoutes_default);
app.use(["/api/subjects", "/subjects"], subjectRoutes_default);
app.use(["/api/grading-scales", "/grading-scales"], gradingScaleRoutes_default);
app.use(["/api/students", "/students"], studentRoutes_default);
app.use(["/api/scores", "/scores"], scoreRoutes_default);
app.use(["/api/broadsheet", "/broadsheet"], broadsheetRoutes_default);
app.use(["/api/report-card/pdf", "/report-card/pdf"], pdfRoutes_default);
app.use(["/api/report-card-settings", "/report-card-settings"], reportCardSettingRoutes_default);
app.use(["/api/report-card-remarks", "/report-card-remarks"], reportCardRemarkRoutes_default);
app.use(["/api/report-card", "/report-card"], reportCardRoutes_default);
app.use(["/api/dashboard", "/dashboard"], dashboardRoutes_default);
app.use(["/api/parent-portal", "/parent-portal"], parentPortalRoutes_default);
app.use(["/api/terms", "/terms"], termRoutes_default);
app.use(["/api/result-publications", "/result-publications"], resultPublicationRoutes_default);
app.use(["/api/attendance", "/attendance"], attendanceRoutes_default);
app.use(["/api/predefined-comments", "/predefined-comments"], predefinedCommentRoutes_default);
app.use(["/api", "/"], errorHandler);
var app_default = app;
export {
  app,
  app_default as default
};

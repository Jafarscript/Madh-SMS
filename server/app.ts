import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import branchRoutes from "./routes/branchRoutes";
import classRoutes from "./routes/classRoutes";
import subjectRoutes from "./routes/subjectRoutes";
import gradingScaleRoutes from "./routes/gradingScaleRoutes";
import studentRoutes from "./routes/studentRoutes";
import scoreRoutes from "./routes/scoreRoutes";
import broadsheetRoutes from "./routes/broadsheetRoutes";
import reportCardRoutes from "./routes/reportCardRoutes";
import pdfRoutes from "./routes/pdfRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import parentPortalRoutes from "./routes/parentPortalRoutes";
import termRoutes from "./routes/termRoutes";
import userRoutes from "./routes/userRoutes";
import reportCardRemarkRoutes from "./routes/reportCardRemarkRoutes";
import resultPublicationRoutes from "./routes/resultPublicationRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import reportCardSettingRoutes from "./routes/reportCardSettingRoutes";
import predefinedCommentRoutes from "./routes/predefinedCommentRoutes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Vercel serverless path normalizer
app.use((req, _res, next) => {
  if (req.url.startsWith("/api/index.js")) {
    const matched = (req.headers["x-matched-path"] as string) || (req.headers["x-invoke-path"] as string);
    if (matched && !matched.startsWith("/api/index.js")) {
      req.url = matched;
    }
  }
  next();
});

// Lightweight health check (accessible without blocking on database)
app.get(["/api/health", "/health"], async (_req, res) => {
  const hasMongoUri = Boolean(process.env.MONGODB_URI || process.env.MONGO_URI);
  let dbStatus = "disconnected";
  let connectedDb: string | null = null;
  let userCount = 0;

  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    dbStatus = "connected";
    connectedDb = mongoose.connection.name;
    try {
      userCount = await mongoose.connection.db.collection("users").countDocuments();
    } catch {
      // ignore
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
      host: mongoose.connection.host || null,
    },
  });
});

// Middleware to ensure DB connection for serverless/local environments
app.use(async (req, res, next) => {
  // Skip DB connection check for preflight requests
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    const errorMsg = (err as Error)?.message || "Unknown database error";
    console.error("[Database] Connection middleware error:", errorMsg);

    let diagnostic = "Database connection error. Check server logs.";
    const hasMongoUri = Boolean(process.env.MONGODB_URI || process.env.MONGO_URI);

    if (!hasMongoUri) {
      diagnostic = "MONGODB_URI environment variable is missing on this deployment.";
    } else if (
      errorMsg.includes("ETIMEDOUT") ||
      errorMsg.includes("timed out") ||
      errorMsg.includes("selection timed out") ||
      errorMsg.includes("querySrv ENOTFOUND")
    ) {
      diagnostic = "Could not reach MongoDB Atlas. Please ensure IP access list allows 0.0.0.0/0 in MongoDB Atlas Network Access.";
    } else if (errorMsg.includes("bad auth") || errorMsg.includes("Authentication failed")) {
      diagnostic = "MongoDB Atlas authentication failed. Please verify database username and password in MONGODB_URI.";
    }

    return res.status(503).json({
      message: "Database connection temporarily unavailable. Please try again shortly.",
      diagnostic,
      error: errorMsg,
    });
  }
});

// API Routes (supports both direct serverless mounts and /api prefixed routes)
app.use(["/api/auth", "/auth"], authRoutes);
app.use(["/api/users", "/users"], userRoutes);
app.use(["/api/branches", "/branches"], branchRoutes);
app.use(["/api/classes", "/classes"], classRoutes);
app.use(["/api/subjects", "/subjects"], subjectRoutes);
app.use(["/api/grading-scales", "/grading-scales"], gradingScaleRoutes);
app.use(["/api/students", "/students"], studentRoutes);
app.use(["/api/scores", "/scores"], scoreRoutes);
app.use(["/api/broadsheet", "/broadsheet"], broadsheetRoutes);
app.use(["/api/report-card/pdf", "/report-card/pdf"], pdfRoutes);
app.use(["/api/report-card-settings", "/report-card-settings"], reportCardSettingRoutes);
app.use(["/api/report-card-remarks", "/report-card-remarks"], reportCardRemarkRoutes);
app.use(["/api/report-card", "/report-card"], reportCardRoutes);
app.use(["/api/dashboard", "/dashboard"], dashboardRoutes);
app.use(["/api/parent-portal", "/parent-portal"], parentPortalRoutes);
app.use(["/api/terms", "/terms"], termRoutes);
app.use(["/api/result-publications", "/result-publications"], resultPublicationRoutes);
app.use(["/api/attendance", "/attendance"], attendanceRoutes);
app.use(["/api/predefined-comments", "/predefined-comments"], predefinedCommentRoutes);

// Error Handling
app.use(["/api", "/"], errorHandler);

export default app;

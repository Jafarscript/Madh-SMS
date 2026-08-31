import express from "express";
import cors from "cors";
import dotenv from "dotenv";

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
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Middleware to ensure DB connection for serverless/local environments
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection middleware error:", err);
    next();
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "School Management System API is healthy" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/grading-scales", gradingScaleRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/broadsheet", broadsheetRoutes);
app.use("/api/report-card", reportCardRoutes);
app.use("/api/report-card/pdf", pdfRoutes);
app.use("/api/report-card-settings", reportCardSettingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/parent-portal", parentPortalRoutes);
app.use("/api/terms", termRoutes);
app.use("/api/report-card-remarks", reportCardRemarkRoutes);
app.use("/api/result-publications", resultPublicationRoutes);
app.use("/api/attendance", attendanceRoutes);

// Error Handling
app.use("/api", errorHandler);

export default app;

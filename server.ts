import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { createServer as createViteServer } from "vite";

import connectDB from "./server/config/db";
import authRoutes from "./server/routes/authRoutes";
import branchRoutes from "./server/routes/branchRoutes";
import classRoutes from "./server/routes/classRoutes";
import subjectRoutes from "./server/routes/subjectRoutes";
import gradingScaleRoutes from "./server/routes/gradingScaleRoutes";
import studentRoutes from "./server/routes/studentRoutes";
import scoreRoutes from "./server/routes/scoreRoutes";
import broadsheetRoutes from "./server/routes/broadsheetRoutes";
import reportCardRoutes from "./server/routes/reportCardRoutes";
import pdfRoutes from "./server/routes/pdfRoutes";
import dashboardRoutes from "./server/routes/dashboardRoutes";
import parentPortalRoutes from "./server/routes/parentPortalRoutes";
import termRoutes from "./server/routes/termRoutes";
import userRoutes from "./server/routes/userRoutes";
import reportCardRemarkRoutes from "./server/routes/reportCardRemarkRoutes";
import resultPublicationRoutes from "./server/routes/resultPublicationRoutes";
import attendanceRoutes from "./server/routes/attendanceRoutes";
import { errorHandler } from "./server/middleware/errorHandler";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB Connection (with automated fallback + seed data)
  await connectDB();

  // Core Middlewares
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "School Management System API is healthy" });
  });

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
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/parent-portal", parentPortalRoutes);
  app.use("/api/terms", termRoutes);
  app.use("/api/report-card-remarks", reportCardRemarkRoutes);
  app.use("/api/result-publications", resultPublicationRoutes);
  app.use("/api/attendance", attendanceRoutes);

  // Error handling middleware for API routes
  app.use("/api", errorHandler);

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`School Management System server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import {
  getMyChildReportCard,
  downloadMyChildReportCardPdf,
  getAvailableTerms,
} from "../controllers/parentPortalController";

const router = Router();

// authorize("parent") only — this route deliberately does NOT allow
// admin/teacher roles, since "my child" only makes sense for a parent account
router.get("/report-card", protect, authorize("parent"), getMyChildReportCard);
router.get("/report-card/pdf", protect, authorize("parent"), downloadMyChildReportCardPdf);
router.get("/terms", protect, authorize("parent"), getAvailableTerms);

export default router;
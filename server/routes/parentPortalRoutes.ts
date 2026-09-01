import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import {
  getMyChildReportCard,
  downloadMyChildReportCardPdf,
  getAvailableTerms,
  getMyChildren,
  linkChild,
} from "../controllers/parentPortalController";

const router = Router();

// authorize("parent") only
router.get("/children", protect, authorize("parent"), getMyChildren);
router.post("/link-child", protect, authorize("parent"), linkChild);
router.get("/report-card", protect, authorize("parent"), getMyChildReportCard);
router.get("/report-card/pdf", protect, authorize("parent"), downloadMyChildReportCardPdf);
router.get("/terms", protect, authorize("parent"), getAvailableTerms);

export default router;
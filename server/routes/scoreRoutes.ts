import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import { submitScore, getScores, getScoreAuditLogs } from "../controllers/scoreController";

const router = Router();

router.post(
  "/",
  protect,
  authorize("super_admin", "branch_admin", "class_teacher", "subject_teacher"),
  submitScore
);
router.get(
  "/",
  protect,
  authorize("super_admin", "branch_admin", "class_teacher", "subject_teacher"),
  getScores
);
router.get(
  "/audit-logs",
  protect,
  authorize("super_admin", "branch_admin", "class_teacher"),
  getScoreAuditLogs
);

export default router;
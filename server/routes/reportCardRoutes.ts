import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import { getReportCard } from "../controllers/reportCardController";

const router = Router();

router.get(
  "/",
  protect,
  authorize("super_admin", "branch_admin", "class_teacher"),
  getReportCard
);

export default router;
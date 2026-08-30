import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import {
  getReportCardSetting,
  updateReportCardSetting,
  resetReportCardSetting,
} from "../controllers/reportCardSettingController";

const router = Router();

// Public / Authenticated read
router.get("/", getReportCardSetting);

// Admin-only updates
router.put(
  "/",
  protect,
  authorize("super_admin", "branch_admin"),
  updateReportCardSetting
);

router.post(
  "/reset",
  protect,
  authorize("super_admin"),
  resetReportCardSetting
);

export default router;

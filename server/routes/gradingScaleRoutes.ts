import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import {
  createGradingScale,
  getGradingScales,
  updateGradingScale,
  deleteGradingScale,
  resetTaqdeerScale,
} from "../controllers/gradingScaleController";

const router = Router();

router.post("/", protect, authorize("super_admin", "branch_admin"), createGradingScale);
router.get("/", protect, getGradingScales);
router.post("/reset-taqdeer", protect, authorize("super_admin", "branch_admin"), resetTaqdeerScale);
router.put("/:id", protect, authorize("super_admin", "branch_admin"), updateGradingScale);
router.delete("/:id", protect, authorize("super_admin", "branch_admin"), deleteGradingScale);

export default router;
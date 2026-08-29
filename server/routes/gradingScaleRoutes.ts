import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import {
  createGradingScale,
  getGradingScales,
  updateGradingScale,
  deleteGradingScale,
} from "../controllers/gradingScaleController";

const router = Router();

router.post("/", protect, authorize("super_admin"), createGradingScale);
router.get("/", protect, getGradingScales);
router.put("/:id", protect, authorize("super_admin"), updateGradingScale);
router.delete("/:id", protect, authorize("super_admin"), deleteGradingScale);

export default router;
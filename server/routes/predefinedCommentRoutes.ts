import { Router } from "express";
import {
  getPredefinedComments,
  createPredefinedComment,
  updatePredefinedComment,
  deletePredefinedComment,
  resetPredefinedComments,
} from "../controllers/predefinedCommentController";
import { protect, authorize } from "../middleware/auth";

const router = Router();

// All authenticated users (teachers, admins) can view available comments
router.get("/", protect, getPredefinedComments);

// Only Super Admin can manage predefined comments
router.post("/", protect, authorize("super_admin"), createPredefinedComment);
router.put("/:id", protect, authorize("super_admin"), updatePredefinedComment);
router.delete("/:id", protect, authorize("super_admin"), deletePredefinedComment);
router.post("/reset", protect, authorize("super_admin"), resetPredefinedComments);

export default router;

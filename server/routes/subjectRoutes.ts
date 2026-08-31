import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import {
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
  bulkCreateSubjects,
  reorderSubjects,
} from "../controllers/subjectController";

const router = Router();

router.post("/", protect, authorize("super_admin", "branch_admin"), createSubject);
router.get("/", protect, getSubjects);
router.put("/reorder", protect, authorize("super_admin", "branch_admin"), reorderSubjects);
router.put("/:id", protect, authorize("super_admin", "branch_admin"), updateSubject);
router.delete("/:id", protect, authorize("super_admin", "branch_admin"), deleteSubject);
router.post("/bulk", protect, authorize("super_admin", "branch_admin"), bulkCreateSubjects);

export default router;
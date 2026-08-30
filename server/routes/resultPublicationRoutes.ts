import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import {
  getResultPublication,
  setResultPublication,
  batchSetResultPublication,
  getResultOverview,
  getClassAuditDetails,
} from "../controllers/resultPublicationController";

const router = Router();

router.get("/", protect, authorize("super_admin", "branch_admin", "class_teacher"), getResultPublication);
router.get("/overview", protect, authorize("super_admin", "branch_admin"), getResultOverview);
router.get("/audit", protect, authorize("super_admin", "branch_admin"), getClassAuditDetails);
router.put("/", protect, authorize("super_admin", "branch_admin"), setResultPublication);
router.post("/batch", protect, authorize("super_admin", "branch_admin"), batchSetResultPublication);

export default router;

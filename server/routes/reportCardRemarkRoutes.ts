import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import { setRemark, getRemark } from "../controllers/reportCardRemarkController";

const router = Router();

router.put("/", protect, authorize("super_admin", "branch_admin", "class_teacher"), setRemark);
router.get("/", protect, authorize("super_admin", "branch_admin", "class_teacher"), getRemark);

export default router;
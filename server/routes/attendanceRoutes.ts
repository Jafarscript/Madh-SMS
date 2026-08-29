import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import { getClassAttendance, saveClassAttendance } from "../controllers/attendanceController";

const router = Router();
router.get("/", protect, authorize("super_admin", "branch_admin", "class_teacher"), getClassAttendance);
router.put("/bulk", protect, authorize("super_admin", "branch_admin", "class_teacher"), saveClassAttendance);
export default router;

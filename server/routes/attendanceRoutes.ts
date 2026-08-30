import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import {
  getClassAttendance,
  saveClassAttendance,
  getAttendanceSettings,
  saveAttendanceSettings,
} from "../controllers/attendanceController";

const router = Router();

router.get("/", protect, authorize("super_admin", "branch_admin", "class_teacher"), getClassAttendance);
router.put("/bulk", protect, authorize("super_admin", "branch_admin", "class_teacher"), saveClassAttendance);

router.get("/settings", protect, authorize("super_admin", "branch_admin"), getAttendanceSettings);
router.put("/settings", protect, authorize("super_admin", "branch_admin"), saveAttendanceSettings);

export default router;

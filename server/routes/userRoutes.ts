import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import {
  getUsers,
  getPendingTeachers,
  approveTeacher,
  rejectTeacher,
  bulkCreateStaff,
  getStaffCode,
  updateStaffCode,
  updateUser,
  resetUserPassword,
  deleteUser,
} from "../controllers/userController";

const router = Router();

router.get("/staff-code", protect, authorize("super_admin", "branch_admin"), getStaffCode);
router.put("/staff-code", protect, authorize("super_admin"), updateStaffCode);

router.get("/pending-teachers", protect, authorize("super_admin", "branch_admin"), getPendingTeachers);
router.put("/:id/approve", protect, authorize("super_admin", "branch_admin"), approveTeacher);
router.put("/:id/reject", protect, authorize("super_admin", "branch_admin"), rejectTeacher);

router.post("/bulk", protect, authorize("super_admin", "branch_admin"), bulkCreateStaff);

router.get("/", protect, authorize("super_admin", "branch_admin"), getUsers);
router.put("/:id", protect, authorize("super_admin", "branch_admin"), updateUser);
router.put(
  "/:id/reset-password",
  protect,
  authorize("super_admin", "branch_admin"),
  resetUserPassword
);
router.delete("/:id", protect, authorize("super_admin", "branch_admin"), deleteUser);

export default router;
import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import { getUsers, updateUser, resetUserPassword, deleteUser } from "../controllers/userController";

const router = Router();

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
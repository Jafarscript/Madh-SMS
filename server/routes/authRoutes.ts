import { Router } from "express";
import {
  register,
  registerTeacher,
  registerParent,
  lookupStudent,
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPasswordWithCode,
} from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/register-teacher", registerTeacher);
router.post("/register-parent", registerParent);
router.post("/lookup-student", lookupStudent);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordWithCode);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

export default router;
import { Router } from "express";
import { register, login, getMe, changePassword } from "../controllers/authController";
import { protect } from "../middleware/auth";



const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

export default router;
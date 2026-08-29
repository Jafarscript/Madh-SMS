import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import { getDashboard } from "../controllers/dashboardController";

const router = Router();

router.get("/", protect, authorize("super_admin", "branch_admin"), getDashboard);

export default router;
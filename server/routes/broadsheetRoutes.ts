import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import { getBroadsheet } from "../controllers/broadsheetController";

const router = Router();

router.get(
  "/",
  protect,
  authorize("super_admin", "branch_admin", "class_teacher"),
  getBroadsheet
);

export default router;
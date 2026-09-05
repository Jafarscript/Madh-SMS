import { Router } from "express";
import { protect, authorize, optionalProtect } from "../middleware/auth";
import { createClass, getClasses, updateClass, deleteClass } from "../controllers/classController";

const router = Router();

router.post("/", protect, authorize("super_admin", "branch_admin"), createClass);
router.get("/", optionalProtect, getClasses); // public registration or authenticated users can view classes
router.put("/:id", protect, authorize("super_admin", "branch_admin"), updateClass);
router.delete("/:id", protect, authorize("super_admin", "branch_admin"), deleteClass);

export default router;
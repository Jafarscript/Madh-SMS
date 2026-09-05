import { Router } from "express";
import { protect, authorize, optionalProtect } from "../middleware/auth";
import { createBranch, getBranches, updateBranch, deleteBranch } from "../controllers/branchController";

const router = Router();

// only super_admin manages branches — branch_admin belongs to one, doesn't create new ones
router.post("/", protect, authorize("super_admin"), createBranch);
router.get("/", optionalProtect, getBranches); // public registration or any logged-in role can view branches
router.put("/:id", protect, authorize("super_admin"), updateBranch);
router.delete("/:id", protect, authorize("super_admin"), deleteBranch);

export default router;
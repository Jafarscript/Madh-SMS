import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import { createTerm, getTerms, setActiveTerm } from "../controllers/termController";

const router = Router();

router.post("/", protect, authorize("super_admin", "branch_admin"), createTerm);
router.get("/", protect, getTerms);
router.put("/:id/activate", protect, authorize("super_admin"), setActiveTerm);

export default router;
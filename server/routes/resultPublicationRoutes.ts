import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import { getResultPublication, setResultPublication } from "../controllers/resultPublicationController";

const router = Router();

router.get("/", protect, authorize("super_admin", "branch_admin", "class_teacher"), getResultPublication);
router.put("/", protect, authorize("super_admin", "branch_admin"), setResultPublication);

export default router;

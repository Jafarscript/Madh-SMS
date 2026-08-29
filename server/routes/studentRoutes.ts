import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import { createStudent, getStudents, updateStudent, deleteStudent, bulkCreateStudents } from "../controllers/studentController";

const router = Router();

router.post("/", protect, authorize("super_admin", "branch_admin", "class_teacher"), createStudent);
router.post("/bulk", protect, authorize("super_admin", "branch_admin", "class_teacher"), bulkCreateStudents);
router.get("/", protect, getStudents); // any logged-in role can view (filtered)
router.put("/:id", protect, authorize("super_admin", "branch_admin", "class_teacher"), updateStudent);
router.delete("/:id", protect, authorize("super_admin", "branch_admin"), deleteStudent);

export default router;
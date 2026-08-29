import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import { downloadSingleReportCardPdf, downloadBulkReportCardPdf } from "../controllers/pdfController";

const router = Router();

router.get(
  "/single",
  protect,
  authorize("super_admin", "branch_admin", "class_teacher"),
  downloadSingleReportCardPdf
);
router.get(
  "/bulk",
  protect,
  authorize("super_admin", "branch_admin", "class_teacher"),
  downloadBulkReportCardPdf
);

export default router;

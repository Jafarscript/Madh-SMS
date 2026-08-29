import { Response } from "express";
import ReportCardRemark from "../models/ReportCardRemark";
import Student from "../models/Student";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { getCommentById } from "../constants/reportCardComments";
import { isClassResultLocked } from "./resultPublicationController";

// PUT /api/report-card-remarks
// body: { student, term, field, commentId? }  ← picked from the list
//   OR: { student, term, field, en, ar }       ← typed manually
export const setRemark = async (req: AuthRequest, res: Response) => {
  try {
    const { student, term, field, commentId, en, ar } = req.body;

    if (!student || !term || !field) {
      return res.status(400).json({ message: "student, term, and field are required" });
    }
    if (!["classTeacherComment", "principalComment"].includes(field)) {
      return res.status(400).json({ message: "Invalid field" });
    }
    if (!commentId && !(en && ar)) {
      return res.status(400).json({ message: "Provide either a commentId, or both en and ar text" });
    }

    const studentDoc = await Student.findById(student).select("class");
    if (!studentDoc) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Security: verify if class results are locked
    if (await isClassResultLocked(studentDoc.class.toString(), term)) {
      return res.status(423).json({
        message: "This class result is locked. Remarks cannot be modified while locked.",
      });
    }

    if (req.user?.role === "class_teacher") {
      if (field !== "classTeacherComment") {
        return res.status(403).json({ message: "Only super_admin/branch_admin can set the principal's comment" });
      }
      const teacher = await User.findById(req.user.id);
      const allowedClassIds = (teacher?.classes || []).map((c) => c.toString());
      if (!allowedClassIds.includes(studentDoc.class.toString())) {
        return res.status(403).json({ message: "This student is not in one of your classes" });
      }
    }

    // resolve to final en/ar text — either from the picked predefined
    // comment, or straight from what was typed
    let finalEn = en;
    let finalAr = ar;
    let finalId: string | undefined = undefined;

    if (commentId) {
      const picked = getCommentById(commentId);
      if (!picked) return res.status(400).json({ message: "Unknown commentId" });
      finalEn = picked.en;
      finalAr = picked.ar;
      finalId = commentId;
    }

    const prefix = field === "classTeacherComment" ? "classTeacherComment" : "principalComment";
    const update = {
      [`${prefix}Id`]: finalId ?? null,   // null clears any previously-picked id when switching to custom text
      [`${prefix}En`]: finalEn,
      [`${prefix}Ar`]: finalAr,
      enteredBy: req.user?.id,
    };

    const remark = await ReportCardRemark.findOneAndUpdate(
      { student, term },
      update,
      { new: true, upsert: true }
    );

    res.status(200).json(remark);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getRemark = async (req: AuthRequest, res: Response) => {
  try {
    const { student, term } = req.query;
    const remark = await ReportCardRemark.findOne({ student: student as any, term: term as any });
    res.status(200).json(remark || null);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

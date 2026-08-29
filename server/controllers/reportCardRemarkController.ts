import { Response } from "express";
import ReportCardRemark from "../models/ReportCardRemark";
import Student from "../models/Student";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { getCommentById } from "../constants/reportCardComments";

// PUT /api/report-card-remarks
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

    if (req.user?.role === "class_teacher") {
      if (field !== "classTeacherComment") {
        return res.status(403).json({ message: "Only super_admin/branch_admin can set the principal's comment" });
      }
      const studentDoc = await Student.findById(student);
      const teacher = await User.findById(req.user.id);
      const allowedClassIds = (teacher?.classes || []).map((c) => c.toString());
      if (!studentDoc || !allowedClassIds.includes(studentDoc.class.toString())) {
        return res.status(403).json({ message: "This student is not in one of your classes" });
      }
    }

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
      [`${prefix}Id`]: finalId ?? null,
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
    const student = req.query.student as string;
    const term = req.query.term as string;
    const remark = await ReportCardRemark.findOne({ student: student as any, term: term as any });
    res.status(200).json(remark || null);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

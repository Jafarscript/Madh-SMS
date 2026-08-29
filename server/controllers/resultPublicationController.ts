import { Response } from "express";
import Class from "../models/Class";
import ResultPublication, { ResultStatus } from "../models/ResultPublication";
import Student from "../models/Student";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

const canManageClass = async (req: AuthRequest, classId: string) => {
  if (req.user?.role === "super_admin") return true;

  const [user, classDoc] = await Promise.all([
    User.findById(req.user?.id),
    Class.findById(classId),
  ]);
  if (!user || !classDoc) return false;

  return (
    req.user?.role === "branch_admin" &&
    !!user.branch &&
    user.branch.toString() === classDoc.branch.toString()
  );
};

// GET /api/result-publications?class=<classId>&term=<termId>
// OR GET /api/result-publications?term=<termId> (returns array for all authorized classes)
export const getResultPublication = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, term } = req.query;
    if (!term) {
      return res.status(400).json({ message: "term is required" });
    }

    if (classId) {
      const publication = await ResultPublication.findOne({
        class: classId as any,
        term: term as any,
      })
        .populate("publishedBy", "name email")
        .populate("lockedBy", "name email");

      return res
        .status(200)
        .json(publication || { class: classId, term, status: "draft" });
    }

    // Return list for all accessible classes
    let classFilter: any = {};
    if (req.user?.role === "branch_admin") {
      const user = await User.findById(req.user.id);
      if (user?.branch) {
        const branchClasses = await Class.find({ branch: user.branch }).select("_id");
        classFilter = { _id: { $in: branchClasses.map((c) => c._id) } };
      }
    } else if (req.user?.role === "class_teacher") {
      const teacher = await User.findById(req.user.id);
      classFilter = { _id: { $in: teacher?.classes || [] } };
    }

    const classes = await Class.find(classFilter).select("_id name arm branch");
    const classIds = classes.map((c) => c._id);

    const publications = await ResultPublication.find({
      class: { $in: classIds },
      term: term as any,
    })
      .populate("publishedBy", "name email")
      .populate("lockedBy", "name email");

    const pubMap = new Map<string, any>();
    publications.forEach((p) => pubMap.set(p.class.toString(), p));

    const result = classes.map((c) => {
      const pub = pubMap.get(c._id.toString());
      return (
        pub || {
          class: c._id,
          term,
          status: "draft" as ResultStatus,
        }
      );
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PUT /api/result-publications
// body: { class, term, status: "published" | "locked" | "draft" }
export const setResultPublication = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, term, status } = req.body as {
      class?: string;
      term?: string;
      status?: ResultStatus;
    };
    if (!classId || !term || !["draft", "published", "locked"].includes(status || "")) {
      return res.status(400).json({ message: "class, term, and a valid status are required" });
    }
    if (!(await canManageClass(req, classId))) {
      return res.status(403).json({ message: "You cannot manage results for this class" });
    }

    const now = new Date();
    const update: Record<string, unknown> = { status };
    if (status === "published") {
      update.publishedBy = req.user!.id;
      update.publishedAt = now;
      update.lockedBy = null;
      update.lockedAt = null;
    } else if (status === "locked") {
      update.lockedBy = req.user!.id;
      update.lockedAt = now;
    } else {
      update.publishedBy = null;
      update.publishedAt = null;
      update.lockedBy = null;
      update.lockedAt = null;
    }

    const publication = await ResultPublication.findOneAndUpdate(
      { class: classId as any, term: term as any },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
      .populate("publishedBy", "name email")
      .populate("lockedBy", "name email");

    res.status(200).json(publication);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/result-publications/batch
// body: { classIds: string[], term: string, status: "draft" | "published" | "locked" }
export const batchSetResultPublication = async (req: AuthRequest, res: Response) => {
  try {
    const { classIds, term, status } = req.body as {
      classIds?: string[];
      term?: string;
      status?: ResultStatus;
    };

    if (!Array.isArray(classIds) || classIds.length === 0 || !term || !["draft", "published", "locked"].includes(status || "")) {
      return res.status(400).json({ message: "classIds (array), term, and valid status are required" });
    }

    // Filter to classes the user can manage
    const allowedClassIds: string[] = [];
    for (const cid of classIds) {
      if (await canManageClass(req, cid)) {
        allowedClassIds.push(cid);
      }
    }

    if (allowedClassIds.length === 0) {
      return res.status(403).json({ message: "You are not authorized to manage any of the specified classes" });
    }

    const now = new Date();
    const update: Record<string, unknown> = { status };
    if (status === "published") {
      update.publishedBy = req.user!.id;
      update.publishedAt = now;
      update.lockedBy = null;
      update.lockedAt = null;
    } else if (status === "locked") {
      update.lockedBy = req.user!.id;
      update.lockedAt = now;
    } else {
      update.publishedBy = null;
      update.publishedAt = null;
      update.lockedBy = null;
      update.lockedAt = null;
    }

    const operations = allowedClassIds.map((cid) => ({
      updateOne: {
        filter: { class: cid, term },
        update: { $set: update },
        upsert: true,
      },
    }));

    await ResultPublication.bulkWrite(operations);

    const updatedPublications = await ResultPublication.find({
      class: { $in: allowedClassIds },
      term: term as any,
    })
      .populate("publishedBy", "name email")
      .populate("lockedBy", "name email");

    res.status(200).json({
      message: `Updated status to '${status}' for ${allowedClassIds.length} classes`,
      publications: updatedPublications,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const isStudentResultPublished = async (studentId: string, termId: string) => {
  const student = await Student.findById(studentId).select("class");
  if (!student) return false;
  const publication = await ResultPublication.findOne({ class: student.class as any, term: termId as any });
  return publication?.status === "published" || publication?.status === "locked";
};

export const isClassResultLocked = async (classId: string, termId: string) => {
  const publication = await ResultPublication.findOne({ class: classId as any, term: termId as any });
  return publication?.status === "locked";
};

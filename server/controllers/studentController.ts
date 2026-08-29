import { Response } from "express";
import Student from "../models/Student";
import { AuthRequest } from "../middleware/auth";
import Score from "../models/Score";

// Re-sorts every student in a class alphabetically (Arabic-aware collation,
// since names are typically in Arabic script) and reassigns numberInClass
// 1..N based on that order. Called after any add/delete so numbers never
// have gaps or duplicates, and always reflect alphabetical order — this
// solves both problems (renumbering on delete, and alphabetical sorting)
// with one mechanism instead of two separate fixes.
const renumberClass = async (classId: string) => {
  const students = await Student.find({ class: classId });

  // 'ar' locale collation sorts Arabic script correctly (by actual letter
  // order, not raw character codes); it also handles Latin names
  // reasonably if a class ever has mixed-script names.
  const collator = new Intl.Collator("ar");
  const sorted = [...students].sort((a, b) => {
    // males first, then females — gender takes priority over name
    if (a.gender !== b.gender) {
      return a.gender === "M" ? -1 : 1;
    }
    // within the same gender, alphabetical by name
    return collator.compare(a.name, b.name);
  });

  await Promise.all(
    sorted.map((student, index) =>
      Student.findByIdAndUpdate(student._id, { numberInClass: index + 1 })
    )
  );
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { name, gender, class: classId, branch } = req.body;

    // numberInClass is set properly by renumberClass right after — this
    // initial value is just a placeholder so the document is valid
    const student = await Student.create({
      name,
      gender,
      class: classId,
      branch,
      numberInClass: 0,
    });

    await renumberClass(classId);

    const updated = await Student.findById(student._id);
    res.status(201).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// POST /api/students/bulk
export const bulkCreateStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { class: classId, branch, students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "students array is required" });
    }

    const toInsert = students.map((s: { name: string; gender: "M" | "F" }) => ({
      name: s.name,
      gender: s.gender || "M",
      class: classId,
      branch,
      numberInClass: 0, // placeholder — renumberClass fixes this right after
    }));

    const created = await Student.insertMany(toInsert);

    await renumberClass(classId);

    const updated = await Student.find({ class: classId }).sort({ numberInClass: 1 });
    res.status(201).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// GET /api/students?class=<id>&branch=<id>
export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, string> = {};
    if (req.query.class) filter.class = req.query.class as string;

    if (req.user?.role === "branch_admin" && req.user.branch) {
      filter.branch = req.user.branch;
    } else if (req.query.branch) {
      filter.branch = req.query.branch as string;
    }

    const students = await Student.find(filter)
      .populate("class", "name arm")
      .sort({ numberInClass: 1 });
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Student not found" });

    // if the name changed, their alphabetical position may have changed
    // too — renumber so the class stays correctly ordered
    await renumberClass(updated.class.toString());

    const refreshed = await Student.findById(updated._id);
    res.status(200).json(refreshed);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await Student.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Student not found" });

    // clean up their score history too — otherwise those records become
    // orphaned, referencing a student that no longer exists, which can
    // crash any query that populates and expects the student to be there
    await Score.deleteMany({ student: req.params.id });

    await renumberClass(deleted.class.toString());
    res.status(200).json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
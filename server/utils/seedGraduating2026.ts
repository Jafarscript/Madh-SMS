import Branch from "../models/Branch";
import ClassModel from "../models/Class";
import Student from "../models/Student";
import { GRADUATING_ROSTER_2026 } from "../data/graduatingRoster2026";
import { seedGraduatingClassSubjects } from "./graduatingAccess";

const renumberClassStudents = async (classId: string) => {
  const students = await Student.find({ class: classId, status: "active" });
  const collator = new Intl.Collator("ar");
  const sorted = [...students].sort((a, b) => {
    if (a.gender !== b.gender) {
      return a.gender === "M" ? -1 : 1;
    }
    return collator.compare(a.name, b.name);
  });

  await Promise.all(
    sorted.map((st, idx) =>
      Student.updateOne({ _id: st._id }, { $set: { numberInClass: idx + 1 } })
    )
  );
};

export interface GraduatingSetupSummary {
  branchName: string;
  classesCreated: number;
  classesExisting: number;
  studentsInserted: number;
  studentsUpdated: number;
  subjectsSeeded: number;
}

export const ensureGraduating2026Setup = async (): Promise<GraduatingSetupSummary> => {
  // All graduating classes & result collation are handled by Permanent site (Ronik)
  let ronikBranch =
    (await Branch.findOne({ name: /ronik/i })) ||
    (await Branch.findOne({ name: /permanent/i })) ||
    (await Branch.findOne());

  if (!ronikBranch) {
    ronikBranch = await Branch.create({
      name: "Permanent site (Ronik)",
      address: "Ronik Campus, Ejigbo, Lagos",
    });
  }

  const branchId = ronikBranch._id.toString();

  let classesCreated = 0;
  let classesExisting = 0;
  let studentsInserted = 0;
  let studentsUpdated = 0;
  let subjectsSeeded = 0;

  for (const group of GRADUATING_ROSTER_2026) {
    let classDoc = await ClassModel.findOne({
      branch: branchId,
      name: group.className,
      $or: [{ arm: group.arm }, { sourceSchool: group.sourceSchool }],
    });

    if (!classDoc) {
      classDoc = await ClassModel.create({
        name: group.className,
        arm: group.arm,
        category: group.category,
        branch: branchId,
        isGraduating: true,
        graduatingLevel: group.graduatingLevel,
        sourceSchool: group.sourceSchool,
        secondaryResultMode: "current_only",
      });
      classesCreated++;
    } else {
      classesExisting++;
      // Ensure graduating metadata flags are populated without overriding admin customization of secondaryResultMode
      const updates: Record<string, any> = {};
      if (!classDoc.isGraduating) updates.isGraduating = true;
      if (!classDoc.graduatingLevel) updates.graduatingLevel = group.graduatingLevel;
      if (!classDoc.sourceSchool) updates.sourceSchool = group.sourceSchool;
      if (!classDoc.arm) updates.arm = group.arm;
      if (classDoc.category !== group.category) updates.category = group.category;
      if (Object.keys(updates).length > 0) {
        await ClassModel.updateOne({ _id: classDoc._id }, { $set: updates });
      }
    }

    const classId = classDoc._id.toString();
    const seededCount = await seedGraduatingClassSubjects(classId, group.graduatingLevel, branchId);
    subjectsSeeded += seededCount;

    for (const s of group.students) {
      const existingStudent = await Student.findOne({
        $or: [
          { seatNumber: s.seatNumber },
          { admissionNumber: s.seatNumber },
        ],
      });

      if (!existingStudent) {
        await Student.create({
          name: s.name,
          gender: s.gender,
          class: classId,
          branch: branchId,
          seatNumber: s.seatNumber,
          admissionNumber: s.seatNumber,
          studentCode: s.seatNumber,
          sourceSchool: group.sourceSchool,
          numberInClass: 0,
          status: "active",
          joinedTerm: 1,
          enrolledTerms: [1, 2, 3],
          resultModeOverride: "default",
        });
        studentsInserted++;
      } else {
        const stUpdates: Record<string, any> = {};
        if (existingStudent.seatNumber !== s.seatNumber) stUpdates.seatNumber = s.seatNumber;
        if (!existingStudent.sourceSchool) stUpdates.sourceSchool = group.sourceSchool;
        if (existingStudent.branch?.toString() !== branchId) stUpdates.branch = branchId;
        if (existingStudent.class?.toString() !== classId) stUpdates.class = classId;
        if (Object.keys(stUpdates).length > 0) {
          await Student.updateOne({ _id: existingStudent._id }, { $set: stUpdates });
          studentsUpdated++;
        }
      }
    }

    await renumberClassStudents(classId);
  }

  return {
    branchName: ronikBranch.name,
    classesCreated,
    classesExisting,
    studentsInserted,
    studentsUpdated,
    subjectsSeeded,
  };
};

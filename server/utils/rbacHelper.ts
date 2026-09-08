import User, { IUser } from "../models/User";
import Class from "../models/Class";
import Subject from "../models/Subject";
import Student from "../models/Student";
import { AuthRequest } from "../middleware/auth";

export interface UserScope {
  userId: string;
  role: string;
  branchId?: string;
  assignedClassIds: string[];
  assignedSubjectIds: string[];
  allAllowedClassIds: string[];
}

/**
 * Resolves the authenticated user's role and associated branch, classes, and subjects.
 */
export const getUserScope = async (req: AuthRequest): Promise<UserScope | null> => {
  if (!req.user?.id) return null;

  const user = await User.findById(req.user.id).select("role branch classes subjects");
  if (!user) return null;

  const branchId = user.branch ? user.branch.toString() : req.user.branch?.toString();
  const assignedClassIds = (user.classes || []).map((c) => c.toString());
  const assignedSubjectIds = (user.subjects || []).map((s) => s.toString());

  let allAllowedClassIds = [...assignedClassIds];

  // For subject_teacher, they can also access classes that contain their assigned subjects
  if (user.role === "subject_teacher" && assignedSubjectIds.length > 0) {
    const subjects = await Subject.find({ _id: { $in: assignedSubjectIds } }).select("class");
    const subjectClassIds = subjects
      .filter((s) => s.class)
      .map((s) => s.class.toString());
    allAllowedClassIds = Array.from(new Set([...allAllowedClassIds, ...subjectClassIds]));
  }

  return {
    userId: user._id.toString(),
    role: user.role,
    branchId,
    assignedClassIds,
    assignedSubjectIds,
    allAllowedClassIds,
  };
};

/**
 * Checks whether the current user is authorized to access a given branch.
 */
export const canAccessBranch = (scope: UserScope, branchId: string): boolean => {
  if (scope.role === "super_admin") return true;
  if (scope.role === "branch_admin") {
    return !!scope.branchId && scope.branchId === branchId.toString();
  }
  return true;
};

/**
 * Checks whether the current user is authorized to access a given class.
 */
export const canAccessClassById = async (scope: UserScope, classId: string): Promise<boolean> => {
  if (scope.role === "super_admin") return true;

  if (scope.role === "branch_admin") {
    if (!scope.branchId) return false;
    const classDoc = await Class.findById(classId).select("branch");
    if (!classDoc || !classDoc.branch) return false;
    return classDoc.branch.toString() === scope.branchId;
  }

  if (scope.role === "class_teacher") {
    return scope.assignedClassIds.includes(classId.toString());
  }

  if (scope.role === "subject_teacher") {
    return scope.allAllowedClassIds.includes(classId.toString());
  }

  return false;
};

/**
 * Checks whether the current user is authorized to access a given subject.
 */
export const canAccessSubjectById = async (scope: UserScope, subjectId: string): Promise<boolean> => {
  if (scope.role === "super_admin") return true;

  const subjectDoc = await Subject.findById(subjectId).select("class");
  if (!subjectDoc) return false;

  if (scope.role === "branch_admin") {
    return canAccessClassById(scope, subjectDoc.class.toString());
  }

  if (scope.role === "class_teacher") {
    const isInClass = scope.assignedClassIds.includes(subjectDoc.class.toString());
    const isAssigned = scope.assignedSubjectIds.includes(subjectId.toString());
    return isInClass || isAssigned;
  }

  if (scope.role === "subject_teacher") {
    return scope.assignedSubjectIds.includes(subjectId.toString());
  }

  return false;
};

/**
 * Checks whether the current user is authorized to access a given student.
 */
export const canAccessStudentById = async (scope: UserScope, studentId: string): Promise<boolean> => {
  if (scope.role === "super_admin") return true;

  const studentDoc = await Student.findById(studentId).select("class branch");
  if (!studentDoc) return false;

  if (scope.role === "branch_admin") {
    if (!scope.branchId) return false;
    return studentDoc.branch.toString() === scope.branchId;
  }

  if (scope.role === "class_teacher") {
    return scope.assignedClassIds.includes(studentDoc.class.toString());
  }

  if (scope.role === "subject_teacher") {
    return scope.allAllowedClassIds.includes(studentDoc.class.toString());
  }

  return false;
};

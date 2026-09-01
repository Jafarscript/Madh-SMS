import mongoose, { Schema, Document, Types } from "mongoose";

export type UserRole =
  | "super_admin"
  | "branch_admin"
  | "class_teacher"
  | "subject_teacher"
  | "parent";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  status: "active" | "pending_approval" | "rejected" | "suspended";
  rejectionReason?: string;
  branch?: Types.ObjectId;          // relevant for branch_admin, teachers
  classes?: Types.ObjectId[];       // classes this class_teacher/subject_teacher is tied to
  subjects?: Types.ObjectId[];      // specific subjects a subject_teacher can enter scores for
  linkedStudent?: Types.ObjectId;   // for parent accounts (single / primary child)
  linkedStudents?: Types.ObjectId[]; // for parent accounts with multiple children
  mustChangePassword: boolean; 
  staffCodeUsed?: string;
  resetPasswordCode?: string;
  resetPasswordExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "branch_admin", "class_teacher", "subject_teacher", "parent"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "pending_approval", "rejected", "suspended"],
      default: "active",
    },
    rejectionReason: { type: String },
    branch: { type: Schema.Types.ObjectId, ref: "Branch" },
    classes: [{ type: Schema.Types.ObjectId, ref: "Class" }],
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    linkedStudent: { type: Schema.Types.ObjectId, ref: "Student" },
    linkedStudents: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    mustChangePassword: { type: Boolean, default: true },
    staffCodeUsed: { type: String },
    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
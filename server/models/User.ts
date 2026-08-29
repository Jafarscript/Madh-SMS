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
  password: string;
  role: UserRole;
  branch?: Types.ObjectId;          // relevant for branch_admin, teachers
  classes?: Types.ObjectId[];       // classes this class_teacher/subject_teacher is tied to
  subjects?: Types.ObjectId[];      // specific subjects a subject_teacher can enter scores for
  linkedStudent?: Types.ObjectId;   // for parent accounts
  mustChangePassword: boolean; 
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["super_admin", "branch_admin", "class_teacher", "subject_teacher", "parent"],
    required: true,
  },
  branch: { type: Schema.Types.ObjectId, ref: "Branch" },
  classes: [{ type: Schema.Types.ObjectId, ref: "Class" }],
  subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
  linkedStudent: { type: Schema.Types.ObjectId, ref: "Student" },
  mustChangePassword: { type: Boolean, default: true },
});

export default mongoose.model<IUser>("User", UserSchema);
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudent extends Document {
  name: string;
  gender: "M" | "F";
  class: Types.ObjectId;
  branch: Types.ObjectId;
  numberInClass?: number;
  admissionNumber?: string;
  studentCode?: string;
  parentPhone?: string;
  parentEmail?: string;
  status: "active" | "graduated" | "transferred" | "archived";
  graduationSession?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    name: { type: String, required: true },
    gender: { type: String, enum: ["M", "F"], required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    branch: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    numberInClass: { type: Number },
    admissionNumber: { type: String, trim: true },
    studentCode: { type: String, trim: true },
    parentPhone: { type: String, trim: true },
    parentEmail: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "graduated", "transferred", "archived"],
      default: "active",
    },
    graduationSession: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IStudent>("Student", StudentSchema);
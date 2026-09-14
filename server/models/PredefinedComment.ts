import mongoose, { Schema, Document } from "mongoose";

export interface IPredefinedComment extends Document {
  code: string;
  en: string;
  ar: string;
  gender: "M" | "F" | "N";
  category: "excellence" | "commendable" | "progress" | "effort" | "behavior" | "support";
  targetRole: "both" | "teacher" | "principal";
  isDefault: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const PredefinedCommentSchema: Schema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    en: { type: String, required: true, trim: true },
    ar: { type: String, required: true, trim: true },
    gender: {
      type: String,
      enum: ["M", "F", "N"],
      default: "N",
      required: true,
    },
    category: {
      type: String,
      enum: ["excellence", "commendable", "progress", "effort", "behavior", "support"],
      default: "commendable",
      required: true,
    },
    targetRole: {
      type: String,
      enum: ["both", "teacher", "principal"],
      default: "both",
      required: true,
    },
    isDefault: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IPredefinedComment>(
  "PredefinedComment",
  PredefinedCommentSchema
);

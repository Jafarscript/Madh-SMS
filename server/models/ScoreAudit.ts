import mongoose, { Schema, Document, Types } from "mongoose";

export interface IScoreAudit extends Document {
  student: Types.ObjectId;
  subject: Types.ObjectId;
  term: Types.ObjectId;
  class?: Types.ObjectId;
  action: "create" | "update" | "delete" | "bulk_import";
  previousScore?: {
    ca?: number;
    exam?: number;
    total?: number;
  };
  newScore: {
    ca?: number;
    exam?: number;
    total?: number;
  };
  changedBy: Types.ObjectId;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScoreAuditSchema = new Schema<IScoreAudit>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    term: { type: Schema.Types.ObjectId, ref: "Term", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class" },
    action: {
      type: String,
      enum: ["create", "update", "delete", "bulk_import"],
      default: "create",
      required: true,
    },
    previousScore: {
      ca: { type: Number },
      exam: { type: Number },
      total: { type: Number },
    },
    newScore: {
      ca: { type: Number },
      exam: { type: Number },
      total: { type: Number },
    },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);

ScoreAuditSchema.index({ student: 1, subject: 1, term: 1 });
ScoreAuditSchema.index({ class: 1, term: 1 });
ScoreAuditSchema.index({ changedBy: 1 });
ScoreAuditSchema.index({ createdAt: -1 });

export default mongoose.model<IScoreAudit>("ScoreAudit", ScoreAuditSchema);

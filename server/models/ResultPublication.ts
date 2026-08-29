import mongoose, { Document, Schema, Types } from "mongoose";

export type ResultStatus = "draft" | "published" | "locked";

export interface IResultPublication extends Document {
  class: Types.ObjectId;
  term: Types.ObjectId;
  status: ResultStatus;
  publishedBy?: Types.ObjectId;
  publishedAt?: Date;
  lockedBy?: Types.ObjectId;
  lockedAt?: Date;
}

const ResultPublicationSchema = new Schema<IResultPublication>(
  {
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    term: { type: Schema.Types.ObjectId, ref: "Term", required: true },
    status: {
      type: String,
      enum: ["draft", "published", "locked"],
      default: "draft",
      required: true,
    },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
    publishedAt: { type: Date },
    lockedBy: { type: Schema.Types.ObjectId, ref: "User" },
    lockedAt: { type: Date },
  },
  { timestamps: true },
);

ResultPublicationSchema.index({ class: 1, term: 1 }, { unique: true });

export default mongoose.model<IResultPublication>(
  "ResultPublication",
  ResultPublicationSchema,
);

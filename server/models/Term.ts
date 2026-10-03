import mongoose, { Schema, Document } from "mongoose";

export interface ITerm extends Document {
  session: string;          // e.g. "2026/2027"
  termNumber: 1 | 2 | 3;
  isActive: boolean;
  timesSchoolOpened?: number | null;
  dateResumed?: string;
  dateClosed?: string;
  nextResumption?: string;
}

const TermSchema = new Schema<ITerm>({
  session: { type: String, required: true },
  termNumber: { type: Number, enum: [1, 2, 3], required: true },
  isActive: { type: Boolean, default: false },
  timesSchoolOpened: { type: Number, default: null },
  dateResumed: { type: String, default: "" },
  dateClosed: { type: String, default: "" },
  nextResumption: { type: String, default: "" },
});

export default mongoose.model<ITerm>("Term", TermSchema);
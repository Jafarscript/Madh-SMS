import mongoose, { Schema, Document } from "mongoose";

export interface ITerm extends Document {
  session: string;          // e.g. "2026/2027"
  termNumber: 1 | 2 | 3;
  isActive: boolean;
}

const TermSchema = new Schema<ITerm>({
  session: { type: String, required: true },
  termNumber: { type: Number, enum: [1, 2, 3], required: true },
  isActive: { type: Boolean, default: false },
});

export default mongoose.model<ITerm>("Term", TermSchema);
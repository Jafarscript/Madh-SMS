import mongoose, { Schema, Document, Types } from "mongoose";

export interface IScore extends Document {
  student: Types.ObjectId;
  subject: Types.ObjectId;
  term: Types.ObjectId;
  ca: number;    // out of 40
  exam: number;  // out of 60
  total: number; // ca + exam, out of 100
  enteredBy: Types.ObjectId; // subject teacher who entered it
}

const ScoreSchema = new Schema<IScore>({
  student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  term: { type: Schema.Types.ObjectId, ref: "Term", required: true },
  ca: { type: Number, required: true, min: 0, max: 40 },
  exam: { type: Number, required: true, min: 0, max: 60 },
  total: { type: Number, required: true, min: 0, max: 100 },
  enteredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

// prevent duplicate score entries for the same student+subject+term
ScoreSchema.index({ student: 1, subject: 1, term: 1 }, { unique: true });

export default mongoose.model<IScore>("Score", ScoreSchema);
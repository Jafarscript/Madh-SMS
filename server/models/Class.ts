import mongoose, { Schema, Document, Types } from "mongoose";

// An "arm" is optional — e.g. Class "Grade 2" may have arms "A" and "B",
// or no arm at all. We model each class+arm combo as its own document
// so broadsheets/report cards can reference one specific arm directly.
export interface IClass extends Document {
  name: string;          // e.g. "Grade 2"
  arm?: string;           // e.g. "A" — omitted if class has no arms
  branch: Types.ObjectId;
  createdAt: Date;
}

const ClassSchema = new Schema<IClass>({
  name: { type: String, required: true },
  arm: { type: String }, // optional on purpose
  branch: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IClass>("Class", ClassSchema);
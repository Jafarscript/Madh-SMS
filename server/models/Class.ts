import mongoose, { Schema, Document, Types } from "mongoose";

// An "arm" is optional — e.g. Class "Grade 2" may have arms "A" and "B",
// or no arm at all. We model each class+arm combo as its own document
// so broadsheets/report cards can reference one specific arm directly.
export type GraduatingLevel = "elementary" | "junior_secondary" | "senior_secondary";
export type SecondaryResultMode = "current_only" | "combine_1st_and_3rd";

export interface IClass extends Document {
  name: string;          // e.g. "Grade 2" or "STAGE ONE"
  arm?: string;           // e.g. "A" — omitted if class has no arms
  category?: "secondary" | "elementary";
  branch: Types.ObjectId;
  isGraduating?: boolean;
  graduatingLevel?: GraduatingLevel;
  sourceSchool?: string;
  secondaryResultMode?: SecondaryResultMode;
  createdAt: Date;
}

const ClassSchema = new Schema<IClass>({
  name: { type: String, required: true },
  arm: { type: String }, // optional on purpose
  category: {
    type: String,
    enum: ["secondary", "elementary"],
    default: "secondary",
  },
  branch: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  isGraduating: { type: Boolean, default: false },
  graduatingLevel: {
    type: String,
    enum: ["elementary", "junior_secondary", "senior_secondary"],
  },
  sourceSchool: { type: String, trim: true },
  secondaryResultMode: {
    type: String,
    enum: ["current_only", "combine_1st_and_3rd"],
    default: "current_only",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IClass>("Class", ClassSchema);
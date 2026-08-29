import mongoose, { Schema, Document } from "mongoose";

// Admin-configurable grading bands, e.g.
// { minScore: 70, maxScore: 100, grade: "A1", remark: "Very Good" }
export interface IGradeBand {
  minScore: number;
  maxScore: number;
  grade: string;
  remark: string;
  remarkArabic: string;
}

export interface IGradingScale extends Document {
  name: string; // e.g. "Default Scale" — school might want more than one
  bands: IGradeBand[];
}

const GradeBandSchema = new Schema<IGradeBand>(
  {
    minScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    grade: { type: String, required: true },
    remark: { type: String, required: true },
    remarkArabic: { type: String, required: true },
  },
  { _id: false }
);

const GradingScaleSchema = new Schema<IGradingScale>({
  name: { type: String, required: true },
  bands: [GradeBandSchema],
});

export default mongoose.model<IGradingScale>("GradingScale", GradingScaleSchema);
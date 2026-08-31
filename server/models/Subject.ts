import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubject extends Document {
  nameEnglish: string;   // e.g. "Hadith"
  nameArabic?: string;   // e.g. "الحديث"
  class: Types.ObjectId; // subjects are assigned per class, not school-wide
  order?: number;        // display/curriculum sequence order
}

const SubjectSchema = new Schema<ISubject>({
  nameEnglish: { type: String, required: true },
  nameArabic: { type: String },
  class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  order: { type: Number, default: 0 },
});

export default mongoose.model<ISubject>("Subject", SubjectSchema);
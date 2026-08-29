import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudent extends Document {
  name: string;
  gender: "M" | "F";
  class: Types.ObjectId;
  branch: Types.ObjectId;
  numberInClass?: number;
}

const StudentSchema = new Schema<IStudent>({
  name: { type: String, required: true },
  gender: { type: String, enum: ["M", "F"], required: true },
  class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  branch: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  numberInClass: { type: Number },
});

export default mongoose.model<IStudent>("Student", StudentSchema);
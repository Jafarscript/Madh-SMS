import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAttendanceSetting extends Document {
  term: Types.ObjectId;
  branch?: Types.ObjectId;
  class?: Types.ObjectId;
  timesSchoolOpened?: number | null;
  dateResumed?: string;
  dateClosed?: string;
  nextResumption?: string;
  updatedBy?: Types.ObjectId;
}

const AttendanceSettingSchema = new Schema<IAttendanceSetting>(
  {
    term: { type: Schema.Types.ObjectId, ref: "Term", required: true },
    branch: { type: Schema.Types.ObjectId, ref: "Branch" },
    class: { type: Schema.Types.ObjectId, ref: "Class" },
    timesSchoolOpened: { type: Number, default: null },
    dateResumed: { type: String, default: "" },
    dateClosed: { type: String, default: "" },
    nextResumption: { type: String, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

AttendanceSettingSchema.index({ term: 1, class: 1 }, { unique: true, sparse: true });
AttendanceSettingSchema.index({ term: 1, branch: 1 });

export default mongoose.model<IAttendanceSetting>(
  "AttendanceSetting",
  AttendanceSettingSchema
);

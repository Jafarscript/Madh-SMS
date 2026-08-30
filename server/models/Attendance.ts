import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAttendance extends Document {
  student: Types.ObjectId;
  class: Types.ObjectId;
  term: Types.ObjectId;
  timesPresent?: number | null;
  timesAbsent?: number | null;
  recordedBy?: Types.ObjectId;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    term: { type: Schema.Types.ObjectId, ref: "Term", required: true },
    timesPresent: { type: Number, default: null },
    timesAbsent: { type: Number, default: null },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

AttendanceSchema.index({ student: 1, term: 1 }, { unique: true });
AttendanceSchema.index({ class: 1, term: 1 });

export default mongoose.model<IAttendance>("Attendance", AttendanceSchema);

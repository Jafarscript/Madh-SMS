import mongoose, { Document, Schema, Types } from "mongoose";

export type AttendanceStatus = "present" | "absent" | "late";

export interface IAttendance extends Document {
  student: Types.ObjectId;
  class: Types.ObjectId;
  term: Types.ObjectId;
  date: string;
  status: AttendanceStatus;
  recordedBy: Types.ObjectId;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    term: { type: Schema.Types.ObjectId, ref: "Term", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD: timezone-safe school day
    status: { type: String, enum: ["present", "absent", "late"], required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

AttendanceSchema.index({ student: 1, term: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ class: 1, term: 1, date: 1 });

export default mongoose.model<IAttendance>("Attendance", AttendanceSchema);

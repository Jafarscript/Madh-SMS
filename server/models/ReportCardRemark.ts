import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReportCardRemark extends Document {
  student: Types.ObjectId;
  term: Types.ObjectId;
  classTeacherCommentId?: string;
  classTeacherCommentEn?: string;
  classTeacherCommentAr?: string;
  principalCommentId?: string;
  principalCommentEn?: string;
  principalCommentAr?: string;
  enteredBy: Types.ObjectId;
}

const ReportCardRemarkSchema = new Schema<IReportCardRemark>({
  student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  term: { type: Schema.Types.ObjectId, ref: "Term", required: true },
  classTeacherCommentId: { type: String },
  classTeacherCommentEn: { type: String },
  classTeacherCommentAr: { type: String },
  principalCommentId: { type: String },
  principalCommentEn: { type: String },
  principalCommentAr: { type: String },
  enteredBy: { type: Schema.Types.ObjectId, ref: "User" },
});

ReportCardRemarkSchema.index({ student: 1, term: 1 }, { unique: true });

export default mongoose.model<IReportCardRemark>("ReportCardRemark", ReportCardRemarkSchema);
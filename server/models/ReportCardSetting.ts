import mongoose, { Document, Schema, Types } from "mongoose";

export interface IReportCardSetting extends Document {
  schoolNameArabic: string;
  schoolNameEnglish: string;
  address: string;
  logoBase64?: string;
  primaryColor: string;
  headerColor: string;
  showPrincipalSignature: boolean;
  principalSignatureBase64?: string;
  showStamp: boolean;
  stampBase64?: string;
  watermarkText?: string;
  staffRegistrationCode?: string;
  updatedBy?: Types.ObjectId;
}

const ReportCardSettingSchema = new Schema<IReportCardSetting>(
  {
    schoolNameArabic: {
      type: String,
      default: "معهد التعليم العربي الإسلامي",
    },
    schoolNameEnglish: {
      type: String,
      default: "INSTITUTE OF ARABIC AND ISLAMIC STUDIES",
    },
    address: {
      type: String,
      default:
        "18/20 ADEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665",
    },
    logoBase64: { type: String, default: "" },
    primaryColor: { type: String, default: "#16a34a" },
    headerColor: { type: String, default: "#1e3a8a" },
    showPrincipalSignature: { type: Boolean, default: false },
    principalSignatureBase64: { type: String, default: "" },
    showStamp: { type: Boolean, default: false },
    stampBase64: { type: String, default: "" },
    watermarkText: { type: String, default: "" },
    staffRegistrationCode: { type: String, default: "STAFF-2026" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IReportCardSetting>(
  "ReportCardSetting",
  ReportCardSettingSchema
);

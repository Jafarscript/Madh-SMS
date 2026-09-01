import { Request, Response } from "express";
import ReportCardSetting from "../models/ReportCardSetting";
import { AuthRequest } from "../middleware/auth";

export const getReportCardSetting = async (_req: Request, res: Response) => {
  try {
    let setting = await ReportCardSetting.findOne();
    if (!setting) {
      setting = await ReportCardSetting.create({
        schoolNameArabic: "معهد التعليم العربي الإسلامي",
        schoolNameEnglish: "INSTITUTE OF ARABIC AND ISLAMIC STUDIES",
        address:
          "18/20 ADEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665",
        logoBase64: "",
        primaryColor: "#16a34a",
        headerColor: "#1e3a8a",
        showPrincipalSignature: false,
        principalSignatureBase64: "",
        showStamp: false,
        stampBase64: "",
        watermarkText: "",
      });
    } else if (setting.address && setting.address.includes("ABEWALE")) {
      setting.address = setting.address.replace(/ABEWALE/g, "ADEWALE");
      await setting.save();
    }
    res.status(200).json(setting);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateReportCardSetting = async (req: AuthRequest, res: Response) => {
  try {
    const {
      schoolNameArabic,
      schoolNameEnglish,
      address,
      logoBase64,
      primaryColor,
      headerColor,
      showPrincipalSignature,
      principalSignatureBase64,
      showStamp,
      stampBase64,
      watermarkText,
    } = req.body;

    let setting = await ReportCardSetting.findOne();
    if (!setting) {
      setting = new ReportCardSetting({});
    }

    if (schoolNameArabic !== undefined) setting.schoolNameArabic = schoolNameArabic;
    if (schoolNameEnglish !== undefined) setting.schoolNameEnglish = schoolNameEnglish;
    if (address !== undefined) setting.address = address;
    if (logoBase64 !== undefined) setting.logoBase64 = logoBase64;
    if (primaryColor !== undefined) setting.primaryColor = primaryColor;
    if (headerColor !== undefined) setting.headerColor = headerColor;
    if (showPrincipalSignature !== undefined)
      setting.showPrincipalSignature = showPrincipalSignature;
    if (principalSignatureBase64 !== undefined)
      setting.principalSignatureBase64 = principalSignatureBase64;
    if (showStamp !== undefined) setting.showStamp = showStamp;
    if (stampBase64 !== undefined) setting.stampBase64 = stampBase64;
    if (watermarkText !== undefined) setting.watermarkText = watermarkText;

    if (req.user) {
      setting.updatedBy = (req.user as any)._id;
    }

    await setting.save();
    res.status(200).json(setting);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const resetReportCardSetting = async (req: AuthRequest, res: Response) => {
  try {
    let setting = await ReportCardSetting.findOne();
    if (setting) {
      await ReportCardSetting.deleteOne({ _id: setting._id });
    }

    const defaultSetting = await ReportCardSetting.create({
      schoolNameArabic: "معهد التعليم العربي الإسلامي",
      schoolNameEnglish: "INSTITUTE OF ARABIC AND ISLAMIC STUDIES",
      address:
        "18/20 ADEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665",
      logoBase64: "",
      primaryColor: "#16a34a",
      headerColor: "#1e3a8a",
      showPrincipalSignature: false,
      principalSignatureBase64: "",
      showStamp: false,
      stampBase64: "",
      watermarkText: "",
      updatedBy: req.user ? (req.user as any)._id : undefined,
    });

    res.status(200).json(defaultSetting);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

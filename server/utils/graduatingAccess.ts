import ClassModel, { GraduatingLevel, SecondaryResultMode } from "../models/Class";
import Subject from "../models/Subject";
import { AuthRequest } from "../middleware/auth";
import { ELEMENTARY_FIXED_SUBJECTS } from "../constants/elementarySubjects";

export const normalizeArabicText = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "")
    .trim();
};

export const detectGraduatingLevel = (name: string): GraduatingLevel | undefined => {
  const n = normalizeArabicText(name || "");
  const raw = (name || "").toLowerCase();

  // Junior Secondary: الثالث الإعدادي / ثالث إعدادي / JSS 3
  if (
    (/ثالث|3/.test(n) && n.includes("اعدادي")) ||
    /\bjss\s*3\b/i.test(raw) ||
    /3rd.*junior\s*secondary/i.test(raw)
  ) {
    return "junior_secondary";
  }

  // Senior Secondary: الثالث الثانوي / ثالث ثانوي / SSS 3
  if (
    (/ثالث|3/.test(n) && n.includes("ثانوي")) ||
    /\bsss\s*3\b/i.test(raw) ||
    /3rd.*senior\s*secondary/i.test(raw)
  ) {
    return "senior_secondary";
  }

  // Elementary graduating: الإبتدائي / الابتدائي (must NOT contain اعدادي or ثانوي)
  if (
    !n.includes("اعدادي") &&
    !n.includes("ثانوي") &&
    (n.includes("ابتدائ") || /\bgraduating\b.*\belementary\b/i.test(raw))
  ) {
    return "elementary";
  }

  return undefined;
};

export const isGraduatingClass = (name: string, explicitFlag?: boolean): boolean => {
  if (explicitFlag === true) return true;
  if (detectGraduatingLevel(name) !== undefined) return true;

  const n = normalizeArabicText(name || "");
  const raw = (name || "").toLowerCase();
  if (n.includes("شهاده") || raw.includes("graduating")) {
    return true;
  }
  return false;
};

export const isClassGraduatingDoc = (
  cls: { name?: string; isGraduating?: boolean } | null | undefined
): boolean => {
  if (!cls) return false;
  return isGraduatingClass(cls.name || "", cls.isGraduating);
};

export const isSuperAdmin = (req: AuthRequest): boolean => {
  return req.user?.role === "super_admin";
};

export const compareSeatNumbers = (
  seatA?: string | null,
  seatB?: string | null,
  direction: "asc" | "desc" = "asc"
): number => {
  const a = (seatA || "").trim();
  const b = (seatB || "").trim();
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const cmp = a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });
  return direction === "desc" ? -cmp : cmp;
};

export const sortGraduatingStudents = <
  T extends { seatNumber?: string | null; numberInClass?: number | null; name?: string }
>(
  students: T[],
  direction: "asc" | "desc" = "asc"
): T[] => {
  const collator = new Intl.Collator("ar");
  return [...students].sort((a, b) => {
    const seatCmp = compareSeatNumbers(a.seatNumber, b.seatNumber, direction);
    if (seatCmp !== 0) return seatCmp;
    const numCmp = (a.numberInClass ?? 0) - (b.numberInClass ?? 0);
    if (numCmp !== 0) return numCmp;
    return collator.compare(a.name || "", b.name || "");
  });
};

export const getAllGraduatingClassIds = async (): Promise<string[]> => {
  const allClasses = await ClassModel.find().select("_id name isGraduating").lean();
  return allClasses
    .filter((c) => isClassGraduatingDoc(c))
    .map((c) => c._id.toString());
};

export const assertSuperAdminForClass = async (
  req: AuthRequest,
  classId: string
): Promise<{ allowed: boolean; classDoc: any | null; isGraduating: boolean }> => {
  const classDoc = await ClassModel.findById(classId);
  if (!classDoc) {
    return { allowed: false, classDoc: null, isGraduating: false };
  }
  const grad = isClassGraduatingDoc(classDoc);
  if (grad && !isSuperAdmin(req)) {
    return { allowed: false, classDoc, isGraduating: true };
  }
  return { allowed: true, classDoc, isGraduating: grad };
};

export const getEffectiveSecondaryResultMode = (
  classDoc: { secondaryResultMode?: SecondaryResultMode } | null | undefined,
  studentDoc: { resultModeOverride?: string } | null | undefined,
  isElementary: boolean,
  isGraduating: boolean
): "cascade" | "current_only" | "combine_1st_and_3rd" => {
  if (isElementary || !isGraduating) {
    return "cascade";
  }
  if (
    studentDoc?.resultModeOverride &&
    (studentDoc.resultModeOverride === "current_only" ||
      studentDoc.resultModeOverride === "combine_1st_and_3rd")
  ) {
    return studentDoc.resultModeOverride;
  }
  return classDoc?.secondaryResultMode || "current_only";
};

const DEFAULT_JUNIOR_SECONDARY_SUBJECTS = [
  { nameEnglish: "Quran Recitation", nameArabic: "التلاوة", order: 1 },
  { nameEnglish: "Quran Memorization", nameArabic: "الاستحفاظ", order: 2 },
  { nameEnglish: "Quran Translation", nameArabic: "التفسير", order: 3 },
  { nameEnglish: "Hadith", nameArabic: "الحديث", order: 4 },
  { nameEnglish: "Islamic Jurisprudence", nameArabic: "الفقه", order: 5 },
  { nameEnglish: "History of Prophet", nameArabic: "السيرة", order: 6 },
  { nameEnglish: "Islamic History", nameArabic: "التاريخ الإسلامي", order: 7 },
  { nameEnglish: "Islam in Nigeria", nameArabic: "الإسلام في نيجيريا", order: 8 },
  { nameEnglish: "Arabic Language", nameArabic: "العربية", order: 9 },
  { nameEnglish: "Grammar", nameArabic: "النحو", order: 10 },
  { nameEnglish: "Morphology", nameArabic: "الصرف", order: 11 },
  { nameEnglish: "Reading", nameArabic: "القراءة", order: 12 },
  { nameEnglish: "Writing", nameArabic: "الكتابة", order: 13 },
  { nameEnglish: "Conversation", nameArabic: "المحادثة", order: 14 },
  { nameEnglish: "Language drills", nameArabic: "التدريبات اللغوية", order: 15 },
];

const DEFAULT_SENIOR_SECONDARY_SUBJECTS = [
  { nameEnglish: "Quran Recitation", nameArabic: "التلاوة", order: 1 },
  { nameEnglish: "Quran Memorization", nameArabic: "الاستحفاظ", order: 2 },
  { nameEnglish: "Quran Translation", nameArabic: "التفسير", order: 3 },
  { nameEnglish: "Science of Quran", nameArabic: "علوم القرآن", order: 4 },
  { nameEnglish: "Tajweed", nameArabic: "التجويد", order: 5 },
  { nameEnglish: "Hadith", nameArabic: "الحديث", order: 6 },
  { nameEnglish: "Science of Hadith", nameArabic: "مصطلح الحديث", order: 7 },
  { nameEnglish: "Islamic Jurisprudence", nameArabic: "الفقه", order: 8 },
  { nameEnglish: "Rule of Jurisprudence", nameArabic: "أصول الفقه", order: 9 },
  { nameEnglish: "Islamic History", nameArabic: "التاريخ الإسلامي", order: 10 },
  { nameEnglish: "Islam in Nigeria", nameArabic: "الإسلام في نيجيريا", order: 11 },
  { nameEnglish: "Arabic Language", nameArabic: "العربية", order: 12 },
  { nameEnglish: "Grammar", nameArabic: "النحو", order: 13 },
  { nameEnglish: "Morphology", nameArabic: "الصرف", order: 14 },
  { nameEnglish: "Rhetoric", nameArabic: "البلاغة", order: 15 },
  { nameEnglish: "Arabic Literature", nameArabic: "الأدب العربي", order: 16 },
  { nameEnglish: "Language drills", nameArabic: "التدريبات اللغوية", order: 17 },
];

export const seedGraduatingClassSubjects = async (
  classId: string,
  level?: GraduatingLevel,
  preferredBranchId?: string
): Promise<number> => {
  const existingCount = await Subject.countDocuments({ class: classId });
  if (existingCount > 0) return 0;

  if (level === "elementary") {
    const docs = ELEMENTARY_FIXED_SUBJECTS.map((s) => ({
      nameEnglish: s.nameEnglish,
      nameArabic: s.nameArabic,
      class: classId,
      order: s.order,
    }));
    await Subject.insertMany(docs);
    return docs.length;
  }

  // Try to clone subjects from an existing class of the same or preceding level in DB
  const allClasses = await ClassModel.find().lean();
  const isJunior = level === "junior_secondary";

  const candidateClasses = allClasses
    .filter((c) => c._id.toString() !== classId)
    .sort((a, b) => {
      const scoreClass = (cls: any): number => {
        const n = normalizeArabicText(cls.name || "");
        let score = 0;
        if (preferredBranchId && cls.branch?.toString() === preferredBranchId) score += 20;
        if (isJunior) {
          if (n.includes("ثالث") && n.includes("اعدادي")) score += 100;
          else if (n.includes("ثاني") && n.includes("اعدادي")) score += 80;
          else if (n.includes("اعدادي")) score += 50;
        } else {
          if (n.includes("ثالث") && n.includes("ثانوي")) score += 100;
          else if (n.includes("ثاني") && n.includes("ثانوي")) score += 80;
          else if (n.includes("ثانوي")) score += 50;
        }
        return score;
      };
      return scoreClass(b) - scoreClass(a);
    });

  for (const candidate of candidateClasses) {
    const n = normalizeArabicText(candidate.name || "");
    const matchesLevel = isJunior ? n.includes("اعدادي") : n.includes("ثانوي");
    if (!matchesLevel) continue;

    const sourceSubjects = await Subject.find({ class: candidate._id })
      .sort({ order: 1, nameEnglish: 1 })
      .lean();
    if (sourceSubjects.length > 0) {
      const toInsert = sourceSubjects.map((s, idx) => ({
        nameEnglish: s.nameEnglish,
        nameArabic: s.nameArabic,
        class: classId,
        order: s.order ?? idx + 1,
      }));
      await Subject.insertMany(toInsert);
      return toInsert.length;
    }
  }

  // Fallback to default secondary subject list for that level
  const fallback = isJunior ? DEFAULT_JUNIOR_SECONDARY_SUBJECTS : DEFAULT_SENIOR_SECONDARY_SUBJECTS;
  const toInsert = fallback.map((s) => ({
    nameEnglish: s.nameEnglish,
    nameArabic: s.nameArabic,
    class: classId,
    order: s.order,
  }));
  await Subject.insertMany(toInsert);
  return toInsert.length;
};

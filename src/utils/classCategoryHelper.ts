/**
 * Normalizes Arabic text by standardizing alefs, taa marbuta, alif maqsura, and removing tashkeel.
 */
export const normalizeArabic = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "") // remove diacritics
    .trim();
};

/**
 * Accurately determines if a class name indicates an elementary (per-term) class.
 * Supports both Arabic and English naming conventions (e.g. مستوى الثالث, المرحلة الابتدائية, Stage 1, Grade 2, etc.)
 */
export const isElementaryClass = (name: string, category?: string): boolean => {
  if (category === "elementary") return true;

  const n = normalizeArabic(name || "");
  const raw = (name || "").toLowerCase();

  // Explicit secondary terms must be secondary
  const isExplicitSecondary =
    n.includes("اعدادي") || // إعدادي / اعدادي / الاعدادية
    n.includes("ثانوي") || // ثانوي / الثانوية
    raw.includes("jss") ||
    raw.includes("sss") ||
    raw.includes("junior secondary") ||
    raw.includes("senior secondary") ||
    raw.includes("high school") ||
    raw.includes("college");

  if (isExplicitSecondary) return false;

  const isElementaryName =
    n.includes("مستوي") || // matches مستوى and المستوي
    n.includes("مستوى") ||
    n.includes("ابتدائ") || // matches ابتدائي, ابتدائيه, الابتدائي
    n.includes("روض") || // matches روضة, رياض
    n.includes("تمهيد") || // matches تمهيدي, التمهيدي
    n.includes("حضانه") || // matches حضانة, حضانه
    n.includes("طفول") || // طفولة
    raw.includes("stage") ||
    raw.includes("elementary") ||
    raw.includes("primary") ||
    raw.includes("pry") ||
    raw.includes("basic") ||
    raw.includes("nursery") ||
    raw.includes("nur") ||
    raw.includes("kg") ||
    raw.includes("kindergarten") ||
    raw.includes("creche") ||
    raw.includes("reception") ||
    raw.includes("preschool") ||
    raw.includes("pre-school") ||
    raw.includes("playgroup") ||
    raw.includes("toddler") ||
    /\bgrade\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) ||
    /\byear\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) ||
    /\bclass\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) ||
    /\bpri(mary)?\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) ||
    /\bbasic\s*([1-6]|one|two|three|four|five|six)(?:[a-z]|\b)/i.test(raw) ||
    /(صف|الفصل|المرحله|مرحله|المستوي|مستوي)?\s*(ال)?(اول|اولي|ثاني|ثانيه|ثالث|ثالثه|رابع|رابعه|خامس|خامسه|سادس|سادسه|[1-6])/.test(n);

  if (isElementaryName) return true;
  if (category === "secondary") return false;
  return false;
};

export type GraduatingLevel = "elementary" | "junior_secondary" | "senior_secondary";

export const detectGraduatingLevel = (name: string): GraduatingLevel | undefined => {
  const n = normalizeArabic(name || "");
  const raw = (name || "").toLowerCase();

  if (
    (/ثالث|3/.test(n) && n.includes("اعدادي")) ||
    /\bjss\s*3\b/i.test(raw) ||
    /3rd.*junior\s*secondary/i.test(raw)
  ) {
    return "junior_secondary";
  }

  if (
    (/ثالث|3/.test(n) && n.includes("ثانوي")) ||
    /\bsss\s*3\b/i.test(raw) ||
    /3rd.*senior\s*secondary/i.test(raw)
  ) {
    return "senior_secondary";
  }

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

  const n = normalizeArabic(name || "");
  const raw = (name || "").toLowerCase();
  if (n.includes("شهاده") || raw.includes("graduating")) {
    return true;
  }
  return false;
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

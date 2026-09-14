export interface ElementarySubjectDef {
  nameEnglish: string;
  nameArabic: string;
  order: number;
}

export const ELEMENTARY_FIXED_SUBJECTS: ElementarySubjectDef[] = [
  { nameEnglish: "Q. MEMORIZATION", nameArabic: "القرآن الكريم (الاستحفاظ)", order: 1 },
  { nameEnglish: "HADITH", nameArabic: "الحديث الشريف", order: 2 },
  { nameEnglish: "READING SKILL", nameArabic: "مهارة القراءة", order: 3 },
  { nameEnglish: "WRITING SKILL", nameArabic: "مهارة الكتابة", order: 4 },
  { nameEnglish: "ARABIC", nameArabic: "العربية", order: 5 },
  { nameEnglish: "HYMNS", nameArabic: "الأناشيد", order: 6 },
];

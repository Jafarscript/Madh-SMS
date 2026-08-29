export interface ReportCardComment {
  id: string;
  en: string;
  ar: string;
  gender: "M" | "F" | "N"; // N = neutral, shown regardless of student gender
  category: "excellence" | "commendable" | "progress" | "effort" | "behavior" | "support";
}

export const REPORT_CARD_COMMENTS: ReportCardComment[] = [
  { id: "c1", en: "Outstanding performance. Keep up the excellent work.", ar: "طالب ملتزم ومجتهد", gender: "M", category: "excellence" },
  { id: "c2", en: "An exceptional result. Continue striving for excellence.", ar: "طالبة ملتزمة ومجتهدة", gender: "F", category: "excellence" },
  { id: "c3", en: "An exceptional result. Continue striving for excellence.", ar: "يحرص على أداء واجباته، ونشجعه على الاستمرار", gender: "M", category: "excellence" },
  { id: "c4", en: "A very commendable performance. Keep it up.", ar: "أظهر تقدمًا ملحوظًا خلال هذا الفصل", gender: "M", category: "commendable" },
  { id: "c5", en: "A very commendable performance. Keep it up.", ar: "يتمتع بأخلاق حسنة وسلوك طيب داخل المدرسة", gender: "M", category: "behavior" },
  { id: "c6", en: "An exceptional result. Continue striving for excellence.", ar: "النجاح ثمرة الصبر والاجتهاد، فواصلي مسيرتك بثقة", gender: "F", category: "excellence" },
  { id: "c7", en: "A good performance with room for further improvement.", ar: "يحرص على أداء واجباته، ونشجعه على الاستمرار", gender: "M", category: "progress" },
  { id: "c8", en: "Has worked well and should continue to aim higher.", ar: "أظهر تقدمًا ملحوظًا خلال هذا الفصل", gender: "M", category: "progress" },
  { id: "c9", en: "A satisfactory performance. More effort will yield better results.", ar: "يتمتع بأخلاق حسنة وسلوك طيب داخل المدرسة", gender: "M", category: "behavior" },
  { id: "c10", en: "A good performance with room for further improvement.", ar: "قادرة على تحقيق نتائج أفضل إذا واصلت الاجتهاد", gender: "F", category: "progress" },
  { id: "c11", en: "A satisfactory performance. More effort will yield better results.", ar: "يحرص على أداء واجباته، ونشجعه على الاستمرار", gender: "M", category: "effort" },
  { id: "c12", en: "Shows potential but needs greater commitment to studies.", ar: "يحرص على أداء واجباته، ونشجعه على الاستمرار", gender: "M", category: "effort" },
  { id: "c13", en: "Has worked well and should continue to aim higher.", ar: "قادرة على تحقيق نتائج أفضل إذا واصلت الاجتهاد", gender: "F", category: "progress" },
  { id: "c14", en: "A good performance with room for further improvement.", ar: "أظهر تقدمًا ملحوظًا خلال هذا الفصل", gender: "M", category: "progress" },
  { id: "c15", en: "Can achieve better results with increased effort and dedication.", ar: "يحتاج إلى مزيد من الثقة بالنفس والمشاركة الفاعلة", gender: "M", category: "effort" },
  { id: "c16", en: "An average performance. More focus and hard work are required.", ar: "قادر على تحقيق نتائج أفضل إذا واصل الاجتهاد", gender: "M", category: "effort" },
  { id: "c17", en: "Shows potential but needs greater commitment to studies.", ar: "قادر على تحقيق نتائج أفضل إذا واصل الاجتهاد", gender: "M", category: "effort" },
  { id: "c18", en: "Needs to work harder and pay more attention to studies.", ar: "مستوى الطالب مقبول، ويحتاج إلى مزيد من التركيز والانضباط", gender: "M", category: "effort" },
  { id: "c19", en: "Must be more committed to academic work to achieve success.", ar: "قادرة على تحقيق نتائج أفضل إذا واصلت الاجتهاد", gender: "F", category: "effort" },
  { id: "c20", en: "Can achieve better results with increased effort and dedication.", ar: "يحتاج إلى تحسين مهاراته الدراسية وتنظيم وقته", gender: "M", category: "effort" },
  { id: "c21", en: "Shows potential but needs greater commitment to studies.", ar: "مستوى الطالب مقبول، ويحتاج إلى مزيد من التركيز والانضباط", gender: "M", category: "effort" },
  { id: "c22", en: "An average performance. More focus and hard work are required.", ar: "قادرة على تحقيق نتائج أفضل إذا واصلت الاجتهاد", gender: "F", category: "effort" },
  { id: "c23", en: "Can achieve better results with increased effort and dedication.", ar: "قادرة على تحقيق نتائج أفضل إذا واصلت الاجتهاد", gender: "F", category: "effort" },
  { id: "c24", en: "An average performance. More focus and hard work are required.", ar: "النجاح ثمرة الصبر والاجتهاد، فواصل مسيرتك بثقة", gender: "M", category: "effort" },
  { id: "c25", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "النجاح ثمرة الصبر والاجتهاد، فواصلي مسيرتك بثقة", gender: "F", category: "support" },
  { id: "c26", en: "Can achieve better results with increased effort and dedication.", ar: "نأمل من الطالب بذل جهد أكبر للارتقاء بمستواه الدراسي", gender: "M", category: "effort" },
  { id: "c27", en: "Needs to work harder and pay more attention to studies.", ar: "ضعف التحصيل يتطلب مزيدًا من الجد والاجتهاد", gender: "N", category: "effort" },
  { id: "c28", en: "Performance is below expectation. Serious improvement is needed.", ar: "نوصي بالمواظبة على الحضور والاهتمام بالواجبات المدرسية", gender: "N", category: "support" },
  { id: "c29", en: "Must be more committed to academic work to achieve success.", ar: "نأمل من الطالبة بذل جهد أكبر للارتقاء بمستواها الدراسي", gender: "F", category: "effort" },
  { id: "c30", en: "Needs to work harder and pay more attention to studies.", ar: "نوصي بالمواظبة على الحضور والاهتمام بالواجبات المدرسية", gender: "N", category: "support" },
  { id: "c31", en: "Needs to work harder and pay more attention to studies.", ar: "احرص على الاجتهاد والمثابرة.", gender: "N", category: "effort" },
  { id: "c32", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "نوصي بالمواظبة على الحضور والاهتمام بالواجبات المدرسية", gender: "N", category: "support" },
  { id: "c33", en: "Performance is below expectation. Serious improvement is needed.", ar: "احرص على الاجتهاد والمثابرة.", gender: "N", category: "support" },
  { id: "c34", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "احرص على الاجتهاد والمثابرة.", gender: "N", category: "support" },
  { id: "c35", en: "Must be more committed to academic work to achieve success.", ar: "نوصي بالمواظبة على الحضور والاهتمام بالواجبات المدرسية", gender: "N", category: "support" },
  { id: "c36", en: "Performance is below expectation. Serious improvement is needed.", ar: "نأمل من الطالبة بذل جهد أكبر للارتقاء بمستواها الدراسي", gender: "F", category: "support" },
];

export const COMMENT_CATEGORIES = [
  { id: "all", label: "All Comments", labelAr: "الكل" },
  { id: "excellence", label: "Excellence (Distinction)", labelAr: "ممتاز وتفوق" },
  { id: "commendable", label: "Commendable / Very Good", labelAr: "جيد جداً" },
  { id: "progress", label: "Good / Noticeable Progress", labelAr: "تقدم ملحوظ" },
  { id: "effort", label: "Needs More Effort", labelAr: "يحتاج لمزيد من الجهد" },
  { id: "behavior", label: "Conduct & Character", labelAr: "السلوك والأخلاق" },
  { id: "support", label: "Academic Support Required", labelAr: "يحتاج دعم ومتابعة" },
];

export const getCommentById = (id: string): ReportCardComment | undefined =>
  REPORT_CARD_COMMENTS.find((c) => c.id === id);

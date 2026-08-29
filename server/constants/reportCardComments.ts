export interface ReportCardComment {
  id: string;
  en: string;
  ar: string;
  gender: "M" | "F" | "N"; // N = neutral, shown regardless of student gender
}

export const REPORT_CARD_COMMENTS: ReportCardComment[] = [
  { id: "c1", en: "Outstanding performance. Keep up the excellent work.", ar: "طالب ملتزم ومجتهد", gender: "M" },
  { id: "c2", en: "An exceptional result. Continue striving for excellence.", ar: "طالبة ملتزمة ومجتهدة", gender: "F" },
  { id: "c3", en: "An exceptional result. Continue striving for excellence.", ar: "يحرص على أداء واجباته، ونشجعه على الاستمرار", gender: "M" },
  { id: "c4", en: "A very commendable performance. Keep it up", ar: "أظهر تقدمًا ملحوظًا خلال هذا الفصل", gender: "M" },
  { id: "c5", en: "A very commendable performance. Keep it up", ar: "يتمتع بأخلاق حسنة وسلوك طيب داخل المدرسة", gender: "M" },
  { id: "c6", en: "An exceptional result. Continue striving for excellence.", ar: "النجاح ثمرة الصبر والاجتهاد، فواصلي مسيرتك بثقة", gender: "F" },
  { id: "c7", en: "A good performance with room for further improvement.", ar: "يحرص على أداء واجباته، ونشجعه على الاستمرار", gender: "M" },
  { id: "c8", en: "Has worked well and should continue to aim higher.", ar: "أظهر تقدمًا ملحوظًا خلال هذا الفصل", gender: "M" },
  { id: "c9", en: "A satisfactory performance. More effort will yield better results.", ar: "يتمتع بأخلاق حسنة وسلوك طيب داخل المدرسة", gender: "M" },
  { id: "c10", en: "A good performance with room for further improvement.", ar: "قادرة على تحقيق نتائج أفضل إذا واصلت الاجتهاد", gender: "F" },
  { id: "c11", en: "A satisfactory performance. More effort will yield better results.", ar: "يحرص على أداء واجباته، ونشجعه على الاستمرار", gender: "M" },
  { id: "c12", en: "Shows potential but needs greater commitment to studies.", ar: "يحرص على أداء واجباته، ونشجعه على الاستمرار", gender: "M" },
  { id: "c13", en: "Has worked well and should continue to aim higher.", ar: "قادرة على تحقيق نتائج أفضل إذا واصلت الاجتهاد", gender: "F" },
  { id: "c14", en: "A good performance with room for further improvement.", ar: "أظهر تقدمًا ملحوظًا خلال هذا الفصل", gender: "M" },
  { id: "c15", en: "Can achieve better results with increased effort and dedication.", ar: "يحتاج إلى مزيد من الثقة بالنفس والمشاركة الفاعلة", gender: "M" },
  { id: "c16", en: "An average performance. More focus and hard work are required.", ar: "قادر على تحقيق نتائج أفضل إذا واصل الاجتهاد", gender: "M" },
  { id: "c17", en: "Shows potential but needs greater commitment to studies.", ar: "قادر على تحقيق نتائج أفضل إذا واصل الاجتهاد", gender: "M" },
  { id: "c18", en: "Needs to work harder and pay more attention to studies.", ar: "مستوى الطالب مقبول، ويحتاج إلى مزيد من التركيز والانضباط", gender: "M" },
  { id: "c19", en: "Must be more committed to academic work to achieve success.", ar: "قادرة على تحقيق نتائج أفضل إذا واصلت الاجتهاد", gender: "F" },
  { id: "c20", en: "Can achieve better results with increased effort and dedication.", ar: "يحتاج إلى تحسين مهاراته الدراسية وتنظيم وقته", gender: "M" },
  { id: "c21", en: "Shows potential but needs greater commitment to studies.", ar: "مستوى الطالب مقبول، ويحتاج إلى مزيد من التركيز والانضباط", gender: "M" },
  { id: "c22", en: "An average performance. More focus and hard work are required.", ar: "قادرة على تحقيق نتائج أفضل إذا واصلت الاجتهاد", gender: "F" },
  { id: "c23", en: "Can achieve better results with increased effort and dedication.", ar: "قادرة على تحقيق نتائج أفضل إذا واصلت الاجتهاد", gender: "F" },
  { id: "c24", en: "An average performance. More focus and hard work are required.", ar: "النجاح ثمرة الصبر والاجتهاد، فواصل مسيرتك بثقة", gender: "M" },
  { id: "c25", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "النجاح ثمرة الصبر والاجتهاد، فواصلي مسيرتك بثقة", gender: "F" },
  { id: "c26", en: "Can achieve better results with increased effort and dedication.", ar: "نأمل من الطالب بذل جهد أكبر للارتقاء بمستواه الدراسي", gender: "M" },
  { id: "c27", en: "Needs to work harder and pay more attention to studies.", ar: "ضعف التحصيل يتطلب مزيدًا من الجد والاجتهاد", gender: "N" },
  { id: "c28", en: "Performance is below expectation. Serious improvement is needed.", ar: "نوصي بالمواظبة على الحضور والاهتمام بالواجبات المدرسية", gender: "N" },
  { id: "c29", en: "Must be more committed to academic work to achieve success.", ar: "نأمل من الطالبة بذل جهد أكبر للارتقاء بمستواها الدراسي", gender: "F" },
  { id: "c30", en: "Needs to work harder and pay more attention to studies.", ar: "نوصي بالمواظبة على الحضور والاهتمام بالواجبات المدرسية", gender: "N" },
  { id: "c31", en: "Needs to work harder and pay more attention to studies.", ar: "احرص على الاجتهاد والمثابرة.", gender: "N" },
  { id: "c32", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "نوصي بالمواظبة على الحضور والاهتمام بالواجبات المدرسية", gender: "N" },
  { id: "c33", en: "Performance is below expectation. Serious improvement is needed.", ar: "احرص على الاجتهاد والمثابرة.", gender: "N" },
  { id: "c34", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "احرص على الاجتهاد والمثابرة.", gender: "N" },
  { id: "c35", en: "Must be more committed to academic work to achieve success.", ar: "نوصي بالمواظبة على الحضور والاهتمام بالواجبات المدرسية", gender: "N" },
  { id: "c36", en: "Performance is below expectation. Serious improvement is needed.", ar: "نأمل من الطالبة بذل جهد أكبر للارتقاء بمستواها الدراسي", gender: "F" },
];

export const getCommentById = (id: string): ReportCardComment | undefined =>
  REPORT_CARD_COMMENTS.find((c) => c.id === id);
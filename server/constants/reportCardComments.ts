export interface ReportCardComment {
  id: string;
  en: string;
  ar: string;
  gender: "M" | "F" | "N"; // N = neutral, shown regardless of student gender
  category: "excellence" | "commendable" | "progress" | "effort" | "behavior" | "support";
  targetRole?: "both" | "teacher" | "principal";
}

export const REPORT_CARD_COMMENTS: ReportCardComment[] = [
  { id: "c1", en: "Outstanding performance. Keep up the excellent work.", ar: "أداء متميز واستثنائي، واصل هذا الاجتهاد والتفوق.", gender: "M", category: "excellence", targetRole: "both" },
  { id: "c2", en: "An exceptional result. Continue striving for excellence.", ar: "نتيجة استثنائية ورائعة، واصلي السعي نحو التميز والتفوق.", gender: "F", category: "excellence", targetRole: "both" },
  { id: "c3", en: "An exceptional result. Continue striving for excellence.", ar: "نتيجة استثنائية ورائعة، واصل السعي نحو التميز والتفوق.", gender: "M", category: "excellence", targetRole: "both" },
  { id: "c4", en: "A very commendable performance. Keep it up.", ar: "أداء جدير بالثناء والتقدير، استمر على هذا العطاء المتميز.", gender: "M", category: "commendable", targetRole: "both" },
  { id: "c5", en: "A very commendable performance. Keep it up.", ar: "أداء جدير بالثناء والتقدير، استمري على هذا العطاء المتميز.", gender: "F", category: "commendable", targetRole: "both" },
  { id: "c6", en: "Brilliant academic achievement and dedication to learning.", ar: "إنجاز أكاديمي باهر وتفانٍ مستمر في طلب العلم والتعلم.", gender: "N", category: "excellence", targetRole: "both" },
  { id: "c7", en: "A good performance with room for further improvement.", ar: "أداء جيد مع إمكانية تحقيق تقدم أفضل بمزيد من الجهد والمثابرة.", gender: "M", category: "progress", targetRole: "both" },
  { id: "c8", en: "Has worked well and should continue to aim higher.", ar: "بذل جهداً طيباً، وعليه مواصلة الطموح لتحقيق مراتب أعلى.", gender: "M", category: "progress", targetRole: "both" },
  { id: "c9", en: "A satisfactory performance. More effort will yield better results.", ar: "أداء مُرْضٍ، وبذل المزيد من الجهد سيثمر عن نتائج أفضل.", gender: "M", category: "effort", targetRole: "both" },
  { id: "c10", en: "A good performance with room for further improvement.", ar: "أداء جيد مع إمكانية تحقيق تقدم أفضل بمزيد من الجهد والمثابرة.", gender: "F", category: "progress", targetRole: "both" },
  { id: "c11", en: "A satisfactory performance. More effort will yield better results.", ar: "أداء مُرْضٍ، وبذل المزيد من الجهد سيثمر عن نتائج أفضل.", gender: "F", category: "effort", targetRole: "both" },
  { id: "c12", en: "Shows potential but needs greater commitment to studies.", ar: "يتمتع بقدرات واعدة ولكنه يحتاج إلى مزيد من الالتزام بالدراسة.", gender: "M", category: "effort", targetRole: "both" },
  { id: "c13", en: "Has worked well and should continue to aim higher.", ar: "بذلت جهداً طيباً، وعليها مواصلة الطموح لتحقيق درجات أعلى.", gender: "F", category: "progress", targetRole: "both" },
  { id: "c14", en: "A good performance with room for further improvement.", ar: "أداء جيد ومبشر مع وجود فرصة لمزيد من التحسن والتطور.", gender: "N", category: "progress", targetRole: "both" },
  { id: "c15", en: "Can achieve better results with increased effort and dedication.", ar: "قادر على تحقيق نتائج أفضل إذا زاد من جهده ومثابرته.", gender: "M", category: "effort", targetRole: "both" },
  { id: "c16", en: "An average performance. More focus and hard work are required.", ar: "أداء متوسط، ويحتاج إلى مزيد من التركيز والجد والاجتهاد.", gender: "M", category: "effort", targetRole: "both" },
  { id: "c17", en: "Shows potential but needs greater commitment to studies.", ar: "تتمتع بقدرات واعدة ولكنها تحتاج إلى مزيد من الالتزام بالدراسة.", gender: "F", category: "effort", targetRole: "both" },
  { id: "c18", en: "Needs to work harder and pay more attention to studies.", ar: "يحتاج إلى مضاعفة الجهد وزيادة الاهتمام والمتابعة لدروسه.", gender: "M", category: "effort", targetRole: "both" },
  { id: "c19", en: "Must be more committed to academic work to achieve success.", ar: "يجب عليها إبداء مزيد من الالتزام بالواجبات المدرسية لتحقيق النجاح.", gender: "F", category: "effort", targetRole: "both" },
  { id: "c20", en: "Can achieve better results with increased effort and dedication.", ar: "قادرة على تحقيق نتائج أفضل إذا زادت من جهدها ومثابرتها.", gender: "F", category: "effort", targetRole: "both" },
  { id: "c21", en: "Shows potential but needs greater commitment to studies.", ar: "يمتلك استعداداً طيباً ولكنه بحاجة إلى مزيد من الحرص والتركيز.", gender: "N", category: "effort", targetRole: "both" },
  { id: "c22", en: "An average performance. More focus and hard work are required.", ar: "أداء متوسط، وتحتاج إلى مزيد من التركيز والجد والاجتهاد.", gender: "F", category: "effort", targetRole: "both" },
  { id: "c23", en: "Steady progress observed. Encourage consistent revision at home.", ar: "لوحظ تقدم مستمر، ونشجع على المراجعة المنتظمة في المنزل.", gender: "N", category: "progress", targetRole: "both" },
  { id: "c24", en: "Active and cooperative student with commendable conduct.", ar: "طالب نشيط ومتعاون يتمتع بسلوك وخلق حميد داخل المدرسة وخارجها.", gender: "M", category: "behavior", targetRole: "both" },
  { id: "c25", en: "Active and cooperative student with commendable conduct.", ar: "طالبة نشيطة ومتعاونة تتمتع بسلوك وخلق حميد داخل المدرسة وخارجها.", gender: "F", category: "behavior", targetRole: "both" },
  { id: "c26", en: "Exemplary conduct, well-mannered, and respectful to all.", ar: "سلوك نموذجي وخلق رفيع واحترام متبادل مع المعلمين والزملاء.", gender: "N", category: "behavior", targetRole: "both" },
  { id: "c27", en: "Needs to work harder and pay more attention to studies.", ar: "يحتاج إلى مضاعفة الجهد والحرص على متابعة الدروس بانتظام.", gender: "N", category: "effort", targetRole: "both" },
  { id: "c28", en: "Performance is below expectation. Serious improvement is needed.", ar: "الأداء دون المستوى المتوقع، ويحتاج إلى تحسن جاد وفوري.", gender: "M", category: "support", targetRole: "both" },
  { id: "c29", en: "Must be more committed to academic work to achieve success.", ar: "يجب عليه إبداء مزيد من الالتزام بالواجبات المدرسية لتحقيق النجاح.", gender: "M", category: "effort", targetRole: "both" },
  { id: "c30", en: "Needs to work harder and pay more attention to studies.", ar: "تحتاج إلى مضاعفة الجهد وزيادة الاهتمام والمتابعة لدروسها.", gender: "F", category: "effort", targetRole: "both" },
  { id: "c31", en: "Punctual, attentive, and consistently completes classwork.", ar: "طالب ملتزم بالحضور ومنتبه ومواظب على أداء واجباته المدرسية.", gender: "M", category: "commendable", targetRole: "both" },
  { id: "c32", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "أداء غير مُرْضٍ، ويتطلب تحسناً عاجلاً ومتابعة مكثفة في البيت والمدرسة.", gender: "M", category: "support", targetRole: "both" },
  { id: "c33", en: "Performance is below expectation. Serious improvement is needed.", ar: "الأداء دون المستوى المتوقع، وتحتاج إلى تحسن جاد وفوري.", gender: "F", category: "support", targetRole: "both" },
  { id: "c34", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "أداء غير مُرْضٍ، وتتطلب تحسناً عاجلاً ومتابعة مكثفة في البيت والمدرسة.", gender: "F", category: "support", targetRole: "both" },
  { id: "c35", en: "Must be more committed to academic work to achieve success.", ar: "ينبغي التحلي بالجدية والالتزام بالواجبات المدرسية لضمان النجاح.", gender: "N", category: "support", targetRole: "both" },
  { id: "c36", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "النتيجة غير مرضية، وتستلزم خطة علاجية عاجلة ومتابعة مستمرة.", gender: "N", category: "support", targetRole: "both" },
];

export const getCommentById = (id: string): ReportCardComment | undefined =>
  REPORT_CARD_COMMENTS.find((c) => c.id === id);

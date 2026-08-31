export interface ReportCardComment {
  id: string;
  en: string;
  ar: string;
  gender: "M" | "F" | "N"; // N = neutral, shown regardless of student gender
  category: "excellence" | "commendable" | "progress" | "effort" | "behavior" | "support";
}

export const REPORT_CARD_COMMENTS: ReportCardComment[] = [
  { id: "c1", en: "Outstanding performance. Keep up the excellent work.", ar: "أداء متميز واستثنائي، واصل هذا الاجتهاد والتفوق.", gender: "M", category: "excellence" },
  { id: "c2", en: "An exceptional result. Continue striving for excellence.", ar: "نتيجة استثنائية ورائعة، واصلي السعي نحو التميز والتفوق.", gender: "F", category: "excellence" },
  { id: "c3", en: "An exceptional result. Continue striving for excellence.", ar: "نتيجة استثنائية ورائعة، واصل السعي نحو التميز والتفوق.", gender: "M", category: "excellence" },
  { id: "c4", en: "A very commendable performance. Keep it up.", ar: "أداء جدير بالثناء والتقدير، استمر على هذا العطاء المتميز.", gender: "M", category: "commendable" },
  { id: "c5", en: "A very commendable performance. Keep it up.", ar: "أداء جدير بالثناء والتقدير، استمري على هذا العطاء المتميز.", gender: "F", category: "commendable" },
  { id: "c6", en: "Brilliant academic achievement and dedication to learning.", ar: "إنجاز أكاديمي باهر وتفانٍ مستمر في طلب العلم والتعلم.", gender: "N", category: "excellence" },
  { id: "c7", en: "A good performance with room for further improvement.", ar: "أداء جيد مع إمكانية تحقيق تقدم أفضل بمزيد من الجهد والمثابرة.", gender: "M", category: "progress" },
  { id: "c8", en: "Has worked well and should continue to aim higher.", ar: "بذل جهداً طيباً، وعليه مواصلة الطموح لتحقيق مراتب أعلى.", gender: "M", category: "progress" },
  { id: "c9", en: "A satisfactory performance. More effort will yield better results.", ar: "أداء مُرْضٍ، وبذل المزيد من الجهد سيثمر عن نتائج أفضل.", gender: "M", category: "effort" },
  { id: "c10", en: "A good performance with room for further improvement.", ar: "أداء جيد مع إمكانية تحقيق تقدم أفضل بمزيد من الجهد والمثابرة.", gender: "F", category: "progress" },
  { id: "c11", en: "A satisfactory performance. More effort will yield better results.", ar: "أداء مُرْضٍ، وبذل المزيد من الجهد سيثمر عن نتائج أفضل.", gender: "F", category: "effort" },
  { id: "c12", en: "Shows potential but needs greater commitment to studies.", ar: "يتمتع بقدرات واعدة ولكنه يحتاج إلى مزيد من الالتزام بالدراسة.", gender: "M", category: "effort" },
  { id: "c13", en: "Has worked well and should continue to aim higher.", ar: "بذلت جهداً طيباً، وعليها مواصلة الطموح لتحقيق درجات أعلى.", gender: "F", category: "progress" },
  { id: "c14", en: "A good performance with room for further improvement.", ar: "أداء جيد ومبشر مع وجود فرصة لمزيد من التحسن والتطور.", gender: "N", category: "progress" },
  { id: "c15", en: "Can achieve better results with increased effort and dedication.", ar: "قادر على تحقيق نتائج أفضل إذا زاد من جهده ومثابرته.", gender: "M", category: "effort" },
  { id: "c16", en: "An average performance. More focus and hard work are required.", ar: "أداء متوسط، ويحتاج إلى مزيد من التركيز والجد والاجتهاد.", gender: "M", category: "effort" },
  { id: "c17", en: "Shows potential but needs greater commitment to studies.", ar: "تتمتع بقدرات واعدة ولكنها تحتاج إلى مزيد من الالتزام بالدراسة.", gender: "F", category: "effort" },
  { id: "c18", en: "Needs to work harder and pay more attention to studies.", ar: "يحتاج إلى مضاعفة الجهد وزيادة الاهتمام والمتابعة لدروسه.", gender: "M", category: "effort" },
  { id: "c19", en: "Must be more committed to academic work to achieve success.", ar: "يجب عليها إبداء مزيد من الالتزام بالواجبات المدرسية لتحقيق النجاح.", gender: "F", category: "effort" },
  { id: "c20", en: "Can achieve better results with increased effort and dedication.", ar: "قادرة على تحقيق نتائج أفضل إذا زادت من جهدها ومثابرتها.", gender: "F", category: "effort" },
  { id: "c21", en: "Shows potential but needs greater commitment to studies.", ar: "يمتلك استعداداً طيباً ولكنه بحاجة إلى مزيد من الحرص والتركيز.", gender: "N", category: "effort" },
  { id: "c22", en: "An average performance. More focus and hard work are required.", ar: "أداء متوسط، وتحتاج إلى مزيد من التركيز والجد والاجتهاد.", gender: "F", category: "effort" },
  { id: "c23", en: "Steady progress observed. Encourage consistent revision at home.", ar: "لوحظ تقدم مستمر، ونشجع على المراجعة المنتظمة في المنزل.", gender: "N", category: "progress" },
  { id: "c24", en: "Active and cooperative student with commendable conduct.", ar: "طالب نشيط ومتعاون يتمتع بسلوك وخلق حميد داخل المدرسة وخارجها.", gender: "M", category: "behavior" },
  { id: "c25", en: "Active and cooperative student with commendable conduct.", ar: "طالبة نشيطة ومتعاونة تتمتع بسلوك وخلق حميد داخل المدرسة وخارجها.", gender: "F", category: "behavior" },
  { id: "c26", en: "Exemplary conduct, well-mannered, and respectful to all.", ar: "سلوك نموذجي وخلق رفيع واحترام متبادل مع المعلمين والزملاء.", gender: "N", category: "behavior" },
  { id: "c27", en: "Needs to work harder and pay more attention to studies.", ar: "يحتاج إلى مضاعفة الجهد والحرص على متابعة الدروس بانتظام.", gender: "N", category: "effort" },
  { id: "c28", en: "Performance is below expectation. Serious improvement is needed.", ar: "الأداء دون المستوى المتوقع، ويحتاج إلى تحسن جاد وفوري.", gender: "M", category: "support" },
  { id: "c29", en: "Must be more committed to academic work to achieve success.", ar: "يجب عليه إبداء مزيد من الالتزام بالواجبات المدرسية لتحقيق النجاح.", gender: "M", category: "effort" },
  { id: "c30", en: "Needs to work harder and pay more attention to studies.", ar: "تحتاج إلى مضاعفة الجهد وزيادة الاهتمام والمتابعة لدروسها.", gender: "F", category: "effort" },
  { id: "c31", en: "Punctual, attentive, and consistently completes classwork.", ar: "طالب ملتزم بالحضور ومنتبه ومواظب على أداء واجباته المدرسية.", gender: "M", category: "commendable" },
  { id: "c32", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "أداء غير مُرْضٍ، ويتطلب تحسناً عاجلاً ومتابعة مكثفة في البيت والمدرسة.", gender: "M", category: "support" },
  { id: "c33", en: "Performance is below expectation. Serious improvement is needed.", ar: "الأداء دون المستوى المتوقع، وتحتاج إلى تحسن جاد وفوري.", gender: "F", category: "support" },
  { id: "c34", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "أداء غير مُرْضٍ، وتتطلب تحسناً عاجلاً ومتابعة مكثفة في البيت والمدرسة.", gender: "F", category: "support" },
  { id: "c35", en: "Must be more committed to academic work to achieve success.", ar: "ينبغي التحلي بالجدية والالتزام بالواجبات المدرسية لضمان النجاح.", gender: "N", category: "support" },
  { id: "c36", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "النتيجة غير مرضية، وتستلزم خطة علاجية عاجلة ومتابعة مستمرة.", gender: "N", category: "support" },
];

export const COMMENT_CATEGORIES = [
  { id: "all", label: "All Comments", labelAr: "جميع العبارات" },
  { id: "excellence", label: "Excellence (Distinction)", labelAr: "ممتاز وتفوق" },
  { id: "commendable", label: "Commendable / Very Good", labelAr: "جيد جداً وثناء" },
  { id: "progress", label: "Good / Noticeable Progress", labelAr: "تقدم ملحوظ" },
  { id: "effort", label: "Needs More Effort", labelAr: "يحتاج لمزيد من الجهد" },
  { id: "behavior", label: "Conduct & Character", labelAr: "السلوك والأخلاق" },
  { id: "support", label: "Academic Support Required", labelAr: "يحتاج دعم ومتابعة" },
];

export const getCommentById = (id: string): ReportCardComment | undefined =>
  REPORT_CARD_COMMENTS.find((c) => c.id === id);

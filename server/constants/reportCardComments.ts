export interface ReportCardComment {
  id: string;
  en: string;
  ar: string;
  gender: "M" | "F" | "N"; // N = neutral, shown regardless of student gender
}

export const REPORT_CARD_COMMENTS: ReportCardComment[] = [
  { id: "c1", en: "Outstanding performance. Keep up the excellent work.", ar: "أداء متميز واستثنائي، واصل هذا الاجتهاد والتفوق.", gender: "M" },
  { id: "c2", en: "An exceptional result. Continue striving for excellence.", ar: "نتيجة استثنائية ورائعة، واصلي السعي نحو التميز والتفوق.", gender: "F" },
  { id: "c3", en: "An exceptional result. Continue striving for excellence.", ar: "نتيجة استثنائية ورائعة، واصل السعي نحو التميز والتفوق.", gender: "M" },
  { id: "c4", en: "A very commendable performance. Keep it up.", ar: "أداء جدير بالثناء والتقدير، استمر على هذا العطاء المتميز.", gender: "M" },
  { id: "c5", en: "A very commendable performance. Keep it up.", ar: "أداء جدير بالثناء والتقدير، استمري على هذا العطاء المتميز.", gender: "F" },
  { id: "c6", en: "Brilliant academic achievement and dedication to learning.", ar: "إنجاز أكاديمي باهر وتفانٍ مستمر في طلب العلم والتعلم.", gender: "N" },
  { id: "c7", en: "A good performance with room for further improvement.", ar: "أداء جيد مع إمكانية تحقيق تقدم أفضل بمزيد من الجهد والمثابرة.", gender: "M" },
  { id: "c8", en: "Has worked well and should continue to aim higher.", ar: "بذل جهداً طيباً، وعليه مواصلة الطموح لتحقيق مراتب أعلى.", gender: "M" },
  { id: "c9", en: "A satisfactory performance. More effort will yield better results.", ar: "أداء مُرْضٍ، وبذل المزيد من الجهد سيثمر عن نتائج أفضل.", gender: "M" },
  { id: "c10", en: "A good performance with room for further improvement.", ar: "أداء جيد مع إمكانية تحقيق تقدم أفضل بمزيد من الجهد والمثابرة.", gender: "F" },
  { id: "c11", en: "A satisfactory performance. More effort will yield better results.", ar: "أداء مُرْضٍ، وبذل المزيد من الجهد سيثمر عن نتائج أفضل.", gender: "F" },
  { id: "c12", en: "Shows potential but needs greater commitment to studies.", ar: "يتمتع بقدرات واعدة ولكنه يحتاج إلى مزيد من الالتزام بالدراسة.", gender: "M" },
  { id: "c13", en: "Has worked well and should continue to aim higher.", ar: "بذلت جهداً طيباً، وعليها مواصلة الطموح لتحقيق درجات أعلى.", gender: "F" },
  { id: "c14", en: "A good performance with room for further improvement.", ar: "أداء جيد ومبشر مع وجود فرصة لمزيد من التحسن والتطور.", gender: "N" },
  { id: "c15", en: "Can achieve better results with increased effort and dedication.", ar: "قادر على تحقيق نتائج أفضل إذا زاد من جهده ومثابرته.", gender: "M" },
  { id: "c16", en: "An average performance. More focus and hard work are required.", ar: "أداء متوسط، ويحتاج إلى مزيد من التركيز والجد والاجتهاد.", gender: "M" },
  { id: "c17", en: "Shows potential but needs greater commitment to studies.", ar: "تتمتع بقدرات واعدة ولكنها تحتاج إلى مزيد من الالتزام بالدراسة.", gender: "F" },
  { id: "c18", en: "Needs to work harder and pay more attention to studies.", ar: "يحتاج إلى مضاعفة الجهد وزيادة الاهتمام والمتابعة لدروسه.", gender: "M" },
  { id: "c19", en: "Must be more committed to academic work to achieve success.", ar: "يجب عليها إبداء مزيد من الالتزام بالواجبات المدرسية لتحقيق النجاح.", gender: "F" },
  { id: "c20", en: "Can achieve better results with increased effort and dedication.", ar: "قادرة على تحقيق نتائج أفضل إذا زادت من جهدها ومثابرتها.", gender: "F" },
  { id: "c21", en: "Shows potential but needs greater commitment to studies.", ar: "يمتلك استعداداً طيباً ولكنه بحاجة إلى مزيد من الحرص والتركيز.", gender: "N" },
  { id: "c22", en: "An average performance. More focus and hard work are required.", ar: "أداء متوسط، وتحتاج إلى مزيد من التركيز والجد والاجتهاد.", gender: "F" },
  { id: "c23", en: "Steady progress observed. Encourage consistent revision at home.", ar: "لوحظ تقدم مستمر، ونشجع على المراجعة المنتظمة في المنزل.", gender: "N" },
  { id: "c24", en: "Active and cooperative student with commendable conduct.", ar: "طالب نشيط ومتعاون يتمتع بسلوك وخلق حميد داخل المدرسة وخارجها.", gender: "M" },
  { id: "c25", en: "Active and cooperative student with commendable conduct.", ar: "طالبة نشيطة ومتعاونة تتمتع بسلوك وخلق حميد داخل المدرسة وخارجها.", gender: "F" },
  { id: "c26", en: "Exemplary conduct, well-mannered, and respectful to all.", ar: "سلوك نموذجي وخلق رفيع واحترام متبادل مع المعلمين والزملاء.", gender: "N" },
  { id: "c27", en: "Needs to work harder and pay more attention to studies.", ar: "يحتاج إلى مضاعفة الجهد والحرص على متابعة الدروس بانتظام.", gender: "N" },
  { id: "c28", en: "Performance is below expectation. Serious improvement is needed.", ar: "الأداء دون المستوى المتوقع، ويحتاج إلى تحسن جاد وفوري.", gender: "M" },
  { id: "c29", en: "Must be more committed to academic work to achieve success.", ar: "يجب عليه إبداء مزيد من الالتزام بالواجبات المدرسية لتحقيق النجاح.", gender: "M" },
  { id: "c30", en: "Needs to work harder and pay more attention to studies.", ar: "تحتاج إلى مضاعفة الجهد وزيادة الاهتمام والمتابعة لدروسها.", gender: "F" },
  { id: "c31", en: "Punctual, attentive, and consistently completes classwork.", ar: "طالب ملتزم بالحضور ومنتبه ومواظب على أداء واجباته المدرسية.", gender: "M" },
  { id: "c32", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "أداء غير مُرْضٍ، ويتطلب تحسناً عاجلاً ومتابعة مكثفة في البيت والمدرسة.", gender: "M" },
  { id: "c33", en: "Performance is below expectation. Serious improvement is needed.", ar: "الأداء دون المستوى المتوقع، وتحتاج إلى تحسن جاد وفوري.", gender: "F" },
  { id: "c34", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "أداء غير مُرْضٍ، وتتطلب تحسناً عاجلاً ومتابعة مكثفة في البيت والمدرسة.", gender: "F" },
  { id: "c35", en: "Must be more committed to academic work to achieve success.", ar: "ينبغي التحلي بالجدية والالتزام بالواجبات المدرسية لضمان النجاح.", gender: "N" },
  { id: "c36", en: "Unsatisfactory performance. Requires immediate improvement and support.", ar: "النتيجة غير مرضية، وتستلزم خطة علاجية عاجلة ومتابعة مستمرة.", gender: "N" },
];

export const getCommentById = (id: string): ReportCardComment | undefined =>
  REPORT_CARD_COMMENTS.find((c) => c.id === id);

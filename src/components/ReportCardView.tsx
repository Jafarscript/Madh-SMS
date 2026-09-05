// update the SubjectResult interface at the top:

import type { ReportCardData } from "../types/reportCard";

const termWordEn = (n: number) => (n === 1 ? "1ST" : n === 2 ? "2ND" : "3RD");
const termWordAr = (n: number) =>
  n === 1 ? "الأولى" : n === 2 ? "الثانية" : "الثالثة";
const ordinalEn = ["1ST", "2ND", "3RD"];
const ordinalAr = ["الأولى", "الثانية", "الثالثة"];

const formatVal = (val: any) => {
  if (val === undefined || val === null || val === "") return "-";
  return String(val);
};

const ReportCardView = ({ data }: { data: ReportCardData }) => {
  const {
    student,
    term,
    subjects,
    overallTotal,
    overallPercentage,
    position,
    result,
    principalComment,
    classTeacherComment,
    totalStudentsInClass,
    termAverages,
    attendance,
    templateSettings,
  } = data;

  const schoolNameAr =
    templateSettings?.schoolNameArabic || "معهد التعليم العربي الإسلامي";
  const schoolNameEn =
    templateSettings?.schoolNameEnglish ||
    "INSTITUTE OF ARABIC AND ISLAMIC STUDIES";
  const schoolAddress =
    templateSettings?.address ||
    "18/20 ADEWALE BELLO STREET, OFF AILEGUN ROAD,\n49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665";
  const primaryColor = templateSettings?.primaryColor || "#16a34a";
  const headerColor = templateSettings?.headerColor || "#1e3a8a";

  const attendanceList = [
    {
      en: "ATTENDANCE",
      mid: "",
      ar: "الحضور والغياب",
      isHeader: true,
    },
    {
      en: "No. of times school opened",
      mid: formatVal(attendance?.timesSchoolOpened ?? attendance?.schoolDays),
      ar: "عدد أيام الدوام",
      isHeader: false,
    },
    {
      en: "No. of times present",
      mid: formatVal(attendance?.timesPresent ?? attendance?.presentDays),
      ar: "عدد أيام الحضور",
      isHeader: false,
    },
    {
      en: "No. of times absent",
      mid: formatVal(attendance?.timesAbsent ?? attendance?.absentDays),
      ar: "عدد أيام الغياب",
      isHeader: false,
    },
    {
      en: "Date School resumed",
      mid: formatVal(attendance?.dateResumed),
      ar: "بدء الدراسة",
      isHeader: false,
    },
    {
      en: "Date School closes",
      mid: formatVal(attendance?.dateClosed),
      ar: "ختم الدراسة",
      isHeader: false,
    },
    {
      en: "Next resumption",
      mid: formatVal(attendance?.nextResumption),
      ar: "العودة إلى الدراسة",
      isHeader: false,
    },
  ];

  return (
    <div
      className="border-4 rounded-sm p-4 bg-white relative min-w-[680px] sm:min-w-full print:min-w-0"
      style={{ borderColor: primaryColor }}
    >
      {/* header */}
      <div className="relative text-center mb-2 min-h-[60px]">
        {templateSettings?.logoBase64 ? (
          <img
            src={templateSettings.logoBase64}
            alt="School Logo"
            className="absolute top-0 right-0 w-16 h-16 object-contain rounded"
          />
        ) : (
          <div
            className="absolute top-0 right-0 w-16 h-16 rounded flex items-center justify-center text-xs text-gray-400"
            style={{ backgroundColor: "#F4F1EA" }}
          >
            logo
          </div>
        )}
        <p
          className="text-2xl font-bold"
          style={{ fontFamily: "Amiri, serif", color: headerColor }}
        >
          {schoolNameAr}
        </p>
        <p className="text-xs font-bold mt-1 text-gray-900">{schoolNameEn}</p>
        <p className="text-[10px] font-bold mt-0.5 text-gray-700 whitespace-pre-line leading-tight">
          {schoolAddress}
        </p>
      </div>

      {/* title bar */}
      <div
        className="text-center text-xs font-bold py-1 mb-2 flex justify-center gap-2"
        style={{ color: headerColor }}
      >
        <span style={{ fontFamily: "Amiri, serif" }}>
          كشف درجات الفترة {termWordAr(term.termNumber)}
        </span>
        <span>
          REPORT SHEET FOR {termWordEn(term.termNumber)} TERM {term.session}{" "}
          ACADEMIC SESSION
        </span>
      </div>

      {/* info section */}
      <div className="flex border border-black mb-2 text-[10px]">
        <div className="flex-1 border-r border-black flex flex-col justify-between">
          {attendanceList.map((row, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-2 py-1 border-b ${
                row.isHeader
                  ? "border-black font-bold bg-gray-50"
                  : "border-gray-200 last:border-0"
              }`}
            >
              {/* English on the left side */}
              <span className="w-[44%] text-left font-medium text-gray-900 leading-tight">
                {row.en}
              </span>

              {/* Value in the middle always in English */}
              <span className="w-[20%] text-center font-bold text-gray-900 text-[11px]">
                {row.mid}
              </span>

              {/* Arabic on the right side */}
              <span
                className="w-[36%] text-right font-medium text-gray-900 text-[11px] leading-tight"
                style={{ fontFamily: "Amiri, serif" }}
              >
                {row.ar}
              </span>
            </div>
          ))}
        </div>
        <div className="flex-1">
          <div className="flex border-b border-black h-9">
            <div
              className="flex-2 flex items-center justify-center font-bold text-sm border-r border-black"
              style={{ fontFamily: "Amiri, serif" }}
            >
              {student.name}
            </div>
            <div className="flex-1 flex items-center justify-center text-center text-[10px] font-bold leading-tight">
              الاسم
              <br />
              NAME
            </div>
          </div>
          <div className="flex border-b border-black h-9">
            <div
              className="flex-2 flex items-center justify-center font-bold text-sm border-r border-black"
              style={{ fontFamily: "Amiri, serif" }}
            >
              {student.class}
            </div>
            <div className="flex-1 flex items-center justify-center text-center text-[10px] font-bold leading-tight">
              الصف
              <br />
              CLASS
            </div>
          </div>
          <div className="flex border-b border-black h-9">
            <div className="flex-2 flex items-center justify-center font-bold text-sm border-r border-black">
              {totalStudentsInClass ?? "-"}
            </div>
            <div className="flex-1 flex items-center justify-center text-center text-[10px] font-bold leading-tight">
              عدد الطلاب
              <br />
              NO IN CLASS
            </div>
          </div>
          {student.arm && (
            <div className="flex border-b border-black h-9">
              <div className="flex-2 flex items-center justify-center font-bold text-sm border-r border-black">
                {student.arm}
              </div>
              <div className="flex-1 flex items-center justify-center text-center text-[10px] font-bold leading-tight">
                الشعبة
                <br />
                DIVISION
              </div>
            </div>
          )}
          <div className="flex h-9">
            <div className="flex-2 flex items-center justify-center font-bold text-sm border-r border-black">
              {student.gender}
            </div>
            <div className="flex-1 flex items-center justify-center text-center text-[10px] font-bold leading-tight">
              الجنس
              <br />
              GENDER
            </div>
          </div>
        </div>
      </div>

      {/* subject table */}
      <table className="w-full text-[10px] border-collapse mb-2">
        <thead>
          <tr style={{ backgroundColor: "#fafafa" }}>
            <th className="border border-black p-1 text-left">
              المواد : SUBJECT
            </th>
            <th className="border border-black p-1">
              CA: مذ
              <br />
              40
            </th>
            <th className="border border-black p-1">
              EXAM :متح
              <br />
              60
            </th>
            <th className="border border-black p-1">
              TOTAL : محص
              <br />
              100
            </th>

            {/* term 2 only: shows term 1's raw total */}
            {term.termNumber === 2 && (
              <th className="border border-black p-1">
                محصلة الفترة الأولى
                <br />
                1st term total
              </th>
            )}
            {/* term 2 only: cascade through term 1+2 */}
            {term.termNumber === 2 && (
              <th className="border border-black p-1">
                محصلة الفترة الأولى والثانية
                <br />
                1st and 2nd term total
              </th>
            )}

            {/* term 3 only: shows the cascade value through term 1+2 (what was term 2's final average) */}
            {term.termNumber === 3 && (
              <th className="border border-black p-1">
                محصلة الفترة الثانية
                <br />
                2nd term total
              </th>
            )}
            {/* term 3 only: cascade through term 1+2+3 */}
            {term.termNumber === 3 && (
              <th className="border border-black p-1">
                محصلة الفترة الثانية والثالثة
                <br />
                2nd and 3rd term total
              </th>
            )}

            <th className="border border-black p-1">
              وسطى الدرجات
              <br />
              Average marks
            </th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => (
            <tr key={s.subject}>
              <td className="border border-black p-1 font-bold text-left">
                {s.nameEnglish}{" "}
                {s.nameArabic && (
                  <span
                    className="float-right"
                    style={{ fontFamily: "Amiri, serif" }}
                  >
                    {s.nameArabic}
                  </span>
                )}
              </td>
              <td className="border border-black p-1 text-center">
                {s.ca ?? "-"}
              </td>
              <td className="border border-black p-1 text-center">
                {s.exam ?? "-"}
              </td>
              <td className="border border-black p-1 text-center font-bold">
                {s.currentTermScore ?? "-"}
              </td>

              {term.termNumber === 2 && (
                <td className="border border-black p-1 text-center">
                  {s.priorPeriodValue ?? "-"}
                </td>
              )}
              {term.termNumber === 2 && (
                <td className="border border-black p-1 text-center font-bold">
                  {s.combinedTotal ?? "-"}{" "}
                  {/* was s.cumulativeAverage — this is now the SUM */}
                </td>
              )}

              {term.termNumber === 3 && (
                <td className="border border-black p-1 text-center">
                  {s.priorPeriodValue ?? "-"}
                </td>
              )}
              {term.termNumber === 3 && (
                <td className="border border-black p-1 text-center font-bold">
                  {s.combinedTotal ?? "-"} {/* same fix */}
                </td>
              )}

              <td className="border border-black p-1 text-center font-bold">
                {s.cumulativeAverage ?? "-"}
              </td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="border border-black p-1 text-left">
              المجموع الكلي : TOTAL
            </td>
            <td className="border border-black p-1"></td>
            <td className="border border-black p-1"></td>
            <td className="border border-black p-1 text-center">
              {overallTotal}
            </td>
            {term.termNumber === 2 && (
              <td className="border border-black p-1"></td>
            )}
            {term.termNumber === 2 && (
              <td className="border border-black p-1"></td>
            )}
            {term.termNumber === 3 && (
              <td className="border border-black p-1"></td>
            )}
            {term.termNumber === 3 && (
              <td className="border border-black p-1"></td>
            )}
            <td className="border border-black p-1"></td>
          </tr>
        </tbody>
      </table>

      {/* bottom section */}
      <div className="flex border border-black text-[10px] mb-2">
        <div className="flex-1 border-r border-black">
          <div className="flex border-b border-black h-8">
            <div
              className="flex-1 flex items-center justify-center font-bold text-center"
              style={{ backgroundColor: "#fafafa" }}
            >
              الترتيب
              <br />
              POSITION
            </div>
            <div className="flex-1 flex items-center justify-center font-bold">
              {position ?? "-"}
            </div>
          </div>
          <div className="flex h-8">
            <div
              className="flex-1 flex items-center justify-center font-bold text-center"
              style={{ backgroundColor: "#fafafa" }}
            >
              النتيجة
              <br />
              RESULT
            </div>
            <div
              className="flex-1 flex items-center justify-center font-bold"
              style={{ color: result === "Pass" ? "#0B3D2E" : "#B42318" }}
            >
              {result}
            </div>
          </div>
        </div>
        <div className="flex-1 border-r border-black flex flex-col justify-between">
          <table className="w-full text-[10px] border-collapse h-full">
            <tbody>
              {termAverages.map((t) => (
                <tr key={t.termNumber} className="border-b border-black">
                  <td className="px-2 py-1 text-left whitespace-nowrap align-middle">
                    <span className="font-semibold text-gray-900">{ordinalEn[t.termNumber - 1]}</span>
                    <span
                      className="font-medium text-gray-900 text-[11px] mx-1.5"
                      style={{ fontFamily: "Amiri, serif" }}
                      dir="rtl"
                    >
                      {ordinalAr[t.termNumber - 1]}
                    </span>
                    <span className="font-bold">:</span>
                  </td>
                  <td className="px-2 py-1 text-right font-bold text-gray-900 text-[11px] whitespace-nowrap align-middle">
                    {t.average ?? "-"}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold border-t border-black">
                <td className="px-2 py-1.5 text-left font-bold text-gray-900 text-[10px]">
                  CUMULATIVE AVERAGE
                </td>
                <td className="px-2 py-1.5 text-right font-bold text-gray-900 text-[11px] whitespace-nowrap">
                  {overallTotal}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex-1">
          <div className="flex border-b border-black h-8">
            <div
              className="flex-1 flex items-center justify-center font-bold text-center"
              style={{ backgroundColor: "#fafafa" }}
            >
              النسبة المئوية
              <br />
              PERCENTAGE
            </div>
            <div className="flex-1 flex items-center justify-center font-bold">
              {overallPercentage}%
            </div>
          </div>
          <div className="flex h-8">
            <div
              className="flex-1 flex items-center justify-center font-bold text-center"
              style={{ backgroundColor: "#fafafa" }}
            >
              التقدير
              <br />
              GRADE
            </div>
            <div className="flex-1 flex items-center justify-center font-bold text-center">
              {subjects[0]?.remark ?? "-"}
              {subjects[0]?.remarkArabic && (
                <span className="ml-1" style={{ fontFamily: "Amiri, serif" }}>
                  {subjects[0].remarkArabic}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* comments */}
      <div className="border border-black text-[10px]">
        <div className="flex border-b border-black min-h-9">
          <div className="flex-1 flex items-center justify-center text-center font-bold border-r border-black p-1">
            تعليق وتوقيع أستاذ الصف
            <br />
            CLASS TEACHER'S COMMENT AND SIGNATURE
          </div>
          <div className="flex-2 flex flex-col items-center justify-center p-1 text-center">
            {classTeacherComment ? (
              <>
                <p style={{ fontFamily: "Amiri, serif" }}>
                  {classTeacherComment.ar}
                </p>
                <p>{classTeacherComment.en}</p>
              </>
            ) : (
              <span className="text-gray-300">—</span>
            )}
          </div>
        </div>
        <div className="flex min-h-9 relative">
          <div className="flex-1 flex items-center justify-center text-center font-bold border-r border-black p-1">
            تعليق و توقيع الوكيل
            <br />
            PRINCIPAL'S COMMENT AND SIGNATURE
          </div>
          <div className="flex-2 flex flex-col items-center justify-center p-1 text-center relative">
            {principalComment ? (
              <>
                <p style={{ fontFamily: "Amiri, serif" }}>
                  {principalComment.ar}
                </p>
                <p>{principalComment.en}</p>
              </>
            ) : (
              <span className="text-gray-300">—</span>
            )}
            {templateSettings?.showPrincipalSignature && templateSettings.principalSignatureBase64 && (
              <img
                src={templateSettings.principalSignatureBase64}
                alt="Principal Signature"
                className="max-h-8 max-w-[120px] object-contain mt-1"
              />
            )}
            {templateSettings?.showStamp && templateSettings.stampBase64 && (
              <img
                src={templateSettings.stampBase64}
                alt="School Stamp"
                className="absolute right-4 bottom-1 max-h-10 max-w-[80px] object-contain opacity-80 pointer-events-none"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCardView;

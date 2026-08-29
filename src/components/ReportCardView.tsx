// update the SubjectResult interface at the top:

import type { ReportCardData } from "../types/reportCard";

const termWordEn = (n: number) => (n === 1 ? "1ST" : n === 2 ? "2ND" : "3RD");
const termWordAr = (n: number) =>
  n === 1 ? "الأولى" : n === 2 ? "الثانية" : "الثالثة";
const ordinalEn = ["1ST", "2ND", "3RD"];
const ordinalAr = ["الأولى", "الثانية", "الثالثة"];

const attendanceRows = [
  { ar: "الحضور والغياب", en: "ATTENDANCE" },
  { ar: "عدد أيام الدوام", en: "No. of times school opened" },
  { ar: "نسبة الحضور", en: "No. of times present" },
  { ar: "نسبة الغياب", en: "No. of times absent" },
  { ar: "بدء الدراسة", en: "Date School resumed" },
  { ar: "ختم الدراسة", en: "Date School closes" },
  { ar: "العودة إلى الدراسة", en: "Next resumption" },
];

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
  } = data;

  return (
    <div
      className="border-4 rounded-sm p-4 bg-white"
      style={{ borderColor: "#16a34a" }}
    >
      {/* header */}
      <div className="relative text-center mb-2">
        <div
          className="absolute top-0 right-0 w-16 h-16 rounded flex items-center justify-center text-xs text-gray-400"
          style={{ backgroundColor: "#F4F1EA" }}
        >
          logo
        </div>
        <p
          className="text-2xl font-bold"
          style={{ fontFamily: "Amiri, serif", color: "#1e3a8a" }}
        >
          معهد التعليم العربي الإسلامي
        </p>
        <p className="text-xs font-bold mt-1">
          INSTITUTE OF ARABIC AND ISLAMIC STUDIES
        </p>
        <p className="text-[10px] font-bold mt-0.5 text-gray-700">
          18/20 ABEWALE BELLO STREET, OFF AILEGUN ROAD,
          <br />
          49, LAFENWA STREET, EJIGBO, LAGOS. TEL: 08023299665
        </p>
      </div>

      {/* title bar */}
      <div
        className="text-center text-xs font-bold py-1 mb-2 flex justify-center gap-2"
        style={{ color: "#1e3a8a" }}
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
        <div className="flex-1 border-r border-black">
          {attendanceRows.map((row, i) => (
            <div
              key={i}
              className="flex justify-between items-center px-2 py-1 border-b border-gray-200 last:border-0"
            >
              <span style={{ fontFamily: "Amiri, serif" }}>{row.ar}</span>
              <span>
                {row.en}
                {i === 1 && `: ${attendance.schoolDays}`}
                {i === 2 && `: ${attendance.presentDays}`}
                {i === 3 && `: ${attendance.absentDays}`}
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
        <div className="flex-1 border-r border-black">
          {termAverages.map((t) => (
            <div
              key={t.termNumber}
              className="px-2 py-1 border-b flex justify-between border-black"
            >
              <span>
                {ordinalEn[t.termNumber - 1]} {ordinalAr[t.termNumber - 1]}{" "}
                :{" "}
              </span>
              <span>{t.average ?? "-"}</span>
            </div>
          ))}
          <div className="px-2 py-1 flex justify-between font-bold">
            <span>CUMULATIVE AVERAGE</span>
            <span>{overallTotal}</span>
          </div>
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
        <div className="flex min-h-9">
          <div className="flex-1 flex items-center justify-center text-center font-bold border-r border-black p-1">
            تعليق و توقيع الوكيل
            <br />
            PRINCIPAL'S COMMENT AND SIGNATURE
          </div>
          <div className="flex-2 flex flex-col items-center justify-center p-1 text-center">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCardView;

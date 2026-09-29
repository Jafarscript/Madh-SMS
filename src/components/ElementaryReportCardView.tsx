/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import type { ReportCardData } from "../types/reportCard";
import { ELEMENTARY_FIXED_SUBJECTS } from "../data/elementarySubjects";

interface Props {
  data: ReportCardData;
}

const ordinalEn = ["1st", "2nd", "3rd"];
const ordinalAr = ["الأولى", "الثانية", "الثالثة"];

const toArabicNumerals = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || val === "") return "-";
  const str = String(val);
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return str.replace(/[0-9]/g, (d) => arabicDigits[parseInt(d, 10)]);
};

const getArabicGradeRemark = (grade: string | null | undefined, percentage: number): string => {
  if (percentage < 50 || grade === "Fail" || grade === "Poor" || grade === "F") return "ضعيف";
  if (percentage >= 85 || grade === "Excellent" || grade === "A") return "ممتاز";
  if (percentage >= 75 || grade === "V. Good" || grade === "V.Good" || grade === "B") return "جيد جداً";
  if (percentage >= 65 || grade === "Good" || grade === "C") return "جيد";
  return "مقبول";
};

const getElementaryGrade = (score: number | null | undefined, existingGrade?: string | null): string => {
  if (score !== null && score !== undefined && !isNaN(score)) {
    if (score >= 85) return "Excellent";
    if (score >= 75) return "V.Good";
    if (score >= 65) return "Good";
    if (score >= 50) return "Fair";
    return "Poor";
  }
  if (existingGrade) {
    if (existingGrade === "A1" || existingGrade === "A") return "Excellent";
    if (
      existingGrade === "B2" ||
      existingGrade === "B" ||
      existingGrade.includes("Very Good") ||
      existingGrade.includes("V. Good") ||
      existingGrade.includes("V.Good")
    ) {
      return "V.Good";
    }
    if (existingGrade === "C4" || existingGrade === "C") return "Good";
    if (existingGrade === "D7" || existingGrade === "D" || existingGrade === "Pass") return "Fair";
    if (existingGrade === "F9" || existingGrade === "F" || existingGrade === "Fail") return "Poor";
    return existingGrade;
  }
  return "";
};

export const ElementaryReportCardView: React.FC<Props> = ({ data }) => {
  const {
    student,
    term,
    subjects = [],
    overallTotal,
    overallPercentage,
    position,
    result,
    totalStudentsInClass,
    attendance,
    classTeacherComment,
    principalComment,
    templateSettings,
    affectiveScores = {},
  } = data;

  const schoolNameAr =
    templateSettings?.schoolNameArabic || "معهد التعليم العربي الإسلامي";
  const schoolNameEn =
    templateSettings?.schoolNameEnglish || "INSTITUTE OF ARABIC AND ISLAMIC STUDIES";

  const timesOpened = attendance?.timesSchoolOpened ?? attendance?.schoolDays ?? "";
  const timesPresent = attendance?.timesPresent ?? attendance?.presentDays ?? "";
  const timesAbsent = attendance?.timesAbsent ?? attendance?.absentDays ?? "";
  const dateResumed = attendance?.dateResumed || "";
  const dateClosed = attendance?.dateClosed || "";
  const nextResumption = attendance?.nextResumption || "";

  // Merge the fixed 6 subjects with any scores or extra subjects
  const subjectMap = new Map<string, any>();
  subjects.forEach((s) => {
    const key = (s.nameEnglish || "").trim().toLowerCase();
    subjectMap.set(key, s);
    if (s.nameArabic) {
      subjectMap.set(s.nameArabic.trim(), s);
    }
  });

  const displaySubjects: Array<{
    nameEnglish: string;
    nameArabic: string;
    ca: number | null;
    exam: number | null;
    total: number | null;
    grade: string | null;
  }> = [];

  const matchedKeys = new Set<string>();

  // 1. Process fixed 6 subjects in exact order
  ELEMENTARY_FIXED_SUBJECTS.forEach((fixed) => {
    const keyEn = fixed.nameEnglish.trim().toLowerCase();
    const keyAr = fixed.nameArabic.trim();

    // Look for exact or partial match
    let found = subjectMap.get(keyEn) || subjectMap.get(keyAr);
    if (!found) {
      for (const [sKey, sVal] of subjectMap.entries()) {
        if (
          (keyEn.includes("memorization") && sKey.includes("memorization")) ||
          (keyEn.includes("hadith") && sKey.includes("hadith")) ||
          (keyEn.includes("reading") && sKey.includes("reading")) ||
          (keyEn.includes("writing") && sKey.includes("writing")) ||
          (keyEn.includes("arabic") && sKey === "arabic") ||
          (keyEn.includes("hymns") && sKey.includes("hymn"))
        ) {
          found = sVal;
          break;
        }
      }
    }

    if (found) {
      matchedKeys.add((found.nameEnglish || "").trim().toLowerCase());
      if (found.nameArabic) matchedKeys.add(found.nameArabic.trim());
    }

    const totalVal =
      found?.currentTermScore ??
      found?.combinedTotal ??
      (found?.ca !== null && found?.exam !== null && found?.ca !== undefined && found?.exam !== undefined
        ? Number(found.ca) + Number(found.exam)
        : null);

    displaySubjects.push({
      nameEnglish: fixed.nameEnglish,
      nameArabic: fixed.nameArabic,
      ca: found?.ca ?? null,
      exam: found?.exam ?? null,
      total: totalVal,
      grade: getElementaryGrade(totalVal, found?.grade ?? null),
    });
  });

  // 2. Append any extra subjects that were entered for this student
  subjects.forEach((s) => {
    const keyEn = (s.nameEnglish || "").trim().toLowerCase();
    const keyAr = (s.nameArabic || "").trim();
    if (!matchedKeys.has(keyEn) && (!keyAr || !matchedKeys.has(keyAr))) {
      const totalVal =
        s.currentTermScore ??
        s.combinedTotal ??
        (s.ca !== null && s.exam !== null && s.ca !== undefined && s.exam !== undefined
          ? Number(s.ca) + Number(s.exam)
          : null);

      displaySubjects.push({
        nameEnglish: s.nameEnglish,
        nameArabic: s.nameArabic || "",
        ca: s.ca ?? null,
        exam: s.exam ?? null,
        total: totalVal,
        grade: getElementaryGrade(totalVal, s.grade ?? null),
      });
    }
  });

  const fallbackRemark =
    overallPercentage >= 85
      ? "Excellent"
      : overallPercentage >= 75
      ? "V.Good"
      : overallPercentage >= 65
      ? "Good"
      : overallPercentage >= 50
      ? "Fair"
      : "Poor";
  const fallbackRemarkArabic =
    overallPercentage >= 85
      ? "ممتاز"
      : overallPercentage >= 75
      ? "جيد جداً"
      : overallPercentage >= 65
      ? "جيد"
      : overallPercentage >= 50
      ? "مقبول"
      : "ضعيف";

  const isEnrolled = (student as any)?.isEnrolledInCurrentTerm !== false;
  const displayRemark = data.remark || (!isEnrolled ? "Not Enrolled" : fallbackRemark);
  const displayRemarkArabic = data.remarkArabic || (!isEnrolled ? "لم يلتحق" : fallbackRemarkArabic);

  return (
    <div className="max-w-[794px] mx-auto p-4 bg-white text-gray-950 border border-black shadow-sm font-sans text-xs select-none">
      {/* Top School Header */}
      <div className="relative text-center pb-2 mb-2 border-b border-gray-300">
        <h1
          className="text-2xl font-bold tracking-tight text-gray-950"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {schoolNameAr}
        </h1>
        <p
          className="text-sm font-bold text-gray-800 mt-0.5"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          ايجيبوا - لاغوس - نيجيريا
        </p>
        <h2 className="text-sm font-bold tracking-wide text-gray-900 mt-1 uppercase">
          {schoolNameEn}
        </h2>
        <p className="text-[11px] tracking-wider text-gray-700 font-semibold uppercase">
          FOR CHARITABLE ORGANIZATION
        </p>
        <p className="text-[9px] text-gray-600 mt-0.5 leading-snug">
          18/20 ADEWALE BELLO STREET, OFF AILEGUN ROAD, EJIGBO, LAGOS.
          <br />
          49 LAFENWA STREET, OFF COCA ROAD, EJIGBO, LAGOS. TEL: 08023299665
        </p>
        {templateSettings?.logoBase64 && (
          <img
            src={templateSettings.logoBase64}
            alt="School Logo"
            className="absolute right-0 top-0 w-16 h-16 md:w-20 md:h-20 object-contain"
          />
        )}
      </div>

      {/* Dark Navy Blue Banner */}
      <div className="flex justify-between items-center px-4 py-1.5 bg-[#1e3a5f] text-white font-bold text-sm tracking-wide rounded-none mb-2 border border-black">
        <span className="tracking-wider">REPORT CARD</span>
        <span className="text-base" style={{ fontFamily: "'Amiri', serif" }}>
          كشف الدرجات
        </span>
      </div>

      {/* Top Grid: Attendance on Left, Meta & Mini Affective on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        {/* Attendance Table */}
        <div className="border border-black">
          <table className="w-full text-[10px] text-center border-collapse">
            <thead>
              <tr className="border-b border-black font-bold bg-white">
                <th className="py-1 px-2 text-left w-[46%]">ATTENDANCE</th>
                <th className="py-1 px-1 w-[18%] border-x border-black"></th>
                <th
                  className="py-1 px-2 text-right w-[36%] text-[11px]"
                  style={{ fontFamily: "'Amiri', serif" }}
                >
                  الحضور والغياب
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              <tr>
                <td className="py-1 px-2 text-left">No. of times school opened</td>
                <td className="py-1 px-1 border-x border-black font-semibold">{timesOpened || "-"}</td>
                <td className="py-1 px-2 text-right" style={{ fontFamily: "'Amiri', serif" }}>
                  عدد أيام الدوام
                </td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-left">No. of times present</td>
                <td className="py-1 px-1 border-x border-black font-semibold">{timesPresent || "-"}</td>
                <td className="py-1 px-2 text-right" style={{ fontFamily: "'Amiri', serif" }}>
                  نسبة الحضور
                </td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-left">No. of times absent</td>
                <td className="py-1 px-1 border-x border-black font-semibold">{timesAbsent || "-"}</td>
                <td className="py-1 px-2 text-right" style={{ fontFamily: "'Amiri', serif" }}>
                  نسبة الغياب
                </td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-left">No. of Students in the class</td>
                <td className="py-1 px-1 border-x border-black font-semibold">{totalStudentsInClass || "-"}</td>
                <td className="py-1 px-2 text-right" style={{ fontFamily: "'Amiri', serif" }}>
                  عدد الطلاب في الصف
                </td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-left">Date School resumed</td>
                <td className="py-1 px-1 border-x border-black font-semibold">{dateResumed || "-"}</td>
                <td className="py-1 px-2 text-right" style={{ fontFamily: "'Amiri', serif" }}>
                  بدء الدراسة
                </td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-left">Date School closes</td>
                <td className="py-1 px-1 border-x border-black font-semibold">{dateClosed || "-"}</td>
                <td className="py-1 px-2 text-right" style={{ fontFamily: "'Amiri', serif" }}>
                  ختم الدراسة
                </td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-left">Next resumption</td>
                <td className="py-1 px-1 border-x border-black font-semibold">{nextResumption || "-"}</td>
                <td className="py-1 px-2 text-right" style={{ fontFamily: "'Amiri', serif" }}>
                  العودة إلى الدراسة
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right Info Boxes: Session/Term, Name/Class, Mini Affective */}
        <div className="flex flex-col justify-between gap-1.5">
          {/* Session & Term Table */}
          <table className="w-full text-[10.5px] border border-black border-collapse">
            <tbody>
              <tr className="border-b border-black">
                <td className="py-1 px-2 font-bold w-[22%] text-left">Session:</td>
                <td className="py-1 px-2 font-bold text-center w-[56%]">{term.session}</td>
                <td
                  className="py-1 px-2 font-bold text-right w-[22%]"
                  style={{ fontFamily: "'Amiri', serif" }}
                >
                  :عام
                </td>
              </tr>
              <tr>
                <td className="py-1 px-2 font-bold text-left">Term:</td>
                <td className="py-1 px-2 font-bold text-center">
                  <span>{ordinalEn[term.termNumber - 1]} Term</span>
                  <span className="mx-2" style={{ fontFamily: "'Amiri', serif" }}>
                    {ordinalAr[term.termNumber - 1]}
                  </span>
                </td>
                <td
                  className="py-1 px-2 font-bold text-right"
                  style={{ fontFamily: "'Amiri', serif" }}
                >
                  :الفترة
                </td>
              </tr>
            </tbody>
          </table>

          {/* Name & Class Table */}
          <table className="w-full text-[10.5px] border border-black border-collapse">
            <tbody>
              <tr className="border-b border-black">
                <td className="py-1 px-2 font-bold w-[20%] text-left">Name:</td>
                <td
                  className="py-1 px-2 font-bold text-center text-sm w-[60%]"
                  style={{ fontFamily: "'Amiri', serif" }}
                >
                  {student.name}
                </td>
                <td
                  className="py-1 px-2 font-bold text-right w-[20%]"
                  style={{ fontFamily: "'Amiri', serif" }}
                >
                  :الإسم
                </td>
              </tr>
              <tr>
                <td className="py-1 px-2 font-bold text-left">Class:</td>
                <td className="py-1 px-2 font-bold text-center">
                  <span className="uppercase">{student.class}</span>
                  {student.arm && <span> ({student.arm})</span>}
                </td>
                <td
                  className="py-1 px-2 font-bold text-right"
                  style={{ fontFamily: "'Amiri', serif" }}
                >
                  :الصف
                </td>
              </tr>
            </tbody>
          </table>

          {/* Mini Affective Domain Table */}
          <table className="w-full text-[10px] text-center border border-black border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-black">
                <th className="text-left py-1 px-2 border-r border-black font-bold">
                  AFFECTIVE DOMAIN
                </th>
                <th className="w-6 border-r border-black font-bold">1</th>
                <th className="w-6 border-r border-black font-bold">2</th>
                <th className="w-6 border-r border-black font-bold">3</th>
                <th className="w-6 border-r border-black font-bold">4</th>
                <th className="w-6 font-bold">5</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              <tr>
                <td className="text-left py-1 px-2 border-r border-black font-medium">
                  Punctuality
                </td>
                <td className="border-r border-black">{affectiveScores["Punctuality"] === 1 ? "✓" : ""}</td>
                <td className="border-r border-black">{affectiveScores["Punctuality"] === 2 ? "✓" : ""}</td>
                <td className="border-r border-black">{affectiveScores["Punctuality"] === 3 ? "✓" : ""}</td>
                <td className="border-r border-black">{affectiveScores["Punctuality"] === 4 ? "✓" : ""}</td>
                <td>{affectiveScores["Punctuality"] === 5 ? "✓" : ""}</td>
              </tr>
              <tr>
                <td className="text-left py-1 px-2 border-r border-black font-medium">
                  Neatness
                </td>
                <td className="border-r border-black">{affectiveScores["Neatness"] === 1 ? "✓" : ""}</td>
                <td className="border-r border-black">{affectiveScores["Neatness"] === 2 ? "✓" : ""}</td>
                <td className="border-r border-black">{affectiveScores["Neatness"] === 3 ? "✓" : ""}</td>
                <td className="border-r border-black">{affectiveScores["Neatness"] === 4 ? "✓" : ""}</td>
                <td>{affectiveScores["Neatness"] === 5 ? "✓" : ""}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Elementary Subjects Table */}
      <div className="border border-black overflow-hidden mb-2">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="bg-slate-200 border-b border-black text-center font-bold">
              <th className="py-1 px-1 border-r border-black w-24">
                <span className="text-[11px]" style={{ fontFamily: "'Amiri', serif" }}>
                  التقدير
                </span>
                <br />
                <span className="text-[9.5px] font-semibold">(GRADE)</span>
              </th>
              <th className="py-1 px-1 border-r border-black w-20">
                <span className="text-[11px]" style={{ fontFamily: "'Amiri', serif" }}>
                  المحصلة
                </span>
                <br />
                <span className="text-[9.5px] font-semibold">(TOTAL)</span>
              </th>
              <th className="py-1 px-1 border-r border-black w-24">
                <span className="text-[11px]" style={{ fontFamily: "'Amiri', serif" }}>
                  الامتحان
                </span>
                <br />
                <span className="text-[9.5px] font-semibold">(EXAM 60%)</span>
              </th>
              <th className="py-1 px-1 border-r border-black w-28">
                <span className="text-[11px]" style={{ fontFamily: "'Amiri', serif" }}>
                  المراقبة المستمرة
                </span>
                <br />
                <span className="text-[9.5px] font-semibold">(CA 40%)</span>
              </th>
              <th className="py-1 px-3 text-right">
                <div className="flex justify-between items-center font-bold">
                  <span className="tracking-wide">SUBJECTS</span>
                  <span className="text-sm" style={{ fontFamily: "'Amiri', serif" }}>
                    المواد
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {displaySubjects.map((sub, idx) => (
              <tr key={idx} className="text-center font-medium">
                <td className="py-1.5 px-1 border-r border-black font-semibold text-gray-800">
                  {sub.grade ?? ""}
                </td>
                <td className="py-1.5 px-1 border-r border-black font-semibold">
                  {sub.total !== null && sub.total !== undefined ? sub.total : ""}
                </td>
                <td className="py-1.5 px-1 border-r border-black">
                  {sub.exam !== null && sub.exam !== undefined ? sub.exam : ""}
                </td>
                <td className="py-1.5 px-1 border-r border-black">
                  {sub.ca !== null && sub.ca !== undefined ? sub.ca : ""}
                </td>
                <td className="py-1.5 px-3 text-right">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="tracking-wider uppercase">{sub.nameEnglish}</span>
                    <span className="text-sm" style={{ fontFamily: "'Amiri', serif" }}>
                      {sub.nameArabic}
                    </span>
                  </div>
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr className="border-t-2 border-black bg-white font-bold text-center">
              <td className="py-1.5 px-1 border-r border-black text-rose-700 font-bold">
                {result || "Fail"}
              </td>
              <td className="py-1.5 px-1 border-r border-black font-bold">
                {overallTotal > 0 ? overallTotal : "."}
              </td>
              <td className="py-1.5 px-1 border-r border-black"></td>
              <td className="py-1.5 px-1 border-r border-black"></td>
              <td className="py-1.5 px-3 text-right font-bold">
                <div className="flex justify-between items-center">
                  <span className="tracking-wider">TOTAL</span>
                  <span className="text-sm" style={{ fontFamily: "'Amiri', serif" }}>
                    المجموع الكلي
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom Section: Skills, Grading Scale, Rosette Star, Summary & Remarks */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-[10px]">
        {/* Left: Psychomotor / Affective Skills Table (5 cols) */}
        <div className="md:col-span-5 border border-black overflow-hidden flex flex-col justify-between">
          <table className="w-full text-[9.5px] text-center border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-black font-bold">
                <th colSpan={6} className="py-1 px-1 text-[10px]">
                  (Psychomotor / Affective Skills) &nbsp; السلوك والنشاط
                </th>
              </tr>
              <tr className="bg-slate-50 border-b border-black font-bold">
                <th className="w-5 py-0.5 border-r border-black">5</th>
                <th className="w-5 py-0.5 border-r border-black">4</th>
                <th className="w-5 py-0.5 border-r border-black">3</th>
                <th className="w-5 py-0.5 border-r border-black">2</th>
                <th className="w-5 py-0.5 border-r border-black">1</th>
                <th className="py-0.5 px-1 text-right">Skills</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {[
                { en: "Punctuality", ar: "المواظبة" },
                { en: "Neatness", ar: "النظافة" },
                { en: "Attitude to sch. Work", ar: "التجاوب الدراسي" },
                { en: "Attentiveness", ar: "الانتباه" },
                { en: "Speaking Habit/Writing", ar: "التحدث / الخط" },
                { en: "Verbal Fluency", ar: "الفصاحة" },
                { en: "Games / Sports", ar: "الألعاب والرياضة" },
              ].map((skill, sIdx) => {
                const score = affectiveScores[skill.en] ?? null;
                return (
                  <tr key={sIdx}>
                    <td className="py-0.5 border-r border-black font-bold text-blue-900">
                      {score === 5 ? "✓" : ""}
                    </td>
                    <td className="py-0.5 border-r border-black font-bold text-blue-900">
                      {score === 4 ? "✓" : ""}
                    </td>
                    <td className="py-0.5 border-r border-black font-bold text-blue-900">
                      {score === 3 ? "✓" : ""}
                    </td>
                    <td className="py-0.5 border-r border-black font-bold text-blue-900">
                      {score === 2 ? "✓" : ""}
                    </td>
                    <td className="py-0.5 border-r border-black font-bold text-blue-900">
                      {score === 1 ? "✓" : ""}
                    </td>
                    <td className="py-0.5 px-1 text-right">
                      <div className="flex justify-between items-center">
                        <span className="text-[8.5px] text-gray-700">{skill.en}</span>
                        <span className="font-semibold" style={{ fontFamily: "'Amiri', serif" }}>
                          {skill.ar}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Center: Scale & Rosette Seal (2 cols) */}
        <div className="md:col-span-2 border border-black p-1 flex flex-col items-center justify-between text-center bg-white">
          <div className="text-[9px] font-bold leading-relaxed border-b border-gray-300 pb-1 w-full text-left pl-1">
            <div>85 - 100 = Excellent</div>
            <div>75 - 84 = V.Good</div>
            <div>65 - 74 = Good</div>
            <div>50 - 64 = Fair</div>
            <div>1 - 49 = Poor</div>
          </div>

          <div className="my-1">
            {templateSettings?.showStamp && templateSettings?.stampBase64 ? (
              <img
                src={templateSettings.stampBase64}
                alt="Stamp"
                className="max-h-16 max-w-16 object-contain"
              />
            ) : (
              <svg className="w-16 h-16 mx-auto" viewBox="0 0 100 100">
                <polygon
                  points="50,4 61,19 79,9 80,29 98,36 88,53 97,70 77,75 73,95 54,87 37,97 30,78 10,75 18,57 5,42 22,33 21,13 40,20"
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth="1.6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="28"
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
                <circle cx="50" cy="50" r="22" fill="#f8fafc" stroke="#1e3a8a" strokeWidth="1" />
                <text
                  x="50"
                  y="47"
                  textAnchor="middle"
                  fontSize="6.5"
                  fontWeight="bold"
                  fill="#1e3a8a"
                >
                  OFFICIAL
                </text>
                <text
                  x="50"
                  y="56"
                  textAnchor="middle"
                  fontSize="6.5"
                  fontWeight="bold"
                  fill="#1e3a8a"
                >
                  SEAL
                </text>
              </svg>
            )}
          </div>
        </div>

        {/* Right: Position/Percentage/Result/Grade & Remarks (5 cols) */}
        <div className="md:col-span-5 border border-black flex flex-col justify-between">
          {/* Summary Grid: 2 rows of 2 boxes */}
          <div className="border-b border-black text-[9.5px] font-semibold">
            <div className="grid grid-cols-2 border-b border-black">
              <div className="border-r border-black p-1 flex justify-between items-center">
                <span>Position</span>
                <strong className="text-[11px]">
                  {position ? position : "-"}
                </strong>
                <span style={{ fontFamily: "'Amiri', serif" }}>:الترتيب</span>
              </div>
              <div className="p-1 flex justify-between items-center">
                <span>Percentage%</span>
                <strong className="text-[11px]">{overallPercentage.toFixed(1)} %</strong>
                <span style={{ fontFamily: "'Amiri', serif" }}>النسبة المئوية:</span>
              </div>
            </div>

            <div className="grid grid-cols-2">
              <div className="border-r border-black p-1 flex justify-between items-center">
                <span>Result:</span>
                <strong className="text-[11px] text-rose-700">{result || "Fail"}</strong>
                <span style={{ fontFamily: "'Amiri', serif" }}>:النتيجة</span>
              </div>
              <div className="p-1 flex justify-between items-center">
                <span>Grade:</span>
                <strong
                  className="text-[11px] text-rose-700 flex items-center gap-1"
                >
                  <span>{displayRemark}</span>
                  {displayRemarkArabic && (
                    <span style={{ fontFamily: "'Amiri', serif" }} dir="rtl">
                      ({displayRemarkArabic})
                    </span>
                  )}
                </strong>
                <span style={{ fontFamily: "'Amiri', serif" }}>:التقدير</span>
              </div>
            </div>
          </div>

          {/* Teacher's comment */}
          <div className="p-1.5 border-b border-black flex flex-col justify-between min-h-[48px]">
            <div
              className="text-right font-bold text-[9.5px]"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              تعليق أستاذ الصف / <span className="font-normal font-sans text-[8.5px]">:Teacher's comment</span>
            </div>
            <div className="text-center py-1 font-medium text-[9px] text-gray-800">
              {classTeacherComment?.en || classTeacherComment?.ar ? (
                <div>
                  {classTeacherComment.ar && (
                    <div style={{ fontFamily: "'Amiri', serif" }} className="font-bold">
                      {classTeacherComment.ar}
                    </div>
                  )}
                  {classTeacherComment.en && <div>{classTeacherComment.en}</div>}
                </div>
              ) : (
                <span className="text-gray-500 italic">
                  performance can improve with increased focus
                </span>
              )}
            </div>
            <div className="flex justify-between items-center text-[8.5px] text-gray-700">
              <span>Signature: ....................................................</span>
              <span style={{ fontFamily: "'Amiri', serif" }}>:التوقيع</span>
            </div>
          </div>

          {/* Principal's comment */}
          <div className="p-1.5 flex flex-col justify-between min-h-[48px] relative">
            <div className="text-[9px] text-gray-700 space-y-0.5">
              <div className="flex justify-between">
                <span style={{ fontFamily: "'Amiri', serif" }}>
                  تعليق الوكيل:...........................................................................................
                </span>
              </div>
              <div className="text-left">
                Principal's comment:...................................................................................
              </div>
            </div>
            <div className="text-center py-0.5">
              {principalComment && (
                <div className="text-[8.5px] font-medium text-gray-900">
                  {principalComment.ar && (
                    <span style={{ fontFamily: "'Amiri', serif" }} className="font-bold mx-1">
                      {principalComment.ar}
                    </span>
                  )}
                  {principalComment.en && <span>{principalComment.en}</span>}
                </div>
              )}
              {templateSettings?.showPrincipalSignature && templateSettings.principalSignatureBase64 && (
                <img
                  src={templateSettings.principalSignatureBase64}
                  alt="Principal Signature"
                  className="max-h-5 max-w-[80px] object-contain mx-auto mt-0.5"
                />
              )}
            </div>
            <div className="flex justify-between items-center text-[8.5px] text-gray-700">
              <span>Signature: ....................................................</span>
              <span style={{ fontFamily: "'Amiri', serif" }}>:التوقيع</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

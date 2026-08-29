import bcrypt from "bcryptjs";
import User from "./models/User";
import Branch from "./models/Branch";
import ClassModel from "./models/Class";
import Subject from "./models/Subject";
import GradingScale from "./models/GradingScale";
import Term from "./models/Term";
import Student from "./models/Student";
import Score from "./models/Score";
import ReportCardRemark from "./models/ReportCardRemark";

export const seedDatabase = async () => {
  try {
    const defaultHashedPassword = await bcrypt.hash("password123", 10);
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("Database already has data. Ensuring demo passwords are valid...");
      await User.updateMany(
        {},
        { $set: { password: defaultHashedPassword, mustChangePassword: false } }
      );
      return;
    }

    console.log("Seeding database with initial data...");

    // 1. Branches
    const mainBranch = await Branch.create({
      name: "Main Campus (Central)",
      address: "123 Islamic Academy Blvd, Knowledge District",
    });

    const northBranch = await Branch.create({
      name: "North Branch",
      address: "45 Al-Hikmah Way, North City",
    });

    // 2. Classes
    const grade1A = await ClassModel.create({
      name: "Grade 1",
      arm: "A",
      branch: mainBranch._id,
    });

    const grade1B = await ClassModel.create({
      name: "Grade 1",
      arm: "B",
      branch: mainBranch._id,
    });

    const grade2A = await ClassModel.create({
      name: "Grade 2",
      arm: "A",
      branch: mainBranch._id,
    });

    const grade3A = await ClassModel.create({
      name: "Grade 3",
      arm: "A",
      branch: mainBranch._id,
    });

    // 3. Subjects for Grade 1 A
    const quran = await Subject.create({
      nameEnglish: "Quran & Tajweed",
      nameArabic: "القرآن الكريم والتجويد",
      class: grade1A._id,
    });

    const hadith = await Subject.create({
      nameEnglish: "Hadith Studies",
      nameArabic: "الحديث الشريف",
      class: grade1A._id,
    });

    const islamicStudies = await Subject.create({
      nameEnglish: "Islamic Studies (Fiqh)",
      nameArabic: "الفقه والتربية الإسلامية",
      class: grade1A._id,
    });

    const arabicLang = await Subject.create({
      nameEnglish: "Arabic Language",
      nameArabic: "اللغة العربية",
      class: grade1A._id,
    });

    const englishLang = await Subject.create({
      nameEnglish: "English Language",
      nameArabic: "اللغة الإنجليزية",
      class: grade1A._id,
    });

    const mathematics = await Subject.create({
      nameEnglish: "Mathematics",
      nameArabic: "الرياضيات",
      class: grade1A._id,
    });

    const basicScience = await Subject.create({
      nameEnglish: "Basic Science",
      nameArabic: "العلوم العامة",
      class: grade1A._id,
    });

    // Also create some subjects for Grade 1 B & Grade 2 A
    await Subject.create({
      nameEnglish: "Quran & Tajweed",
      nameArabic: "القرآن الكريم والتجويد",
      class: grade1B._id,
    });
    await Subject.create({
      nameEnglish: "Arabic Language",
      nameArabic: "اللغة العربية",
      class: grade1B._id,
    });
    await Subject.create({
      nameEnglish: "Quran & Tajweed",
      nameArabic: "القرآن الكريم والتجويد",
      class: grade2A._id,
    });

    // 4. Grading Scales
    const gradingScale = await GradingScale.create({
      name: "Standard Islamic Academy Scale",
      bands: [
        { minScore: 70, maxScore: 100, grade: "A1", remark: "Excellent Distinction", remarkArabic: "ممتاز مع مرتبة الشرف" },
        { minScore: 60, maxScore: 69, grade: "B2", remark: "Very Good", remarkArabic: "جيد جداً" },
        { minScore: 50, maxScore: 59, grade: "C3", remark: "Good / Credit", remarkArabic: "جيد" },
        { minScore: 40, maxScore: 49, grade: "D4", remark: "Pass", remarkArabic: "مقبول" },
        { minScore: 0, maxScore: 39, grade: "F9", remark: "Fail", remarkArabic: "راسب" },
      ],
    });

    // 5. Terms
    const term1 = await Term.create({
      session: "2025/2026",
      termNumber: 1,
      isActive: false,
    });

    const term2 = await Term.create({
      session: "2025/2026",
      termNumber: 2,
      isActive: true,
    });

    const term3 = await Term.create({
      session: "2025/2026",
      termNumber: 3,
      isActive: false,
    });

    // 6. Students
    const student1 = await Student.create({
      name: "Amina Ibrahim",
      gender: "F",
      class: grade1A._id,
      branch: mainBranch._id,
      numberInClass: 1,
    });

    const student2 = await Student.create({
      name: "Zaid Al-Mansoor",
      gender: "M",
      class: grade1A._id,
      branch: mainBranch._id,
      numberInClass: 2,
    });

    const student3 = await Student.create({
      name: "Fatima Yusuf",
      gender: "F",
      class: grade1A._id,
      branch: mainBranch._id,
      numberInClass: 3,
    });

    const student4 = await Student.create({
      name: "Bilal Hassan",
      gender: "M",
      class: grade1A._id,
      branch: mainBranch._id,
      numberInClass: 4,
    });

    const student5 = await Student.create({
      name: "Maryam Siddiq",
      gender: "F",
      class: grade1A._id,
      branch: mainBranch._id,
      numberInClass: 5,
    });

    // 7. Users
    // Super Admin
    await User.create({
      name: "Super Administrator",
      email: "admin@school.com",
      password: defaultHashedPassword,
      role: "super_admin",
      mustChangePassword: false,
    });

    // Branch Admin
    await User.create({
      name: "Branch Director (Main)",
      email: "branchadmin@school.com",
      password: defaultHashedPassword,
      role: "branch_admin",
      branch: mainBranch._id,
      mustChangePassword: false,
    });

    // Class Teacher
    const classTeacher = await User.create({
      name: "Ustadh Umar Farooq (Class Teacher 1A)",
      email: "classteacher@school.com",
      password: defaultHashedPassword,
      role: "class_teacher",
      branch: mainBranch._id,
      classes: [grade1A._id],
      mustChangePassword: false,
    });

    // Subject Teacher
    const subjectTeacher = await User.create({
      name: "Ustadha Aisha Rahman (Arabic & Quran Teacher)",
      email: "subjectteacher@school.com",
      password: defaultHashedPassword,
      role: "subject_teacher",
      branch: mainBranch._id,
      classes: [grade1A._id, grade1B._id],
      subjects: [quran._id, arabicLang._id, hadith._id],
      mustChangePassword: false,
    });

    // Parent
    await User.create({
      name: "Dr. Ibrahim Parent (Father of Amina)",
      email: "parent@school.com",
      password: defaultHashedPassword,
      role: "parent",
      linkedStudent: student1._id,
      mustChangePassword: false,
    });

    // 8. Scores for Term 1 (Session 2025/2026)
    const subjectsGrade1A = [quran, hadith, islamicStudies, arabicLang, englishLang, mathematics, basicScience];
    const studentsGrade1A = [student1, student2, student3, student4, student5];

    // Seed Term 1 scores
    for (const student of studentsGrade1A) {
      for (const subject of subjectsGrade1A) {
        const ca = Math.floor(Math.random() * 8) + 32; // 32 - 40
        const exam = Math.floor(Math.random() * 18) + 40; // 40 - 58
        await Score.create({
          student: student._id,
          subject: subject._id,
          term: term1._id,
          ca,
          exam,
          total: ca + exam,
          enteredBy: subjectTeacher._id,
        });
      }
    }

    // Seed Term 2 scores
    for (const student of studentsGrade1A) {
      for (const subject of subjectsGrade1A) {
        const ca = Math.floor(Math.random() * 7) + 33;
        const exam = Math.floor(Math.random() * 16) + 42;
        await Score.create({
          student: student._id,
          subject: subject._id,
          term: term2._id,
          ca,
          exam,
          total: ca + exam,
          enteredBy: subjectTeacher._id,
        });
      }
    }

    // 9. Report Card Remarks for Student 1 & Student 2 in Term 2
    await ReportCardRemark.create({
      student: student1._id,
      term: term2._id,
      classTeacherCommentId: "1",
      classTeacherCommentEn: "An outstanding and exemplary student who demonstrates high dedication to Islamic ethics and academics.",
      classTeacherCommentAr: "طالبة متميزة وخلوقة تبدي حرصاً كبيراً على التفوق والأخلاق الإسلامية.",
      principalCommentId: "1",
      principalCommentEn: "Excellent performance. Keep up the high standard and continuous progress.",
      principalCommentAr: "أداء ممتاز ومبارك، نرجو لها دوام التوفيق والنجاح.",
      enteredBy: classTeacher._id,
    });

    console.log("Database seeded successfully with demo data!");
  } catch (err) {
    console.error("Error seeding database:", err);
  }
};

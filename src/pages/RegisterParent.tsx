import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Search, CheckCircle2, AlertCircle, ArrowLeft, GraduationCap, ShieldCheck, HeartHandshake } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
  branch?: { _id: string; name: string };
}

interface VerifiedStudent {
  _id: string;
  name: string;
  gender: "M" | "F";
  admissionNumber: string;
  class: { _id: string; name: string; arm?: string };
  branch?: { _id: string; name: string };
}

const RegisterParent = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [classes, setClasses] = useState<ClassItem[]>([]);

  // Step 1: Child Lookup
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifiedStudent, setVerifiedStudent] = useState<VerifiedStudent | null>(null);

  // Step 2: Parent Information
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    api.get("/classes")
      .then((res) => setClasses(res.data))
      .catch(() => {});
  }, []);

  const handleLookupStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentQuery.trim()) {
      setVerifyError("Please enter your child's Admission Number, Student ID, or Name");
      return;
    }

    setVerifying(true);
    setVerifyError("");
    setVerifiedStudent(null);

    try {
      const res = await api.post("/auth/lookup-student", {
        identifier: studentQuery.trim(),
        classId: selectedClassId || undefined,
      });

      if (res.data?.student) {
        setVerifiedStudent(res.data.student);
      }
    } catch (err: any) {
      setVerifyError(
        err.response?.data?.message ||
          "Could not locate a student with those details. Please check the Admission Number or select the student's class."
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleRegisterParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!verifiedStudent) {
      setSubmitError("Please verify your child's admission details first");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setSubmitError("Password must be at least 6 characters long");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/auth/register-parent", {
        name: parentName,
        email,
        phone,
        password,
        studentId: verifiedStudent._id,
      });

      // Auto login
      if (res.data?.token && res.data?.user) {
        login(res.data.user, res.data.token);
        navigate("/parent");
      } else {
        navigate("/login");
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || "Failed to create parent account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* LEFT — identity banner */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-emerald-950 via-[#063a28] to-teal-900 text-white">
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="islamicStar2" width="60" height="60" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="#34d399" strokeWidth="1">
                <path d="M30 5 L36 22 L54 22 L40 33 L45 51 L30 40 L15 51 L20 33 L6 22 L24 22 Z" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamicStar2)" />
        </svg>

        <div className="relative z-10 text-center">
          <p className="text-3xl leading-tight text-white font-bold" style={{ fontFamily: "Amiri, serif" }}>
            معهد التعليم العربي الإسلامي
          </p>
          <p className="mt-2 text-xs tracking-widest uppercase text-emerald-300 font-semibold">
            Institute of Arabic and Islamic Studies
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <GraduationCap className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Parent Results Portal</p>
              <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
                Check terminal scores, download official PDF report cards, and track your children's Islamic and academic growth.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <HeartHandshake className="w-6 h-6 text-teal-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Multiple Children Support</p>
              <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
                Connect all your children to a single parent account and switch between their report cards effortlessly.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-emerald-200/60">
          Parents & Guardians Portal • Session 2025/2026
        </div>
      </div>

      {/* RIGHT — registration steps */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-lg">
          <div className="mb-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>

          <div className="bg-white shadow-xl rounded-2xl border border-slate-100 p-8">
            <div className="mb-6">
              <h1
                className="text-2xl font-bold text-slate-900 mb-1"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Parent Portal Sign Up
              </h1>
              <p className="text-sm text-slate-500">
                Link your child and create your parent access account
              </p>
            </div>

            {/* SECTION 1: CHILD LOOKUP */}
            <div className="mb-6 border-b border-slate-100 pb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px]">1</span>
                  Find & Link Your Child
                </span>
                {verifiedStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      setVerifiedStudent(null);
                      setStudentQuery("");
                    }}
                    className="text-xs text-slate-400 hover:text-rose-600 underline"
                  >
                    Change Child
                  </button>
                )}
              </div>

              {!verifiedStudent ? (
                <div className="space-y-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Child's Admission No. or Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. IAIS/2026/001 or Student Name"
                      value={studentQuery}
                      onChange={(e) => setStudentQuery(e.target.value)}
                      className="w-full border border-slate-300 bg-white rounded-lg px-3.5 py-2 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Child's Class (Optional if using Admission No.)
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full border border-slate-300 bg-white rounded-lg px-3.5 py-2 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- All Classes --</option>
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} {c.arm ? `(${c.arm})` : ""} {c.branch ? `• ${c.branch.name}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {verifyError && (
                    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{verifyError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleLookupStudent}
                    disabled={verifying}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Search className="w-3.5 h-3.5" />
                    {verifying ? "Searching Student..." : "Verify & Connect Child"}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">
                        {verifiedStudent.name}
                      </h4>
                      <p className="text-xs text-emerald-700">
                        Class: <strong>{verifiedStudent.class?.name} {verifiedStudent.class?.arm ? `(${verifiedStudent.class.arm})` : ""}</strong>
                        {verifiedStudent.admissionNumber && ` • Adm: ${verifiedStudent.admissionNumber}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900">
                    Linked
                  </span>
                </div>
              )}
            </div>

            {/* SECTION 2: PARENT DETAILS */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-3">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px]">2</span>
                Parent / Guardian Credentials
              </span>

              {submitError && (
                <div className="text-xs mb-4 text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterParent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Parent / Guardian Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alhaji Ibrahim Al-Hassan"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="parent@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="08033221144"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Min. 6 chars"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm Password *
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Re-type password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !verifiedStudent}
                  className="w-full py-3 mt-3 rounded-xl text-white font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  {submitting ? "Creating Account..." : "Create Parent Account & Log In"}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Already registered? <Link to="/login" className="text-emerald-700 font-semibold hover:underline">Sign In</Link></span>
                <span>Are you a teacher? <Link to="/register/teacher" className="text-emerald-700 font-semibold hover:underline">Staff Sign Up</Link></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterParent;

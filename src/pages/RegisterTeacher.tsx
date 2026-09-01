import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, CheckCircle, ShieldCheck, UserCheck, AlertCircle, ArrowLeft } from "lucide-react";
import api from "../api/axios";

interface Branch {
  _id: string;
  name: string;
}

const RegisterTeacher = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"class_teacher" | "subject_teacher">("subject_teacher");
  const [branch, setBranch] = useState("");
  const [staffCode, setStaffCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get("/branches")
      .then((res) => {
        setBranches(res.data);
        if (res.data.length > 0) {
          setBranch(res.data[0]._id);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!staffCode.trim()) {
      setError("Please provide the school staff registration code");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register-teacher", {
        name,
        email,
        phone,
        role,
        branch: branch || undefined,
        staffCode,
        password,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit teacher registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* LEFT — identity banner */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-sky-950 via-[#072d4a] to-sky-900 text-white">
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="islamicStar" width="60" height="60" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="#38bdf8" strokeWidth="1">
                <path d="M30 5 L36 22 L54 22 L40 33 L45 51 L30 40 L15 51 L20 33 L6 22 L24 22 Z" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamicStar)" />
        </svg>

        <div className="relative z-10 text-center">
          <p className="text-3xl leading-tight text-white font-bold" style={{ fontFamily: "Amiri, serif" }}>
            معهد التعليم العربي الإسلامي
          </p>
          <p className="mt-2 text-xs tracking-widest uppercase text-sky-300 font-semibold">
            Institute of Arabic and Islamic Studies
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <ShieldCheck className="w-6 h-6 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Protected Staff Onboarding</p>
              <p className="text-xs text-sky-200/80 mt-1 leading-relaxed">
                Staff accounts require an active school passcode and verification by an administrator to safeguard academic records.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <UserCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Fast Activation</p>
              <p className="text-xs text-sky-200/80 mt-1 leading-relaxed">
                Once approved, your assigned classes and subjects will automatically appear in your portal.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-sky-200/60">
          Academic Year 2025/2026 • Teacher Portal
        </div>
      </div>

      {/* RIGHT — registration form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-lg">
          <div className="mb-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-600 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>

          <div className="bg-white shadow-xl rounded-2xl border border-slate-100 p-8">
            {submitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-9 h-9" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Registration Submitted!
                </h2>
                <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto leading-relaxed">
                  Ustadh <strong>{name}</strong>, your teacher registration has been received and is currently in the <strong>Pending Verification Queue</strong>.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-xs text-amber-900 mb-6 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertCircle className="w-4 h-4" /> Next Steps:
                  </p>
                  <p>1. Notify the school administrator or head of department.</p>
                  <p>2. Once verified and assigned to your classes, you can log in using <strong>{email}</strong>.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full py-2.5 rounded-xl text-white font-semibold bg-sky-600 hover:bg-sky-700 transition shadow-md shadow-sky-600/20"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h1
                    className="text-2xl font-bold text-slate-900 mb-1"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Teacher Self-Registration
                  </h1>
                  <p className="text-sm text-slate-500">
                    Create your staff profile to request portal access
                  </p>
                </div>

                {error && (
                  <div className="text-sm mb-5 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ustadh Ahmad Ibrahim"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
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
                        placeholder="teacher@school.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="08012345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Primary Role *
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                      >
                        <option value="subject_teacher">Subject Teacher</option>
                        <option value="class_teacher">Class Teacher</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Campus / Branch
                      </label>
                      <select
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                      >
                        {branches.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3.5">
                    <label className="block text-xs font-bold text-sky-900 uppercase tracking-wider mb-1">
                      Staff School Passcode *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. STAFF-2026"
                      value={staffCode}
                      onChange={(e) => setStaffCode(e.target.value)}
                      className="w-full border border-sky-300 bg-white rounded-lg px-3.5 py-2 text-sm font-mono uppercase tracking-wider outline-none transition focus:ring-2 focus:ring-sky-500"
                    />
                    <p className="text-[11px] text-sky-700 mt-1">
                      Ask your school administrator for the secret registration passcode.
                    </p>
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
                          className="w-full border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500"
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
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 mt-2 rounded-xl text-white font-semibold bg-sky-600 hover:bg-sky-700 active:scale-[0.99] shadow-md shadow-sky-600/20 transition disabled:opacity-50"
                  >
                    {loading ? "Submitting Registration..." : "Submit Registration Request"}
                  </button>
                </form>

                <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>Already verified? <Link to="/login" className="text-sky-600 font-semibold hover:underline">Sign In</Link></span>
                  <span>Are you a parent? <Link to="/register/parent" className="text-sky-600 font-semibold hover:underline">Parent Sign Up</Link></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterTeacher;

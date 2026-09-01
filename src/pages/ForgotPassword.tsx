/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2, ShieldCheck, Mail } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const roleToRoute: Record<string, string> = {
  super_admin: "/admin/dashboard",
  branch_admin: "/admin/dashboard",
  class_teacher: "/admin/broadsheet",
  subject_teacher: "/subject-teacher",
  parent: "/parent",
};

const ForgotPassword = () => {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatedCodeHint, setGeneratedCodeHint] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      const res = await api.post("/auth/forgot-password", { email: cleanEmail });
      
      setGeneratedCodeHint(res.data.resetCode || null);
      if (res.data.resetCode) {
        setCode(res.data.resetCode);
      }
      setSuccessMsg(`Verification code generated for ${cleanEmail}. Please enter your new password below.`);
      setStep("reset");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to find account. Please verify your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.trim().length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim();
      const cleanCode = code.trim();
      const cleanPassword = newPassword.trim();

      const res = await api.post("/auth/reset-password", {
        email: cleanEmail,
        code: cleanCode,
        newPassword: cleanPassword,
      });

      setSuccessMsg("Password reset successfully! Logging you in...");

      if (res.data.token && res.data.user) {
        login(res.data.user, res.data.token);
        setTimeout(() => {
          navigate(roleToRoute[res.data.user.role] || "/");
        }, 1200);
      } else {
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* LEFT — identity panel */}
      <div className="hidden md:flex md:w-5/12 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-sky-950 via-[#072d4a] to-sky-900 text-white">
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="islamicStarForgot"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <g fill="none" stroke="#38bdf8" strokeWidth="1">
                <path d="M30 5 L36 22 L54 22 L40 33 L45 51 L30 40 L15 51 L20 33 L6 22 L24 22 Z" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamicStarForgot)" />
        </svg>

        <div className="relative z-10 text-center">
          <p
            className="text-3xl leading-tight text-white font-bold"
            style={{ fontFamily: "Amiri, serif" }}
          >
            معهد التعليم العربي الإسلامي
          </p>
          <p className="mt-2 text-xs tracking-widest uppercase text-sky-300 font-semibold">
            Institute of Arabic and Islamic Studies
          </p>
        </div>

        <div className="relative z-10">
          <div className="h-0.5 w-16 mb-6 bg-sky-400/60" />
          <p className="text-sm text-sky-100/80 leading-relaxed">
            Account Recovery Portal — Secure password reset for administrative staff, teachers, and parents.
          </p>
        </div>
      </div>

      {/* RIGHT — Recovery Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="relative bg-white shadow-xl rounded-2xl border border-slate-100 p-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-700 font-medium mb-6 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>

            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mb-4 mx-auto border border-sky-100">
              <KeyRound className="w-6 h-6" />
            </div>

            <h1
              className="text-2xl text-center font-bold text-slate-900 mb-1"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {step === "request" ? "Reset Password" : "Enter New Password"}
            </h1>
            <p className="text-center text-xs text-slate-500 mb-6 leading-relaxed">
              {step === "request"
                ? "Enter your registered email address to receive a secure recovery code."
                : `Set a new secure password for ${email}.`}
            </p>

            {error && (
              <div className="text-xs mb-4 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 leading-relaxed">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="text-xs mb-4 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {step === "request" ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Registered Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="e.g. teacher@school.com"
                      className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-2.5 mt-2 rounded-xl text-white font-semibold bg-sky-600 hover:bg-sky-700 active:scale-[0.99] shadow-md shadow-sky-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {loading ? "Verifying..." : "Continue"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {generatedCodeHint && (
                  <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
                      Verification Code
                    </p>
                    <p className="text-xl font-mono font-bold tracking-widest text-sky-900 my-1">
                      {generatedCodeHint}
                    </p>
                    <p className="text-[10px] text-sky-700">
                      Valid for 15 minutes. Automatically populated below.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    6-Digit Reset Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="123456"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-center font-mono tracking-widest text-base font-bold outline-none transition focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Min. 6 characters"
                      className="w-full border border-slate-300 rounded-xl pl-4 pr-11 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter new password"
                      className="w-full border border-slate-300 rounded-xl pl-4 pr-11 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("request");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newPassword.trim() || !code.trim()}
                    className="w-2/3 py-2.5 rounded-xl text-white font-semibold text-xs bg-sky-600 hover:bg-sky-700 active:scale-[0.99] shadow-md shadow-sky-600/20 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-4 h-4" />
                    {loading ? "Updating..." : "Save Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

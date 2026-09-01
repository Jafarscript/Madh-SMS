/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const roleToRoute: Record<string, string> = {
  super_admin: "/admin/dashboard",
  branch_admin: "/admin/dashboard",
  class_teacher: "/admin/broadsheet",
  subject_teacher: "/subject-teacher",
  parent: "/parent",
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();
      const res = await api.post("/auth/login", { email: cleanEmail, password: cleanPassword });
      login(res.data.user, res.data.token);

      if (res.data.user.mustChangePassword) {
        navigate("/change-password");
      } else {
        navigate(roleToRoute[res.data.user.role] || "/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* LEFT — identity panel */}
      <div
        className="hidden md:flex md:w-5/12 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-sky-950 via-[#072d4a] to-sky-900 text-white"
      >
        {/* repeating geometric star pattern, low opacity */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="islamicStar"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <g fill="none" stroke="#38bdf8" strokeWidth="1">
                <path d="M30 5 L36 22 L54 22 L40 33 L45 51 L30 40 L15 51 L20 33 L6 22 L24 22 Z" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamicStar)" />
        </svg>

        <div className="relative z-10 text-center">
          <p
            className="text-3xl leading-tight text-white font-bold"
            style={{ fontFamily: "Amiri, serif" }}
          >
            معهد التعليم العربي الإسلامي
          </p>
          <p
            className="mt-2 text-xs tracking-widest uppercase text-sky-300 font-semibold"
          >
            Institute of Arabic and Islamic Studies
          </p>
        </div>

        <div className="relative z-10">
          <div className="h-0.5 w-16 mb-6 bg-sky-400/60" />
          <p className="text-sm text-sky-100/80 leading-relaxed">
            School Management System — High-precision report cards, broadsheets,
            and academic grading in one unified portal.
          </p>
        </div>
      </div>

      {/* RIGHT — login form */}
      <div
        className="flex-1 flex items-center justify-center p-6 bg-slate-50"
      >
        <div className="w-full max-w-sm">
          {/* card */}
          <div className="relative bg-white shadow-xl rounded-2xl border border-slate-100 p-8">
            <div>
              <h1
                className="text-2xl text-center font-bold text-slate-900 mb-1"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Welcome back
              </h1>
              <p className="text-center text-sm text-slate-500 mb-8">
                Sign in to your account
              </p>

              {error && (
                <div
                  className="text-sm mb-4 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@school.com"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-sky-600 hover:text-sky-800 font-medium transition"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-xl pl-4 pr-11 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 transition"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 mt-2 rounded-xl text-white font-semibold bg-sky-600 hover:bg-sky-700 active:scale-[0.99] shadow-md shadow-sky-600/20 transition disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              {/* Self-Registration Links */}
              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/register/teacher")}
                  className="px-3 py-2 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-xl border border-sky-200/80 transition text-center"
                >
                  Staff Registration
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/register/parent")}
                  className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200/80 transition text-center"
                >
                  Parent Sign Up
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            School Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
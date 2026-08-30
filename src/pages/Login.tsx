/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const roleToRoute: Record<string, string> = {
  super_admin: "/admin/dashboard",
  branch_admin: "/admin/dashboard",
  class_teacher: "/admin/broadsheet",
  subject_teacher: "/subject-teacher",
  parent: "/parent",
};

const demoAccounts = [
  { label: "Super Admin", email: "admin@test.com", role: "Super Admin" },
  { label: "Class Teacher", email: "lihammedjafar@gmail.com", role: "Class Teacher" },
  { label: "Branch Admin", email: "ifo@test.com", role: "Branch Admin" },
  { label: "Subject Teacher", email: "anas@test.com", role: "Subject Teacher" },
  { label: "Demo Admin", email: "admin@school.com", role: "Super Admin" },
];

const Login = () => {
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);
  try {
    const res = await api.post("/auth/login", { email, password });
    login(res.data.user, res.data.token);

    if (res.data.user.mustChangePassword) {
      navigate("/change-password");
    } else {
      navigate(roleToRoute[res.data.user.role] || "/");
    }
  } catch (err: any) {
    setError(err.response?.data?.message || "Login failed");
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
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 mt-2 rounded-xl text-white font-semibold bg-sky-600 hover:bg-sky-700 active:scale-[0.99] shadow-md shadow-sky-600/20 transition disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-8 border-t border-slate-100 pt-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Quick Demo Accounts
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => {
                        setEmail(acc.email);
                        setPassword("password123");
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 border border-slate-200/80 transition font-medium"
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
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
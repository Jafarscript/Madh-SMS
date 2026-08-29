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
  { label: "Super Admin", email: "admin@test.com", role: "Super Admin", color: "bg-emerald-800 text-white" },
  { label: "Class Teacher", email: "lihammedjafar@gmail.com", role: "Class Teacher", color: "bg-amber-800 text-white" },
  { label: "Branch Admin", email: "ifo@test.com", role: "Branch Admin", color: "bg-teal-800 text-white" },
  { label: "Subject Teacher", email: "anas@test.com", role: "Subject Teacher", color: "bg-blue-800 text-white" },
  { label: "Demo Admin", email: "admin@school.com", role: "Super Admin", color: "bg-slate-700 text-white" },
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

  const handleQuickLogin = (accEmail: string) => {
    setEmail(accEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* LEFT — identity panel */}
      <div
        className="hidden md:flex md:w-5/12 relative flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundColor: "#0B3D2E" }}
      >
        {/* repeating geometric star pattern, low opacity, purely atmospheric */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.08]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="islamicStar"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <g fill="none" stroke="#C9A227" strokeWidth="1">
                <path d="M30 5 L36 22 L54 22 L40 33 L45 51 L30 40 L15 51 L20 33 L6 22 L24 22 Z" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamicStar)" />
        </svg>

        <div className="relative z-10 text-center">
          <p
            className="text-3xl leading-tight"
            style={{ fontFamily: "Amiri, serif", color: "#F4E4B8" }}
          >
            معهد التعليم العربي الإسلامي
          </p>
          <p
            className="mt-2 text-sm tracking-widest uppercase font-medium"
            style={{ color: "#C9A227" }}
          >
            Institute of Arabic and Islamic Studies
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="h-px w-16" style={{ backgroundColor: "#C9A227" }} />
          <p className="text-sm leading-relaxed" style={{ color: "#D8CFAE" }}>
            School Management System — Academic records, broadsheets, grading
            scales, and bilingual term report cards in one unified portal.
          </p>
          <div className="pt-2 text-xs text-amber-200/80">
            ✓ Role-based access control (Admin, Teachers, Parents)<br />
            ✓ Cumulative score cascading & automatic ranking<br />
            ✓ Arabic/English bilingual report cards & PDF generation
          </div>
        </div>
      </div>

      {/* RIGHT — login form */}
      <div
        className="flex-1 flex items-center justify-center p-6"
        style={{ backgroundColor: "#FAF6EE" }}
      >
        <div className="w-full max-w-md">
          {/* arch-topped card */}
          <div
            className="relative bg-white shadow-xl"
            style={{
              borderTopLeftRadius: "9999px 60px",
              borderTopRightRadius: "9999px 60px",
              borderBottomLeftRadius: "12px",
              borderBottomRightRadius: "12px",
              paddingTop: "3rem",
            }}
          >
            <div className="px-8 pb-8">
              <h1
                className="text-2xl text-center mb-1 font-serif"
                style={{ fontFamily: "Playfair Display, serif", color: "#0B3D2E" }}
              >
                Welcome back
              </h1>
              <p className="text-center text-sm text-gray-500 mb-6">
                Sign in to your SMS account
              </p>

              {/* Demo Account Quick Switcher */}
              <div className="mb-5 p-3 rounded-lg border border-amber-200 bg-amber-50/70 text-xs">
                <p className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                  Quick Demo Login (Password: <span className="font-mono text-emerald-800">password123</span>):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleQuickLogin(acc.email)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer hover:opacity-90 ${
                        email === acc.email ? "ring-2 ring-emerald-600 font-bold" : "opacity-80"
                      } ${acc.color}`}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div
                  className="text-sm mb-4 px-3 py-2 rounded"
                  style={{ backgroundColor: "#FDECEC", color: "#B42318" }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 mb-4 outline-none transition focus:ring-2"
                  style={{ ["--tw-ring-color" as any]: "#C9A227" }}
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 mb-6 outline-none transition focus:ring-2"
                  style={{ ["--tw-ring-color" as any]: "#C9A227" }}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg text-white font-medium transition disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: "#0B3D2E" }}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            School Management System • Institute of Arabic & Islamic Studies
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

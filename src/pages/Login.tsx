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
            className="mt-2 text-sm tracking-widest uppercase"
            style={{ color: "#C9A227" }}
          >
            Institute of Arabic and Islamic Studies
          </p>
        </div>

        <div className="relative z-10">
          <div className="h-px w-16 mb-6" style={{ backgroundColor: "#C9A227" }} />
          <p className="text-sm" style={{ color: "#D8CFAE" }}>
            School Management System — Report cards, broadsheets,
            and results, in one place.
          </p>
        </div>
      </div>

      {/* RIGHT — login form */}
      <div
        className="flex-1 flex items-center justify-center p-6"
        style={{ backgroundColor: "#FAF6EE" }}
      >
        <div className="w-full max-w-sm">
          {/* arch-topped card, subtle nod to mihrab shape without overdoing it */}
          <div
            className="relative bg-white shadow-xl"
            style={{
              borderTopLeftRadius: "9999px 60px",
              borderTopRightRadius: "9999px 60px",
              borderBottomLeftRadius: "12px",
              borderBottomRightRadius: "12px",
              paddingTop: "3.5rem",
            }}
          >
            <div className="px-8 pb-8">
              <h1
                className="text-2xl text-center mb-1"
                style={{ fontFamily: "Playfair Display, serif", color: "#0B3D2E" }}
              >
                Welcome back
              </h1>
              <p className="text-center text-sm text-gray-500 mb-8">
                Sign in to your account
              </p>

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
                  className="w-full py-2.5 rounded-lg text-white font-medium transition disabled:opacity-50"
                  style={{ backgroundColor: "#0B3D2E" }}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
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
                      className="text-xs px-2.5 py-1 rounded bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 transition"
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            School Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
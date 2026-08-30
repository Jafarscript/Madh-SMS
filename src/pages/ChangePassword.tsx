import { useState } from "react";
import { useNavigate } from "react-router";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login: updateAuthUser, token } = useAuth();
  const navigate = useNavigate();

  const homeRoute: Record<string, string> = {
    super_admin: "/admin/dashboard",
    branch_admin: "/admin/dashboard",
    class_teacher: "/admin/broadsheet",
    subject_teacher: "/subject-teacher",
    parent: "/parent",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await api.put("/auth/change-password", { currentPassword, newPassword });
      if (user && token) {
        updateAuthUser({ ...user, mustChangePassword: false }, token);
      }
      setSuccess("Password updated. Redirecting...");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        navigate(homeRoute[user?.role || ""] || "/login");
      }, 1200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-50 p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm"
      >
        <h1
          className="text-2xl font-bold text-center mb-1 text-slate-900"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Change Password
        </h1>
        <p className="text-center text-xs text-slate-500 mb-6 font-medium">
          Signed in as <span className="font-semibold text-slate-700">{user?.name || user?.email}</span>
        </p>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 mb-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-xl text-white font-semibold bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 transition disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;

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
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#FAF6EE" }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-sm w-full max-w-sm"
      >
        <h1
          className="text-xl text-center mb-1"
          style={{ fontFamily: "Playfair Display, serif", color: "#0B3D2E" }}
        >
          Change Password
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Signed in as {user?.name}
        </p>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {success && <p className="text-sm text-green-700 mb-4">{success}</p>}

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current password
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          New password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm new password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 mb-6"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-white font-medium disabled:opacity-50"
          style={{ backgroundColor: "#0B3D2E" }}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;

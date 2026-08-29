import { Navigate, useLocation } from "react-router";
import { useAuth, type UserRole  } from "../context/AuthContext";
import { type ReactNode } from "react";

interface Props {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: string; // where a logged-in user without permission gets sent
}

// Unlike ProtectedRoute (which gates access to the /admin section as a
// whole), this gates ONE page inside it. A class_teacher typing
// /admin/branches directly in the URL bar gets redirected here instead
// of the page silently loading — the sidebar hiding a link was never
// real security, just a hidden door with no lock on it.
const RoleGate = ({ allowedRoles, children, fallback = "/admin/broadsheet" }: Props) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
};

export default RoleGate;
import { Navigate, useLocation } from "react-router";
import { useAuth, type UserRole } from "../context/AuthContext";
import { type ReactNode } from "react";

interface Props {
  allowedRoles: UserRole[];
  children: ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: Props) => {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  // A user who still has a temporary password gets funneled to
  // /change-password no matter what page they were trying to reach —
  // this is the actual enforcement point, not just Login.tsx's redirect,
  // since someone could otherwise bookmark or type any URL directly.
  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
import { Routes, Route, Navigate } from "react-router";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";
import Branches from "./pages/admin/Branches";
import Classes from "./pages/admin/Classes";
import Subjects from "./pages/admin/Subjects";
import GradingScales from "./pages/admin/GradingScales";
import Terms from "./pages/admin/Terms";
import Students from "./pages/admin/Students";
import Users from "./pages/admin/Users";
import SubjectTeacherHome from "./pages/SubjectTeacherHome";
import Broadsheet from "./pages/admin/Broadsheet";
import ReportCard from "./pages/admin/ReportCard";
import ResultPublishing from "./pages/admin/ResultPublishing";
import Dashboard from "./pages/admin/Dashboard";
import ParentHome from "./pages/ParentHome";
import RoleGate from "./routes/RoleGate";
import ChangePassword from "./pages/ChangePassword";
import Attendance from "./pages/admin/Attendance";
import TeacherAssignmentMatrix from "./pages/admin/TeacherAssignmentMatrix";
import AuditLogs from "./pages/admin/AuditLogs";
import RegisterTeacher from "./pages/RegisterTeacher";
import RegisterParent from "./pages/RegisterParent";
import ForgotPassword from "./pages/ForgotPassword";
import { useAuth } from "./context/AuthContext";

const RootHandler = () => {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const roleToRoute: Record<string, string> = {
    super_admin: "/admin/dashboard",
    branch_admin: "/admin/dashboard",
    class_teacher: "/admin/broadsheet",
    subject_teacher: "/subject-teacher",
    parent: "/parent",
  };

  return <Navigate to={roleToRoute[user.role] || "/login"} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootHandler />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register/teacher" element={<RegisterTeacher />} />
      <Route path="/register/parent" element={<RegisterParent />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute
            allowedRoles={["super_admin", "branch_admin", "class_teacher"]}
          >
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <RoleGate allowedRoles={["super_admin", "branch_admin"]}>
              <Dashboard />
            </RoleGate>
          }
        />
        <Route
          path="branches"
          element={
            <RoleGate allowedRoles={["super_admin"]}>
              <Branches />
            </RoleGate>
          }
        />
        <Route
          path="classes"
          element={
            <RoleGate allowedRoles={["super_admin", "branch_admin"]}>
              <Classes />
            </RoleGate>
          }
        />
        <Route
          path="subjects"
          element={
            <RoleGate allowedRoles={["super_admin", "branch_admin"]}>
              <Subjects />
            </RoleGate>
          }
        />
        <Route
          path="teacher-matrix"
          element={
            <RoleGate allowedRoles={["super_admin", "branch_admin"]}>
              <TeacherAssignmentMatrix />
            </RoleGate>
          }
        />
        <Route
          path="grading-scales"
          element={
            <RoleGate allowedRoles={["super_admin"]}>
              <GradingScales />
            </RoleGate>
          }
        />
        <Route
          path="terms"
          element={
            <RoleGate allowedRoles={["super_admin"]}>
              <Terms />
            </RoleGate>
          }
        />
        <Route
          path="students"
          element={
            <RoleGate allowedRoles={["super_admin", "branch_admin"]}>
              <Students />
            </RoleGate>
          }
        />
        <Route
          path="users"
          element={
            <RoleGate allowedRoles={["super_admin", "branch_admin"]}>
              <Users />
            </RoleGate>
          }
        />
        <Route path="score-entry" element={<SubjectTeacherHome />} />
        <Route path="broadsheet" element={<Broadsheet />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="report-cards" element={<ReportCard />} />
        <Route
          path="publishing"
          element={
            <RoleGate allowedRoles={["super_admin", "branch_admin"]}>
              <ResultPublishing />
            </RoleGate>
          }
        />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>

      <Route
        path="/subject-teacher"
        element={
          <ProtectedRoute allowedRoles={["subject_teacher", "class_teacher"]}>
            <SubjectTeacherHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <ParentHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/change-password"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "branch_admin", "class_teacher", "subject_teacher", "parent"]}>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

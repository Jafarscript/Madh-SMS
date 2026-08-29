import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const allNavItems = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    roles: ["super_admin", "branch_admin"],
  },
  { to: "/admin/branches", label: "Branches", roles: ["super_admin"] },
  {
    to: "/admin/classes",
    label: "Classes & Arms",
    roles: ["super_admin", "branch_admin"],
  },
  {
    to: "/admin/subjects",
    label: "Subjects",
    roles: ["super_admin", "branch_admin"],
  },
  {
    to: "/admin/grading-scales",
    label: "Grading Scales",
    roles: ["super_admin"],
  },
  { to: "/admin/terms", label: "Terms", roles: ["super_admin"] },
  {
    to: "/admin/students",
    label: "Students",
    roles: ["super_admin", "branch_admin"],
  },
  {
    to: "/admin/users",
    label: "Users",
    roles: ["super_admin", "branch_admin"],
  },
  {
    to: "/admin/broadsheet",
    label: "Broadsheet",
    roles: ["super_admin", "branch_admin", "class_teacher"],
  },
  {
    to: "/admin/report-cards",
    label: "Report Cards",
    roles: ["super_admin", "branch_admin", "class_teacher"],
  },
  {
    to: "/admin/attendance",
    label: "Attendance",
    roles: ["super_admin", "branch_admin", "class_teacher"],
  },
];

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  branch_admin: "Branch Admin",
  class_teacher: "Class Teacher",
};

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate()
  const navItems = allNavItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  // sidebar is open by default on desktop (irrelevant there, since the
  // sidebar is always visible above the md breakpoint) and closed by
  // default on mobile, where it becomes a slide-in drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* mobile top bar — only visible below md breakpoint */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: "#0B3D2E" }}
      >
        <p style={{ fontFamily: "Playfair Display, serif", color: "#F4E4B8" }}>
          School SMS
        </p>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="text-white p-1"
        >
          {/* simple hamburger icon, no icon library needed for 3 lines */}
          <div className="w-6 h-0.5 bg-white mb-1.5" />
          <div className="w-6 h-0.5 bg-white mb-1.5" />
          <div className="w-6 h-0.5 bg-white" />
        </button>
      </div>

      {/* backdrop — only rendered/clickable when the mobile drawer is open */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* sidebar — fixed on ALL screen sizes now, so it stays pinned in
          place regardless of how far the main content is scrolled.
          On mobile it slides in/out via translate-x; on desktop it's
          simply always visible at translate-x-0, permanently fixed. */}
      <aside
        className={`
          w-64 shrink-0 p-6 flex flex-col z-50
          fixed top-0 left-0 h-screen overflow-y-auto
          transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
        style={{ backgroundColor: "#0B3D2E" }}
      >
        <div className="flex justify-between items-start mb-10">
          <div>
            <p
              className="text-lg"
              style={{
                fontFamily: "Playfair Display, serif",
                color: "#F4E4B8",
              }}
            >
              School SMS
            </p>
            <p className="text-xs mt-1" style={{ color: "#C9A227" }}>
              {user ? roleLabel[user.role] : ""}
            </p>
          </div>
          {/* close button, mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-white/70 hover:text-white text-xl leading-none"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)} // auto-close drawer after navigating on mobile
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => navigate("/change-password")}
          className="text-sm text-left px-3 py-2 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition"
        >
          Change Password
        </button>
        <button
          onClick={logout}
          className="text-sm text-left px-3 py-2 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition"
        >
          Log out
        </button>
      </aside>

      {/* main content — margin-left on desktop clears the fixed sidebar's
          width (16rem = w-64); top padding on mobile clears the fixed top
          bar. h-screen + overflow-y-auto makes this its own independent
          scroll region, separate from the sidebar's scroll region. */}
      <main
        className="flex-1 h-screen overflow-y-auto pt-16 md:pt-0 md:ml-64"
        style={{ backgroundColor: "#FAF6EE" }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

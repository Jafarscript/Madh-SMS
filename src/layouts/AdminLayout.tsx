import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  BookOpen,
  Sliders,
  Calendar,
  Users,
  UserCog,
  Table2,
  FileText,
  Send,
  CalendarCheck,
  KeyRound,
  LogOut,
  Menu,
  X,
  School,
  ChevronRight,
} from "lucide-react";

interface NavItemConfig {
  to: string;
  label: string;
  roles: string[];
  icon: React.ComponentType<{ className?: string }>;
  group?: "main" | "academic" | "people" | "performance";
}

const navItemsConfig: NavItemConfig[] = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    roles: ["super_admin", "branch_admin"],
    icon: LayoutDashboard,
    group: "main",
  },
  {
    to: "/admin/branches",
    label: "Branches",
    roles: ["super_admin"],
    icon: Building2,
    group: "academic",
  },
  {
    to: "/admin/classes",
    label: "Classes & Arms",
    roles: ["super_admin", "branch_admin"],
    icon: GraduationCap,
    group: "academic",
  },
  {
    to: "/admin/subjects",
    label: "Subjects",
    roles: ["super_admin", "branch_admin"],
    icon: BookOpen,
    group: "academic",
  },
  {
    to: "/admin/grading-scales",
    label: "Grading Scales",
    roles: ["super_admin"],
    icon: Sliders,
    group: "academic",
  },
  {
    to: "/admin/terms",
    label: "Terms",
    roles: ["super_admin"],
    icon: Calendar,
    group: "academic",
  },
  {
    to: "/admin/students",
    label: "Students",
    roles: ["super_admin", "branch_admin"],
    icon: Users,
    group: "people",
  },
  {
    to: "/admin/users",
    label: "Users & Staff",
    roles: ["super_admin", "branch_admin"],
    icon: UserCog,
    group: "people",
  },
  {
    to: "/admin/score-entry",
    label: "Score Entry",
    roles: ["super_admin", "branch_admin", "class_teacher"],
    icon: BookOpen,
    group: "performance",
  },
  {
    to: "/admin/broadsheet",
    label: "Broadsheet",
    roles: ["super_admin", "branch_admin", "class_teacher"],
    icon: Table2,
    group: "performance",
  },
  {
    to: "/admin/report-cards",
    label: "Report Cards",
    roles: ["super_admin", "branch_admin", "class_teacher"],
    icon: FileText,
    group: "performance",
  },
  {
    to: "/admin/publishing",
    label: "Result Publishing",
    roles: ["super_admin", "branch_admin"],
    icon: Send,
    group: "performance",
  },
  {
    to: "/admin/attendance",
    label: "Attendance",
    roles: ["super_admin", "branch_admin", "class_teacher"],
    icon: CalendarCheck,
    group: "performance",
  },
];

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  branch_admin: "Branch Admin",
  class_teacher: "Class Teacher",
  subject_teacher: "Subject Teacher",
  parent: "Parent",
};

const groupLabels: Record<string, string> = {
  main: "Overview",
  academic: "Academic Structure",
  people: "Students & Staff",
  performance: "Results & Grading",
};

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allowedNavItems = navItemsConfig.filter(
    (item) => user && item.roles.includes(user.role)
  );

  // Group items by category
  const groups: Array<"main" | "academic" | "people" | "performance"> = [
    "main",
    "academic",
    "people",
    "performance",
  ];

  // Find active item title for mobile header
  const currentItem = allowedNavItems.find(
    (item) => location.pathname === item.to || location.pathname.startsWith(item.to + "/")
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 antialiased selection:bg-sky-500 selection:text-white">
      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-sky-950 via-sky-900 to-sky-950 text-white shadow-md border-b border-sky-800/60">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar navigation menu"
            className="p-2 -ml-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-sky-800/80 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600/40 border border-sky-400/40 flex items-center justify-center text-sky-200 shadow-inner">
              <School className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white leading-tight">
                School SMS
              </p>
              <p className="text-[10px] font-medium text-sky-300">
                {currentItem ? currentItem.label : "Admin Portal"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-800/90 text-sky-200 border border-sky-700/80">
              {roleLabel[user.role] || user.role}
            </span>
          )}
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar (Slide-over on mobile, fixed modern sidebar on lg screens) */}
      <aside
        className={`
          w-72 shrink-0 flex flex-col z-50
          fixed top-0 left-0 h-screen
          bg-gradient-to-b from-sky-950 via-[#072d4a] to-sky-950 text-white
          border-r border-sky-800/50 shadow-xl
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
      >
        {/* Brand Header */}
        <div className="px-5 py-5 border-b border-sky-800/50 flex items-center justify-between shrink-0 bg-sky-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white shadow-md shadow-sky-950/50 border border-sky-400/30">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                School SMS
              </h1>
              <p
                className="text-xs text-sky-300/90 font-medium"
                style={{ fontFamily: "Amiri, serif" }}
              >
                معهد التعليم العربي الإسلامي
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-sky-300 hover:text-white hover:bg-sky-800/70 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 custom-scrollbar">
          {groups.map((groupKey) => {
            const itemsInGroup = allowedNavItems.filter((i) => i.group === groupKey);
            if (itemsInGroup.length === 0) return null;

            return (
              <div key={groupKey} className="space-y-1">
                <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-sky-400/80">
                  {groupLabels[groupKey]}
                </div>
                <div className="space-y-0.5">
                  {itemsInGroup.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative ${
                            isActive
                              ? "bg-sky-600 text-white shadow-sm shadow-sky-900/40 font-semibold"
                              : "text-sky-100/75 hover:text-white hover:bg-sky-800/40"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center gap-3">
                              <Icon
                                className={`w-4 h-4 transition-colors ${
                                  isActive
                                    ? "text-white"
                                    : "text-sky-300/70 group-hover:text-sky-200"
                                }`}
                              />
                              <span>{item.label}</span>
                            </div>
                            {isActive && (
                              <ChevronRight className="w-4 h-4 text-sky-200 opacity-90" />
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Card & Footer Actions */}
        <div className="p-3.5 border-t border-sky-800/50 bg-sky-950/70 shrink-0 space-y-2">
          {/* User Profile Card */}
          {user && (
            <div className="px-3 py-2.5 rounded-xl bg-sky-900/40 border border-sky-800/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {user.email ? user.email.charAt(0) : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user.email}
                </p>
                <span className="inline-block text-[10px] font-medium text-sky-300">
                  {roleLabel[user.role] || user.role}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => {
                setMobileOpen(false);
                navigate("/change-password");
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-sky-200 hover:text-white bg-sky-900/30 hover:bg-sky-800/50 border border-sky-800/40 transition-colors"
              title="Change Password"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-300 hover:text-rose-100 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/40 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto pt-14 lg:pt-0 lg:ml-72 bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;


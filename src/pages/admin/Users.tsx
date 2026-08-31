/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import {
  UserCog,
  GraduationCap,
  BookOpen,
  Building2,
  Users as UsersIcon,
  Shield,
  KeyRound,
  Trash2,
  Edit2,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

type Role = "branch_admin" | "class_teacher" | "subject_teacher" | "parent";

interface Branch {
  _id: string;
  name: string;
}
interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
  branch?: { _id: string; name: string };
}
interface Subject {
  _id: string;
  nameEnglish: string;
  nameArabic?: string;
  class?: any;
}
interface Student {
  _id: string;
  name: string;
}

const Users = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Create user form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("class_teacher");
  const [branchId, setBranchId] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  
  // Subject picker for create form
  const [classForSubjects, setClassForSubjects] = useState("");
  const [availableSubjectsForClass, setAvailableSubjectsForClass] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedSubjectObjects, setSelectedSubjectObjects] = useState<Record<string, Subject>>({});

  const [linkedStudent, setLinkedStudent] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{
    name: string;
    password: string;
  } | null>(null);

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<Role>("class_teacher");
  const [editBranchId, setEditBranchId] = useState("");
  const [editClasses, setEditClasses] = useState<string[]>([]);
  const [editSubjects, setEditSubjects] = useState<string[]>([]);
  const [editSubjectObjects, setEditSubjectObjects] = useState<Record<string, Subject>>({});
  const [editClassForSubjects, setEditClassForSubjects] = useState("");
  const [editAvailableSubjects, setEditAvailableSubjects] = useState<Subject[]>([]);
  const [editLinkedStudent, setEditLinkedStudent] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    api.get("/branches").then((res) => setBranches(res.data));
    api.get("/classes").then((res) => setClasses(res.data));
    api.get("/students").then((res) => setStudents(res.data));
    fetchUsers();
  }, []);

  // Fetch subjects for create form's selected class
  useEffect(() => {
    if (!classForSubjects) {
      setAvailableSubjectsForClass([]);
      return;
    }
    api.get(`/subjects?class=${classForSubjects}`).then((res) => {
      setAvailableSubjectsForClass(res.data);
      // Cache subject objects for display tags
      setSelectedSubjectObjects((prev) => {
        const next = { ...prev };
        res.data.forEach((s: Subject) => {
          next[s._id] = s;
        });
        return next;
      });
    });
  }, [classForSubjects]);

  // Fetch subjects for edit modal's selected class
  useEffect(() => {
    if (!editClassForSubjects) {
      setEditAvailableSubjects([]);
      return;
    }
    api.get(`/subjects?class=${editClassForSubjects}`).then((res) => {
      setEditAvailableSubjects(res.data);
      setEditSubjectObjects((prev) => {
        const next = { ...prev };
        res.data.forEach((s: Subject) => {
          next[s._id] = s;
        });
        return next;
      });
    });
  }, [editClassForSubjects]);

  const resetRoleFields = () => {
    setBranchId("");
    setSelectedClasses([]);
    setClassForSubjects("");
    setSelectedSubjects([]);
    setLinkedStudent("");
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    resetRoleFields();
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const password = generatePassword();
      const payload: Record<string, unknown> = { name, email, password, role };

      if (role === "branch_admin") payload.branch = branchId;
      if (role === "class_teacher") {
        payload.classes = selectedClasses;
        payload.subjects = selectedSubjects; // Class teachers can also be assigned subjects!
      }
      if (role === "subject_teacher") {
        payload.subjects = selectedSubjects;
      }
      if (role === "parent") payload.linkedStudent = linkedStudent;

      await api.post("/auth/register", payload);

      setGeneratedPassword(password);
      setSuccess(`${name} added as ${role.replace("_", " ")}`);
      setName("");
      setEmail("");
      resetRoleFields();
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const toggleInArray = (
    arr: string[],
    value: string,
    setter: (v: string[]) => void
  ) => {
    setter(
      arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
    );
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Generate a new password for ${userName}? Their old password will stop working.`
      )
    )
      return;
    setResettingId(userId);
    try {
      const res = await api.put(`/users/${userId}/reset-password`);
      setResetPasswordResult({
        name: userName,
        password: res.data.newPassword,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setResettingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Delete this user account? This cannot be undone.")) return;
    await api.delete(`/users/${userId}`);
    fetchUsers();
  };

  const handleCopy = (password: string) => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open Edit User Modal
  const startEditUser = (u: any) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditBranchId(u.branch?._id || u.branch || "");
    setEditClasses((u.classes || []).map((c: any) => c._id || c));
    setEditSubjects((u.subjects || []).map((s: any) => s._id || s));
    
    // Cache subject objects for badges
    const subjMap: Record<string, Subject> = {};
    (u.subjects || []).forEach((s: any) => {
      if (s && s._id) subjMap[s._id] = s;
    });
    setEditSubjectObjects(subjMap);

    setEditLinkedStudent(u.linkedStudent?._id || u.linkedStudent || "");
    setEditClassForSubjects("");
    setEditError("");
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    setEditError("");

    try {
      const payload: Record<string, any> = {
        name: editName,
        email: editEmail,
        role: editRole,
      };

      if (editRole === "branch_admin") payload.branch = editBranchId;
      if (editRole === "class_teacher") {
        payload.classes = editClasses;
        payload.subjects = editSubjects; // Can have both managed classes and subjects!
      }
      if (editRole === "subject_teacher") {
        payload.subjects = editSubjects;
      }
      if (editRole === "parent") payload.linkedStudent = editLinkedStudent;

      await api.put(`/users/${editingUser._id}`, payload);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setEditError(err.response?.data?.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    if (!matchesRole) return false;

    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.replace("_", " ").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="Staff & User Management"
        subtitle="Manage accounts for class teachers, subject teachers, branch admins, and parents"
      />

      {/* Account Creation Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Create New User Account
              </h2>
              <p className="text-xs text-slate-500">
                Assign roles, classes, and teaching subjects seamlessly
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Role selector with descriptive helper */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              User Role & Permissions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  role === "class_teacher"
                    ? "bg-sky-50/80 border-sky-500 ring-2 ring-sky-500/20 text-sky-950 font-semibold"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-sky-600" />
                    Class Teacher
                  </span>
                  <input
                    type="radio"
                    name="role"
                    value="class_teacher"
                    checked={role === "class_teacher"}
                    onChange={() => handleRoleChange("class_teacher")}
                    className="text-sky-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-normal leading-tight">
                  Manages class records (attendance, broadsheet, remarks) & can teach subjects.
                </p>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  role === "subject_teacher"
                    ? "bg-sky-50/80 border-sky-500 ring-2 ring-sky-500/20 text-sky-950 font-semibold"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-sky-600" />
                    Subject Teacher
                  </span>
                  <input
                    type="radio"
                    name="role"
                    value="subject_teacher"
                    checked={role === "subject_teacher"}
                    onChange={() => handleRoleChange("subject_teacher")}
                    className="text-sky-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-normal leading-tight">
                  Enters scores & continuous assessment for assigned subjects only.
                </p>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  role === "branch_admin"
                    ? "bg-sky-50/80 border-sky-500 ring-2 ring-sky-500/20 text-sky-950 font-semibold"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    Branch Admin
                  </span>
                  <input
                    type="radio"
                    name="role"
                    value="branch_admin"
                    checked={role === "branch_admin"}
                    onChange={() => handleRoleChange("branch_admin")}
                    className="text-sky-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-normal leading-tight">
                  Branch administration, publishing, and student management.
                </p>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  role === "parent"
                    ? "bg-sky-50/80 border-sky-500 ring-2 ring-sky-500/20 text-sky-950 font-semibold"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <UsersIcon className="w-4 h-4 text-sky-600" />
                    Parent / Guardian
                  </span>
                  <input
                    type="radio"
                    name="role"
                    value="parent"
                    checked={role === "parent"}
                    onChange={() => handleRoleChange("parent")}
                    className="text-sky-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-normal leading-tight">
                  View published term report cards for their linked student.
                </p>
              </label>
            </div>
          </div>

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Ustaz Ahmad Bello"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address (Username for Login)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.g. ahmad.bello@school.org"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition"
              />
            </div>
          </div>

          {/* Temporary Generated Password Notification */}
          {generatedPassword && (
            <div className="p-4 rounded-xl text-sm bg-sky-50 border border-sky-200 flex items-center justify-between">
              <div>
                <p className="text-sky-800 text-xs font-bold uppercase tracking-wider mb-0.5">
                  Temporary Account Password
                </p>
                <p className="font-mono font-bold text-slate-900 text-base">
                  {generatedPassword}
                </p>
                <p className="text-[11px] text-sky-700 mt-0.5">
                  Share this password with the staff member. They will be prompted to choose a new password upon first login.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(generatedPassword)}
                className="px-3.5 py-2 rounded-xl text-white text-xs font-bold bg-sky-700 hover:bg-sky-800 transition shrink-0 cursor-pointer shadow-xs"
              >
                {copied ? "Copied!" : "Copy Password"}
              </button>
            </div>
          )}

          {/* 1. Branch Admin configuration */}
          {role === "branch_admin" && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Assign Branch
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="">-- Select Managed Branch --</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Class Teacher configuration: Managed Classes + Subject Teacher duties */}
          {role === "class_teacher" && (
            <div className="space-y-4 bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    1. Managed Class(es) — Class Teacher / Form Master
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {selectedClasses.length} class{selectedClasses.length !== 1 ? "es" : ""} selected
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2.5">
                  Select the class(es) this teacher manages for attendance, broadsheet, student remarks, and report cards:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                  {classes.map((c) => {
                    const isChecked = selectedClasses.includes(c._id);
                    return (
                      <label
                        key={c._id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                          isChecked
                            ? "bg-sky-50 border-sky-300 text-sky-900 font-bold"
                            : "bg-white border-slate-100 text-slate-700 hover:border-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            toggleInArray(selectedClasses, c._id, setSelectedClasses)
                          }
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span className="truncate">
                          {c.name} {c.arm ? `(الشعبة ${c.arm})` : ""}{" "}
                          <span className="text-slate-400 text-[10px]">
                            {c.branch?.name ? `• ${c.branch.name}` : ""}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Subject Duties for Class Teacher */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. Teaching Subjects — Subject Teacher Duties (Optional)
                  </label>
                  <span className="text-[11px] text-sky-700 font-semibold">
                    {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? "s" : ""} assigned
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2.5">
                  Class teachers can also teach specific subjects across any class in the school. Pick a class to add its subjects:
                </p>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-3">
                  <select
                    value={classForSubjects}
                    onChange={(e) => setClassForSubjects(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                  >
                    <option value="">-- Choose Class to pick subjects from --</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.arm ? `— الشعبة ${c.arm}` : ""}{" "}
                        {c.branch?.name ? `(${c.branch.name})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {classForSubjects && availableSubjectsForClass.length > 0 && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 mb-3 space-y-2">
                    <p className="text-[11px] font-bold text-slate-600 uppercase">
                      Subjects in selected class:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                      {availableSubjectsForClass.map((s) => {
                        const isChecked = selectedSubjects.includes(s._id);
                        return (
                          <label
                            key={s._id}
                            className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                              isChecked
                                ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                                : "bg-white border-slate-100 text-slate-700 hover:border-slate-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                toggleInArray(selectedSubjects, s._id, setSelectedSubjects)
                              }
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="truncate">{s.nameEnglish}</span>
                            {s.nameArabic && (
                              <span
                                style={{ fontFamily: "Amiri, serif" }}
                                className="text-slate-400 text-[10px]"
                                dir="rtl"
                              >
                                {s.nameArabic}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Subjects Tag Cloud */}
                {selectedSubjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedSubjects.map((subId) => {
                      const subObj = selectedSubjectObjects[subId];
                      return (
                        <span
                          key={subId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold"
                        >
                          <BookOpen className="w-3 h-3 text-emerald-700" />
                          <span>{subObj?.nameEnglish || "Subject"}</span>
                          {subObj?.nameArabic && (
                            <span
                              style={{ fontFamily: "Amiri, serif" }}
                              className="text-emerald-700 text-[11px]"
                            >
                              ({subObj.nameArabic})
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSubjects((prev) =>
                                prev.filter((id) => id !== subId)
                              )
                            }
                            className="text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100 rounded p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Pure Subject Teacher configuration */}
          {role === "subject_teacher" && (
            <div className="space-y-3 bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Assigned Teaching Subjects
                </label>
                <span className="text-[11px] text-sky-700 font-semibold">
                  {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? "s" : ""} selected
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2">
                Select a class to browse and assign subjects to this teacher:
              </p>

              <select
                value={classForSubjects}
                onChange={(e) => setClassForSubjects(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-sky-500 outline-none font-medium"
              >
                <option value="">-- Select Class --</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.arm ? `— الشعبة ${c.arm}` : ""}{" "}
                    {c.branch?.name ? `(${c.branch.name})` : ""}
                  </option>
                ))}
              </select>

              {classForSubjects && availableSubjectsForClass.length > 0 && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <p className="text-[11px] font-bold text-slate-600 uppercase">
                    Available subjects in this class:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {availableSubjectsForClass.map((s) => {
                      const isChecked = selectedSubjects.includes(s._id);
                      return (
                        <label
                          key={s._id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                            isChecked
                              ? "bg-sky-50 border-sky-300 text-sky-900 font-bold"
                              : "bg-white border-slate-100 text-slate-700 hover:border-slate-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              toggleInArray(selectedSubjects, s._id, setSelectedSubjects)
                            }
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <span className="truncate">{s.nameEnglish}</span>
                          {s.nameArabic && (
                            <span
                              style={{ fontFamily: "Amiri, serif" }}
                              className="text-slate-400 text-[10px]"
                              dir="rtl"
                            >
                              {s.nameArabic}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Subjects Tag Cloud */}
              {selectedSubjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedSubjects.map((subId) => {
                    const subObj = selectedSubjectObjects[subId];
                    return (
                      <span
                        key={subId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-900 border border-sky-200 text-xs font-semibold"
                      >
                        <BookOpen className="w-3 h-3 text-sky-600" />
                        <span>{subObj?.nameEnglish || "Subject"}</span>
                        {subObj?.nameArabic && (
                          <span
                            style={{ fontFamily: "Amiri, serif" }}
                            className="text-sky-700 text-[11px]"
                          >
                            ({subObj.nameArabic})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedSubjects((prev) =>
                              prev.filter((id) => id !== subId)
                            )
                          }
                          className="text-sky-600 hover:text-sky-900 hover:bg-sky-100 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. Parent configuration */}
          {role === "parent" && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Linked Student (Child)
              </label>
              <select
                value={linkedStudent}
                onChange={(e) => setLinkedStudent(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="">-- Select Child / Student --</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-white text-xs font-bold bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? "Creating Account..." : "Create User Account"}
            </button>
          </div>
        </form>
      </div>

      {/* Password Reset Result Notification */}
      {resetPasswordResult && (
        <div className="flex items-center justify-between px-5 py-4 rounded-2xl text-sm bg-amber-50 border border-amber-200 shadow-xs">
          <div>
            <p className="text-amber-800 text-xs font-bold uppercase tracking-wider mb-0.5">
              New Password for {resetPasswordResult.name}
            </p>
            <p className="font-mono font-bold text-slate-900 text-base">
              {resetPasswordResult.password}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Please copy and share this password immediately. The previous password has been invalidated.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(resetPasswordResult.password)}
            className="px-4 py-2 rounded-xl text-white text-xs font-bold bg-sky-600 hover:bg-sky-700 transition cursor-pointer shadow-xs shrink-0"
          >
            {copied ? "Copied!" : "Copy Password"}
          </button>
        </div>
      )}

      {/* Existing Users List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Existing System Users ({filteredUsers.length})
            </h2>
            <p className="text-xs text-slate-500">
              Manage accounts, roles, classes, and credentials
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Role Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setRoleFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  roleFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRoleFilter("class_teacher")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  roleFilter === "class_teacher"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Class Teachers
              </button>
              <button
                onClick={() => setRoleFilter("subject_teacher")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  roleFilter === "subject_teacher"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Subject Teachers
              </button>
              <button
                onClick={() => setRoleFilter("branch_admin")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  roleFilter === "branch_admin"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Admins
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search staff, email..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              No users found matching your search.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const roleDisplay = u.role.replace("_", " ");
              const managedClasses = u.classes || [];
              const assignedSubjects = u.subjects || [];

              return (
                <div
                  key={u._id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">
                        {u.name}
                      </span>
                      {/* Role Badge */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                          u.role === "super_admin"
                            ? "bg-purple-50 text-purple-800 border-purple-200"
                            : u.role === "branch_admin"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : u.role === "class_teacher"
                            ? "bg-sky-50 text-sky-800 border-sky-200"
                            : u.role === "subject_teacher"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {roleDisplay}
                      </span>

                      {/* Branch badge if available */}
                      {u.branch?.name && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {u.branch.name}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">{u.email}</p>

                    {/* Classes & Subjects Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {/* Managed Classes */}
                      {managedClasses.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                          <GraduationCap className="w-3 h-3 text-sky-600" />
                          Class Master:{" "}
                          {managedClasses
                            .map(
                              (c: any) =>
                                `${c.name || "Class"}${
                                  c.arm ? ` (${c.arm})` : ""
                                }`
                            )
                            .join(", ")}
                        </span>
                      )}

                      {/* Teaching Subjects */}
                      {assignedSubjects.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <BookOpen className="w-3 h-3 text-emerald-600" />
                          {assignedSubjects.length} Subject
                          {assignedSubjects.length > 1 ? "s" : ""} Assigned:{" "}
                          <span className="font-normal text-emerald-700">
                            {assignedSubjects
                              .slice(0, 3)
                              .map((s: any) => s.nameEnglish || "Subject")
                              .join(", ")}
                            {assignedSubjects.length > 3
                              ? ` +${assignedSubjects.length - 3} more`
                              : ""}
                          </span>
                        </span>
                      )}

                      {/* Parent child */}
                      {u.linkedStudent && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          <UsersIcon className="w-3 h-3 text-slate-500" />
                          Child: {u.linkedStudent.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => startEditUser(u)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 hover:text-sky-900 hover:bg-sky-50 border border-sky-200 transition flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleResetPassword(u._id, u.name)}
                      disabled={resettingId === u._id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1 disabled:opacity-50"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      {resettingId === u._id ? "Resetting..." : "Reset"}
                    </button>
                    {u.role !== "super_admin" && (
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="px-6 py-4.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                  <UserCog className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Edit User — {editingUser.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="class_teacher">Class Teacher</option>
                  <option value="subject_teacher">Subject Teacher</option>
                  <option value="branch_admin">Branch Admin</option>
                  <option value="parent">Parent</option>
                </select>
              </div>

              {editRole === "branch_admin" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Branch
                  </label>
                  <select
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    <option value="">-- Select Branch --</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editRole === "class_teacher" && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      1. Managed Class(es) — Class Teacher / Form Master
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {classes.map((c) => (
                        <label
                          key={c._id}
                          className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={editClasses.includes(c._id)}
                            onChange={() =>
                              toggleInArray(editClasses, c._id, setEditClasses)
                            }
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <span>
                            {c.name} {c.arm ? `(الشعبة ${c.arm})` : ""}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      2. Teaching Subjects (Optional)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <select
                        value={editClassForSubjects}
                        onChange={(e) => setEditClassForSubjects(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                      >
                        <option value="">-- Browse Subjects in Class --</option>
                        {classes.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} {c.arm ? `— ${c.arm}` : ""}{" "}
                            {c.branch?.name ? `(${c.branch.name})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {editClassForSubjects && editAvailableSubjects.length > 0 && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 mb-2 grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                        {editAvailableSubjects.map((s) => (
                          <label
                            key={s._id}
                            className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={editSubjects.includes(s._id)}
                              onChange={() =>
                                toggleInArray(editSubjects, s._id, setEditSubjects)
                              }
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="truncate">{s.nameEnglish}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {editSubjects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {editSubjects.map((subId) => {
                          const subObj = editSubjectObjects[subId];
                          return (
                            <span
                              key={subId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-medium"
                            >
                              <span>{subObj?.nameEnglish || "Subject"}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditSubjects((prev) =>
                                    prev.filter((id) => id !== subId)
                                  )
                                }
                                className="text-emerald-600 hover:text-emerald-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editRole === "subject_teacher" && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Assigned Teaching Subjects
                  </label>
                  <select
                    value={editClassForSubjects}
                    onChange={(e) => setEditClassForSubjects(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    <option value="">-- Browse Subjects in Class --</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.arm ? `— ${c.arm}` : ""}{" "}
                        {c.branch?.name ? `(${c.branch.name})` : ""}
                      </option>
                    ))}
                  </select>

                  {editClassForSubjects && editAvailableSubjects.length > 0 && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 mb-2 grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                      {editAvailableSubjects.map((s) => (
                        <label
                          key={s._id}
                          className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={editSubjects.includes(s._id)}
                            onChange={() =>
                              toggleInArray(editSubjects, s._id, setEditSubjects)
                            }
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <span className="truncate">{s.nameEnglish}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {editSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {editSubjects.map((subId) => {
                        const subObj = editSubjectObjects[subId];
                        return (
                          <span
                            key={subId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-900 border border-sky-200 text-xs font-medium"
                          >
                            <span>{subObj?.nameEnglish || "Subject"}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditSubjects((prev) =>
                                  prev.filter((id) => id !== subId)
                                )
                              }
                              className="text-sky-600 hover:text-sky-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {editRole === "parent" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Linked Child / Student
                  </label>
                  <select
                    value={editLinkedStudent}
                    onChange={(e) => setEditLinkedStudent(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    <option value="">-- Select Child --</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl text-white text-xs font-bold bg-sky-600 hover:bg-sky-700 transition disabled:opacity-50"
                >
                  {editLoading ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

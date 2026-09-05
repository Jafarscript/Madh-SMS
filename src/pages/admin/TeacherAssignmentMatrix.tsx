/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import {
  Grid,
  Users,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  UserCheck,
  UserPlus,
  RefreshCw,
  Printer,
  ChevronDown,
  X,
} from "lucide-react";

interface Branch {
  _id: string;
  name: string;
}

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
  branch?: { _id: string; name: string } | string;
}

interface Subject {
  _id: string;
  nameEnglish: string;
  nameArabic?: string;
  class: string | { _id: string; name: string };
}

interface TeacherUser {
  _id: string;
  name: string;
  email: string;
  role: "super_admin" | "branch_admin" | "class_teacher" | "subject_teacher" | "parent";
  subjects?: any[];
  classes?: any[];
  branch?: any;
}

export default function TeacherAssignmentMatrix() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewFilter, setViewFilter] = useState<"all" | "unassigned" | "assigned">("all");

  // Assignment Modal State
  const [activeCell, setActiveCell] = useState<{
    subject: Subject;
    classItem: ClassItem;
    assignedTeachers: TeacherUser[];
  } | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes, sRes, uRes] = await Promise.all([
        api.get("/branches"),
        api.get("/classes"),
        api.get("/subjects"),
        api.get("/users"),
      ]);

      setBranches(bRes.data || []);
      setClasses(cRes.data || []);
      setSubjects(sRes.data || []);

      const teachingStaff = (uRes.data || []).filter(
        (u: TeacherUser) =>
          u.role === "subject_teacher" ||
          u.role === "class_teacher" ||
          u.role === "super_admin" ||
          u.role === "branch_admin"
      );
      setTeachers(teachingStaff);
    } catch (err) {
      console.error("Failed to load assignment matrix data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter classes by branch
  const filteredClasses = classes.filter((c) => {
    if (selectedBranch === "all") return true;
    const bId = typeof c.branch === "object" ? c.branch?._id : c.branch;
    return bId === selectedBranch;
  });

  // Unique subject names across all classes or filtered by search
  const uniqueSubjectNames = Array.from(
    new Set(subjects.map((s) => s.nameEnglish.trim()))
  ).sort((a, b) => a.localeCompare(b));

  // Find teachers assigned to a specific subject ID
  const getAssignedTeachersForSubject = (subjectId: string): TeacherUser[] => {
    return teachers.filter((t) => {
      const subjIds = (t.subjects || []).map((s: any) => (typeof s === "object" ? s._id : s));
      return subjIds.includes(subjectId);
    });
  };

  // Find class masters for a class ID
  const getClassMasters = (classId: string): TeacherUser[] => {
    return teachers.filter((t) => {
      if (t.role !== "class_teacher" && t.role !== "super_admin" && t.role !== "branch_admin")
        return false;
      const classIds = (t.classes || []).map((c: any) => (typeof c === "object" ? c._id : c));
      return classIds.includes(classId);
    });
  };

  // Calculate workload & stats
  let totalSlots = 0;
  let assignedSlots = 0;
  let unassignedSlots = 0;

  filteredClasses.forEach((c) => {
    const classSubjs = subjects.filter((s) => {
      const sClassId = typeof s.class === "object" ? s.class?._id : s.class;
      return sClassId === c._id;
    });
    classSubjs.forEach((s) => {
      totalSlots++;
      const assigned = getAssignedTeachersForSubject(s._id);
      if (assigned.length > 0) {
        assignedSlots++;
      } else {
        unassignedSlots++;
      }
    });
  });

  const coveragePercent = totalSlots > 0 ? Math.round((assignedSlots / totalSlots) * 100) : 0;

  // Handle Quick Teacher Assignment
  const handleAssignTeacher = async () => {
    if (!activeCell || !selectedTeacherId) return;
    setUpdating(true);
    setFeedback(null);
    try {
      const teacher = teachers.find((t) => t._id === selectedTeacherId);
      if (!teacher) return;

      const currentSubjIds = (teacher.subjects || []).map((s: any) =>
        typeof s === "object" ? s._id : s
      );

      if (!currentSubjIds.includes(activeCell.subject._id)) {
        currentSubjIds.push(activeCell.subject._id);
      }

      const currentClassIds = (teacher.classes || []).map((c: any) =>
        typeof c === "object" ? c._id : c
      );
      if (!currentClassIds.includes(activeCell.classItem._id)) {
        currentClassIds.push(activeCell.classItem._id);
      }

      await api.put(`/users/${teacher._id}`, {
        name: teacher.name,
        role: teacher.role,
        branch: typeof teacher.branch === "object" ? teacher.branch?._id : teacher.branch,
        classes: currentClassIds,
        subjects: currentSubjIds,
      });

      setFeedback({
        type: "success",
        text: `Assigned ${teacher.name} to ${activeCell.subject.nameEnglish} (${activeCell.classItem.name})`,
      });

      await fetchData();
      setTimeout(() => {
        setActiveCell(null);
        setSelectedTeacherId("");
        setFeedback(null);
      }, 1000);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to update teacher assignment",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUnassignTeacher = async (teacher: TeacherUser, subjectId: string) => {
    setUpdating(true);
    try {
      const currentSubjIds = (teacher.subjects || [])
        .map((s: any) => (typeof s === "object" ? s._id : s))
        .filter((id: string) => id !== subjectId);

      await api.put(`/users/${teacher._id}`, {
        name: teacher.name,
        role: teacher.role,
        branch: typeof teacher.branch === "object" ? teacher.branch?._id : teacher.branch,
        classes: (teacher.classes || []).map((c: any) => (typeof c === "object" ? c._id : c)),
        subjects: currentSubjIds,
      });

      await fetchData();
      if (activeCell) {
        setActiveCell((prev) =>
          prev
            ? {
                ...prev,
                assignedTeachers: prev.assignedTeachers.filter((t) => t._id !== teacher._id),
              }
            : null
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to unassign teacher");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Class & Subject Teacher Assignment Matrix"
          subtitle="Master visual matrix table showing which teacher teaches which subject in each class/arm at a glance"
        />

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
            title="Refresh Matrix"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm shadow-sky-600/20 active:scale-95 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Matrix</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Subject Slots</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalSlots}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {filteredClasses.length} classes</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Coverage</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{coveragePercent}%</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">{assignedSlots} assigned slots</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Unassigned Gaps</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">{unassignedSlots}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Requires teacher assignment</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Teachers</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-sky-900 mt-1">{teachers.length}</p>
          <p className="text-[11px] text-sky-600 mt-0.5">Available in staff roster</p>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject or teacher name..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition"
            />
          </div>

          {branches.length > 1 && (
            <div className="w-full sm:w-56">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
          {(["all", "unassigned", "assigned"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewFilter(mode)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                viewFilter === mode
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {mode === "all" ? "All Subjects" : mode === "unassigned" ? "⚠️ Missing Only" : "Assigned Only"}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-sky-600" />
            <p className="text-sm font-medium">Constructing assignment matrix...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <GraduationCap className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="text-base font-semibold text-slate-700 mt-2">No classes found</p>
            <p className="text-xs text-slate-400">Please create classes and subjects first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-max text-left text-xs border-collapse">
              <thead>
                {/* Class Column Headers */}
                <tr className="bg-sky-950 text-white text-xs">
                  <th className="py-4 px-4 font-bold uppercase tracking-wider sticky left-0 z-20 bg-sky-950 border-r border-sky-800 min-w-[220px]">
                    Subject / Course
                  </th>
                  {filteredClasses.map((c) => {
                    const masters = getClassMasters(c._id);
                    return (
                      <th
                        key={c._id}
                        className="py-3 px-4 font-semibold text-center border-r border-sky-800/60 min-w-[200px]"
                      >
                        <div className="font-bold text-sm text-white">
                          {c.name} {c.arm ? `(${c.arm})` : ""}
                        </div>
                        <div className="mt-1 text-[11px] text-sky-300 font-normal">
                          {masters.length > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-sky-900/80 px-2 py-0.5 rounded-md border border-sky-700/60 text-sky-200">
                              <UserCheck className="w-3 h-3 text-sky-400" />
                              <span className="truncate max-w-[130px]">{masters[0].name}</span>
                            </span>
                          ) : (
                            <span className="text-sky-400/60 text-[10px] italic">No Class Master</span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {uniqueSubjectNames
                  .filter((subjName) => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    if (subjName.toLowerCase().includes(query)) return true;

                    // Also check if any teacher teaching this subject matches the query
                    const matchingSubjs = subjects.filter((s) => s.nameEnglish.trim() === subjName);
                    return matchingSubjs.some((s) => {
                      const assigned = getAssignedTeachersForSubject(s._id);
                      return assigned.some((t) => t.name.toLowerCase().includes(query));
                    });
                  })
                  .map((subjName) => {
                    return (
                      <tr key={subjName} className="hover:bg-slate-50/70 transition-colors">
                        {/* Row Header: Subject Name */}
                        <td className="py-3.5 px-4 font-semibold text-slate-900 sticky left-0 z-10 bg-white border-r border-slate-200 shadow-xs">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-slate-900">{subjName}</p>
                              {/* Show Arabic script if available on matching subject */}
                              {(() => {
                                const sample = subjects.find(
                                  (s) => s.nameEnglish.trim() === subjName && s.nameArabic
                                );
                                return sample?.nameArabic ? (
                                  <p
                                    className="text-xs text-sky-800 font-medium font-arabic mt-0.5"
                                    style={{ fontFamily: "Amiri, serif" }}
                                  >
                                    {sample.nameArabic}
                                  </p>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        </td>

                        {/* Class Matrix Cells */}
                        {filteredClasses.map((c) => {
                          const subjectInClass = subjects.find((s) => {
                            const sClassId =
                              typeof s.class === "object" ? s.class?._id : s.class;
                            return (
                              sClassId === c._id &&
                              s.nameEnglish.trim().toLowerCase() === subjName.toLowerCase()
                            );
                          });

                          if (!subjectInClass) {
                            return (
                              <td
                                key={c._id}
                                className="py-3 px-4 text-center border-r border-slate-100 bg-slate-50/40 text-slate-300 text-[11px]"
                              >
                                —
                              </td>
                            );
                          }

                          const assignedTeachers = getAssignedTeachersForSubject(
                            subjectInClass._id
                          );
                          const isAssigned = assignedTeachers.length > 0;

                          if (viewFilter === "unassigned" && isAssigned) {
                            return (
                              <td key={c._id} className="py-3 px-4 border-r border-slate-100 opacity-40">
                                <span className="text-[10px] text-slate-400 font-medium">Assigned</span>
                              </td>
                            );
                          }

                          if (viewFilter === "assigned" && !isAssigned) {
                            return (
                              <td key={c._id} className="py-3 px-4 border-r border-slate-100 opacity-40">
                                <span className="text-[10px] text-slate-400 font-medium">Unassigned</span>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={c._id}
                              className={`py-3 px-4 border-r border-slate-100 transition-colors ${
                                isAssigned ? "bg-white" : "bg-amber-50/40"
                              }`}
                            >
                              {isAssigned ? (
                                <div className="space-y-1.5">
                                  {assignedTeachers.map((teacher) => (
                                    <div
                                      key={teacher._id}
                                      className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50/80 border border-sky-200/80 text-sky-950 font-medium group hover:bg-sky-100 transition"
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                          {teacher.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="truncate text-xs font-semibold text-sky-950">
                                          {teacher.name}
                                        </span>
                                      </div>

                                      <button
                                        onClick={() =>
                                          handleUnassignTeacher(teacher, subjectInClass._id)
                                        }
                                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition p-0.5 rounded"
                                        title="Remove teacher from this subject"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}

                                  <button
                                    onClick={() =>
                                      setActiveCell({
                                        subject: subjectInClass,
                                        classItem: c,
                                        assignedTeachers,
                                      })
                                    }
                                    className="text-[10px] text-sky-600 hover:text-sky-800 font-semibold hover:underline block text-center w-full mt-1"
                                  >
                                    + Add / Change Teacher
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center py-1">
                                  <button
                                    onClick={() =>
                                      setActiveCell({
                                        subject: subjectInClass,
                                        classItem: c,
                                        assignedTeachers: [],
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 transition shadow-2xs active:scale-95"
                                  >
                                    <UserPlus className="w-3 h-3" />
                                    <span>Assign Teacher</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Assignment Modal */}
      {activeCell && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-sky-600" />
                  <span>Assign Subject Teacher</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeCell.subject.nameEnglish} — {activeCell.classItem.name}{" "}
                  {activeCell.classItem.arm ? `(${activeCell.classItem.arm})` : ""}
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveCell(null);
                  setSelectedTeacherId("");
                  setFeedback(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* Currently Assigned */}
            {activeCell.assignedTeachers.length > 0 && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">
                  Currently Assigned Teachers:
                </p>
                <div className="space-y-1.5">
                  {activeCell.assignedTeachers.map((t) => (
                    <div
                      key={t._id}
                      className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200"
                    >
                      <span className="font-semibold text-slate-800">{t.name}</span>
                      <button
                        onClick={() => handleUnassignTeacher(t, activeCell.subject._id)}
                        disabled={updating}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teacher Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Teaching Staff Member
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="">-- Choose a teacher from staff roster --</option>
                {teachers.map((t) => {
                  const assignedCount = (t.subjects || []).length;
                  return (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.role.replace("_", " ")}) — {assignedCount} subjects assigned
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setActiveCell(null);
                  setSelectedTeacherId("");
                  setFeedback(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignTeacher}
                disabled={!selectedTeacherId || updating}
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm shadow-sky-600/20 rounded-xl active:scale-95 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Assignment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

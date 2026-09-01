import React, { useState, useEffect } from "react";
import { UserCheck, UserX, Clock, Mail, Phone, Building2, BookOpen, GraduationCap, AlertCircle, CheckCircle2, ShieldAlert, X } from "lucide-react";
import api from "../../api/axios";

interface PendingUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "class_teacher" | "subject_teacher";
  branch?: { _id: string; name: string };
  createdAt: string;
  staffCodeUsed?: string;
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

interface Props {
  onApprovalComplete?: () => void;
  classes: ClassItem[];
  branches: { _id: string; name: string }[];
}

export const PendingTeachersList: React.FC<Props> = ({ onApprovalComplete, classes, branches }) => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Approval Modal State
  const [approvingUser, setApprovingUser] = useState<PendingUser | null>(null);
  const [approveRole, setApproveRole] = useState<"class_teacher" | "subject_teacher">("subject_teacher");
  const [approveBranch, setApproveBranch] = useState("");
  const [approveClasses, setApproveClasses] = useState<string[]>([]);
  const [approveSubjects, setApproveSubjects] = useState<string[]>([]);
  const [classForSubjects, setClassForSubjects] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [subjectCache, setSubjectCache] = useState<Record<string, Subject>>({});
  const [actionLoading, setActionLoading] = useState(false);

  // Reject Modal State
  const [rejectingUser, setRejectingUser] = useState<PendingUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deletePermanently, setDeletePermanently] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/users/pending-teachers");
      setPendingUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load pending teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // Fetch subjects for chosen class in approval modal
  useEffect(() => {
    if (!classForSubjects) {
      setAvailableSubjects([]);
      return;
    }
    api.get(`/subjects?class=${classForSubjects}`).then((res) => {
      setAvailableSubjects(res.data);
      setSubjectCache((prev) => {
        const next = { ...prev };
        res.data.forEach((s: Subject) => {
          next[s._id] = s;
        });
        return next;
      });
    });
  }, [classForSubjects]);

  const openApproveModal = (u: PendingUser) => {
    setApprovingUser(u);
    setApproveRole(u.role || "subject_teacher");
    setApproveBranch(u.branch?._id || (branches[0]?._id || ""));
    setApproveClasses([]);
    setApproveSubjects([]);
    setClassForSubjects("");
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingUser) return;
    setActionLoading(true);
    setError("");
    try {
      await api.put(`/users/${approvingUser._id}/approve`, {
        role: approveRole,
        branch: approveBranch || undefined,
        classes: approveClasses,
        subjects: approveSubjects,
      });

      setSuccess(`Ustadh ${approvingUser.name} has been approved and activated!`);
      setTimeout(() => setSuccess(""), 4000);
      setApprovingUser(null);
      fetchPending();
      if (onApprovalComplete) onApprovalComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve teacher");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingUser) return;
    setActionLoading(true);
    setError("");
    try {
      await api.put(`/users/${rejectingUser._id}/reject`, {
        reason: rejectReason,
        deletePermanently,
      });

      setSuccess(`Application for ${rejectingUser.name} was rejected.`);
      setTimeout(() => setSuccess(""), 4000);
      setRejectingUser(null);
      setRejectReason("");
      fetchPending();
      if (onApprovalComplete) onApprovalComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject application");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleClass = (classId: string) => {
    setApproveClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const toggleSubject = (subId: string) => {
    setApproveSubjects((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Alert Notices */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main List Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending Teacher Registrations
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {pendingUsers.length} awaiting
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and authorize staff accounts before they can access student grading and report cards.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchPending}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
          >
            Refresh Queue
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading pending registrations...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">No Pending Approvals</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All teacher registrations have been processed. New self-registered staff will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingUsers.map((user) => (
              <div key={user._id} className="p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-base font-bold text-slate-900">{user.name}</h4>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 uppercase tracking-wide">
                      {user.role === "class_teacher" ? "Class Teacher" : "Subject Teacher"}
                    </span>
                    {user.branch && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {user.branch.name}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {user.email}
                    </span>
                    {user.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {user.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      Applied: {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingUser(user);
                      setRejectReason("");
                      setDeletePermanently(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <UserX className="w-3.5 h-3.5" /> Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => openApproveModal(user)}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Approve & Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* APPROVE & ASSIGN MODAL */}
      {approvingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div>
                <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  Approve Teacher: {approvingUser.name}
                </h3>
                <p className="text-xs text-emerald-800/80">
                  Assign branch, classes, or teaching subjects to activate this account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApprovingUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Designated Role
                  </label>
                  <select
                    value={approveRole}
                    onChange={(e) => setApproveRole(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="subject_teacher">Subject Teacher</option>
                    <option value="class_teacher">Class Teacher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Campus / Branch
                  </label>
                  <select
                    value={approveBranch}
                    onChange={(e) => setApproveBranch(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- All Campuses --</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Class Teacher Class Picker */}
              {approveRole === "class_teacher" && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Assigned Arm / Class (Optional now, can be updated later)
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {classes.map((c) => (
                      <label key={c._id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={approveClasses.includes(c._id)}
                          onChange={() => toggleClass(c._id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="truncate">{c.name} {c.arm ? `(${c.arm})` : ""}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject Teacher Subject Picker */}
              {approveRole === "subject_teacher" && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Assign Teaching Subjects
                  </label>
                  <select
                    value={classForSubjects}
                    onChange={(e) => setClassForSubjects(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- Select Class to View Subjects --</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.arm ? `(${c.arm})` : ""} {c.branch?.name ? `• ${c.branch.name}` : ""}
                      </option>
                    ))}
                  </select>

                  {classForSubjects && availableSubjects.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-36 overflow-y-auto grid grid-cols-2 gap-2">
                      {availableSubjects.map((s) => (
                        <label key={s._id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={approveSubjects.includes(s._id)}
                            onChange={() => toggleSubject(s._id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="truncate">{s.nameEnglish}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {approveSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {approveSubjects.map((subId) => (
                        <span key={subId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                          {subjectCache[subId]?.nameEnglish || "Subject"}
                          <button type="button" onClick={() => toggleSubject(subId)} className="text-emerald-600 hover:text-emerald-900">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setApprovingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-white text-xs font-bold bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {actionLoading ? "Activating Teacher..." : "Activate & Grant Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Decline Application: {rejectingUser.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to decline this teacher's registration request?
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Declining (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Unrecognized staff member or invalid school code"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deletePermanently}
                  onChange={(e) => setDeletePermanently(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Delete record permanently from database</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {actionLoading ? "Declining..." : "Confirm Decline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

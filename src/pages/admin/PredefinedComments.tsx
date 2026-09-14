/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import {
  COMMENT_CATEGORIES,
  REPORT_CARD_COMMENTS,
  ReportCardComment,
} from "../../constants/reportCardComments";
import {
  MessageSquareQuote,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  X,
  User,
  Users,
  Award,
} from "lucide-react";

type TargetRole = "all" | "class_teacher" | "principal" | "both";

export const PredefinedComments: React.FC = () => {
  const [comments, setComments] = useState<ReportCardComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<TargetRole>("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formArabic, setFormArabic] = useState("");
  const [formEnglish, setFormEnglish] = useState("");
  const [formCategory, setFormCategory] = useState<ReportCardComment["category"]>("excellence");
  const [formGender, setFormGender] = useState<"M" | "F" | "N">("N");
  const [formTargetRole, setFormTargetRole] = useState<"class_teacher" | "principal" | "both">("both");
  const [saving, setSaving] = useState(false);

  // Reset Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Delete Modal
  const [deletingComment, setDeletingComment] = useState<ReportCardComment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/predefined-comments");
      if (Array.isArray(res.data) && res.data.length > 0) {
        setComments(res.data);
      } else {
        // Fallback to initial constant comments
        setComments(REPORT_CARD_COMMENTS);
      }
    } catch (err: any) {
      console.warn("Could not load comments from DB, using fallback", err);
      setComments(REPORT_CARD_COMMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      // Role filter
      if (selectedRole !== "all") {
        const cRole = c.targetRole || "both";
        if (selectedRole === "class_teacher" && cRole === "principal") return false;
        if (selectedRole === "principal" && cRole === "class_teacher") return false;
      }

      // Category filter
      if (selectedCategory !== "all" && c.category !== selectedCategory) {
        return false;
      }

      // Gender filter
      if (selectedGender !== "all" && c.gender !== selectedGender) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesEn = c.en.toLowerCase().includes(q);
        const matchesAr = c.ar.includes(q);
        if (!matchesEn && !matchesAr) return false;
      }

      return true;
    });
  }, [comments, selectedRole, selectedCategory, selectedGender, searchQuery]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setFormArabic("");
    setFormEnglish("");
    setFormCategory("excellence");
    setFormGender("N");
    setFormTargetRole("both");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (c: ReportCardComment) => {
    setModalMode("edit");
    setEditingId(c.id || (c as any)._id || null);
    setFormArabic(c.ar);
    setFormEnglish(c.en);
    setFormCategory(c.category);
    setFormGender(c.gender || "N");
    setFormTargetRole(c.targetRole || "both");
    setError("");
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formArabic.trim() || !formEnglish.trim()) {
      setError("Please provide both Arabic and English text.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (modalMode === "create") {
        await api.post("/predefined-comments", {
          ar: formArabic.trim(),
          en: formEnglish.trim(),
          category: formCategory,
          gender: formGender,
          targetRole: formTargetRole,
        });
        setSuccessMessage("Predefined comment added successfully.");
      } else if (modalMode === "edit" && editingId) {
        await api.put(`/predefined-comments/${editingId}`, {
          ar: formArabic.trim(),
          en: formEnglish.trim(),
          category: formCategory,
          gender: formGender,
          targetRole: formTargetRole,
        });
        setSuccessMessage("Predefined comment updated successfully.");
      }
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(""), 4000);
      await fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save comment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingComment) return;
    setDeleting(true);
    setError("");
    try {
      const commentId = deletingComment.id || (deletingComment as any)._id;
      await api.delete(`/predefined-comments/${commentId}`);
      setSuccessMessage("Comment deleted successfully.");
      setDeletingComment(null);
      setTimeout(() => setSuccessMessage(""), 4000);
      await fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete comment.");
    } finally {
      setDeleting(false);
    }
  };

  const handleResetDefaults = async () => {
    setResetting(true);
    setError("");
    try {
      await api.post("/predefined-comments/reset");
      setSuccessMessage("Predefined comments reset to factory defaults.");
      setIsResetModalOpen(false);
      setTimeout(() => setSuccessMessage(""), 4000);
      await fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset comments.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Predefined Report Card Comments"
        subtitle="Configure the standard bilingual remark bank for class teachers and the principal."
      />

      {/* Notifications */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-sm font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && !isModalOpen && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2.5 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search comments in Arabic or English..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center gap-1.5"
              title="Reset all comments to factory defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={openCreateModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Comment</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
          {/* Role Filter */}
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <span className="px-2 font-medium text-gray-500">Role:</span>
            {(
              [
                { id: "all", label: "All Roles" },
                { id: "class_teacher", label: "Class Teacher" },
                { id: "principal", label: "Principal" },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  selectedRole === r.id
                    ? "bg-white text-emerald-800 shadow-xs border border-gray-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <span className="px-2 font-medium text-gray-500">Gender:</span>
            {[
              { id: "all", label: "All" },
              { id: "N", label: "Neutral" },
              { id: "M", label: "Male" },
              { id: "F", label: "Female" },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGender(g.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  selectedGender === g.id
                    ? "bg-white text-emerald-800 shadow-xs border border-gray-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <span className="px-2 font-medium text-gray-500">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-0 py-1 pl-1 pr-6 font-medium text-gray-800 text-xs focus:ring-0 cursor-pointer"
            >
              {COMMENT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} ({cat.labelAr})
                </option>
              ))}
            </select>
          </div>

          <span className="text-gray-400 text-xs ml-auto">
            Showing <strong>{filteredComments.length}</strong> comments
          </span>
        </div>
      </div>

      {/* Comment List */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
          Loading predefined comments...
        </div>
      ) : filteredComments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
          <MessageSquareQuote className="w-12 h-12 text-gray-300 mb-2" />
          <p className="font-semibold text-gray-700">No comments found</p>
          <p className="text-xs text-gray-500 mt-1">Try changing search keywords or active filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredComments.map((c, index) => {
            const role = c.targetRole || "both";
            return (
              <div
                key={c.id || (c as any)._id || index}
                className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between group"
              >
                <div>
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Role Badge */}
                      {role === "principal" ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-md">
                          Principal Only
                        </span>
                      ) : role === "class_teacher" ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                          Class Teacher
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                          Both Roles
                        </span>
                      )}

                      {/* Gender Badge */}
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-700 rounded-md">
                        {c.gender === "M" ? "Male (طالب)" : c.gender === "F" ? "Female (طالبة)" : "Neutral (مشترك)"}
                      </span>

                      {/* Category Badge */}
                      <span className="px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-50 rounded-md">
                        {COMMENT_CATEGORIES.find((cat) => cat.id === c.category)?.label.split(" (")[0] || c.category}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                        title="Edit comment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingComment(c)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-700 hover:bg-red-50 transition"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Arabic Text */}
                  <p
                    className="text-base text-gray-900 font-bold text-right leading-relaxed mb-2"
                    dir="rtl"
                    style={{ fontFamily: "Amiri, serif" }}
                  >
                    {c.ar}
                  </p>

                  {/* English Text */}
                  <p className="text-xs text-gray-700 leading-relaxed">{c.en}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                  <span>ID: {c.id || (c as any)._id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MessageSquareQuote className="w-5 h-5 text-emerald-700" />
                {modalMode === "create" ? "Add Predefined Comment" : "Edit Predefined Comment"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Target Role */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Role (من يستخدم هذه العبارة)
                </label>
                <select
                  value={formTargetRole}
                  onChange={(e) => setFormTargetRole(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white"
                >
                  <option value="both">Both (Class Teachers & Principal)</option>
                  <option value="class_teacher">Class Teachers Only</option>
                  <option value="principal">Principal Only</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category (تصنيف العبارة)
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white"
                >
                  {COMMENT_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label} ({cat.labelAr})
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Student Gender (جنس الطالب)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "N", label: "Neutral (مشترك)" },
                    { id: "M", label: "Male (طالب)" },
                    { id: "F", label: "Female (طالبة)" },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setFormGender(g.id as any)}
                      className={`py-1.5 px-3 text-xs rounded-lg font-medium border text-center transition ${
                        formGender === g.id
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Arabic Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Arabic Remark (العبارة باللغة العربية)
                </label>
                <textarea
                  rows={2}
                  dir="rtl"
                  value={formArabic}
                  onChange={(e) => setFormArabic(e.target.value)}
                  placeholder="أدخل العبارة باللغة العربية مع التشكيل المناسب..."
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base text-right focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  style={{ fontFamily: "Amiri, serif" }}
                />
              </div>

              {/* English Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  English Remark (العبارة باللغة الإنجليزية)
                </label>
                <textarea
                  rows={2}
                  value={formEnglish}
                  onChange={(e) => setFormEnglish(e.target.value)}
                  placeholder="Enter the standard English translation..."
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 transition shadow-xs"
                >
                  {saving ? "Saving..." : modalMode === "create" ? "Add Comment" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Predefined Comment?</h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Are you sure you want to delete this comment? Existing report cards that already used it will retain
              their current snapshot.
            </p>
            <div className="p-3 bg-gray-50 rounded-xl mb-4 border border-gray-200">
              <p className="text-sm font-bold text-right text-gray-900" style={{ fontFamily: "Amiri, serif" }}>
                {deletingComment.ar}
              </p>
              <p className="text-xs text-gray-700 mt-1">{deletingComment.en}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingComment(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-3 text-amber-600">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-900">Reset Predefined Comments?</h3>
            </div>
            <p className="text-xs text-gray-600 mb-5 leading-relaxed">
              This will restore all default 36 standard remarks in Arabic and English for both Class Teachers and
              Principals. Any custom remarks you added will be preserved unless you choose to overwrite them.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsResetModalOpen(false)}
                disabled={resetting}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDefaults}
                disabled={resetting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
              >
                {resetting ? "Resetting..." : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredefinedComments;

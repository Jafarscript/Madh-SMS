/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { AlertTriangle, Trash2, CheckCircle, GraduationCap, RefreshCw } from "lucide-react";
import { isElementaryClass, isGraduatingClass } from "../../utils/classCategoryHelper";

interface Branch {
  _id: string;
  name: string;
}

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
  category?: "secondary" | "elementary";
  isGraduating?: boolean;
  graduatingLevel?: "elementary" | "junior_secondary" | "senior_secondary";
  sourceSchool?: string;
  secondaryResultMode?: "current_only" | "combine_1st_and_3rd";
  branch: { _id: string; name: string };
}

const Classes = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin" || user?.role === "branch_admin";
  const isSuperAdmin = user?.role === "super_admin";

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState("");
  const [arm, setArm] = useState("");
  const [category, setCategory] = useState<"secondary" | "elementary">("secondary");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [isGraduating, setIsGraduating] = useState(false);
  const [isGraduatingTouched, setIsGraduatingTouched] = useState(false);
  const [sourceSchool, setSourceSchool] = useState("");
  const [secondaryResultMode, setSecondaryResultMode] = useState<"current_only" | "combine_1st_and_3rd">("current_only");
  const [loading, setLoading] = useState(false);
  const [syncingGraduating, setSyncingGraduating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editArm, setEditArm] = useState("");
  const [editCategory, setEditCategory] = useState<"secondary" | "elementary">("secondary");
  const [editBranchId, setEditBranchId] = useState("");
  const [editIsGraduating, setEditIsGraduating] = useState(false);
  const [editSourceSchool, setEditSourceSchool] = useState("");
  const [editSecondaryResultMode, setEditSecondaryResultMode] = useState<"current_only" | "combine_1st_and_3rd">("current_only");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingClass, setDeletingClass] = useState<ClassItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [classRes, branchRes] = await Promise.all([
        api.get("/classes"),
        api.get("/branches"),
      ]);
      setClasses(classRes.data);
      setBranches(branchRes.data);
    } catch (err: any) {
      console.error("Failed to load classes or branches", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRonikBranchId = () => {
    const ronik =
      branches.find((b) => /ronik/i.test(b.name)) ||
      branches.find((b) => /permanent/i.test(b.name));
    return ronik?._id || "";
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!categoryTouched) {
      if (isElementaryClass(val)) {
        setCategory("elementary");
      } else {
        setCategory("secondary");
      }
    }
    if (isSuperAdmin && !isGraduatingTouched) {
      const detectedGrad = isGraduatingClass(val);
      setIsGraduating(detectedGrad);
      if (detectedGrad && !branchId) {
        const rId = getRonikBranchId();
        if (rId) setBranchId(rId);
      }
    }
  };

  const handleSyncGraduating2026 = async () => {
    if (!isSuperAdmin) return;
    setSyncingGraduating(true);
    setError("");
    setSuccessMessage("");
    try {
      const res = await api.post("/classes/graduating/setup-2026");
      await fetchData();
      setSuccessMessage(res.data?.message || "2026 graduating classes & roster synced.");
      setTimeout(() => setSuccessMessage(""), 6000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to sync graduating classes");
    } finally {
      setSyncingGraduating(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      await api.post("/classes", {
        name,
        branch: branchId || (isGraduating ? getRonikBranchId() : ""),
        category,
        ...(arm.trim() ? { arm: arm.trim() } : {}),
        ...(isSuperAdmin && isGraduating
          ? {
              isGraduating: true,
              ...(sourceSchool.trim() ? { sourceSchool: sourceSchool.trim() } : {}),
              secondaryResultMode,
            }
          : {}),
      });
      setName("");
      setArm("");
      setCategory("secondary");
      setCategoryTouched(false);
      setBranchId("");
      setIsGraduating(false);
      setIsGraduatingTouched(false);
      setSourceSchool("");
      setSecondaryResultMode("current_only");
      setSuccessMessage("Class created successfully.");
      setTimeout(() => setSuccessMessage(""), 4000);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (classItem: ClassItem) => {
    setEditingId(classItem._id);
    setEditName(classItem.name);
    setEditArm(classItem.arm || "");
    const effectiveCategory =
      classItem.category === "elementary" || isElementaryClass(classItem.name, classItem.category)
        ? "elementary"
        : "secondary";
    setEditCategory(effectiveCategory);
    setEditBranchId(
      typeof classItem.branch === "object" && classItem.branch
        ? classItem.branch._id
        : typeof classItem.branch === "string"
        ? classItem.branch
        : ""
    );
    setEditIsGraduating(Boolean(classItem.isGraduating || isGraduatingClass(classItem.name)));
    setEditSourceSchool(classItem.sourceSchool || "");
    setEditSecondaryResultMode(classItem.secondaryResultMode || "current_only");
    setError("");
    setSuccessMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditArm("");
    setEditCategory("secondary");
    setEditBranchId("");
    setEditIsGraduating(false);
    setEditSourceSchool("");
    setEditSecondaryResultMode("current_only");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      setError("Class name cannot be empty");
      return;
    }
    if (!editBranchId) {
      setError("Branch must be selected");
      return;
    }
    setSavingEdit(true);
    setError("");
    try {
      const res = await api.put(`/classes/${id}`, {
        name: editName.trim(),
        arm: editArm.trim(),
        category: editCategory,
        branch: editBranchId,
        ...(isSuperAdmin
          ? {
              isGraduating: editIsGraduating,
              sourceSchool: editSourceSchool.trim(),
              secondaryResultMode: editSecondaryResultMode,
            }
          : {}),
      });
      setClasses((prev) =>
        prev.map((c) => (c._id === id ? { ...c, ...res.data, category: editCategory } : c))
      );
      await fetchData();
      cancelEdit();
      setSuccessMessage("Class updated successfully.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update class");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleQuickToggleCategory = async (classItem: ClassItem) => {
    if (!isAdmin) return;
    const newCategory: "secondary" | "elementary" =
      classItem.category === "elementary" ? "secondary" : "elementary";
    try {
      setClasses((prev) =>
        prev.map((c) => (c._id === classItem._id ? { ...c, category: newCategory } : c))
      );
      await api.put(`/classes/${classItem._id}`, {
        category: newCategory,
        name: classItem.name,
        branch:
          typeof classItem.branch === "object" && classItem.branch
            ? classItem.branch._id
            : classItem.branch,
        arm: classItem.arm,
      });
      await fetchData();
      setSuccessMessage(
        `Switched "${classItem.name}" to ${newCategory === "elementary" ? "Elementary (Per-term)" : "Secondary (Cumulative)"}`
      );
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to switch class category");
      fetchData();
    }
  };

  const handleQuickToggleResultMode = async (classItem: ClassItem) => {
    if (!isSuperAdmin) return;
    const nextMode: "current_only" | "combine_1st_and_3rd" =
      classItem.secondaryResultMode === "combine_1st_and_3rd" ? "current_only" : "combine_1st_and_3rd";
    try {
      setClasses((prev) =>
        prev.map((c) => (c._id === classItem._id ? { ...c, secondaryResultMode: nextMode } : c))
      );
      await api.put(`/classes/${classItem._id}`, {
        secondaryResultMode: nextMode,
      });
      await fetchData();
      setSuccessMessage(
        `Updated "${classItem.name}" scoring mode to ${
          nextMode === "current_only" ? "Current Exam Only" : "Combine 1st + 3rd Terms"
        }.`
      );
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update secondary scoring mode");
      fetchData();
    }
  };

  const confirmDelete = async () => {
    if (!deletingClass) return;
    setIsDeleting(true);
    setError("");
    try {
      const res = await api.delete(`/classes/${deletingClass._id}`);
      setSuccessMessage(
        res.data?.message ||
          "Class and all linked students, subjects, scores, and records deleted successfully."
      );
      setTimeout(() => setSuccessMessage(""), 6000);
      setDeletingClass(null);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete class");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <PageHeader
          title="Classes & Arms"
          subtitle="Manage and edit classes; add an arm only if this class is split (e.g. A / B)"
        />
        {isSuperAdmin && (
          <button
            type="button"
            onClick={handleSyncGraduating2026}
            disabled={syncingGraduating}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingGraduating ? "animate-spin" : ""}`} />
            <span>
              {syncingGraduating
                ? "Syncing Graduating Roster..."
                : "Sync 2026 Graduating Classes (PDF Roster)"}
            </span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-sm font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2.5 text-sm font-medium">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isAdmin && (
        <form
          onSubmit={handleCreate}
          className="bg-white p-6 rounded-xl shadow-sm mb-8 flex flex-col gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class name
              </label>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                placeholder="e.g. مستوى الأول or الأول الثانوي or Stage 1"
              />
            </div>
            <div className="w-full sm:w-56">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                {category === "elementary" && (
                  <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    Per-term (Elementary)
                  </span>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => {
                  setCategoryTouched(true);
                  setCategory(e.target.value as "secondary" | "elementary");
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-sm"
              >
                <option value="secondary">Secondary (ثانوي/إعدادي)</option>
                <option value="elementary">Elementary (ابتدائي / Stage / مستوى)</option>
              </select>
            </div>
            <div className="w-full sm:w-28">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الشعبة (opt.)
              </label>
              <input
                value={arm}
                onChange={(e) => setArm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                placeholder="A"
              />
            </div>
          </div>

          {isSuperAdmin && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isGraduating}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsGraduatingTouched(true);
                    setIsGraduating(checked);
                    if (checked && !branchId) {
                      const rId = getRonikBranchId();
                      if (rId) setBranchId(rId);
                    }
                  }}
                  className="w-4 h-4 rounded text-indigo-700 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-700" />
                  Graduating Class (Super Admin Only • Handled under Ronik Branch)
                </span>
              </label>

              {isGraduating && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-indigo-900 mb-1">
                      Source School / External Branch (optional)
                    </label>
                    <input
                      value={sourceSchool}
                      onChange={(e) => setSourceSchool(e.target.value)}
                      placeholder="e.g. فرع لافنوا or معهد اقرأ"
                      className="w-full border border-indigo-200 bg-white rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  {category === "secondary" && (
                    <div>
                      <label className="block text-xs font-semibold text-indigo-900 mb-1">
                        Graduating Secondary Scoring Rule
                      </label>
                      <select
                        value={secondaryResultMode}
                        onChange={(e) =>
                          setSecondaryResultMode(
                            e.target.value as "current_only" | "combine_1st_and_3rd"
                          )
                        }
                        className="w-full border border-indigo-200 bg-white rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="current_only">Current Exam Only (Default)</option>
                        <option value="combine_1st_and_3rd">
                          Combine 1st + 3rd Terms (No 2nd Term)
                        </option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="self-start px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Class"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm divide-y">
        {classes.length === 0 && (
          <p className="p-6 text-sm text-gray-400">No classes yet — add one above.</p>
        )}
        {classes.map((c) => (
          <div key={c._id} className="p-4">
            {editingId === c._id ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Branch
                    </label>
                    <select
                      value={editBranchId}
                      onChange={(e) => setEditBranchId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    >
                      <option value="">Select branch</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Class Name
                    </label>
                    <input
                      value={editName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditName(val);
                        if (isElementaryClass(val)) {
                          setEditCategory("elementary");
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                      placeholder="Class name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as "secondary" | "elementary")}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden bg-white"
                    >
                      <option value="secondary">Secondary (ثانوي/إعدادي)</option>
                      <option value="elementary">Elementary (ابتدائي / Stage / مستوى)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      الشعبة (optional)
                    </label>
                    <input
                      value={editArm}
                      onChange={(e) => setEditArm(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                      placeholder="e.g. A"
                    />
                  </div>
                </div>
                {isSuperAdmin && (
                  <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3 flex flex-col gap-2.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-950">
                      <input
                        type="checkbox"
                        checked={editIsGraduating}
                        onChange={(e) => setEditIsGraduating(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-700 focus:ring-indigo-500"
                      />
                      <span>Graduating Class (Super Admin Only)</span>
                    </label>
                    {editIsGraduating && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-indigo-900 mb-1">
                            Source School
                          </label>
                          <input
                            value={editSourceSchool}
                            onChange={(e) => setEditSourceSchool(e.target.value)}
                            placeholder="e.g. فرع لافنوا or معهد اقرأ"
                            className="w-full border border-indigo-200 bg-white rounded-lg px-3 py-1.5 text-sm"
                          />
                        </div>
                        {editCategory === "secondary" && (
                          <div>
                            <label className="block text-xs font-semibold text-indigo-900 mb-1">
                              Secondary Scoring Mode
                            </label>
                            <select
                              value={editSecondaryResultMode}
                              onChange={(e) =>
                                setEditSecondaryResultMode(
                                  e.target.value as "current_only" | "combine_1st_and_3rd"
                                )
                              }
                              className="w-full border border-indigo-200 bg-white rounded-lg px-3 py-1.5 text-sm"
                            >
                              <option value="current_only">Current Exam Only</option>
                              <option value="combine_1st_and_3rd">Combine 1st + 3rd Terms</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 justify-end items-center mt-1">
                  <button
                    onClick={() => handleSaveEdit(c._id)}
                    disabled={savingEdit}
                    className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 transition shadow-xs"
                  >
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={savingEdit}
                    className="px-4 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {c.name}
                      {c.arm && <span className="text-gray-500 font-normal"> — الشعبة {c.arm}</span>}
                    </p>
                    {(c.isGraduating || isGraduatingClass(c.name, c.isGraduating)) && (
                      <span className="px-2.5 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full inline-flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        Graduating • Super Admin Only
                      </span>
                    )}
                    {c.category === "elementary" ? (
                      <button
                        type="button"
                        onClick={() => handleQuickToggleCategory(c)}
                        title="Click to switch category to Secondary (Cumulative)"
                        className="px-2.5 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-full hover:bg-amber-100 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        Elementary (Per-term)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickToggleCategory(c)}
                        title="Click to switch category to Elementary (Per-term)"
                        className="px-2.5 py-0.5 text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 rounded-full hover:bg-sky-100 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
                        Secondary ({c.isGraduating ? "Graduating" : "Cumulative"})
                      </button>
                    )}
                    {isSuperAdmin &&
                      (c.isGraduating || isGraduatingClass(c.name, c.isGraduating)) &&
                      c.category !== "elementary" && (
                        <button
                          type="button"
                          onClick={() => handleQuickToggleResultMode(c)}
                          title="Click to toggle between Current Exam Only and Combine 1st + 3rd Terms"
                          className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border transition cursor-pointer ${
                            c.secondaryResultMode === "combine_1st_and_3rd"
                              ? "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {c.secondaryResultMode === "combine_1st_and_3rd"
                            ? "1st + 3rd Terms"
                            : "Current Exam Only"}
                        </button>
                      )}
                  </div>
                  <p className="text-xs font-medium text-sky-700 mt-0.5">
                    {c.branch?.name || "No branch"}
                    {c.sourceSchool && (
                      <span className="text-gray-500 ml-2">• School: {c.sourceSchool}</span>
                    )}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => startEdit(c)}
                      className="text-sm font-medium text-sky-600 hover:text-sky-800 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingClass(c)}
                      className="text-sm text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Admin Delete Confirmation Modal */}
      {deletingClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete Class: {deletingClass.name} {deletingClass.arm ? `(الشعبة ${deletingClass.arm})` : ""}?
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              This action is <strong className="text-rose-600">permanent and irreversible</strong>. Deleting this class will automatically cascade and delete everything associated with it:
            </p>

            <ul className="text-xs text-gray-700 bg-rose-50/70 border border-rose-100 rounded-xl p-3.5 space-y-1.5 mb-6">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>All <strong>students</strong> registered in this class</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>All <strong>subjects</strong> assigned to this class</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>All student <strong>scores & grades</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>All <strong>attendance</strong> records & class settings</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>All <strong>report card remarks</strong> & published results</span>
              </li>
            </ul>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeletingClass(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? "Deleting All Linked Records..." : "Yes, Delete Everything"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
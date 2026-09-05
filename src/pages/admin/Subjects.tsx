/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, GripVertical, Check, RefreshCw } from "lucide-react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import { predefinedSubjects } from "../../data/predefinedSubjects";
import { useAuth } from "../../context/AuthContext";

interface Branch {
  _id: string;
  name: string;
}

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
  branch: { _id: string; name: string };
}

interface Subject {
  _id: string;
  nameEnglish: string;
  nameArabic?: string;
  class: string;
  order?: number;
}

const Subjects = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [nameEnglish, setNameEnglish] = useState("");
  const [nameArabic, setNameArabic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedPredefined, setSelectedPredefined] = useState<string[]>([]);
  const [addingPredefined, setAddingPredefined] = useState(false);

  // Subject editing state
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editNameEnglish, setEditNameEnglish] = useState("");
  const [editNameArabic, setEditNameArabic] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal / Reordering state
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [reorderedList, setReorderedList] = useState<Subject[]>([]);
  const [savingReorder, setSavingReorder] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/classes"), api.get("/branches")]).then(([classRes, branchRes]) => {
      setClasses(classRes.data);
      setBranches(branchRes.data);
    });
  }, []);

  const filteredClasses = selectedBranch
    ? classes.filter((c) => c.branch?._id === selectedBranch)
    : classes;

  const currentClassObj = classes.find((c) => c._id === selectedClass);

  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      return;
    }
    fetchSubjects();
  }, [selectedClass]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get(`/subjects?class=${selectedClass}`);
      setSubjects(res.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) {
      setError("Select a class first");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/subjects", {
        nameEnglish: nameEnglish.trim(),
        nameArabic: nameArabic.trim() || undefined,
        class: selectedClass,
      });
      setNameEnglish("");
      setNameArabic("");
      await fetchSubjects();
      showSuccess("Subject added successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create subject");
    } finally {
      setLoading(false);
    }
  };

  const startEditSubject = (s: Subject) => {
    setEditingSubjectId(s._id);
    setEditNameEnglish(s.nameEnglish);
    setEditNameArabic(s.nameArabic || "");
  };

  const cancelEditSubject = () => {
    setEditingSubjectId(null);
    setEditNameEnglish("");
    setEditNameArabic("");
  };

  const handleSaveEditSubject = async (id: string) => {
    if (!editNameEnglish.trim()) {
      setError("Subject name (English) cannot be empty");
      return;
    }
    setSavingEdit(true);
    setError("");
    try {
      await api.put(`/subjects/${id}`, {
        nameEnglish: editNameEnglish.trim(),
        nameArabic: editNameArabic.trim() || "",
      });
      await fetchSubjects();
      cancelEditSubject();
      showSuccess("Subject updated successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update subject");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject? Scores entered for this subject in this class may be affected.")) return;
    try {
      await api.delete(`/subjects/${id}`);
      await fetchSubjects();
      showSuccess("Subject deleted");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete subject");
    }
  };

  const togglePredefined = (nameEnglishVal: string) => {
    setSelectedPredefined((prev) =>
      prev.includes(nameEnglishVal)
        ? prev.filter((n) => n !== nameEnglishVal)
        : [...prev, nameEnglishVal]
    );
  };

  const handleAddPredefined = async () => {
    if (!selectedClass || selectedPredefined.length === 0) return;
    setAddingPredefined(true);
    setError("");
    try {
      const toAdd = predefinedSubjects.filter((s) =>
        selectedPredefined.includes(s.nameEnglish)
      );
      await api.post("/subjects/bulk", {
        class: selectedClass,
        subjects: toAdd,
      });
      setSelectedPredefined([]);
      await fetchSubjects();
      showSuccess(`Added ${toAdd.length} subjects to class`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add subjects");
    } finally {
      setAddingPredefined(false);
    }
  };

  // Quick single step Move Up / Down
  const handleQuickMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subjects.length) return;

    const newList = [...subjects];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);

    setSubjects(newList);
    try {
      await api.put("/subjects/reorder", {
        class: selectedClass,
        subjectIds: newList.map((s) => s._id),
      });
      showSuccess("Subject order updated for report cards & broadsheet");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save subject order");
      fetchSubjects();
    }
  };

  // Open Reorder Modal
  const openReorderModal = () => {
    setReorderedList([...subjects]);
    setIsReorderModalOpen(true);
  };

  const moveModalItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reorderedList.length) return;

    const newList = [...reorderedList];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);
    setReorderedList(newList);
  };

  const handleSaveReorderModal = async () => {
    setSavingReorder(true);
    try {
      await api.put("/subjects/reorder", {
        class: selectedClass,
        subjectIds: reorderedList.map((s) => s._id),
      });
      setSubjects(reorderedList);
      setIsReorderModalOpen(false);
      showSuccess("Subject order saved! Report cards will reflect this sequence.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save subject order");
    } finally {
      setSavingReorder(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Subjects & Curriculum Order"
        subtitle="Manage class subjects and set custom order for Report Cards & Broadsheets"
      />

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          {successMessage}
        </div>
      )}

      <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4">
        {/* Branch Filter */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
            {isSuperAdmin ? "Branch (Super Admin Filter)" : "Branch"}
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              if (e.target.value) {
                const isStillValid = classes.some(
                  (c) => c._id === selectedClass && c.branch?._id === e.target.value
                );
                if (!isStillValid) setSelectedClass("");
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
          >
            <option value="">All Branches ({branches.length})</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Class Selector */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
            Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
          >
            <option value="">Select a class</option>
            {filteredClasses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
                {c.arm ? ` — الشعبة ${c.arm}` : ""} ({c.branch?.name || "No branch"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentClassObj && (
        <div className="mb-6 p-3.5 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-between text-xs text-sky-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sky-800">Active Branch:</span>
            <span className="px-2.5 py-1 bg-white font-medium rounded-md shadow-2xs text-sky-700 border border-sky-200">
              {currentClassObj.branch?.name || "General"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sky-800">Class:</span>
            <span className="px-2.5 py-1 bg-white font-medium rounded-md shadow-2xs text-sky-700 border border-sky-200">
              {currentClassObj.name} {currentClassObj.arm ? `(الشعبة ${currentClassObj.arm})` : ""}
            </span>
          </div>
        </div>
      )}

      {selectedClass && (
        <>
          {/* Add Subject Form */}
          <form
            onSubmit={handleCreate}
            className="bg-white p-6 rounded-xl shadow-sm mb-8 flex flex-col gap-4 border border-gray-100"
          >
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Add New Custom Subject
            </h3>
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subject name (English)
                </label>
                <input
                  value={nameEnglish}
                  onChange={(e) => setNameEnglish(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g. Science of Hadith"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subject name (Arabic)
                </label>
                <input
                  value={nameArabic}
                  onChange={(e) => setNameArabic(e.target.value)}
                  dir="rtl"
                  style={{ fontFamily: "Amiri, serif" }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 text-lg"
                  placeholder="مصطلح الحديث"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="self-start px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Subject"}
            </button>
          </form>

          {/* Predefined Subjects Picker */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Quick Add from Predefined Curriculum
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select Islamic & Arabic studies subjects to add directly to this class
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const available = predefinedSubjects
                      .filter((p) => !subjects.some((s) => s.nameEnglish === p.nameEnglish))
                      .map((p) => p.nameEnglish);
                    setSelectedPredefined(available);
                  }}
                  className="text-sky-600 hover:underline font-medium"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedPredefined([])}
                  className="text-gray-500 hover:underline"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-4 max-h-64 overflow-y-auto p-2 border border-gray-100 rounded-lg bg-gray-50/50">
              {predefinedSubjects
                .filter((p) => !subjects.some((s) => s.nameEnglish === p.nameEnglish))
                .map((p) => {
                  const isChecked = selectedPredefined.includes(p.nameEnglish);
                  return (
                    <label
                      key={p.nameEnglish}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm cursor-pointer transition select-none ${
                        isChecked
                          ? "bg-sky-50 border-sky-300 text-sky-900 font-medium shadow-2xs"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePredefined(p.nameEnglish)}
                        className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                      />
                      <span className="truncate flex-1 text-xs">{p.nameEnglish}</span>
                      <span
                        style={{ fontFamily: "Amiri, serif" }}
                        className="text-sm font-semibold text-emerald-800 ml-1"
                        dir="rtl"
                      >
                        {p.nameArabic}
                      </span>
                    </label>
                  );
                })}
            </div>
            <button
              type="button"
              onClick={handleAddPredefined}
              disabled={selectedPredefined.length === 0 || addingPredefined}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-50"
            >
              {addingPredefined
                ? "Adding..."
                : `Add Selected (${selectedPredefined.length})`}
            </button>
          </div>

          {/* Subjects Table with Order Badges & Reordering */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Registered Subjects ({subjects.length})
              </h3>
              <p className="text-xs text-gray-500">
                Subjects appear on report cards and broadsheets in this exact sequential order (#1 to #{subjects.length}).
              </p>
            </div>

            {subjects.length > 1 && (
              <button
                type="button"
                onClick={openReorderModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-95"
              >
                <ArrowUpDown className="w-4 h-4" />
                Arrange Report Card Order
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y overflow-hidden">
            {subjects.length === 0 && (
              <p className="p-8 text-sm text-gray-400 text-center">
                No subjects registered for this class yet. Add from above.
              </p>
            )}
            {subjects.map((s, index) => (
              <div key={s._id} className="p-4 transition hover:bg-slate-50/50">
                {editingSubjectId === s._id ? (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Name (English)
                        </label>
                        <input
                          value={editNameEnglish}
                          onChange={(e) => setEditNameEnglish(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                          placeholder="e.g. Fiqh"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Name (Arabic)
                        </label>
                        <input
                          value={editNameArabic}
                          onChange={(e) => setEditNameArabic(e.target.value)}
                          dir="rtl"
                          style={{ fontFamily: "Amiri, serif" }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden text-base"
                          placeholder="الفقه"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end items-center mt-1">
                      <button
                        onClick={() => handleSaveEditSubject(s._id)}
                        disabled={savingEdit}
                        className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 transition shadow-xs"
                      >
                        {savingEdit ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={cancelEditSubject}
                        disabled={savingEdit}
                        className="px-4 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Order indicator */}
                      <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center border border-sky-200">
                        {index + 1}
                      </span>

                      <div>
                        <span className="font-semibold text-gray-800 text-sm">
                          {s.nameEnglish}
                        </span>
                        {s.nameArabic && (
                          <span
                            className="text-emerald-800 font-medium ml-2.5 text-base"
                            style={{ fontFamily: "Amiri, serif" }}
                            dir="rtl"
                          >
                            {s.nameArabic}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Up/Down Quick Shift */}
                      <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleQuickMove(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition rounded hover:bg-white"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickMove(index, "down")}
                          disabled={index === subjects.length - 1}
                          className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition rounded hover:bg-white"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => startEditSubject(s)}
                        className="px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50 rounded-lg border border-sky-200 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Arrange Order Modal */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Arrange Subjects Order (ترتيب المواد)
                </h3>
                <p className="text-xs text-gray-500">
                  Reorder subjects to match your school's curriculum sequence on report cards.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
              {reorderedList.map((item, idx) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-slate-50/70 hover:bg-slate-100/80 transition"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span className="w-6 h-6 rounded-md bg-white text-gray-800 font-bold text-xs flex items-center justify-center border border-gray-300">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">
                        {item.nameEnglish}
                      </div>
                      {item.nameArabic && (
                        <div
                          className="text-xs text-emerald-800 font-medium"
                          style={{ fontFamily: "Amiri, serif" }}
                        >
                          {item.nameArabic}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveModalItem(idx, "up")}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 disabled:opacity-30 transition"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveModalItem(idx, "down")}
                      disabled={idx === reorderedList.length - 1}
                      className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 disabled:opacity-30 transition"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(false)}
                disabled={savingReorder}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReorderModal}
                disabled={savingReorder}
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 transition disabled:opacity-50 flex items-center gap-2"
              >
                {savingReorder ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Order"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;

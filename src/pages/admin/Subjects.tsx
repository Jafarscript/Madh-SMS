/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
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
  const [selectedPredefined, setSelectedPredefined] = useState<string[]>([]); // holds nameEnglish values
  const [addingPredefined, setAddingPredefined] = useState(false);

  // Subject editing state
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editNameEnglish, setEditNameEnglish] = useState("");
  const [editNameArabic, setEditNameArabic] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/classes"),
      api.get("/branches"),
    ]).then(([classRes, branchRes]) => {
      setClasses(classRes.data);
      setBranches(branchRes.data);
    });
  }, []);

  // Filter classes based on selected branch
  const filteredClasses = selectedBranch
    ? classes.filter((c) => c.branch?._id === selectedBranch)
    : classes;

  const currentClassObj = classes.find((c) => c._id === selectedClass);

  // subjects are per-class, so re-fetch every time the selected class changes
  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      return;
    }
    api
      .get(`/subjects?class=${selectedClass}`)
      .then((res) => setSubjects(res.data));
  }, [selectedClass]);

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
      const res = await api.get(`/subjects?class=${selectedClass}`);
      setSubjects(res.data);
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
      const res = await api.get(`/subjects?class=${selectedClass}`);
      setSubjects(res.data);
      cancelEditSubject();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update subject");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    await api.delete(`/subjects/${id}`);
    const res = await api.get(`/subjects?class=${selectedClass}`);
    setSubjects(res.data);
  };

  const togglePredefined = (nameEnglishVal: string) => {
    setSelectedPredefined((prev) =>
      prev.includes(nameEnglishVal)
        ? prev.filter((n) => n !== nameEnglishVal)
        : [...prev, nameEnglishVal],
    );
  };

  const handleAddPredefined = async () => {
    if (!selectedClass || selectedPredefined.length === 0) return;
    setAddingPredefined(true);
    setError("");
    try {
      const toAdd = predefinedSubjects.filter((s) =>
        selectedPredefined.includes(s.nameEnglish),
      );
      await api.post("/subjects/bulk", {
        class: selectedClass,
        subjects: toAdd,
      });
      setSelectedPredefined([]);
      const res = await api.get(`/subjects?class=${selectedClass}`);
      setSubjects(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add subjects");
    } finally {
      setAddingPredefined(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title="Subjects"
        subtitle="Subjects are assigned per class — pick a branch and class to manage its curriculum"
      />

      <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4">
        {/* Branch Filter for Super Admin (and all admins) */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
            {isSuperAdmin ? "Branch (Super Admin Filter)" : "Branch"}
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              // if selected class is not in the new branch filter, reset selected class
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

        {/* Class Selector with clear branch context */}
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
            <span className="font-semibold text-sky-800">Active Working Branch:</span>
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
          <form
            onSubmit={handleCreate}
            className="bg-white p-6 rounded-xl shadow-sm mb-8 flex flex-col gap-4"
          >
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject name (English)
                </label>
                <input
                  value={nameEnglish}
                  onChange={(e) => setNameEnglish(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  placeholder="e.g. Hadith"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject name (Arabic)
                </label>
                <input
                  value={nameArabic}
                  onChange={(e) => setNameArabic(e.target.value)}
                  dir="rtl"
                  style={{ fontFamily: "Amiri, serif" }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  placeholder="الحديث"
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

          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                Add from predefined subjects
              </label>
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
                // hide ones already added to this class, so the list doesn't
                // let you accidentally create duplicates
                .filter(
                  (p) => !subjects.some((s) => s.nameEnglish === p.nameEnglish),
                )
                .map((p) => {
                  const isChecked = selectedPredefined.includes(p.nameEnglish);
                  return (
                    <label
                      key={p.nameEnglish}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-sm cursor-pointer transition select-none ${
                        isChecked
                          ? "bg-sky-50 border-sky-300 text-sky-900 font-medium"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePredefined(p.nameEnglish)}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span className="truncate flex-1">{p.nameEnglish}</span>
                      <span
                        style={{ fontFamily: "Amiri, serif" }}
                        className="text-xs text-gray-500 ml-1"
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

          <p className="text-sm text-gray-500 mb-3">
            Subjects registered for this class:
          </p>

          <div className="bg-white rounded-xl shadow-sm divide-y">
            {subjects.length === 0 && (
              <p className="p-6 text-sm text-gray-400">
                No subjects for this class yet.
              </p>
            )}
            {subjects.map((s) => (
              <div
                key={s._id}
                className="p-4"
              >
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
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
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
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-800">
                      {s.nameEnglish}
                      {s.nameArabic && (
                        <span
                          className="text-gray-500 ml-2"
                          style={{ fontFamily: "Amiri, serif" }}
                        >
                          {s.nameArabic}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => startEditSubject(s)}
                        className="text-sm font-medium text-sky-600 hover:text-sky-800 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="text-sm text-red-600 hover:underline"
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
    </div>
  );
};

export default Subjects;

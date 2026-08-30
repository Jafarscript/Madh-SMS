/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import { predefinedSubjects } from "../../data/predefinedSubjects";

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
}

interface Subject {
  _id: string;
  nameEnglish: string;
  nameArabic?: string;
  class: string;
}

const Subjects = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [nameEnglish, setNameEnglish] = useState("");
  const [nameArabic, setNameArabic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPredefined, setSelectedPredefined] = useState<string[]>([]); // holds nameEnglish values
  const [addingPredefined, setAddingPredefined] = useState(false);

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
  }, []);

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
        nameEnglish,
        nameArabic,
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    await api.delete(`/subjects/${id}`);
    const res = await api.get(`/subjects?class=${selectedClass}`);
    setSubjects(res.data);
  };

  const togglePredefined = (nameEnglish: string) => {
    setSelectedPredefined((prev) =>
      prev.includes(nameEnglish)
        ? prev.filter((n) => n !== nameEnglish)
        : [...prev, nameEnglish],
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
        subtitle="Subjects are assigned per class — pick a class to manage its subjects"
      />

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Class
        </label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2.5"
        >
          <option value="">Select a class</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
              {c.arm ? ` — الشعبة ${c.arm}` : ""}
            </option>
          ))}
        </select>
      </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Add from predefined subjects
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4 max-h-52 overflow-y-auto">
              {predefinedSubjects
                // hide ones already added to this class, so the list doesn't
                // let you accidentally create duplicates
                .filter(
                  (p) => !subjects.some((s) => s.nameEnglish === p.nameEnglish),
                )
                .map((p) => (
                  <label
                    key={p.nameEnglish}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPredefined.includes(p.nameEnglish)}
                      onChange={() => togglePredefined(p.nameEnglish)}
                    />
                    {p.nameEnglish}{" "}
                    <span
                      style={{ fontFamily: "Amiri, serif" }}
                      className="text-gray-500"
                    >
                      {p.nameArabic}
                    </span>
                  </label>
                ))}
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
            Or add a custom subject not in the list above:
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
                className="p-4 flex justify-between items-center"
              >
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
                <button
                  onClick={() => handleDelete(s._id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Subjects;

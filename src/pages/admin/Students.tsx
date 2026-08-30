/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import * as XLSX from "xlsx";

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
  branch: { _id: string; name: string };
}

interface Student {
  _id: string;
  name: string;
  gender: "M" | "F";
  numberInClass?: number;
}

const Students = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<Student[]>([]);

  const [name, setName] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSummary, setUploadSummary] = useState("");

  // which student row is currently being edited, and the draft values
  // for that row — kept separate from the main `students` list so typing
  // in the edit form doesn't affect the displayed list until saved
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState<"M" | "F">("M");
  const [savingEdit, setSavingEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
  }, []);

  const fetchStudents = async (classId: string) => {
    const res = await api.get(`/students?class=${classId}`);
    setStudents(res.data);
  };

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }
    fetchStudents(selectedClass);
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
      const selectedClassObj = classes.find((c) => c._id === selectedClass);
      await api.post("/students", {
        name,
        gender,
        class: selectedClass,
        branch: selectedClassObj?.branch._id,
      });
      setName("");
      fetchStudents(selectedClass);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Delete this student? This also removes their score history from view.",
      )
    )
      return;
    await api.delete(`/students/${id}`);
    fetchStudents(selectedClass);
  };

  const startEdit = (student: Student) => {
    setEditingId(student._id);
    setEditName(student.name);
    setEditGender(student.gender);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditGender("M");
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setSavingEdit(true);
    setError("");
    try {
      await api.put(`/students/${id}`, {
        name: editName.trim(),
        gender: editGender,
      });
      // renumbering may have shifted positions (name/gender changed),
      // so re-fetch the whole list rather than patching one row locally
      await fetchStudents(selectedClass);
      cancelEdit();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update student");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClass) {
      setUploadError("Select a class first, then choose a file");
      return;
    }

    setUploadError("");
    setUploadSummary("");
    setUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      const parsedStudents = rows
        .map((row) => ({
          name: String(row.name || row.Name || "").trim(),
          gender:
            (row.gender || row.Gender || "M").toString().toUpperCase() === "F"
              ? "F"
              : "M",
        }))
        .filter((s) => s.name.length > 0);

      if (parsedStudents.length === 0) {
        setUploadError(
          "No valid names found — make sure the file has a 'name' column",
        );
        return;
      }

      const selectedClassObj = classes.find((c) => c._id === selectedClass);
      await api.post("/students/bulk", {
        class: selectedClass,
        branch: selectedClassObj?.branch._id,
        students: parsedStudents,
      });

      setUploadSummary(`${parsedStudents.length} students added`);
      fetchStudents(selectedClass);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || "Failed to process file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader title="Students" subtitle="Enroll students into a class" />

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
              {c.arm ? ` — الشعبة ${c.arm}` : ""} ({c.branch?.name})
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <>
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bulk upload (CSV or Excel — needs a "name" column, "gender"
              optional)
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading}
              className="text-sm"
            />
            {uploading && (
              <p className="text-sm text-gray-400 mt-2">Uploading...</p>
            )}
            {uploadError && (
              <p className="text-sm text-red-600 mt-2">{uploadError}</p>
            )}
            {uploadSummary && (
              <p className="text-sm text-green-700 mt-2">{uploadSummary}</p>
            )}
          </div>

          <form
            onSubmit={handleCreate}
            className="bg-white p-6 rounded-xl shadow-sm mb-8 flex flex-col gap-4"
          >
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                />
              </div>
              <div className="w-28">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "M" | "F")}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                >
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="self-start px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Student"}
            </button>
          </form>

          <div className="mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students by name..."
              className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm divide-y">
            {students.length === 0 && (
              <p className="p-6 text-sm text-gray-400">
                No students in this class yet.
              </p>
            )}
            {students
              .filter((s) =>
                s.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
              )
              .sort((a, b) => (a.numberInClass ?? 0) - (b.numberInClass ?? 0))
              .map((s) => (
                <div key={s._id} className="p-4">
                  {editingId === s._id ? (
                    // inline edit mode — replaces the row's display with
                    // editable inputs, rather than opening a separate modal
                    <div className="flex gap-3 items-center">
                      <span className="text-gray-400 w-8">
                        {s.numberInClass}.
                      </span>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                      <select
                        value={editGender}
                        onChange={(e) =>
                          setEditGender(e.target.value as "M" | "F")
                        }
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="M">M</option>
                        <option value="F">F</option>
                      </select>
                      <button
                        onClick={() => saveEdit(s._id)}
                        disabled={savingEdit}
                        className="text-sm px-3.5 py-1.5 rounded-lg text-white font-medium bg-sky-600 hover:bg-sky-700 disabled:opacity-50 transition"
                      >
                        {savingEdit ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-gray-800">
                        {s.numberInClass && (
                          <span className="text-gray-400 mr-2">
                            {s.numberInClass}.
                          </span>
                        )}
                        {s.name}{" "}
                        <span className="text-sm text-gray-400">
                          ({s.gender})
                        </span>
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(s)}
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
                  {students.length > 0 &&
                    searchQuery.trim() &&
                    students.filter((s) =>
                      s.name
                        .toLowerCase()
                        .includes(searchQuery.trim().toLowerCase()),
                    ).length === 0 && (
                      <p className="p-6 text-sm text-gray-400">
                        No students match "{searchQuery}"
                      </p>
                    )}
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Students;

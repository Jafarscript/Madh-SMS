import { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import * as XLSX from "xlsx";
import { AlertTriangle, Trash2, CheckCircle, FileSpreadsheet, Plus } from "lucide-react";
import { BulkStudentUploader } from "../../components/admin/BulkStudentUploader";

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
  enrolledTerms?: number[];
  joinedTerm?: 1 | 2 | 3;
}

const Students = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin" || user?.role === "branch_admin";

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<Student[]>([]);

  const [name, setName] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [joinedTerm, setJoinedTerm] = useState<1 | 2 | 3>(1);
  const [enrolledTerms, setEnrolledTerms] = useState<number[]>([1, 2, 3]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSummary, setUploadSummary] = useState("");

  // which student row is currently being edited, and the draft values
  // for that row — kept separate from the main `students` list so typing
  // in the edit form doesn't affect the displayed list until saved
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState<"M" | "F">("M");
  const [editJoinedTerm, setEditJoinedTerm] = useState<1 | 2 | 3>(1);
  const [editEnrolledTerms, setEditEnrolledTerms] = useState<number[]>([1, 2, 3]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cleaningOrphaned, setCleaningOrphaned] = useState(false);
  const [detectingTerms, setDetectingTerms] = useState(false);
  const [togglingTermsStudentId, setTogglingTermsStudentId] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
  }, []);

  const handleCleanupOrphaned = async () => {
    setCleaningOrphaned(true);
    setError("");
    setSuccessMessage("");
    try {
      const res = await api.post("/students/cleanup-orphaned");
      setSuccessMessage(res.data?.message || "Orphaned student records purged successfully.");
      setTimeout(() => setSuccessMessage(""), 5000);
      if (selectedClass) {
        fetchStudents(selectedClass);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to cleanup orphaned students.");
    } finally {
      setCleaningOrphaned(false);
    }
  };

  const handleAutoDetectTerms = async () => {
    if (!selectedClass) {
      setError("Please select a class first.");
      return;
    }
    setDetectingTerms(true);
    setError("");
    setSuccessMessage("");
    try {
      const res = await api.post(`/students/auto-detect-enrolled-terms?classId=${selectedClass}`);
      setSuccessMessage(res.data?.message || "Terms present auto-detected for students based on score records.");
      setTimeout(() => setSuccessMessage(""), 5000);
      await fetchStudents(selectedClass);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to auto-detect terms present.");
    } finally {
      setDetectingTerms(false);
    }
  };

  const handleToggleTermPresence = async (student: Student, termNumber: number) => {
    const currentTerms: number[] =
      student.enrolledTerms && student.enrolledTerms.length > 0
        ? [...student.enrolledTerms]
        : student.joinedTerm
        ? [1, 2, 3].filter((t) => t >= student.joinedTerm!)
        : [1, 2, 3];

    let updatedTerms: number[];
    if (currentTerms.includes(termNumber)) {
      if (currentTerms.length === 1) {
        setError("A student must be present in at least one term.");
        setTimeout(() => setError(""), 3000);
        return;
      }
      updatedTerms = currentTerms.filter((t) => t !== termNumber);
    } else {
      updatedTerms = [...currentTerms, termNumber].sort((a, b) => a - b);
    }

    setTogglingTermsStudentId(student._id);
    // Optimistic UI update
    setStudents((prev) =>
      prev.map((s) =>
        s._id === student._id
          ? { ...s, enrolledTerms: updatedTerms, joinedTerm: (Math.min(...updatedTerms) as 1 | 2 | 3) }
          : s
      )
    );

    try {
      await api.put(`/students/${student._id}/enrolled-terms`, {
        enrolledTerms: updatedTerms,
        joinedTerm: Math.min(...updatedTerms),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update enrolled terms.");
      await fetchStudents(selectedClass);
    } finally {
      setTogglingTermsStudentId(null);
    }
  };

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
    setSuccessMessage("");
    setLoading(true);
    try {
      const selectedClassObj = classes.find((c) => c._id === selectedClass);
      await api.post("/students", {
        name,
        gender,
        joinedTerm,
        enrolledTerms,
        class: selectedClass,
        branch: selectedClassObj?.branch._id,
      });
      setName("");
      setJoinedTerm(1);
      setEnrolledTerms([1, 2, 3]);
      setSuccessMessage("Student added successfully.");
      setTimeout(() => setSuccessMessage(""), 4000);
      fetchStudents(selectedClass);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteStudent = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    setError("");
    try {
      await api.delete(`/students/${deletingStudent._id}`);
      setSuccessMessage("Student and all related records deleted successfully.");
      setTimeout(() => setSuccessMessage(""), 4000);
      setDeletingStudent(null);
      fetchStudents(selectedClass);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete student");
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = (student: Student) => {
    setEditingId(student._id);
    setEditName(student.name);
    setEditGender(student.gender);
    const existingTerms =
      student.enrolledTerms && student.enrolledTerms.length > 0
        ? student.enrolledTerms
        : student.joinedTerm
        ? [1, 2, 3].filter((t) => t >= student.joinedTerm!)
        : [1, 2, 3];
    setEditEnrolledTerms(existingTerms);
    setEditJoinedTerm(student.joinedTerm || (Math.min(...existingTerms) as 1 | 2 | 3) || 1);
    setError("");
    setSuccessMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditGender("M");
    setEditJoinedTerm(1);
    setEditEnrolledTerms([1, 2, 3]);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) {
      setError("Name cannot be empty");
      return;
    }
    if (editEnrolledTerms.length === 0) {
      setError("Student must be enrolled in at least one term.");
      return;
    }
    setSavingEdit(true);
    setError("");
    try {
      await api.put(`/students/${id}`, {
        name: editName.trim(),
        gender: editGender,
        joinedTerm: editJoinedTerm,
        enrolledTerms: editEnrolledTerms,
      });
      // renumbering may have shifted positions (name/gender changed),
      // so re-fetch the whole list rather than patching one row locally
      await fetchStudents(selectedClass);
      cancelEdit();
      setSuccessMessage("Student updated successfully.");
      setTimeout(() => setSuccessMessage(""), 4000);
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader title="Students" subtitle="Enroll students into a class" />

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

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex-1 min-w-[240px]">
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

        <div className="flex items-center gap-2">
          {selectedClass && (
            <button
              type="button"
              onClick={handleAutoDetectTerms}
              disabled={detectingTerms}
              className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
              title="Scan existing score records to automatically set present terms (T1, T2, T3) for students in this class"
            >
              <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>{detectingTerms ? "Detecting..." : "Auto-Detect Terms"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-sky-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk Excel / CSV Enrollment</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={handleCleanupOrphaned}
              disabled={cleaningOrphaned}
              className="px-3.5 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
              title="Scan database and remove students, scores, and records belonging to previously deleted classes"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-600" />
              <span>{cleaningOrphaned ? "Cleaning..." : "Clean Orphaned"}</span>
            </button>
          )}
        </div>
      </div>

      {showBulkModal && (
        <BulkStudentUploader
          classes={classes}
          defaultClassId={selectedClass}
          onImportComplete={(classId) => {
            setSelectedClass(classId);
            fetchStudents(classId);
          }}
          onClose={() => setShowBulkModal(false)}
        />
      )}

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
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Full name"
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
              <div className="w-56">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joined Term
                </label>
                <select
                  value={joinedTerm}
                  onChange={(e) => {
                    const jt = Number(e.target.value) as 1 | 2 | 3;
                    setJoinedTerm(jt);
                    setEnrolledTerms([1, 2, 3].filter((t) => t >= jt));
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                >
                  <option value={1}>Term 1 (Full Academic Year)</option>
                  <option value={2}>Term 2 (Joined in 2nd Term)</option>
                  <option value={3}>Term 3 (Joined in 3rd Term)</option>
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

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students by name..."
              className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
            />
            <div className="text-xs text-gray-500 bg-sky-50 border border-sky-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <span className="font-semibold text-sky-700">Terms Present (T1, T2, T3):</span>
              <span>Click term badges to toggle enrollment. Non-enrolled terms are excluded from cumulative scores.</span>
            </div>
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
              .map((s) => {
                const sEnrolledTerms =
                  s.enrolledTerms && s.enrolledTerms.length > 0
                    ? s.enrolledTerms
                    : s.joinedTerm
                    ? [1, 2, 3].filter((t) => t >= s.joinedTerm!)
                    : [1, 2, 3];

                return (
                <div key={s._id} className="p-4">
                  {editingId === s._id ? (
                    // inline edit mode — replaces the row's display with
                    // editable inputs, rather than opening a separate modal
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <span className="text-gray-400 w-8 shrink-0">
                        {s.numberInClass}.
                      </span>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 min-w-[140px] border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                      <select
                        value={editGender}
                        onChange={(e) =>
                          setEditGender(e.target.value as "M" | "F")
                        }
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm shrink-0"
                      >
                        <option value="M">M</option>
                        <option value="F">F</option>
                      </select>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-gray-500 font-medium mr-1">Terms:</span>
                        {[1, 2, 3].map((tNum) => {
                          const isChecked = editEnrolledTerms.includes(tNum);
                          return (
                            <button
                              key={tNum}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  if (editEnrolledTerms.length > 1) {
                                    setEditEnrolledTerms(editEnrolledTerms.filter((t) => t !== tNum));
                                  }
                                } else {
                                  setEditEnrolledTerms([...editEnrolledTerms, tNum].sort((a, b) => a - b));
                                }
                              }}
                              className={`px-2 py-1 text-xs font-semibold rounded-md border transition ${
                                isChecked
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-gray-100 text-gray-400 border-gray-200 line-through"
                              }`}
                            >
                              T{tNum}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
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
                    </div>
                  ) : (
                    <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-3">
                      <div className="flex flex-wrap items-center gap-3">
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

                        {/* Interactive Term Presence Badges */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                            Present:
                          </span>
                          {[1, 2, 3].map((tNum) => {
                            const isPresent = sEnrolledTerms.includes(tNum);
                            return (
                              <button
                                key={tNum}
                                type="button"
                                onClick={() => handleToggleTermPresence(s, tNum)}
                                disabled={togglingTermsStudentId === s._id}
                                title={`Term ${tNum}: Click to ${
                                  isPresent ? "exclude" : "enroll"
                                } student. When excluded, non-enrolled term scores are not counted in cumulative total.`}
                                className={`px-2 py-0.5 text-xs font-bold rounded-md border transition cursor-pointer ${
                                  isPresent
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                    : "bg-gray-100 text-gray-400 border-gray-200 line-through opacity-60 hover:opacity-90"
                                }`}
                              >
                                T{tNum}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => startEdit(s)}
                          className="text-sm font-medium text-sky-600 hover:text-sky-800 hover:underline"
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeletingStudent(s)}
                            className="text-sm text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        )}
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
              );
            })}
          </div>

          {/* Admin Delete Confirmation Modal for Student */}
          {deletingStudent && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Delete Student: {deletingStudent.name}?
                </h3>

                <p className="text-sm text-gray-600 mb-4">
                  Deleting this student will permanently delete their record along with all their score records, attendance history, and report card remarks.
                </p>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setDeletingStudent(null)}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteStudent}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isDeleting ? "Deleting..." : "Yes, Delete Student"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Students;

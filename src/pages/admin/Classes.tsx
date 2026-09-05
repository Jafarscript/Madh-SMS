/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { AlertTriangle, Trash2, CheckCircle } from "lucide-react";

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

const Classes = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin" || user?.role === "branch_admin";

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState("");
  const [arm, setArm] = useState("");
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editArm, setEditArm] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      // arm is genuinely optional — only send it if the admin typed one,
      // so classes without arms don't get an empty string stored
      await api.post("/classes", {
        name,
        branch: branchId,
        ...(arm.trim() ? { arm: arm.trim() } : {}),
      });
      setName("");
      setArm("");
      setBranchId("");
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
    setEditBranchId(classItem.branch?._id || "");
    setError("");
    setSuccessMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditArm("");
    setEditBranchId("");
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
      await api.put(`/classes/${id}`, {
        name: editName.trim(),
        arm: editArm.trim(),
        branch: editBranchId,
      });
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
      <PageHeader
        title="Classes & Arms"
        subtitle="Manage and edit classes; add an arm only if this class is split (e.g. A / B)"
      />

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
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                placeholder="e.g. الثاني الاعدادي"
              />
            </div>
            <div className="w-full sm:w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الشعبة (optional)
              </label>
              <input
                value={arm}
                onChange={(e) => setArm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                placeholder="A"
              />
            </div>
          </div>

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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                      placeholder="Class name"
                    />
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
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">
                    {c.name}
                    {c.arm && <span className="text-gray-500 font-normal"> — الشعبة {c.arm}</span>}
                  </p>
                  <p className="text-xs font-medium text-sky-700 mt-0.5">{c.branch?.name || "No branch"}</p>
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
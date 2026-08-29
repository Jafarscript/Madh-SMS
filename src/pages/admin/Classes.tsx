/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";

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
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState("");
  const [arm, setArm] = useState("");
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    const [classRes, branchRes] = await Promise.all([
      api.get("/classes"),
      api.get("/branches"),
    ]);
    setClasses(classRes.data);
    setBranches(branchRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this class? This cannot be undone.")) return;
    await api.delete(`/classes/${id}`);
    fetchData();
  };

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title="Classes & Arms"
        subtitle="Create classes; add an arm only if this class is split (e.g. A / B)"
      />

      <form
        onSubmit={handleCreate}
        className="bg-white p-6 rounded-xl shadow-sm mb-8 flex flex-col gap-4"
      >
        {error && <p className="text-sm text-red-600">{error}</p>}

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

        <div className="flex gap-4">
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
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الشعبة  (optional)
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
          className="self-start px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: "#0B3D2E" }}
        >
          {loading ? "Adding..." : "Add Class"}
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm divide-y">
        {classes.length === 0 && (
          <p className="p-6 text-sm text-gray-400">No classes yet — add one above.</p>
        )}
        {classes.map((c) => (
          <div key={c._id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-800">
                {c.name}
                {c.arm && <span className="text-gray-400"> — الشعبة  {c.arm}</span>}
              </p>
              <p className="text-sm text-gray-500">{c.branch?.name}</p>
            </div>
            <button
              onClick={() => handleDelete(c._id)}
              className="text-sm text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Classes;
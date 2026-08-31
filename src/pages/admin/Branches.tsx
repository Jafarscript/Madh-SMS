/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";

interface Branch {
  _id: string;
  name: string;
  address?: string;
}

const Branches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchBranches = async () => {
    const res = await api.get("/branches");
    setBranches(res.data);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/branches", { name, address });
      setName("");
      setAddress("");
      fetchBranches();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create branch");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (branch: Branch) => {
    setEditingId(branch._id);
    setEditName(branch.name);
    setEditAddress(branch.address || "");
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditAddress("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      setError("Branch name cannot be empty");
      return;
    }
    setSavingEdit(true);
    setError("");
    try {
      await api.put(`/branches/${id}`, {
        name: editName.trim(),
        address: editAddress.trim(),
      });
      await fetchBranches();
      cancelEdit();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update branch");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this branch? This cannot be undone.")) return;
    await api.delete(`/branches/${id}`);
    fetchBranches();
  };

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader title="Branches" subtitle="Manage and edit the school's branches" />

      <form
        onSubmit={handleCreate}
        className="bg-white p-6 rounded-xl shadow-sm mb-8 flex flex-col gap-4"
      >
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Branch name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
            placeholder="e.g. Ejigbo Branch"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address (optional)
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="self-start px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Branch"}
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm divide-y">
        {branches.length === 0 && (
          <p className="p-6 text-sm text-gray-400">No branches yet — add one above.</p>
        )}
        {branches.map((b) => (
          <div key={b._id} className="p-4">
            {editingId === b._id ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Branch Name
                    </label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                      placeholder="Branch name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Address (optional)
                    </label>
                    <input
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                      placeholder="Address"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end items-center mt-1">
                  <button
                    onClick={() => handleSaveEdit(b._id)}
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
                  <p className="font-semibold text-gray-900">{b.name}</p>
                  {b.address ? (
                    <p className="text-sm text-gray-500">{b.address}</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No address set</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEdit(b)}
                    className="text-sm font-medium text-sky-600 hover:text-sky-800 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(b._id)}
                    className="text-sm text-red-600 hover:text-red-800 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Branches;
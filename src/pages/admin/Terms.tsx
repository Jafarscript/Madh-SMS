/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";

interface Term {
  _id: string;
  session: string;
  termNumber: number;
  isActive: boolean;
}

const Terms = () => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [session, setSession] = useState("");
  const [termNumber, setTermNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTerms = async () => {
    const res = await api.get("/terms");
    setTerms(res.data);
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/terms", { session, termNumber, isActive: false });
      setSession("");
      setTermNumber(1);
      fetchTerms();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create term");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    await api.put(`/terms/${id}/activate`);
    fetchTerms();
  };

  return (
    <div className="p-8 max-w-2xl">
      <PageHeader
        title="Terms"
        subtitle="Only one term per session can be active at a time"
      />

      <form
        onSubmit={handleCreate}
        className="bg-white p-6 rounded-xl shadow-sm mb-8 flex flex-col gap-4"
      >
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session
            </label>
            <input
              value={session}
              onChange={(e) => setSession(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
              placeholder="2026/2027"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term
            </label>
            <select
              value={termNumber}
              onChange={(e) => setTermNumber(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
            >
              <option value={1}>1st</option>
              <option value={2}>2nd</option>
              <option value={3}>3rd</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="self-start px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Term"}
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm divide-y">
        {terms.map((t) => (
          <div key={t._id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-800">
                {t.session} — Term {t.termNumber}
              </p>
              {t.isActive && (
                <span className="text-xs font-semibold text-sky-800 bg-sky-100 border border-sky-200 px-2.5 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
            {!t.isActive && (
              <button
                onClick={() => handleActivate(t._id)}
                className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 transition"
              >
                Set Active
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Terms;
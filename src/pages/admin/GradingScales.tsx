/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";

interface Band {
  minScore: number;
  maxScore: number;
  grade: string;
  remark: string;
  remarkArabic: string;
}

interface Scale {
  _id: string;
  name: string;
  bands: Band[];
}

const emptyBand = (): Band => ({
  minScore: 0,
  maxScore: 0,
  grade: "",
  remark: "",
  remarkArabic: "",
});

const GradingScales = () => {
  const [scales, setScales] = useState<Scale[]>([]);
  const [name, setName] = useState("");
  const [bands, setBands] = useState<Band[]>([emptyBand()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchScales = async () => {
    const res = await api.get("/grading-scales");
    setScales(res.data);
  };

  useEffect(() => {
    fetchScales();
  }, []);

  const updateBand = (index: number, field: keyof Band, value: string | number) => {
    setBands((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    );
  };

  const addBand = () => setBands((prev) => [...prev, emptyBand()]);
  const removeBand = (index: number) =>
    setBands((prev) => prev.filter((_, i) => i !== index));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/grading-scales", { name, bands });
      setName("");
      setBands([emptyBand()]);
      fetchScales();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create grading scale");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this grading scale?")) return;
    await api.delete(`/grading-scales/${id}`);
    fetchScales();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Grading Scales"
        subtitle="Define score bands — e.g. 70-100 = A1 / Very Good"
      />

      <form
        onSubmit={handleCreate}
        className="bg-white p-6 rounded-xl shadow-sm mb-8 flex flex-col gap-4"
      >
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scale name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2.5"
            placeholder="e.g. Default Scale"
          />
        </div>

        {bands.map((band, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Min</label>
              <input
                type="number"
                value={band.minScore}
                onChange={(e) => updateBand(i, "minScore", Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Max</label>
              <input
                type="number"
                value={band.maxScore}
                onChange={(e) => updateBand(i, "maxScore", Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Grade</label>
              <input
                value={band.grade}
                onChange={(e) => updateBand(i, "grade", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="A1"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-xs text-gray-500 mb-1">Remark</label>
              <input
                value={band.remark}
                onChange={(e) => updateBand(i, "remark", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Very Good"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Remark (AR)</label>
              <input
                value={band.remarkArabic}
                onChange={(e) => updateBand(i, "remarkArabic", e.target.value)}
                dir="rtl"
                style={{ fontFamily: "Amiri, serif" }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="جيد جدا"
              />
            </div>
            <div className="col-span-1">
              {bands.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBand(i)}
                  className="text-red-600 text-sm px-2 py-2"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addBand}
          className="self-start text-sm text-gray-600 hover:underline"
        >
          + Add another band
        </button>

        <button
          type="submit"
          disabled={loading}
          className="self-start px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Grading Scale"}
        </button>
      </form>

      <div className="flex flex-col gap-4">
        {scales.map((scale) => (
          <div key={scale._id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <p className="font-medium text-gray-800">{scale.name}</p>
              <button
                onClick={() => handleDelete(scale._id)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {scale.bands.map((b, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
                >
                  {b.minScore}-{b.maxScore}: {b.grade} ({b.remark})
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradingScales;
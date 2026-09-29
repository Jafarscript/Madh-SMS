/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import { Edit3, Trash2, Plus, X, Check, ArrowUpRight } from "lucide-react";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bands, setBands] = useState<Band[]>([emptyBand()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

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

  const handleEdit = (scale: Scale) => {
    setEditingId(scale._id);
    setName(scale.name);
    setBands(scale.bands.map((b) => ({ ...b })));
    setError("");
    setSuccessMsg("");
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setBands([emptyBand()]);
    setError("");
    setSuccessMsg("");
  };

  const handleLoadTaqdeerTemplate = () => {
    setName("التقدير");
    setBands([
      { minScore: 85, maxScore: 100, grade: "A1", remark: "Excellent", remarkArabic: "ممتاز" },
      { minScore: 75, maxScore: 84.9, grade: "B2", remark: "Very Good", remarkArabic: "جيد جدا" },
      { minScore: 60, maxScore: 74.9, grade: "C4", remark: "Good", remarkArabic: "جيد" },
      { minScore: 50, maxScore: 59.9, grade: "D7", remark: "Pass", remarkArabic: "مقبول" },
      { minScore: 0, maxScore: 49.9, grade: "F9", remark: "Fail", remarkArabic: "راسب" },
    ]);
    setError("");
    setSuccessMsg("Loaded standard التقدير scale into form! Click 'Save Grading Scale' to apply.");
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const handleResetToStandardTaqdeer = async () => {
    if (!confirm("Reset the 'التقدير' scale to standard 85-100% (A1) configuration?")) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/grading-scales/reset-taqdeer");
      setSuccessMsg("Grading scale 'التقدير' successfully reset to standard 85-100% (A1) scale!");
      await fetchScales();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset grading scale");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/grading-scales/${editingId}`, { name, bands });
        setSuccessMsg(`Grading scale "${name}" updated successfully!`);
      } else {
        await api.post("/grading-scales", { name, bands });
        setSuccessMsg(`Grading scale "${name}" created successfully!`);
      }
      setEditingId(null);
      setName("");
      setBands([emptyBand()]);
      fetchScales();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save grading scale");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, scaleName: string) => {
    if (!confirm(`Delete grading scale "${scaleName}"?`)) return;
    try {
      await api.delete(`/grading-scales/${id}`);
      if (editingId === id) handleCancelEdit();
      fetchScales();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete grading scale");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Grading Scales"
        subtitle="Define and edit score bands — e.g. 85-100% = A1 / Excellent / ممتاز"
      />

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`bg-white p-6 rounded-2xl shadow-sm mb-8 flex flex-col gap-5 border transition ${
          editingId ? "border-sky-400 ring-2 ring-sky-100" : "border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            {editingId ? (
              <>
                <Edit3 className="w-5 h-5 text-sky-600" />
                <span>Editing Grading Scale:</span>
                <span className="text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                  {name}
                </span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-gray-700" />
                <span>Create New Grading Scale</span>
              </>
            )}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Quick Presets & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-xs">
          <div className="flex items-center gap-1.5 font-medium text-sky-900">
            <span className="font-bold">Standard Scale:</span>
            <span>85-100% A1 (ممتاز), 75-84.9% B2 (جيد جدا), 60-74.9% C4 (جيد), 50-59.9% D7 (مقبول), 0-49.9% F9 (راسب)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadTaqdeerTemplate}
              className="px-2.5 py-1.5 bg-white border border-sky-300 hover:bg-sky-100 text-sky-800 rounded-lg font-semibold transition"
            >
              Load into Form
            </button>
            <button
              type="button"
              onClick={handleResetToStandardTaqdeer}
              disabled={loading}
              className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              Reset Database to Standard التقدير
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Scale name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full max-w-sm border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            placeholder="e.g. التقدير"
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Score Bands (Supports Decimals e.g. 84.9%)
          </div>
          {bands.map((band, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-2 items-end bg-gray-50/70 p-3 rounded-xl border border-gray-200"
            >
              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                  Min %
                </label>
                <input
                  type="number"
                  step="any"
                  value={band.minScore}
                  onChange={(e) =>
                    updateBand(i, "minScore", parseFloat(e.target.value) || 0)
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                  Max %
                </label>
                <input
                  type="number"
                  step="any"
                  value={band.maxScore}
                  onChange={(e) =>
                    updateBand(i, "maxScore", parseFloat(e.target.value) || 0)
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                  Grade Code
                </label>
                <input
                  value={band.grade}
                  onChange={(e) => updateBand(i, "grade", e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-bold bg-white text-center"
                  placeholder="A1"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                  English Remark
                </label>
                <input
                  value={band.remark}
                  onChange={(e) => updateBand(i, "remark", e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white"
                  placeholder="Excellent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                  Arabic Remark (التقدير)
                </label>
                <input
                  value={band.remarkArabic}
                  onChange={(e) => updateBand(i, "remarkArabic", e.target.value)}
                  required
                  dir="rtl"
                  style={{ fontFamily: "Amiri, serif" }}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white text-right"
                  placeholder="ممتاز"
                />
              </div>
              <div className="col-span-1 flex justify-center pb-1">
                {bands.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBand(i)}
                    title="Remove Band"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={addBand}
            className="flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-xl border border-sky-200 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Score Band
          </button>

          <div className="flex items-center gap-2">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2.5 rounded-xl text-gray-700 text-sm font-semibold border border-gray-300 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : editingId
                ? "Update Grading Scale"
                : "Save Grading Scale"}
            </button>
          </div>
        </div>
      </form>

      {/* Existing Scales List */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
          Configured Grading Scales ({scales.length})
        </h3>
        {scales.map((scale) => (
          <div
            key={scale._id}
            className={`bg-white rounded-2xl shadow-sm p-5 border transition ${
              editingId === scale._id
                ? "border-sky-500 bg-sky-50/20"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex flex-wrap justify-between items-center gap-3 mb-3 border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900">
                  {scale.name}
                </span>
                {scale.name === "التقدير" && (
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                    Active System Scale
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(scale)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Scale
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(scale._id, scale.name)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {scale.bands.map((b, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium flex items-center gap-1.5"
                >
                  <span className="font-bold text-sky-800">
                    {b.minScore}–{b.maxScore}%:
                  </span>
                  <span className="font-extrabold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                    {b.grade}
                  </span>
                  <span>{b.remark}</span>
                  {b.remarkArabic && (
                    <span
                      style={{ fontFamily: "Amiri, serif" }}
                      className="text-emerald-900 font-semibold"
                      dir="rtl"
                    >
                      ({b.remarkArabic})
                    </span>
                  )}
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
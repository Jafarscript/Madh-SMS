import { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";

type Status = "present" | "absent" | "late";
interface ClassItem { _id: string; name: string; arm?: string }
interface Term { _id: string; session: string; termNumber: number; isActive: boolean }
interface RecordItem { student: string; name: string; numberInClass?: number; status: Status }

const today = new Date().toLocaleDateString("en-CA");

const Attendance = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
    api.get("/terms").then((res) => {
      setTerms(res.data);
      const active = res.data.find((term: Term) => term.isActive);
      if (active) setSelectedTerm(active._id);
    });
  }, []);

  const loadAttendance = async () => {
    if (!selectedClass || !selectedTerm || !date) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await api.get(`/attendance?class=${selectedClass}&term=${selectedTerm}&date=${date}`);
      setRecords(res.data);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Could not load attendance");
    } finally { setLoading(false); }
  };

  const changeStatus = (student: string, status: Status) => {
    setRecords((current) => current.map((record) => record.student === student ? { ...record, status } : record));
  };

  const saveAttendance = async () => {
    if (!selectedClass || !selectedTerm || records.length === 0) return;
    setSaving(true);
    setMessage("");
    try {
      await api.put("/attendance/bulk", {
        class: selectedClass,
        term: selectedTerm,
        date,
        records: records.map(({ student, status }) => ({ student, status })),
      });
      setMessage("Attendance saved successfully.");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Could not save attendance");
    } finally { setSaving(false); }
  };

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader title="Attendance" subtitle="Record daily attendance for a class and term" />
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="">Select class</option>
          {classes.map((item) => <option key={item._id} value={item._id}>{item.name}{item.arm ? ` ${item.arm}` : ""}</option>)}
        </select>
        <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="">Select term</option>
          {terms.map((term) => <option key={term._id} value={term._id}>{term.session} — Term {term.termNumber}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-lg px-3 py-2" />
        <button onClick={loadAttendance} disabled={!selectedClass || !selectedTerm || loading} className="rounded-lg px-4 py-2 text-white disabled:opacity-50" style={{ backgroundColor: "#0B3D2E" }}>
          {loading ? "Loading..." : "Load Class"}
        </button>
      </div>

      {message && <p className={`mb-4 text-sm ${message.includes("success") ? "text-green-700" : "text-red-600"}`}>{message}</p>}
      {records.length > 0 && <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b">
          <p className="font-medium">{records.length} students</p>
          <button onClick={saveAttendance} disabled={saving} className="rounded-lg px-4 py-2 text-white text-sm disabled:opacity-50" style={{ backgroundColor: "#0B3D2E" }}>{saving ? "Saving..." : "Save Attendance"}</button>
        </div>
        {records.map((record) => <div key={record.student} className="p-3 border-b last:border-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>{record.numberInClass ? `${record.numberInClass}. ` : ""}{record.name}</span>
          <div className="flex gap-2">
            {(["present", "absent", "late"] as Status[]).map((status) => <button key={status} onClick={() => changeStatus(record.student, status)} className={`capitalize rounded-md px-3 py-1 text-sm ${record.status === status ? "bg-green-800 text-white" : "border"}`}>{status}</button>)}
          </div>
        </div>)}
      </div>}
    </div>
  );
};

export default Attendance;

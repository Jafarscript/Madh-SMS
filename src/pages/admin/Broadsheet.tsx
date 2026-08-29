/* eslint-disable react-hooks/static-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";

interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
}
interface Term {
  _id: string;
  session: string;
  termNumber: number;
  isActive: boolean;
}
interface SubjectScore {
  subject: string;
  nameEnglish: string;
  nameArabic?: string;
  score: number | null;
}
interface Row {
  student: string;
  name: string;
  numberInClass?: number;
  subjectScores: SubjectScore[];
  total: number;
  average: number;
  position: number;
  allSubjectsEntered: boolean;
}
interface SubjectMeta {
  _id: string;
  nameEnglish: string;
  nameArabic?: string;
}

type SortKey = "numberInClass" | "name" | "total" | "position";

const Broadsheet = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [subjects, setSubjects] = useState<SubjectMeta[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("numberInClass");
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
    api.get("/terms").then((res) => {
      setTerms(res.data);
      const active = res.data.find((t: Term) => t.isActive);
      if (active) setSelectedTerm(active._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass || !selectedTerm) {
      setSubjects([]);
      setRows([]);
      return;
    }
    setLoading(true);
    api
      .get(`/broadsheet?class=${selectedClass}&term=${selectedTerm}`)
      .then((res) => {
        setSubjects(res.data.subjects);
        setRows(res.data.rows);
      })
      .finally(() => setLoading(false));
  }, [selectedClass, selectedTerm]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // sorting happens entirely client-side — the data already carries
  // position/total from the backend, so clicking a column header is
  // just re-ordering the array, no new API call needed
  const filteredRows = rows.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  const sortedRows = [...filteredRows].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "numberInClass")
      cmp = (a.numberInClass ?? 0) - (b.numberInClass ?? 0);
    if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    if (sortKey === "total") cmp = a.total - b.total;
    if (sortKey === "position") cmp = a.position - b.position;
    return sortAsc ? cmp : -cmp;
  });

  const SortHeader = ({ label, sortk }: { label: string; sortk: SortKey }) => (
    <th
      onClick={() => handleSort(sortk)}
      className="p-3 font-medium text-gray-600 cursor-pointer select-none whitespace-nowrap"
    >
      {label} {sortKey === sortk ? (sortAsc ? "▲" : "▼") : ""}
    </th>
  );

  return (
    <div className="p-8">
      <PageHeader
        title="Broadsheet"
        subtitle="Master gradebook per class arm"
      />

      <div className="flex gap-4 mb-6 max-w-2xl">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
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
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Term
          </label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
          >
            <option value="">Select a term</option>
            {terms.map((t) => (
              <option key={t._id} value={t._id}>
                {t.session} — Term {t.termNumber}
              </option>
            ))}
          </select>
        </div>
        {rows.length > 0 && (
          <div className="mb-4 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
            />
          </div>
        )}
      </div>

      {loading && <p className="text-sm text-gray-400">Loading...</p>}

      {!loading && selectedClass && selectedTerm && rows.length === 0 && (
        <p className="text-sm text-gray-400">
          No students found in this class.
        </p>
      )}

      {rows.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="text-sm w-full">
            <thead>
              <tr
                className="text-left border-b"
                style={{ backgroundColor: "#F4F1EA" }}
              >
                <SortHeader label="No." sortk="numberInClass" />
                <SortHeader label="Student" sortk="name" />
                {subjects.map((s) => (
                  <th
                    key={s._id}
                    className="p-3 font-medium text-gray-600 whitespace-nowrap text-center"
                  >
                    {/* {s.nameEnglish} */}
                    {s.nameArabic && (
                      <div
                        className="text-xs text-black"
                        style={{ fontFamily: "Amiri, serif" }}
                      >
                        {s.nameArabic}
                      </div>
                    )}
                  </th>
                ))}
                <SortHeader label="Total" sortk="total" />
                <SortHeader label="Position" sortk="position" />
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.student} className="border-b last:border-0">
                  <td className="p-3 text-gray-400">{row.numberInClass}</td>
                  <td className="p-3 font-medium text-gray-800 whitespace-nowrap">
                    {row.name}
                    {!row.allSubjectsEntered && (
                      <span
                        className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: "#FDECEC", color: "#B42318" }}
                        title="Not all subject scores entered yet"
                      >
                        Incomplete
                      </span>
                    )}
                  </td>
                  {row.subjectScores.map((sc) => (
                    <td key={sc.subject} className="p-3 text-center">
                      {sc.score ?? <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                  <td className="p-3 font-semibold text-gray-800">
                    {row.total}
                  </td>
                  <td
                    className="p-3 font-semibold"
                    style={{ color: "#0B3D2E" }}
                  >
                    {row.position}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 0 && sortedRows.length === 0 && (
            <p className="text-xl text-gray-400 text-center mt-4">
              No student matches "{searchQuery}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Broadsheet;

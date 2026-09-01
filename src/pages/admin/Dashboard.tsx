/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import {
  Grid,
  History,
  Calendar,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

interface Term {
  _id: string;
  session: string;
  termNumber: number;
  isActive: boolean;
}
interface Branch {
  _id: string;
  name: string;
}
interface SubjectCompletion {
  subject: string;
  nameEnglish: string;
  entered: number;
  expected: number;
  complete: boolean;
}
interface ClassSummary {
  class: string;
  className: string;
  branch: string;
  studentCount: number;
  subjectCount: number;
  expectedScoreCount: number;
  actualScoreCount: number;
  percentComplete: number;
  subjectCompletion: SubjectCompletion[];
}
interface TopStudent {
  student: string;
  name: string;
  total: number;
}
interface DashboardData {
  classSummaries: ClassSummary[];
  topStudents: TopStudent[];
  overallSchoolAverage: number;
  totalClasses: number;
  totalStudents: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/terms").then((res) => {
      setTerms(res.data);
      const active = res.data.find((t: Term) => t.isActive);
      if (active) setSelectedTerm(active._id);
    });
    api.get("/branches").then((res) => setBranches(res.data));
  }, []);

  useEffect(() => {
    if (!selectedTerm) return;
    setLoading(true);
    const query = selectedBranch
      ? `?term=${selectedTerm}&branch=${selectedBranch}`
      : `?term=${selectedTerm}`;
    api
      .get(`/dashboard${query}`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [selectedTerm, selectedBranch]);

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        subtitle="Score entry progress, top students, and school performance"
      />

      <div className="flex gap-4 mb-8 max-w-xl">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
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

        {/* super_admin can drill into a branch; branch_admin is implicitly
            scoped server-side already, so this filter is mainly for super_admin */}
        {user?.role === "super_admin" && (
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && <p className="text-sm text-gray-400">Loading...</p>}

      {data && (
        <>
          {/* summary stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-4xl">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Classes</p>
              <p className="text-3xl font-bold text-slate-900">
                {data.totalClasses}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Students</p>
              <p className="text-3xl font-bold text-sky-700">
                {data.totalStudents}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">School Average</p>
              <p className="text-3xl font-bold text-slate-900">
                {data.overallSchoolAverage}
                <span className="text-xs font-normal text-slate-400 ml-1">/ 100</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
            {/* score entry completion, per class, expandable to see per-subject */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <h2 className="font-bold text-base text-slate-900 mb-4">Score Entry Progress</h2>
              <div className="flex flex-col gap-3">
                {data.classSummaries.map((cs) => (
                  <div key={cs.class} className="border border-slate-200 rounded-xl p-3.5 hover:border-sky-300 transition">
                    <button
                      onClick={() =>
                        setExpandedClass(expandedClass === cs.class ? null : cs.class)
                      }
                      className="w-full flex justify-between items-center text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{cs.className}</p>
                        <p className="text-xs text-slate-400 font-medium">{cs.branch}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${cs.percentComplete}%`,
                              backgroundColor:
                                cs.percentComplete === 100 ? "#0284c7" : "#0ea5e9",
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600 w-10 text-right">
                          {cs.percentComplete}%
                        </span>
                      </div>
                    </button>

                    {expandedClass === cs.class && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                        {cs.subjectCompletion.map((sc) => (
                          <div
                            key={sc.subject}
                            className="flex justify-between items-center text-xs"
                          >
                            <span className="text-slate-600 font-medium">{sc.nameEnglish}</span>
                            <span
                              className={`font-semibold ${sc.complete ? "text-sky-700" : "text-amber-600"}`}
                            >
                              {sc.entered}/{sc.expected}{" "}
                              {sc.complete ? "✓" : "— pending"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {data.classSummaries.length === 0 && (
                  <p className="text-sm text-slate-400">No classes found.</p>
                )}
              </div>
            </div>

            {/* top students snapshot */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <h2 className="font-bold text-base text-slate-900 mb-4">Top Students This Term</h2>
              <div className="flex flex-col gap-2">
                {data.topStudents.map((s, i) => (
                  <div
                    key={s.student}
                    className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : i === 1
                            ? "bg-slate-200 text-slate-700 border border-slate-300"
                            : i === 2
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{s.name}</span>
                    </div>
                    <span className="text-sm font-bold text-sky-800">{s.total}</span>
                  </div>
                ))}
                {data.topStudents.length === 0 && (
                  <p className="text-sm text-slate-400">No scores entered yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Admin & Operational Controls Quick Launch */}
          <div className="mt-8 max-w-6xl">
            <h2 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              <span>Admin & Operational Controls</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/admin/teacher-matrix"
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                    <Grid className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition">
                    Teacher Assignment Matrix
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Visual grid showing teacher assignments per subject and class with unassigned gap alerts.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-600">
                  <span>View Matrix</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </Link>

              <Link
                to="/admin/terms"
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    Academic Calendar & Promotions
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    End-of-session class transitions, batch student promotions, and academic session archives.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                  <span>Manage Calendar</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </Link>

              <Link
                to="/admin/audit-logs"
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                    <History className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition">
                    Grading Audit Trail
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Inspect who entered or modified scores, before/after differences, and export audit logs.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
                  <span>View Audit Trail</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
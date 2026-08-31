/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/PageHeader";

type Role = "branch_admin" | "class_teacher" | "subject_teacher" | "parent";

interface Branch {
  _id: string;
  name: string;
}
interface ClassItem {
  _id: string;
  name: string;
  arm?: string;
}
interface Subject {
  _id: string;
  nameEnglish: string;
  nameArabic?: string;
}
interface Student {
  _id: string;
  name: string;
}

const Users = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("class_teacher");
  const [branchId, setBranchId] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [classForSubjects, setClassForSubjects] = useState(""); // to filter subject list
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [linkedStudent, setLinkedStudent] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{
    name: string;
    password: string;
  } | null>(null);

  const fetchUsers = async () => {
    const res = await api.get("/users");
    setUsers(res.data);
  };

  useEffect(() => {
    api.get("/branches").then((res) => setBranches(res.data));
    api.get("/classes").then((res) => setClasses(res.data));
    api.get("/students").then((res) => setStudents(res.data));
    fetchUsers();
  }, []);

  // subject_teacher needs to pick subjects, but subjects are per-class,
  // so we first ask "which class" then load that class's subjects to choose from

  useEffect(() => {
    if (!classForSubjects) {
      setSubjects([]);
      return;
    }
    api
      .get(`/subjects?class=${classForSubjects}`)
      .then((res) => setSubjects(res.data));
  }, [classForSubjects]);

  const resetRoleFields = () => {
    setBranchId("");
    setSelectedClasses([]);
    setClassForSubjects("");
    setSelectedSubjects([]);
    setLinkedStudent("");
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    resetRoleFields();
  };

  // add this instead:
  const [generatedPassword, setGeneratedPassword] = useState("");

  // simple random password generator — 10 characters, mix of letters/numbers,
  // good enough for a temporary password the teacher will change later
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const password = generatePassword();
      const payload: Record<string, unknown> = { name, email, password, role };

      if (role === "branch_admin") payload.branch = branchId;
      if (role === "class_teacher") payload.classes = selectedClasses;
      if (role === "subject_teacher") payload.subjects = selectedSubjects;
      if (role === "parent") payload.linkedStudent = linkedStudent;

      await api.post("/auth/register", payload);

      setGeneratedPassword(password);
      setSuccess(`${name} added as ${role.replace("_", " ")}`);
      setName("");
      setEmail("");
      resetRoleFields();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const toggleInArray = (
    arr: string[],
    value: string,
    setter: (v: string[]) => void,
  ) => {
    setter(
      arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
    );
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Generate a new password for ${userName}? Their old password will stop working.`,
      )
    )
      return;
    setResettingId(userId);
    try {
      const res = await api.put(`/users/${userId}/reset-password`);
      setResetPasswordResult({
        name: userName,
        password: res.data.newPassword,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setResettingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Delete this user account? This cannot be undone.")) return;
    await api.delete(`/users/${userId}`);
    fetchUsers();
  };

  const handleCopy = (password: string) => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-2xl">
      <PageHeader
        title="Users"
        subtitle="Create accounts for branch admins, teachers, and parents"
      />

      <form
        onSubmit={handleCreate}
        className="bg-white p-6 rounded-xl shadow-sm flex flex-col gap-4"
      >
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as Role)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
          >
            <option value="branch_admin">Branch Admin</option>
            <option value="class_teacher">Class Teacher</option>
            <option value="subject_teacher">Subject Teacher</option>
            <option value="parent">Parent</option>
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
            />
          </div>
        </div>

        {generatedPassword && (
          <div
            className="flex items-center justify-between px-4 py-3 rounded-lg text-sm"
            style={{ backgroundColor: "#F4F1EA" }}
          >
            <div>
              <p className="text-gray-500 text-xs mb-1">
                Temporary password (share this with them)
              </p>
              <p
                className="font-mono font-semibold"
                style={{ color: "#0B3D2E" }}
              >
                {generatedPassword}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(generatedPassword)}
              className="text-xs px-3 py-1.5 rounded-lg text-white"
              style={{ backgroundColor: "#0B3D2E" }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        {/* role-specific fields */}
        {role === "branch_admin" && (
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
        )}

        {role === "class_teacher" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Classes they teach
            </label>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {classes.map((c) => (
                <label key={c._id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(c._id)}
                    onChange={() =>
                      toggleInArray(selectedClasses, c._id, setSelectedClasses)
                    }
                  />
                  {c.name}
                  {c.arm ? ` — الشعبة ${c.arm}` : ""}
                  {(c as any).branch?.name && (
                    <span className="text-gray-400 ml-1">
                      ({(c as any).branch.name})
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {role === "subject_teacher" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Which class's subjects?
              </label>
              <select
                value={classForSubjects}
                onChange={(e) => setClassForSubjects(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {c.arm ? ` — الشعبة  ${c.arm}` : ""}{" "}
                    {(c as any).branch?.name ? `(${(c as any).branch.name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {classForSubjects && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjects they teach
                </label>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {subjects.length === 0 && (
                    <p className="text-sm text-gray-400">
                      No subjects in this class yet.
                    </p>
                  )}
                  {subjects.map((s) => (
                    <label
                      key={s._id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(s._id)}
                        onChange={() =>
                          toggleInArray(
                            selectedSubjects,
                            s._id,
                            setSelectedSubjects,
                          )
                        }
                      />
                      {s.nameEnglish}
                      {s.nameArabic && (
                        <span style={{ fontFamily: "Amiri, serif" }}>
                          {s.nameArabic}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {role === "parent" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Linked student (their child)
            </label>
            <select
              value={linkedStudent}
              onChange={(e) => setLinkedStudent(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="self-start px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 active:scale-[0.99] transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
      {/* reset password result — separate from the create-account generatedPassword box */}
      {resetPasswordResult && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl text-sm mt-4 bg-amber-50 border border-amber-200"
        >
          <div>
            <p className="text-amber-800 text-xs font-medium mb-1">
              New password for {resetPasswordResult.name} (share this — old one
              no longer works)
            </p>
            <p className="font-mono font-bold text-slate-800">
              {resetPasswordResult.password}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(resetPasswordResult.password)}
            className="text-xs px-3 py-1.5 rounded-lg text-white font-medium bg-sky-600 hover:bg-sky-700 transition cursor-pointer"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      {/* ── User list, goes after the closing </form> tag ── */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-medium text-gray-800">Existing Users</h2>
          <input
            type="text"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-64"
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {users.length === 0 && (
            <p className="p-6 text-sm text-gray-400">No users created yet.</p>
          )}
          {users
            .filter((u) => {
              const q = userSearchQuery.trim().toLowerCase();
              if (!q) return true;
              return (
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.role.replace("_", " ").toLowerCase().includes(q)
              );
            })
            .map((u) => (
              <div
                key={u._id}
                className="p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {u.name}{" "}
                    <span className="text-sm text-gray-400">
                      ({u.role.replace("_", " ")})
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleResetPassword(u._id, u.name)}
                    disabled={resettingId === u._id}
                    className="text-sm font-medium text-sky-600 hover:text-sky-800 hover:underline disabled:opacity-50"
                  >
                    {resettingId === u._id ? "Resetting..." : "Reset Password"}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u._id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          {users.length > 0 &&
            userSearchQuery.trim() &&
            users.filter((u) => {
              const q = userSearchQuery.trim().toLowerCase();
              return (
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.role.replace("_", " ").toLowerCase().includes(q)
              );
            }).length === 0 && (
              <p className="p-6 text-sm text-gray-400">
                No users match "{userSearchQuery}"
              </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default Users;

import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { User, Role, Department, Team } from "../types";
import {
  UserPlus,
  Search,
  Upload,
  UserCheck,
  UserX,
  Edit,
  Shield,
  FileSpreadsheet,
  Cake,
} from "lucide-react";

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    employeeId: "",
    email: "",
    password: "Password123!",
    fullName: "",
    jobTitle: "",
    role: "EXECUTIVE" as Role,
    departmentId: "",
    teamId: "",
    managerId: "",
    teamLeadId: "",
    dateOfBirth: "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Edit User Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    fullName: "",
    jobTitle: "",
    role: "EXECUTIVE" as Role,
    departmentId: "",
    managerId: "",
    teamLeadId: "",
    dateOfBirth: "",
  });

  // CSV Import Modal
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState(
    `EmployeeID,Email,FullName,JobTitle,Role\nEMP101,john.doe@worktrack.company,John Doe,QA Engineer,EXECUTIVE\nEMP102,jane.smith@worktrack.company,Jane Smith,Senior SRE,TEAM_LEAD`
  );
  const [csvLoading, setCsvLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadOrgData();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/users");
      if (res.success) setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrgData = async () => {
    try {
      const [dRes, tRes]: any = await Promise.all([api.get("/departments"), api.get("/teams")]);
      if (dRes.success) setDepartments(dRes.data || []);
      if (tRes.success) setTeams(tRes.data || []);
    } catch {
      // Ignored
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.post("/users", {
        ...createData,
        departmentId: createData.departmentId || null,
        managerId: createData.managerId || null,
        teamLeadId: createData.teamLeadId || null,
        teamId: createData.teamId || null,
        dateOfBirth: createData.dateOfBirth || null,
      });
      setShowCreateModal(false);
      setCreateData({
        employeeId: "",
        email: "",
        password: "Password123!",
        fullName: "",
        jobTitle: "",
        role: "EXECUTIVE",
        departmentId: "",
        teamId: "",
        managerId: "",
        teamLeadId: "",
        dateOfBirth: "",
      });
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.put(`/users/${selectedUser.id}`, {
        ...editData,
        departmentId: editData.departmentId || null,
        managerId: editData.managerId || null,
        teamLeadId: editData.teamLeadId || null,
        dateOfBirth: editData.dateOfBirth || null,
      });
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update user");
    }
  };

  const handleToggleStatus = async (userObj: User) => {
    const action = userObj.isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} ${userObj.fullName}?`)) return;

    try {
      await api.patch(`/users/${userObj.id}/status`, { isActive: !userObj.isActive });
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update user status");
    }
  };

  const handleImportCsv = async () => {
    setCsvLoading(true);
    try {
      const res: any = await api.post("/users/import-csv", { csvText });
      alert(res.message);
      setShowCsvModal(false);
      loadUsers();
    } catch (err: any) {
      alert(err.message || "CSV Import failed");
    } finally {
      setCsvLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.employeeId.toLowerCase().includes(q) ||
      u.jobTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            User Accounts & Role Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Super Admin console for user provisioning, reporting assignments, role updates, and bulk CSV onboarding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCsvModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Bulk CSV Import
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Create User
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, email, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
        </div>
        <span className="text-slate-400 font-medium">{filtered.length} users registered</span>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Employee</th>
                  <th className="px-6 py-3.5 font-bold">Role</th>
                  <th className="px-6 py-3.5 font-bold">Department</th>
                  <th className="px-6 py-3.5 font-bold">Reporting Lines</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {u.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {u.employeeId} • {u.email}
                      </div>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {u.jobTitle}
                      </div>
                      {u.dateOfBirth && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                          <Cake className="w-3 h-3" />
                          <span>Birthday: {new Date(u.dateOfBirth).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.role} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {u.department?.name || "None"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <div>Lead: {u.teamLead?.fullName || "—"}</div>
                      <div>Mgr: {u.manager?.fullName || "—"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                          u.isActive ? "text-emerald-600" : "text-rose-500"
                        }`}
                      >
                        {u.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setEditData({
                              fullName: u.fullName,
                              jobTitle: u.jobTitle,
                              role: u.role,
                              departmentId: u.departmentId || "",
                              managerId: u.managerId || "",
                              teamLeadId: u.teamLeadId || "",
                              dateOfBirth: u.dateOfBirth ? u.dateOfBirth.split("T")[0] : "",
                            });
                            setShowEditModal(true);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1 rounded ${
                            u.isActive
                              ? "text-rose-500 hover:bg-rose-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={u.isActive ? "Deactivate User" : "Activate User"}
                        >
                          {u.isActive ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Employee Account"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Employee ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. EMP042"
                value={createData.employeeId}
                onChange={(e) => setCreateData({ ...createData, employeeId: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Official Email *</label>
              <input
                type="email"
                required
                placeholder="name@worktrack.company"
                value={createData.email}
                onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="First & Last Name"
                value={createData.fullName}
                onChange={(e) => setCreateData({ ...createData, fullName: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Cloud Security Architect"
                value={createData.jobTitle}
                onChange={(e) => setCreateData({ ...createData, jobTitle: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Role *</label>
              <select
                value={createData.role}
                onChange={(e) => setCreateData({ ...createData, role: e.target.value as Role })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="EXECUTIVE">Executive (Employee)</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="MANAGER">Manager</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Department</label>
              <select
                value={createData.departmentId}
                onChange={(e) => setCreateData({ ...createData, departmentId: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="">-- None --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Assigned Team Lead</label>
              <select
                value={createData.teamLeadId}
                onChange={(e) => setCreateData({ ...createData, teamLeadId: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="">-- None --</option>
                {users
                  .filter((u) => u.role === "TEAM_LEAD")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.department?.name})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Assigned Manager</label>
              <select
                value={createData.managerId}
                onChange={(e) => setCreateData({ ...createData, managerId: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="">-- None --</option>
                {users
                  .filter((u) => u.role === "MANAGER" || u.role === "SUPER_ADMIN")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Birthday / Date of Birth Section */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Cake className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Birthday & Automated Celebrations</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              On the employee's birthday, WorkTrack automatically publishes a company-wide celebration announcement and delivers personalized celebratory wishes to their inbox!
            </p>
            <div className="pt-1">
              <label className="block text-xs font-semibold mb-1 text-slate-800 dark:text-slate-200">
                Birthday (Date of Birth)
              </label>
              <input
                type="date"
                value={createData.dateOfBirth}
                onChange={(e) => setCreateData({ ...createData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit User: ${selectedUser?.fullName}`}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={editData.fullName}
                onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Job Title</label>
              <input
                type="text"
                required
                value={editData.jobTitle}
                onChange={(e) => setEditData({ ...editData, jobTitle: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Role</label>
              <select
                value={editData.role}
                onChange={(e) => setEditData({ ...editData, role: e.target.value as Role })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="EXECUTIVE">Executive</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="MANAGER">Manager</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Department</label>
              <select
                value={editData.departmentId}
                onChange={(e) => setEditData({ ...editData, departmentId: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="">-- None --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Assigned Team Lead</label>
              <select
                value={editData.teamLeadId}
                onChange={(e) => setEditData({ ...editData, teamLeadId: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="">-- None --</option>
                {users
                  .filter((u) => u.role === "TEAM_LEAD" && u.id !== selectedUser?.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Assigned Manager</label>
              <select
                value={editData.managerId}
                onChange={(e) => setEditData({ ...editData, managerId: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="">-- None --</option>
                {users
                  .filter(
                    (u) =>
                      (u.role === "MANAGER" || u.role === "SUPER_ADMIN") &&
                      u.id !== selectedUser?.id
                  )
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Birthday / Date of Birth Section */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Cake className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Birthday & Celebrations</span>
            </div>
            <div className="pt-1">
              <label className="block text-xs font-semibold mb-1 text-slate-800 dark:text-slate-200">
                Birthday (Date of Birth)
              </label>
              <input
                type="date"
                value={editData.dateOfBirth}
                onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        title="Validated Employee CSV Import"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Paste CSV formatted text with columns:{" "}
            <code className="text-indigo-600 font-bold">
              EmployeeID,Email,FullName,JobTitle,Role
            </code>
          </p>
          <textarea
            rows={8}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setShowCsvModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              disabled={csvLoading}
              onClick={handleImportCsv}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md"
            >
              {csvLoading ? "Processing..." : "Validate & Import"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

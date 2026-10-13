import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { EmployeeFlowModal } from "../components/EmployeeFlowModal";
import { User, Department } from "../types";
import { Search, Download, UserCheck, GitBranch } from "lucide-react";

export const DirectoryPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFlowModal, setShowFlowModal] = useState(false);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    loadDirectory();
  }, [deptFilter, roleFilter]);

  const loadDirectory = async () => {
    setLoading(true);
    try {
      let q = "flow=true&";
      if (deptFilter) q += `departmentId=${deptFilter}&`;
      if (roleFilter) q += `role=${roleFilter}&`;
      const [uRes, dRes]: any = await Promise.all([
        api.get(`/users?${q}`),
        api.get("/departments"),
      ]);
      if (uRes.success) setUsers(uRes.data || []);
      if (dRes.success) setDepartments(dRes.data || []);
    } catch (err) {
      console.error("Failed to load directory:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const token = localStorage.getItem("worktrack_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/users/export-csv", {
        headers,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Export not allowed for your role");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `employee_directory.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || "Export failed");
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
            Employee Directory & Hierarchy
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse company employees, reporting lines, departments, and roles within your scope.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFlowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <GitBranch className="w-4 h-4" /> View Employee Flow
          </button>
          {user?.role !== "EXECUTIVE" && (
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Directory CSV
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="TEAM_LEAD">Team Lead</option>
            <option value="EXECUTIVE">Executive</option>
          </select>
        </div>

        <span className="text-slate-400 font-medium">Found {filtered.length} employees</span>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
                  <th className="px-6 py-3.5 font-bold">Assigned Team Lead</th>
                  <th className="px-6 py-3.5 font-bold">Assigned Manager</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {emp.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {emp.employeeId} • {emp.email}
                      </div>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {emp.jobTitle}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={emp.role} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {emp.department?.name || "None"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {emp.teamLead?.fullName || "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {emp.manager?.fullName || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                          emp.isActive ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EmployeeFlowModal
        isOpen={showFlowModal}
        onClose={() => setShowFlowModal(false)}
      />
    </div>
  );
};

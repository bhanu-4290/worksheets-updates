import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { EmployeeFlowModal } from "../components/EmployeeFlowModal";
import { User, Department } from "../types";
import { Link } from "react-router-dom";
import {
  Search,
  Download,
  UserCheck,
  GitBranch,
  LayoutGrid,
  List,
  Mail,
  Cake,
  Building2,
  Users,
  MessageSquare,
  Shield,
  RotateCcw,
} from "lucide-react";

export const DirectoryPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

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

  const handleClearFilters = () => {
    setSearch("");
    setDeptFilter("");
    setRoleFilter("");
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300";
      case "MANAGER":
        return "bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300";
      case "TEAM_LEAD":
        return "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300";
      default:
        return "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300";
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Employee Directory &amp; Roster
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified MATRIX employee profiles, designations, assigned departments, and reporting supervisors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="People Grid with Avatars"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Data Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowFlowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <GitBranch className="w-3.5 h-3.5" /> View Flow
          </button>
          {user?.role !== "EXECUTIVE" && (
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 sm:w-64"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
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
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin (Yellow)</option>
            <option value="MANAGER">Manager (Orange)</option>
            <option value="TEAM_LEAD">Team Lead (Green)</option>
            <option value="EXECUTIVE">Executive (Green)</option>
          </select>

          {(search || deptFilter || roleFilter) && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <span className="text-slate-400 font-medium text-[11px]">
          Showing {filtered.length} of {users.length} verified staff
        </span>
      </div>

      {/* Directory Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-md animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        /* Useful Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No employees match your criteria
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            No employee records match "{search || deptFilter || roleFilter}". Try resetting your search filters to view the full MATRIX roster.
          </p>
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Search Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ======================================================== */
        /* GRID OF PEOPLE WITH AVATARS */
        /* ======================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filtered.map((emp) => {
            const initials = emp.fullName
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .slice(0, 2)
              .join("");

            return (
              <div
                key={emp.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {/* Avatar */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-2xs ${getRoleColor(
                          emp.role
                        )}`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {emp.fullName}
                        </h3>
                        <span className="font-mono text-[10px] text-slate-400 block">
                          {emp.employeeId}
                        </span>
                      </div>
                    </div>

                    <Badge variant={emp.role} size="sm" />
                  </div>

                  <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 line-clamp-1 mb-2">
                    {emp.jobTitle}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.department?.name || "General"}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>

                    {emp.dateOfBirth && (
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 text-[10px] font-medium">
                        <Cake className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>Birthday on file</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reporting supervisor footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 truncate">
                    Supervisor: {emp.manager?.fullName || emp.teamLead?.fullName || "Aditya (Director)"}
                  </span>
                  <Link
                    to="/chat"
                    className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                    title={`Message ${emp.fullName}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ======================================================== */
        /* DATA TABLE VIEW */
        /* ======================================================== */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Assigned Team Lead</th>
                  <th className="px-4 py-3">Assigned Manager</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {emp.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {emp.employeeId} • {emp.email}
                      </div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                        {emp.jobTitle}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.role} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {emp.department?.name || "None"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {emp.teamLead?.fullName || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {emp.manager?.fullName || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                          emp.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
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

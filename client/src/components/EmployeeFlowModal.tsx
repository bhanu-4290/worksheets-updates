import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { User } from "../types";
import { useNavigate } from "react-router-dom";
import {
  X,
  Users,
  Search,
  MessageSquare,
  UserPlus,
  Building2,
  GitBranch,
  ArrowDown,
  Cake,
  RefreshCw,
} from "lucide-react";

interface EmployeeFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ManagerBranch {
  manager: User;
  teamLeads: User[];
  executives: User[];
}

interface SuperAdminTree {
  admin: User;
  branches: ManagerBranch[];
  directLeads: User[];
  directExecutives: User[];
}

export const EmployeeFlowModal: React.FC<EmployeeFlowModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
    }
  }, [isOpen]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/users?status=active&flow=true");
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load employee flow:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeUsers = users.filter((u) => u.isActive !== false);

  // Filter matching search for highlighting
  const matchesSearch = (u: User) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.jobTitle.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.department?.name && u.department.name.toLowerCase().includes(q))
    );
  };

  // Build hierarchical flow structure
  const buildHierarchy = (): SuperAdminTree[] => {
    const superAdmins = activeUsers.filter((u) => u.role === "SUPER_ADMIN");
    const managers = activeUsers.filter((u) => u.role === "MANAGER");
    const teamLeads = activeUsers.filter((u) => u.role === "TEAM_LEAD");
    const executives = activeUsers.filter((u) => u.role === "EXECUTIVE");

    const placedLeadIds = new Set<string>();
    const placedExecIds = new Set<string>();
    const placedManagerIds = new Set<string>();

    // Helper to build a ManagerBranch
    const buildManagerBranch = (mgr: User): ManagerBranch => {
      placedManagerIds.add(mgr.id);

      // Executives reporting to this manager directly
      const directMgrExecs = executives.filter((e) => e.managerId === mgr.id);

      // Team leads linked to this manager (via managerId, or manager's teamLeadId, or via executives under this manager)
      const branchLeads = teamLeads.filter((tl) => {
        if (placedLeadIds.has(tl.id)) return false;
        if (tl.managerId === mgr.id) return true;
        if (mgr.teamLeadId === tl.id) return true;
        if (directMgrExecs.some((e) => e.teamLeadId === tl.id)) return true;
        if (
          tl.departmentId &&
          tl.departmentId === mgr.departmentId &&
          !tl.managerId
        ) {
          return true;
        }
        return false;
      });

      branchLeads.forEach((tl) => placedLeadIds.add(tl.id));
      const branchLeadIds = new Set(branchLeads.map((tl) => tl.id));

      // Executives belonging to this manager or any of this manager's team leads
      const branchExecs = executives.filter((e) => {
        if (placedExecIds.has(e.id)) return false;
        if (e.managerId === mgr.id) return true;
        if (e.teamLeadId && branchLeadIds.has(e.teamLeadId)) return true;
        if (
          e.departmentId &&
          e.departmentId === mgr.departmentId &&
          !e.managerId
        ) {
          return true;
        }
        return false;
      });

      branchExecs.forEach((e) => placedExecIds.add(e.id));

      return {
        manager: mgr,
        teamLeads: branchLeads,
        executives: branchExecs,
      };
    };

    // If no SUPER_ADMIN exists, create a virtual root
    const roots: User[] =
      superAdmins.length > 0
        ? superAdmins
        : [
            {
              id: "org-root",
              employeeId: "ORG",
              email: "",
              fullName: "Organization Head",
              jobTitle: "Corporate Hierarchy",
              role: "SUPER_ADMIN",
              joiningDate: new Date().toISOString(),
              isActive: true,
            },
          ];

    const trees: SuperAdminTree[] = roots.map((admin) => {
      // Find managers explicitly reporting to this Super Admin
      const adminManagers = managers.filter(
        (m) => !placedManagerIds.has(m.id) && m.managerId === admin.id
      );

      const branches = adminManagers.map((m) => buildManagerBranch(m));

      return {
        admin,
        branches,
        directLeads: [],
        directExecutives: [],
      };
    });

    // Attach any remaining unplaced managers to the first Super Admin tree
    const remainingManagers = managers.filter((m) => !placedManagerIds.has(m.id));
    if (remainingManagers.length > 0 && trees.length > 0) {
      remainingManagers.forEach((m) => {
        trees[0].branches.push(buildManagerBranch(m));
      });
    }

    // Attach any remaining unplaced team leads & executives
    const unplacedLeads = teamLeads.filter((tl) => !placedLeadIds.has(tl.id));
    const unplacedExecs = executives.filter((e) => !placedExecIds.has(e.id));

    if (trees.length > 0) {
      // Check if any unplaced lead/exec reports directly to a specific Super Admin
      trees.forEach((tree) => {
        const dLeads = unplacedLeads.filter(
          (tl) => !placedLeadIds.has(tl.id) && tl.managerId === tree.admin.id
        );
        dLeads.forEach((tl) => placedLeadIds.add(tl.id));

        const dExecs = unplacedExecs.filter(
          (e) =>
            !placedExecIds.has(e.id) &&
            (e.managerId === tree.admin.id ||
              dLeads.some((dl) => dl.id === e.teamLeadId))
        );
        dExecs.forEach((e) => placedExecIds.add(e.id));

        tree.directLeads.push(...dLeads);
        tree.directExecutives.push(...dExecs);
      });

      // Any still unplaced go into the first tree's direct pool or first branch
      const stillUnplacedLeads = teamLeads.filter(
        (tl) => !placedLeadIds.has(tl.id)
      );
      const stillUnplacedExecs = executives.filter(
        (e) => !placedExecIds.has(e.id)
      );

      if (stillUnplacedLeads.length > 0 || stillUnplacedExecs.length > 0) {
        trees[0].directLeads.push(...stillUnplacedLeads);
        trees[0].directExecutives.push(...stillUnplacedExecs);
      }
    }

    return trees;
  };

  const hierarchyTrees = buildHierarchy();

  const counts = {
    total: activeUsers.length,
    admins: activeUsers.filter((u) => u.role === "SUPER_ADMIN").length,
    managers: activeUsers.filter((u) => u.role === "MANAGER").length,
    leads: activeUsers.filter((u) => u.role === "TEAM_LEAD").length,
    executives: activeUsers.filter((u) => u.role === "EXECUTIVE").length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-300 shrink-0">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">
                  Organization Employee Flow Chart
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200">
                  {counts.total} Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Live visual reporting hierarchy: Super Admin → Managers → Team Leads (DC) → Executives (L1/L2)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={loadEmployees}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
              title="Refresh Flow Chart"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onClose();
                navigate("/admin/users");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" /> Manage Users
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/80 text-slate-200 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend & Filter Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Color Legend matching user's diagram */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 mr-1">
              Hierarchy Legend:
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-300/90 text-slate-900 font-bold border border-yellow-500 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              Super Admin ({counts.admins})
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-200 dark:bg-orange-900/70 text-orange-950 dark:text-orange-100 font-bold border border-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-600" />
              Manager ({counts.managers})
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-100 font-bold border border-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              DC / Team Lead ({counts.leads})
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-200 dark:bg-sky-900/70 text-sky-950 dark:text-sky-100 font-bold border border-sky-400">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              L1 / L2 Executive ({counts.executives})
            </span>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find employee in flow..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Main Flowchart Canvas */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100/70 dark:bg-slate-950/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-slate-500">
                Building employee hierarchy flow...
              </span>
            </div>
          ) : activeUsers.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              No active employees found.
            </div>
          ) : (
            <div className="space-y-12 min-w-max mx-auto pb-6">
              {hierarchyTrees.map((tree) => {
                const totalSubordinates =
                  tree.branches.reduce(
                    (acc, b) =>
                      acc + 1 + b.teamLeads.length + b.executives.length,
                    0
                  ) +
                  tree.directLeads.length +
                  tree.directExecutives.length;

                const hasDirectPool =
                  tree.directLeads.length > 0 ||
                  tree.directExecutives.length > 0;

                const totalColumns =
                  tree.branches.length + (hasDirectPool ? 1 : 0);

                return (
                  <div
                    key={tree.admin.id}
                    className="flex flex-col items-center bg-white dark:bg-slate-900/90 border-2 border-slate-300 dark:border-slate-800 rounded-3xl p-6 shadow-sm"
                  >
                    {/* ==========================================
                        TIER 1: SUPER ADMIN (YELLOW BOX)
                       ========================================== */}
                    <div
                      className={`relative group min-w-[220px] max-w-xs px-5 py-3.5 rounded-2xl bg-yellow-300 dark:bg-yellow-400 text-slate-950 border-2 border-slate-800 shadow-md text-center transition-all ${
                        !matchesSearch(tree.admin) ? "opacity-35" : ""
                      }`}
                    >
                      <div className="text-sm font-extrabold tracking-tight flex items-center justify-center gap-1.5">
                        <span>
                          {tree.admin.fullName} ({tree.branches.length || totalSubordinates})
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-800 mt-0.5">
                        {tree.admin.jobTitle}
                      </div>
                      {tree.admin.department?.name && (
                        <div className="text-[10px] font-medium text-slate-700 mt-0.5">
                          ({tree.admin.department.name})
                        </div>
                      )}
                      {tree.admin.id !== "org-root" && (
                        <button
                          onClick={() => {
                            onClose();
                            navigate(`/chat?user=${tree.admin.id}`);
                          }}
                          className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 text-[10px] font-bold transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" /> Message
                        </button>
                      )}
                    </div>

                    {/* Connector from Super Admin to Manager Columns */}
                    {totalColumns > 0 && (
                      <div className="flex flex-col items-center w-full">
                        {/* Vertical stem from Super Admin */}
                        <div className="w-0.5 h-7 bg-slate-700 dark:bg-slate-400" />

                        {/* Horizontal distribution bar */}
                        {totalColumns > 1 && (
                          <div className="w-[88%] h-0.5 bg-slate-700 dark:bg-slate-400" />
                        )}

                        {/* Columns Row */}
                        <div className="flex items-start justify-center gap-5 pt-0 w-full">
                          {/* ==========================================
                              TIER 2: MANAGER BRANCHES (ORANGE BOXES)
                             ========================================== */}
                          {tree.branches.map((branch) => {
                            const branchCount =
                              branch.teamLeads.length +
                              branch.executives.length;

                            return (
                              <div
                                key={branch.manager.id}
                                className="flex flex-col items-center w-64 shrink-0"
                              >
                                {/* Downward arrow stem into Manager box */}
                                <div className="w-0.5 h-5 bg-slate-700 dark:bg-slate-400" />
                                <ArrowDown className="w-4 h-4 -mt-1.5 text-slate-700 dark:text-slate-400" />

                                {/* ORANGE BOX: MANAGER */}
                                <div
                                  className={`w-full p-3.5 rounded-2xl bg-orange-200/95 dark:bg-orange-950/80 border-2 border-orange-500/80 text-slate-900 dark:text-orange-100 shadow-xs text-center transition-all ${
                                    !matchesSearch(branch.manager)
                                      ? "opacity-35"
                                      : ""
                                  }`}
                                >
                                  <div className="font-extrabold text-sm">
                                    {branch.manager.fullName} ({branchCount})
                                  </div>
                                  <div className="text-[11px] font-medium text-slate-700 dark:text-orange-200/90 mt-0.5">
                                    ({branch.manager.department?.name || branch.manager.jobTitle})
                                  </div>
                                  <div className="text-[10px] text-slate-600 dark:text-orange-300/70 mt-0.5">
                                    {branch.manager.jobTitle}
                                  </div>

                                  <div className="mt-2 flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        onClose();
                                        navigate(`/chat?user=${branch.manager.id}`);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/20 hover:bg-orange-500/30 text-orange-950 dark:text-orange-200 text-[10px] font-bold transition-colors"
                                    >
                                      <MessageSquare className="w-2.5 h-2.5" /> Chat
                                    </button>
                                  </div>
                                </div>

                                {/* ==========================================
                                    TIER 3: GREEN BOX (DC / TEAM LEADS)
                                   ========================================== */}
                                {branch.teamLeads.length > 0 && (
                                  <>
                                    <div className="w-0.5 h-3 bg-slate-400 dark:bg-slate-600" />
                                    <div className="w-full p-3 rounded-xl bg-emerald-100/95 dark:bg-emerald-950/70 border-2 border-emerald-500/70 text-slate-900 dark:text-emerald-100 shadow-2xs text-center">
                                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1">
                                        DC / Team Lead
                                      </div>
                                      <div className="space-y-1.5">
                                        {branch.teamLeads.map((tl) => (
                                          <div
                                            key={tl.id}
                                            className={`p-1.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-emerald-300/60 dark:border-emerald-800/60 flex items-center justify-between gap-2 text-left ${
                                              !matchesSearch(tl)
                                                ? "opacity-35"
                                                : ""
                                            }`}
                                          >
                                            <div className="min-w-0">
                                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                {tl.fullName}
                                              </div>
                                              <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                                                {tl.jobTitle}
                                              </div>
                                            </div>
                                            <button
                                              onClick={() => {
                                                onClose();
                                                navigate(`/chat?user=${tl.id}`);
                                              }}
                                              className="p-1 rounded hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0"
                                              title={`Message ${tl.fullName}`}
                                            >
                                              <MessageSquare className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* ==========================================
                                    TIER 4: BLUE BOX (L1 / L2 EXECUTIVES)
                                   ========================================== */}
                                {branch.executives.length > 0 && (
                                  <>
                                    <div className="w-0.5 h-3 bg-slate-400 dark:bg-slate-600" />
                                    <div className="w-full p-3.5 rounded-2xl bg-sky-200/90 dark:bg-sky-950/70 border-2 border-sky-500/80 text-slate-900 dark:text-sky-100 shadow-2xs text-center">
                                      <div className="text-xs font-extrabold uppercase tracking-wider text-sky-900 dark:text-sky-300 mb-2">
                                        L1 / Executives ({branch.executives.length})
                                      </div>
                                      <div className="space-y-1.5">
                                        {branch.executives.map((exec) => (
                                          <div
                                            key={exec.id}
                                            className={`p-2 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-sky-300/70 dark:border-sky-800/70 flex items-center justify-between gap-2 text-left ${
                                              !matchesSearch(exec)
                                                ? "opacity-35"
                                                : ""
                                            }`}
                                          >
                                            <div className="min-w-0">
                                              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                                                <span>{exec.fullName}</span>
                                                {exec.dateOfBirth && (
                                                  <span
                                                    title={`Birthday: ${new Date(
                                                      exec.dateOfBirth
                                                    ).toLocaleDateString(
                                                      undefined,
                                                      {
                                                        month: "short",
                                                        day: "numeric",
                                                      }
                                                    )}`}
                                                  >
                                                    <Cake className="w-3 h-3 text-amber-500 shrink-0" />
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                                                {exec.jobTitle}
                                              </div>
                                            </div>
                                            <button
                                              onClick={() => {
                                                onClose();
                                                navigate(`/chat?user=${exec.id}`);
                                              }}
                                              className="p-1 rounded hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 shrink-0"
                                              title={`Message ${exec.fullName}`}
                                            >
                                              <MessageSquare className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}

                          {/* Direct / Unassigned Branch under Super Admin if any */}
                          {hasDirectPool && (
                            <div className="flex flex-col items-center w-64 shrink-0">
                              <div className="w-0.5 h-5 bg-slate-700 dark:bg-slate-400" />
                              <ArrowDown className="w-4 h-4 -mt-1.5 text-slate-700 dark:text-slate-400" />

                              <div className="w-full p-3 rounded-2xl bg-slate-200/90 dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-center">
                                <div className="font-bold text-xs">
                                  Direct / Unassigned Pool (
                                  {tree.directLeads.length +
                                    tree.directExecutives.length}
                                  )
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  Reporting directly to Admin
                                </div>
                              </div>

                              {tree.directLeads.length > 0 && (
                                <>
                                  <div className="w-0.5 h-3 bg-slate-400" />
                                  <div className="w-full p-3 rounded-xl bg-emerald-100/95 dark:bg-emerald-950/70 border-2 border-emerald-500/70 text-center">
                                    <div className="text-[11px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300 mb-1">
                                      Team Leads
                                    </div>
                                    <div className="space-y-1.5">
                                      {tree.directLeads.map((tl) => (
                                        <div
                                          key={tl.id}
                                          className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/60 text-left flex items-center justify-between"
                                        >
                                          <div>
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                                              {tl.fullName}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                              {tl.jobTitle}
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => {
                                              onClose();
                                              navigate(`/chat?user=${tl.id}`);
                                            }}
                                            className="p-1 text-emerald-700"
                                          >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}

                              {tree.directExecutives.length > 0 && (
                                <>
                                  <div className="w-0.5 h-3 bg-slate-400" />
                                  <div className="w-full p-3.5 rounded-2xl bg-sky-200/90 dark:bg-sky-950/70 border-2 border-sky-500/80 text-center">
                                    <div className="text-xs font-extrabold uppercase text-sky-900 dark:text-sky-300 mb-2">
                                      Executives ({tree.directExecutives.length})
                                    </div>
                                    <div className="space-y-1.5">
                                      {tree.directExecutives.map((exec) => (
                                        <div
                                          key={exec.id}
                                          className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/70 text-left flex items-center justify-between"
                                        >
                                          <div>
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                                              {exec.fullName}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                              {exec.jobTitle}
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => {
                                              onClose();
                                              navigate(`/chat?user=${exec.id}`);
                                            }}
                                            className="p-1 text-sky-700"
                                          >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

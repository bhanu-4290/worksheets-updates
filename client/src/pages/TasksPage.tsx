import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { Task, TaskPriority, TaskStatus, Project, Department } from "../types";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Eye,
  UserPlus,
  Users,
  ShieldCheck,
  Check,
} from "lucide-react";

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Create Task Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    projectId: "",
    departmentId: "",
    assignedTeamLeadId: "",
    assignedUserIds: [] as string[],
    priority: "MEDIUM" as TaskPriority,
    startDate: "",
    dueDate: "",
    estimatedHours: "",
  });

  const [createLoading, setCreateLoading] = useState(false);

  // Quick Assign / Delegate Modal State
  const [assignModalTask, setAssignModalTask] = useState<Task | null>(null);
  const [assignSelectedUserIds, setAssignSelectedUserIds] = useState<string[]>([]);
  const [assignSelectedTlId, setAssignSelectedTlId] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);

  const isManagerOrAdmin = user?.role === "MANAGER" || user?.role === "SUPER_ADMIN";
  const isTeamLead = user?.role === "TEAM_LEAD";
  const canManageAssignments = isManagerOrAdmin || isTeamLead;

  useEffect(() => {
    loadTasks();
    if (user?.role !== "EXECUTIVE") {
      loadFormData();
    }
  }, [statusFilter, priorityFilter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      let query = "";
      if (statusFilter) query += `status=${statusFilter}&`;
      if (priorityFilter) query += `priority=${priorityFilter}&`;
      const res: any = await api.get(`/tasks?${query}`);
      if (res.success) setTasks(res.data || []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [pRes, dRes, uRes]: any = await Promise.all([
        api.get("/projects"),
        api.get("/departments"),
        api.get("/users?status=active&flow=true"),
      ]);
      const pList = pRes.success ? pRes.data || [] : [];
      const dList = dRes.success ? dRes.data || [] : [];
      const uList = uRes.success ? uRes.data || [] : [];

      setProjects(pList);
      setDepartments(dList);
      setUsersList(uList);

      setNewTask((prev) => ({
        ...prev,
        departmentId: prev.departmentId || user?.departmentId || (dList[0]?.id ?? ""),
        projectId: prev.projectId || (pList[0]?.id ?? ""),
      }));
    } catch {
      // Ignored
    }
  };

  // Filtered role lists for assignment
  const teamLeadsList = usersList
    .filter((u) => u.role === "TEAM_LEAD")
    .sort((a, b) => {
      const aDirect = a.reportingManagerId === user?.id || a.managerId === user?.id ? -1 : 1;
      const bDirect = b.reportingManagerId === user?.id || b.managerId === user?.id ? -1 : 1;
      return aDirect - bDirect;
    });

  const executivesList = usersList
    .filter((u) => u.role === "EXECUTIVE")
    .sort((a, b) => {
      const aDirect =
        a.reportingManagerId === user?.id ||
        a.teamLeadId === user?.id ||
        a.managerId === user?.id
          ? -1
          : 1;
      const bDirect =
        b.reportingManagerId === user?.id ||
        b.teamLeadId === user?.id ||
        b.managerId === user?.id
          ? -1
          : 1;
      return aDirect - bDirect;
    });

  const toggleCreateAssignee = (userId: string, role?: string) => {
    setNewTask((prev) => {
      const exists = prev.assignedUserIds.includes(userId);
      const updatedIds = exists
        ? prev.assignedUserIds.filter((id) => id !== userId)
        : [...prev.assignedUserIds, userId];

      let updatedTlId = prev.assignedTeamLeadId;
      if (role === "TEAM_LEAD") {
        if (!exists && !updatedTlId) {
          updatedTlId = userId;
        } else if (exists && updatedTlId === userId) {
          updatedTlId = "";
        }
      }

      return {
        ...prev,
        assignedUserIds: updatedIds,
        assignedTeamLeadId: updatedTlId,
      };
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.assignedUserIds.length === 0 && !newTask.assignedTeamLeadId) {
      alert(
        isTeamLead
          ? "Please select at least one Executive to assign this task to."
          : "Please select at least one Team Lead or Executive to assign this task to."
      );
      return;
    }

    setCreateLoading(true);
    try {
      const finalAssignees = Array.from(
        new Set([
          ...newTask.assignedUserIds,
          ...(newTask.assignedTeamLeadId ? [newTask.assignedTeamLeadId] : []),
        ])
      );

      await api.post("/tasks", {
        ...newTask,
        assignedTeamLeadId: newTask.assignedTeamLeadId || (isTeamLead ? user?.id : null),
        assignedUserIds: finalAssignees,
        estimatedHours: newTask.estimatedHours ? parseFloat(newTask.estimatedHours) : undefined,
      });
      setShowCreateModal(false);
      setNewTask({
        title: "",
        description: "",
        projectId: projects[0]?.id || "",
        departmentId: user?.departmentId || departments[0]?.id || "",
        assignedTeamLeadId: "",
        assignedUserIds: [],
        priority: "MEDIUM",
        startDate: "",
        dueDate: "",
        estimatedHours: "",
      });
      loadTasks();
    } catch (err: any) {
      alert(err.message || "Failed to create task");
    } finally {
      setCreateLoading(false);
    }
  };

  const openAssignModal = (task: Task) => {
    setAssignModalTask(task);
    const currentIds = (task.assignees || []).map((a) => a.id);
    // If a Team Lead opens the modal to delegate to an Executive, pre-select only Executive assignees so the TL can cleanly pick Executives
    if (isTeamLead) {
      const execIds = (task.assignees || [])
        .filter((a: any) => a.role === "EXECUTIVE")
        .map((a) => a.id);
      setAssignSelectedUserIds(execIds);
      setAssignSelectedTlId(user?.id || "");
    } else {
      setAssignSelectedUserIds(currentIds);
      setAssignSelectedTlId((task as any).teamLead?.id || task.assignedTeamLeadId || "");
    }
  };

  const toggleModalAssignee = (userId: string, role?: string) => {
    setAssignSelectedUserIds((prev) => {
      const exists = prev.includes(userId);
      const next = exists ? prev.filter((id) => id !== userId) : [...prev, userId];
      if (role === "TEAM_LEAD") {
        if (!exists && !assignSelectedTlId) setAssignSelectedTlId(userId);
        if (exists && assignSelectedTlId === userId) setAssignSelectedTlId("");
      }
      return next;
    });
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalTask) return;

    const finalIds = Array.from(
      new Set([
        ...assignSelectedUserIds,
        ...(isManagerOrAdmin && assignSelectedTlId ? [assignSelectedTlId] : []),
      ])
    );

    if (finalIds.length === 0) {
      alert(
        isTeamLead
          ? "Please select at least one Executive to assign this task to."
          : "Please select at least one Team Lead or Executive."
      );
      return;
    }

    setAssignLoading(true);
    try {
      await api.put(`/tasks/${assignModalTask.id}`, {
        assignedUserIds: finalIds,
        assignedTeamLeadId: isTeamLead ? user?.id : assignSelectedTlId || null,
      });
      setAssignModalTask(null);
      loadTasks();
    } catch (err: any) {
      alert(err.message || "Failed to update task assignment");
    } finally {
      setAssignLoading(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.taskCode.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  });

  const kanbanColumns: { status: TaskStatus; label: string }[] = [
    { status: "TO_DO", label: "To Do" },
    { status: "IN_PROGRESS", label: "In Progress" },
    { status: "BLOCKED", label: "Blocked" },
    { status: "IN_REVIEW", label: "In Review" },
    { status: "COMPLETED", label: "Completed" },
  ];

  const handleQuickStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Task Management Board
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isManagerOrAdmin
              ? "Manager Power: Create & assign tasks to Team Leads (TL) and Executives."
              : isTeamLead
              ? "Team Lead Power: Assign & delegate tasks directly to Executives."
              : "Track and update tasks assigned to you."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {canManageAssignments && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />{" "}
              {isTeamLead ? "Create & Assign to Executive" : "Create & Assign Task"}
            </button>
          )}
        </div>
      </div>

      {/* Role Hierarchy Assignment Banner */}
      {canManageAssignments && (
        <div
          className={`rounded-lg px-4 py-3 border flex flex-wrap items-center justify-between gap-3 text-xs ${
            isManagerOrAdmin
              ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
              : "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              {isManagerOrAdmin ? (
                <>
                  <strong>Manager Assignment Authority:</strong> You can assign tasks to{" "}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] mx-0.5">
                    TEAM LEADS (TL)
                  </span>{" "}
                  and{" "}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-800 dark:text-blue-300 font-bold text-[10px] mx-0.5">
                    EXECUTIVES
                  </span>
                  .
                </>
              ) : (
                <>
                  <strong>Team Lead Assignment Authority:</strong> You can assign or delegate tasks directly to{" "}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-800 dark:text-blue-300 font-bold text-[10px] mx-0.5">
                    EXECUTIVES
                  </span>
                  .
                </>
              )}
            </span>
          </div>
          <span className="text-[11px] opacity-80">
            Click <strong>"Assign"</strong> on any task card below to assign or delegate.
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="TO_DO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <span className="text-slate-400 font-medium">
          Showing {filteredTasks.length} tasks
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-md animate-spin" />
        </div>
      ) : viewMode === "kanban" ? (
        /* ======================================================== */
        /* KANBAN BOARD VIEW */
        /* ======================================================== */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-3.5 flex flex-col min-h-[500px]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    {col.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-lg p-3.5 shadow-sm hover:shadow-md transition-shadow space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          {task.taskCode}
                        </span>
                        <Badge variant={task.priority} size="sm" />
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                        <Link to={`/tasks/${task.id}`} className="hover:text-blue-600">
                          {task.title}
                        </Link>
                      </h4>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {task.description}
                      </p>

                      {/* Assignees & Supervising TL Display */}
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/70 space-y-1.5">
                        {task.teamLead && (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">TL:</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
                              {task.teamLead.fullName}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {task.assignees && task.assignees.length > 0 ? (
                            task.assignees.map((a: any) => (
                              <span
                                key={a.id}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  a.role === "TEAM_LEAD"
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                    : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                                }`}
                              >
                                {a.fullName} ({a.role === "TEAM_LEAD" ? "TL" : "Exec"})
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-500">
                        <span>{task.project?.code}</span>
                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-1 font-medium ${
                              task.isOverdue ? "text-rose-500 font-bold" : ""
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {task.dueDate.split("T")[0]}
                          </span>
                        )}
                      </div>

                      {/* Actual vs Estimated hours derived from database logs */}
                      <div className="flex items-center justify-between text-[10px] bg-slate-50 dark:bg-slate-900/40 p-1.5 rounded-lg">
                        <span>
                          Actual: {task.actualHours ? `${task.actualHours}h` : "Unreported"}
                        </span>
                        <span>Est: {task.estimatedHours ? `${task.estimatedHours}h` : "N/A"}</span>
                      </div>

                      {/* Quick Actions: Assign/Delegate + Status Move */}
                      <div className="pt-1 space-y-1.5">
                        {canManageAssignments && (
                          <button
                            type="button"
                            onClick={() => openAssignModal(task)}
                            className={`w-full py-1.5 px-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                              isTeamLead
                                ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                : "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            }`}
                          >
                            <UserPlus className="w-3 h-3" />
                            {isTeamLead ? "Assign to Executive" : "Assign to TL / Executive"}
                          </button>
                        )}

                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleQuickStatusChange(task.id, e.target.value as TaskStatus)
                          }
                          className="w-full text-[10px] py-1 px-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          <option value="TO_DO">Move to: To Do</option>
                          <option value="IN_PROGRESS">Move to: In Progress</option>
                          <option value="BLOCKED">Move to: Blocked</option>
                          <option value="IN_REVIEW">Move to: In Review</option>
                          <option value="COMPLETED">Move to: Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ======================================================== */
        /* TABLE VIEW */
        /* ======================================================== */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Code</th>
                  <th className="px-6 py-3.5 font-bold">Task Title</th>
                  <th className="px-6 py-3.5 font-bold">Project</th>
                  <th className="px-6 py-3.5 font-bold">Assignees (TL / Exec)</th>
                  <th className="px-6 py-3.5 font-bold">Priority</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold">Due Date</th>
                  <th className="px-6 py-3.5 font-bold">Actual / Est</th>
                  <th className="px-6 py-3.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {task.taskCode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {task.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        {task.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {task.project?.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {task.assignees && task.assignees.length > 0 ? (
                          task.assignees.map((a: any) => (
                            <span
                              key={a.id}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                a.role === "TEAM_LEAD"
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                              }`}
                            >
                              {a.fullName} ({a.role === "TEAM_LEAD" ? "TL" : "Exec"})
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={task.priority} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={task.status} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      {task.dueDate ? (
                        <span className={task.isOverdue ? "text-rose-500 font-bold" : ""}>
                          {task.dueDate.split("T")[0]}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px]">
                      {task.actualHours ? `${task.actualHours}h` : "Unreported"} /{" "}
                      {task.estimatedHours ? `${task.estimatedHours}h` : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {canManageAssignments && (
                          <button
                            type="button"
                            onClick={() => openAssignModal(task)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Assign
                          </button>
                        )}
                        <Link
                          to={`/tasks/${task.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CREATE TASK MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={
          isTeamLead
            ? "Create & Assign Task to Executive"
            : "Create & Assign Organizational Task"
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Complete Weekly Client Campaign Audit"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Detailed description and acceptance criteria..."
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={newTask.departmentId}
                onChange={(e) => setNewTask({ ...newTask, departmentId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Auto-select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project
              </label>
              <select
                value={newTask.projectId}
                onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Auto-select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* ======================================================== */}
          {/* ROLE-BASED ASSIGNMENT SECTION */}
          {/* ======================================================== */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-800/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {isTeamLead
                    ? "Assign to Executive(s) *"
                    : "Assign Task to Team Lead (TL) & Executive(s) *"}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                {newTask.assignedUserIds.length} Selected
              </span>
            </div>

            {/* MANAGER / SUPER_ADMIN: Can assign to TEAM_LEADs */}
            {isManagerOrAdmin && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  1. Team Leads (TL) - Click to Assign
                </label>
                {teamLeadsList.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No active Team Leads found.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                    {teamLeadsList.map((tl) => {
                      const selected =
                        newTask.assignedUserIds.includes(tl.id) ||
                        newTask.assignedTeamLeadId === tl.id;
                      return (
                        <button
                          key={tl.id}
                          type="button"
                          onClick={() => toggleCreateAssignee(tl.id, "TEAM_LEAD")}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                            selected
                              ? "bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-xs truncate">{tl.fullName}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {tl.jobTitle || "Team Lead"}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[9px]">
                              TL
                            </span>
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                                selected
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-slate-300 dark:border-slate-600"
                              }`}
                            >
                              {selected && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MANAGER / TEAM_LEAD / SUPER_ADMIN: Can assign to EXECUTIVEs */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                {isManagerOrAdmin
                  ? "2. Executives - Click to Assign"
                  : "Select Executive(s) - Click to Assign"}
              </label>
              {executivesList.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No active Executives found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {executivesList.map((exec) => {
                    const selected = newTask.assignedUserIds.includes(exec.id);
                    const isMySubordinate =
                      exec.reportingManagerId === user?.id || exec.teamLeadId === user?.id;
                    return (
                      <button
                        key={exec.id}
                        type="button"
                        onClick={() => toggleCreateAssignee(exec.id, "EXECUTIVE")}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          selected
                            ? "bg-blue-500/15 border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-xs truncate flex items-center gap-1.5">
                            <span>{exec.fullName}</span>
                            {isMySubordinate && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300 text-[9px] font-bold">
                                My Team
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {exec.jobTitle || "Executive"}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-[9px]">
                            EXEC
                          </span>
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                              selected
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {selected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={newTask.startDate}
                onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Est. Hours
              </label>
              <input
                type="number"
                step="1"
                placeholder="e.g. 16"
                value={newTask.estimatedHours}
                onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md disabled:opacity-50 cursor-pointer"
            >
              {createLoading ? "Creating & Assigning..." : "Create & Assign Task"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* QUICK ASSIGN / DELEGATE TASK MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={!!assignModalTask}
        onClose={() => setAssignModalTask(null)}
        title={
          isTeamLead
            ? `Delegate Task to Executive - ${assignModalTask?.taskCode || ""}`
            : `Assign Task to TL / Executive - ${assignModalTask?.taskCode || ""}`
        }
        maxWidth="xl"
      >
        {assignModalTask && (
          <form onSubmit={handleSaveAssignment} className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {assignModalTask.title}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                {assignModalTask.description}
              </p>
            </div>

            {isManagerOrAdmin && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Assign Team Lead (TL)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {teamLeadsList.map((tl) => {
                    const selected =
                      assignSelectedUserIds.includes(tl.id) || assignSelectedTlId === tl.id;
                    return (
                      <button
                        key={tl.id}
                        type="button"
                        onClick={() => toggleModalAssignee(tl.id, "TEAM_LEAD")}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          selected
                            ? "bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-xs truncate">{tl.fullName}</div>
                          <div className="text-[10px] text-slate-500 truncate">{tl.jobTitle}</div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[9px]">
                          {selected ? "Selected TL" : "TL"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                {isTeamLead ? "Select Executive(s) to Assign *" : "Assign Executive(s)"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {executivesList.map((exec) => {
                  const selected = assignSelectedUserIds.includes(exec.id);
                  return (
                    <button
                      key={exec.id}
                      type="button"
                      onClick={() => toggleModalAssignee(exec.id, "EXECUTIVE")}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        selected
                          ? "bg-blue-500/15 border-blue-500 text-blue-900 dark:text-blue-200"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs truncate">{exec.fullName}</div>
                        <div className="text-[10px] text-slate-500 truncate">{exec.jobTitle}</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-[9px]">
                        {selected ? "Selected EXEC" : "EXEC"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAssignModalTask(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assignLoading}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md disabled:opacity-50 cursor-pointer"
              >
                {assignLoading
                  ? "Saving..."
                  : isTeamLead
                  ? "Assign to Executive"
                  : "Save Assignment"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};


import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { Task, TaskPriority, TaskStatus, Project, Department, User } from "../types";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Eye,
  MessageSquare,
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
  const [usersList, setUsersList] = useState<User[]>([]);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    projectId: "",
    departmentId: "",
    assignedUserIds: [] as string[],
    priority: "MEDIUM" as TaskPriority,
    startDate: "",
    dueDate: "",
    estimatedHours: "",
  });

  const [createLoading, setCreateLoading] = useState(false);

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
        api.get("/users"),
      ]);
      if (pRes.success) setProjects(pRes.data || []);
      if (dRes.success) setDepartments(dRes.data || []);
      if (uRes.success) setUsersList(uRes.data || []);
    } catch {
      // Ignored
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.post("/tasks", {
        ...newTask,
        estimatedHours: newTask.estimatedHours ? parseFloat(newTask.estimatedHours) : undefined,
      });
      setShowCreateModal(false);
      setNewTask({
        title: "",
        description: "",
        projectId: "",
        departmentId: "",
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
            Independent task module. Work hours are derived strictly from recorded work entries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
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
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {user?.role !== "EXECUTIVE" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Task
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
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
                className="bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 flex flex-col min-h-[500px]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    {col.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          {task.taskCode}
                        </span>
                        <Badge variant={task.priority} size="sm" />
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                        <Link to={`/tasks/${task.id}`} className="hover:text-indigo-600">
                          {task.title}
                        </Link>
                      </h4>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {task.description}
                      </p>

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
                        <span>Est: {task.estimatedHours ? `${task.estimatedHours}h` : "—"}</span>
                      </div>

                      {/* Quick Move Selector */}
                      <div className="pt-1">
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Code</th>
                  <th className="px-6 py-3.5 font-bold">Task Title</th>
                  <th className="px-6 py-3.5 font-bold">Project</th>
                  <th className="px-6 py-3.5 font-bold">Assignees</th>
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
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
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
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {task.assignees?.map((a) => a.fullName).join(", ") || "Unassigned"}
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
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px]">
                      {task.actualHours ? `${task.actualHours}h` : "Unreported"} /{" "}
                      {task.estimatedHours ? `${task.estimatedHours}h` : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Organizational Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement SSO OAuth2 Authentication"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <select
                required
                value={newTask.departmentId}
                onChange={(e) => setNewTask({ ...newTask, departmentId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project *
              </label>
              <select
                required
                value={newTask.projectId}
                onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assign Employee *
              </label>
              <select
                required
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) setNewTask({ ...newTask, assignedUserIds: [val] });
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Employee</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.jobTitle})
                  </option>
                ))}
              </select>
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
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
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
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
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
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

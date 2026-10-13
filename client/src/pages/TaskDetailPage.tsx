import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { TaskStatus } from "../types";
import {
  ArrowLeft,
  MessageSquare,
  History,
  Send,
  AlertCircle,
  UserPlus,
  Check,
} from "lucide-react";

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedTlId, setSelectedTlId] = useState<string>("");
  const [assignSaving, setAssignSaving] = useState(false);

  const isManagerOrAdmin = user?.role === "MANAGER" || user?.role === "SUPER_ADMIN";
  const isTeamLead = user?.role === "TEAM_LEAD";
  const canManageAssignments = isManagerOrAdmin || isTeamLead;

  useEffect(() => {
    loadTask();
    if (user?.role !== "EXECUTIVE") {
      loadUsers();
    }
  }, [id]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/tasks/${id}`);
      if (res.success) setTask(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res: any = await api.get("/users?status=active&flow=true");
      if (res.success) setUsersList(res.data || []);
    } catch {
      // Ignored
    }
  };

  const openAssignModal = () => {
    if (!task) return;
    if (isTeamLead) {
      const execIds = (task.assignees || [])
        .filter((a: any) => a.role === "EXECUTIVE")
        .map((a: any) => a.id);
      setSelectedUserIds(execIds);
      setSelectedTlId(user?.id || "");
    } else {
      setSelectedUserIds((task.assignees || []).map((a: any) => a.id));
      setSelectedTlId(task.teamLead?.id || task.assignedTeamLeadId || "");
    }
    setShowAssignModal(true);
  };

  const toggleUserSelection = (userId: string, role?: string) => {
    setSelectedUserIds((prev) => {
      const exists = prev.includes(userId);
      const next = exists ? prev.filter((uid) => uid !== userId) : [...prev, userId];
      if (role === "TEAM_LEAD") {
        if (!exists && !selectedTlId) setSelectedTlId(userId);
        if (exists && selectedTlId === userId) setSelectedTlId("");
      }
      return next;
    });
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalIds = Array.from(
      new Set([
        ...selectedUserIds,
        ...(isManagerOrAdmin && selectedTlId ? [selectedTlId] : []),
      ])
    );

    if (finalIds.length === 0) {
      alert(
        isTeamLead
          ? "Please select at least one Executive."
          : "Please select at least one Team Lead or Executive."
      );
      return;
    }

    setAssignSaving(true);
    try {
      await api.put(`/tasks/${id}`, {
        assignedUserIds: finalIds,
        assignedTeamLeadId: isTeamLead ? user?.id : selectedTlId || null,
      });
      setShowAssignModal(false);
      loadTask();
    } catch (err: any) {
      alert(err.message || "Failed to update task assignment");
    } finally {
      setAssignSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      await api.put(`/tasks/${id}`, { status: newStatus });
      setTask((prev: any) => ({ ...prev, status: newStatus }));
      loadTask(); // reload history
    } catch (err: any) {
      alert(err.message || "Status update failed");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      await api.post(`/tasks/${id}/comments`, { content: commentText });
      setCommentText("");
      loadTask();
    } catch (err: any) {
      alert(err.message || "Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const teamLeadsList = usersList.filter((u) => u.role === "TEAM_LEAD");
  const executivesList = usersList.filter((u) => u.role === "EXECUTIVE");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-md animate-spin" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg p-6 text-center text-xs text-rose-800 dark:text-rose-300">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-semibold">{error || "Task not found"}</p>
        <Link to="/tasks" className="inline-block mt-3 text-blue-600 underline">
          Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                {task.taskCode}
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {task.title}
              </h1>
              <Badge variant={task.priority} size="sm" />
              <Badge variant={task.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Project: {task.project?.name} • Department: {task.department?.name}
            </p>
          </div>
        </div>

        {/* Status Dropdown & Assign Action */}
        <div className="flex items-center gap-2">
          {canManageAssignments && (
            <button
              type="button"
              onClick={openAssignModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {isTeamLead ? "Assign to Executive" : "Assign to TL / Executive"}
            </button>
          )}
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TO_DO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Details & Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Description & Requirements
            </h2>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Created by {task.createdBy?.fullName || "System"}</span>
              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Linked Daily Work Logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Linked Daily Work Logs ({task.dailyWorkEntries?.length || 0})
              </h2>
              <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                Total Derived Hours: {task.actualHours ? `${task.actualHours} hrs` : "Unreported"}
              </span>
            </div>

            {task.dailyWorkEntries?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No work logged for this task yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {task.dailyWorkEntries?.map((e: any) => (
                  <div key={e.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {e.activityTitle}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        By {e.dailyReport?.user?.fullName} on{" "}
                        {e.dailyReport?.reportingDate?.split("T")[0]}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {e.hoursSpent ? `${e.hoursSpent}h` : "Hours Unreported"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments Thread */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Task Discussion & Updates ({task.comments?.length || 0})
              </h2>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {task.comments?.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No comments yet. Start the thread.</p>
              ) : (
                task.comments?.map((c: any) => (
                  <div key={c.id} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {c.user.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
              <input
                type="text"
                required
                placeholder="Write a comment or status update..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={commentLoading}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Post
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Meta Information & Audit History */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                Task Details
              </h3>
              {canManageAssignments && (
                <button
                  type="button"
                  onClick={openAssignModal}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {isTeamLead ? "+ Assign Executive" : "+ Edit Assignees"}
                </button>
              )}
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Assigned Employees</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {task.assignees?.map((a: any) => (
                  <span
                    key={a.id}
                    className={`px-2 py-0.5 rounded-lg font-semibold text-[11px] ${
                      a.role === "TEAM_LEAD"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                        : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {a.fullName} ({a.role === "TEAM_LEAD" ? "TL" : "Executive"})
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Assigned Team Lead (TL)</span>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {task.teamLead?.fullName || "Unassigned"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Start Date</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {task.startDate ? task.startDate.split("T")[0] : "N/A"}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Due Date</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {task.dueDate ? task.dueDate.split("T")[0] : "N/A"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Estimated Hours</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {task.estimatedHours ? `${task.estimatedHours}h` : "N/A"}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Actual Logged Hours</span>
                <p className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {task.actualHours ? `${task.actualHours}h` : "Unreported"}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 text-[11px]">Progress Percentage</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {task.progressPercentage}%
                </span>
              </div>
              <div className="w-full h-2 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-md transition-all"
                  style={{ width: `${task.progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Task History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                Activity History
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] max-h-60 overflow-y-auto">
              {task.histories?.map((h: any) => (
                <div key={h.id} className="py-2">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-800 dark:text-slate-200">{h.action}</span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">{h.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assign / Delegate Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={
          isTeamLead
            ? `Delegate Task to Executive - ${task.taskCode}`
            : `Assign Task to Team Lead / Executive - ${task.taskCode}`
        }
        maxWidth="xl"
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4">
          {isManagerOrAdmin && (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Team Leads (TL)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                {teamLeadsList.map((tl) => {
                  const selected = selectedUserIds.includes(tl.id) || selectedTlId === tl.id;
                  return (
                    <button
                      key={tl.id}
                      type="button"
                      onClick={() => toggleUserSelection(tl.id, "TEAM_LEAD")}
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
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[9px]">
                          TL
                        </span>
                        {selected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              {isTeamLead ? "Select Executive(s) *" : "Executives"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {executivesList.map((exec) => {
                const selected = selectedUserIds.includes(exec.id);
                return (
                  <button
                    key={exec.id}
                    type="button"
                    onClick={() => toggleUserSelection(exec.id, "EXECUTIVE")}
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-[9px]">
                        EXEC
                      </span>
                      {selected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignSaving}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md disabled:opacity-50 cursor-pointer"
            >
              {assignSaving
                ? "Saving..."
                : isTeamLead
                ? "Assign to Executive"
                : "Save Assignment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


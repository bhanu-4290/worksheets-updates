import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { Task, TaskStatus } from "../types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FolderKanban,
  Building2,
  CheckCircle2,
  MessageSquare,
  History,
  Send,
  AlertCircle,
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

  useEffect(() => {
    loadTask();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-6 text-center text-xs text-rose-800 dark:text-rose-300">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-semibold">{error || "Task not found"}</p>
        <Link to="/tasks" className="inline-block mt-3 text-indigo-600 underline">
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
              <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
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

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Linked Daily Work Logs ({task.dailyWorkEntries?.length || 0})
              </h2>
              <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Task Discussion & Updates ({task.comments?.length || 0})
              </h2>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {task.comments?.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No comments yet. Start the thread.</p>
              ) : (
                task.comments?.map((c: any) => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
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
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={commentLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Post
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Meta Information & Audit History */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 text-xs">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
              Task Details
            </h3>

            <div>
              <span className="text-slate-400 block text-[11px]">Assigned Employees</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {task.assignees?.map((a: any) => (
                  <span
                    key={a.id}
                    className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium"
                  >
                    {a.fullName}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Assigned Team Lead</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {task.teamLead?.fullName || "Unassigned"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Start Date</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {task.startDate ? task.startDate.split("T")[0] : "—"}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Due Date</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {task.dueDate ? task.dueDate.split("T")[0] : "—"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Estimated Hours</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {task.estimatedHours ? `${task.estimatedHours}h` : "—"}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Actual Logged Hours</span>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
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
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${task.progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Task History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
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
    </div>
  );
};

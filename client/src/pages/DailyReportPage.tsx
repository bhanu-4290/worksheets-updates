import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Badge } from "../components/Badge";
import { DailyReport, DailyWorkEntry, Task } from "../types";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  Save,
  Send,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Eye,
  Info,
  Filter,
} from "lucide-react";

export const DailyReportPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<"form" | "history">(
    searchParams.get("tab") === "history" ? "history" : "form"
  );

  // Form State
  const [reportingDate, setReportingDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [entries, setEntries] = useState<DailyWorkEntry[]>([
    {
      activityTitle: "",
      description: "",
      taskId: null,
      startTime: "",
      endTime: "",
      hoursSpent: null, // Strictly optional!
      progressPercentage: 50,
      status: "IN_PROGRESS",
      deliverables: "",
      blockers: "",
      supportRequired: "",
      nextDayPlan: "",
    },
  ]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // History state
  const [historyReports, setHistoryReports] = useState<DailyReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    loadAssignedTasks();
    loadExistingReportForDate(reportingDate);
    loadHistoryReports();
  }, [reportingDate]);

  const loadAssignedTasks = async () => {
    try {
      const res: any = await api.get("/tasks");
      if (res.success) setTasks(res.data || []);
    } catch {
      // Ignored
    }
  };

  const loadExistingReportForDate = async (dateStr: string) => {
    try {
      setLoading(true);
      const res: any = await api.get(`/daily-reports?startDate=${dateStr}&endDate=${dateStr}`);
      if (res.success && res.data && res.data.length > 0) {
        const rep = res.data[0];
        // Populate form with existing report entries for editing
        if (rep.entries && rep.entries.length > 0) {
          setEntries(
            rep.entries.map((e: any) => ({
              ...e,
              hoursSpent: e.hoursSpent ?? null,
              startTime: e.startTime || "",
              endTime: e.endTime || "",
            }))
          );
        }
      } else {
        // Reset default empty entry if no report exists for this date
        setEntries([
          {
            activityTitle: "",
            description: "",
            taskId: null,
            startTime: "",
            endTime: "",
            hoursSpent: null,
            progressPercentage: 50,
            status: "IN_PROGRESS",
            deliverables: "",
            blockers: "",
            supportRequired: "",
            nextDayPlan: "",
          },
        ]);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryReports = async () => {
    try {
      const url = statusFilter ? `/daily-reports?status=${statusFilter}` : "/daily-reports";
      const res: any = await api.get(url);
      if (res.success) setHistoryReports(res.data || []);
    } catch {
      // Ignored
    }
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      {
        activityTitle: "",
        description: "",
        taskId: null,
        startTime: "",
        endTime: "",
        hoursSpent: null,
        progressPercentage: 50,
        status: "IN_PROGRESS",
        deliverables: "",
        blockers: "",
        supportRequired: "",
        nextDayPlan: "",
      },
    ]);
  };

  const removeEntry = (index: number) => {
    if (entries.length === 1) return;
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof DailyWorkEntry, value: any) => {
    setEntries((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSave = async (submitStatus: "DRAFT" | "SUBMITTED") => {
    setMessage(null);

    // Validation
    for (let i = 0; i < entries.length; i++) {
      if (!entries[i].activityTitle.trim()) {
        setMessage({ type: "error", text: `Activity ${i + 1}: Title is required.` });
        return;
      }
      if (!entries[i].description.trim()) {
        setMessage({ type: "error", text: `Activity ${i + 1}: Description is required.` });
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        reportingDate,
        status: submitStatus,
        entries: entries.map((e) => ({
          ...e,
          hoursSpent: e.hoursSpent ? Number(e.hoursSpent) : null,
          startTime: e.startTime ? String(e.startTime) : null,
          endTime: e.endTime ? String(e.endTime) : null,
          taskId: e.taskId || null,
        })),
      };

      const res: any = await api.post("/daily-reports", payload);
      setMessage({
        type: "success",
        text: submitStatus === "SUBMITTED"
          ? "Daily report submitted successfully for Team Lead review!"
          : "Draft saved successfully.",
      });

      loadHistoryReports();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save daily report." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Daily Work Reporting
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Log daily activities, linked project tasks, deliverables, and blockers. Work hours are optional.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/60 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl self-start sm:self-auto border border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={() => setActiveTab("form")}
            className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "form"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md shadow-black/5"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Report Form
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              loadHistoryReports();
            }}
            className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "history"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md shadow-black/5"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Previous Reports
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-3 shadow-xs animate-in fade-in zoom-in-95 duration-150 ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
              : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/30"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: REPORT FORM */}
      {/* ======================================================== */}
      {activeTab === "form" && (
        <div className="space-y-6">
          {/* Date Selector & Optional Hours Notice */}
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Reporting Date
                </label>
                <input
                  type="date"
                  value={reportingDate}
                  onChange={(e) => setReportingDate(e.target.value)}
                  className="mt-1 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 max-w-xl text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed">
              <Info className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              <span>
                <strong>Optional Working Hours Policy:</strong> Entering work hours is strictly optional. Unreported hours are distinguished from zero hours and will never be used as evidence of non-productivity.
              </span>
            </div>
          </div>

          {/* Activity Entries List */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Activity Entries</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                  {entries.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={addEntry}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-xs transition-colors border border-indigo-200/50 dark:border-indigo-800/50 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Activity
              </button>
            </div>

            {entries.map((entry, index) => (
              <div
                key={index}
                className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5 relative transition-all hover:border-indigo-500/30"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-500/20">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Activity Entry #{index + 1}
                    </span>
                  </div>
                  {entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEntry(index)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  )}
                </div>

                {/* Title & Linked Task */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Activity Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Implement Role Scoping Middleware"
                      value={entry.activityTitle}
                      onChange={(e) => updateEntry(index, "activityTitle", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Link to Task (Optional)
                    </label>
                    <select
                      value={entry.taskId || ""}
                      onChange={(e) => updateEntry(index, "taskId", e.target.value || null)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    >
                      <option value="">-- No specific task --</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.taskCode}: {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Detailed Work Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide detailed description of tasks executed, technical decisions, and progress..."
                    value={entry.description}
                    onChange={(e) => updateEntry(index, "description", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all leading-relaxed"
                  />
                </div>

                {/* Optional Hours Row */}
                <div className="p-4.5 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Start Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={entry.startTime || ""}
                      onChange={(e) => updateEntry(index, "startTime", e.target.value || null)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      End Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={entry.endTime || ""}
                      onChange={(e) => updateEntry(index, "endTime", e.target.value || null)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Hours Spent (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="Leave blank if not tracking"
                      value={entry.hoursSpent ?? ""}
                      onChange={(e) =>
                        updateEntry(index, "hoursSpent", e.target.value === "" ? null : parseFloat(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Progress & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Progress Percentage
                      </label>
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        {entry.progressPercentage}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={entry.progressPercentage}
                      onChange={(e) => updateEntry(index, "progressPercentage", parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Activity Status
                    </label>
                    <select
                      value={entry.status}
                      onChange={(e) => updateEntry(index, "status", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    >
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </div>
                </div>

                {/* Deliverables & Blockers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Deliverables / Accomplishments
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Merged PR #104, tested in staging"
                      value={entry.deliverables || ""}
                      onChange={(e) => updateEntry(index, "deliverables", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Blockers / Challenges
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Waiting on VPN firewall rule exception"
                      value={entry.blockers || ""}
                      onChange={(e) => updateEntry(index, "blockers", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Support Required & Next Day Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Support Required (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Need Manager escalation with IT team"
                      value={entry.supportRequired || ""}
                      onChange={(e) => updateEntry(index, "supportRequired", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Next Working Day's Plan
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Run load tests and benchmark response latency"
                      value={entry.nextDayPlan || ""}
                      onChange={(e) => updateEntry(index, "nextDayPlan", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave("DRAFT")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> Save as Draft
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave("SUBMITTED")}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit for Team Lead Review
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: HISTORY BROWSER */}
      {/* ======================================================== */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  loadHistoryReports();
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REVISION_REQUESTED">Revision Requested</option>
              </select>
            </div>
            <span className="text-xs font-medium text-slate-400">
              Found {historyReports.length} reports
            </span>
          </div>

          {historyReports.length === 0 ? (
            <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs font-medium">
              No daily reports found.
            </div>
          ) : (
            <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Reporting Date</th>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Activities</th>
                      <th className="px-6 py-4">Recorded Hours</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Lead Reviewer</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {historyReports.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {r.reportingDate}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                          {r.user.fullName}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {r.entriesCount} entries
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono font-medium">
                          {r.totalHoursRecorded ? `${r.totalHoursRecorded}h` : "Unreported"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={r.status} size="sm" />
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {r.latestReview?.reviewer?.fullName || "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/reports/${r.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
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
        </div>
      )}
    </div>
  );
};

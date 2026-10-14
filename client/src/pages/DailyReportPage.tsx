import React, { useState, useEffect, useMemo } from "react";
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
  ChevronLeft,
  ChevronRight,
  Copy,
  Users,
  FileText,
  GitBranch,
  X,
  ArrowRight,
  Download,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";
import { EmployeeFlowModal } from "../components/EmployeeFlowModal";
import { DailyReportsSummaryModal } from "../components/DailyReportsSummaryModal";

function toLocalYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const DailyReportPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const todayStr = useMemo(() => toLocalYMD(new Date()), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toLocalYMD(d);
  }, []);

  const [activeTab, setActiveTab] = useState<"form" | "history">(
    searchParams.get("tab") === "history" ? "history" : "form"
  );

  // Selected employee filter (for Supervisors viewing subordinate task sheet calendars)
  const [selectedUserId, setSelectedUserId] = useState<string>(user?.id || "");
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [showEmployeeFlow, setShowEmployeeFlow] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [previewReport, setPreviewReport] = useState<DailyReport | null>(null);

  // Calendar Month State
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Form State
  const [reportingDate, setReportingDate] = useState<string>(
    searchParams.get("date") || todayStr
  );
  const [activeReportForDate, setActiveReportForDate] = useState<DailyReport | null>(null);
  const [entries, setEntries] = useState<DailyWorkEntry[]>([
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

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // All reports for the selected user (powers the Calendar, Missed Days tracker, Yesterday/Week feed, and History tab)
  const [historyReports, setHistoryReports] = useState<DailyReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const canInspectOthers =
    user?.role === "SUPER_ADMIN" || user?.role === "MANAGER" || user?.role === "TEAM_LEAD";
  const isViewingSelf = !selectedUserId || selectedUserId === user?.id;

  const selectedUserObj = useMemo(() => {
    if (selectedUserId === "ALL") return { fullName: "All Employees (Organization-Wide)" };
    if (selectedUserId === user?.id) return user;
    return teamUsers.find((u) => u.id === selectedUserId) || user;
  }, [selectedUserId, user, teamUsers]);

  useEffect(() => {
    if (user?.id && !selectedUserId) {
      setSelectedUserId(user.id);
    }
    if (canInspectOthers) {
      api
        .get("/users?status=active&flow=true")
        .then((res: any) => {
          if (res.success) setTeamUsers(res.data || []);
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    loadAssignedTasks();
  }, []);

  useEffect(() => {
    if (!user) return;
    loadExistingReportForDate(reportingDate, selectedUserId || user.id);
    loadHistoryReports(selectedUserId || user.id);
  }, [reportingDate, selectedUserId, user]);

  const loadAssignedTasks = async () => {
    try {
      const res: any = await api.get("/tasks");
      if (res.success) setTasks(res.data || []);
    } catch {
      // Ignored
    }
  };

  const loadExistingReportForDate = async (dateStr: string, targetUserId: string) => {
    if (targetUserId === "ALL") {
      setActiveReportForDate(null);
      return;
    }
    try {
      setLoading(true);
      const res: any = await api.get(
        `/daily-reports?startDate=${dateStr}&endDate=${dateStr}&employeeId=${targetUserId}`
      );
      if (res.success && res.data && res.data.length > 0) {
        const rep = res.data[0];
        setActiveReportForDate(rep);
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
        setActiveReportForDate(null);
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
      setActiveReportForDate(null);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryReports = async (targetUserId?: string) => {
    try {
      const uid = targetUserId !== undefined ? targetUserId : (selectedUserId || user?.id || "");
      const params = new URLSearchParams();
      if (uid) params.set("employeeId", uid);
      if (statusFilter) params.set("status", statusFilter);
      const res: any = await api.get(`/daily-reports?${params.toString()}`);
      if (res.success) setHistoryReports(res.data || []);
    } catch {
      // Ignored
    }
  };

  const handleDownloadCsv = async (targetUserId?: string, targetUserName?: string) => {
    try {
      setDownloadingCsv(true);
      const uid = targetUserId !== undefined ? targetUserId : selectedUserId;
      const params = new URLSearchParams();
      if (uid) params.set("employeeId", uid);
      if (statusFilter) params.set("status", statusFilter);

      const token =
        localStorage.getItem("syncspace_token") ||
        localStorage.getItem("worktrack_token") ||
        "";
      const res = await fetch(`/api/v1/daily-reports/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Download failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const targetUser = teamUsers.find((u) => u.id === uid);
      const rawLabel =
        targetUserName ||
        (uid === "ALL"
          ? "All-Employees"
          : uid === user?.id
          ? user?.fullName
          : targetUser?.fullName || "Employee");
      const userLabel = (rawLabel || "Employee").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `SYNC_SPACE_Daily_Reports_${userLabel}_${toLocalYMD(new Date())}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Export CSV error:", err);
      setMessage({ type: "error", text: err.message || "Failed to download daily reports CSV." });
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Map reports by YYYY-MM-DD for O(1) lookup on the Calendar
  const reportsByDate = useMemo(() => {
    const map: Record<string, DailyReport> = {};
    for (const r of historyReports) {
      if (r.reportingDate) {
        map[r.reportingDate] = r;
      }
    }
    return map;
  }, [historyReports]);

  // Build Calendar Grid for `calendarMonth`
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startWeekday = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = lastDayOfMonth.getDate();

    const cells: Array<{
      dateStr: string | null;
      dayNumber: number | null;
      isToday: boolean;
      isSelected: boolean;
      isPastWorkday: boolean;
      isWeekend: boolean;
      report: DailyReport | null;
    }> = [];

    for (let i = 0; i < startWeekday; i++) {
      cells.push({
        dateStr: null,
        dayNumber: null,
        isToday: false,
        isSelected: false,
        isPastWorkday: false,
        isWeekend: false,
        report: null,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = toLocalYMD(dateObj);
      const weekday = dateObj.getDay();
      const isWeekend = weekday === 0 || weekday === 6;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === reportingDate;
      // Past working day: Mon-Fri after 15-10-2026 and strictly before today (dates up to 2026-10-15 remain blank)
      const isPastWorkday = !isWeekend && dateStr > "2026-10-15" && dateStr < todayStr;
      const report = reportsByDate[dateStr] || null;

      cells.push({
        dateStr,
        dayNumber: day,
        isToday,
        isSelected,
        isPastWorkday,
        isWeekend,
        report,
      });
    }

    return cells;
  }, [calendarMonth, reportsByDate, reportingDate, todayStr]);

  // Missed working days in the currently viewed calendar month
  const missedDatesInMonth = useMemo(() => {
    return calendarDays
      .filter((c) => c.dateStr && c.isPastWorkday && !c.report)
      .map((c) => c.dateStr as string)
      .reverse();
  }, [calendarDays]);

  // Updated days in the currently viewed calendar month
  const updatedDatesCount = useMemo(() => {
    return calendarDays.filter((c) => c.dateStr && c.report).length;
  }, [calendarDays]);

  // Most recent updated report (from yesterday or earlier) so user can carry forward tasks or inspect yesterday's updates
  const latestPreviousReport = useMemo(() => {
    return historyReports.find((r) => r.reportingDate <= todayStr) || null;
  }, [historyReports, todayStr]);

  const yesterdayReport = useMemo(() => {
    return reportsByDate[yesterdayStr] || null;
  }, [reportsByDate, yesterdayStr]);

  const handleCopyPreviousTasks = (sourceReport: DailyReport) => {
    if (!sourceReport.entries || sourceReport.entries.length === 0) return;
    setEntries(
      sourceReport.entries.map((e: any) => ({
        activityTitle: e.activityTitle || "",
        description: e.description || "",
        taskId: e.taskId || null,
        startTime: e.startTime || "",
        endTime: e.endTime || "",
        hoursSpent: e.hoursSpent ?? null,
        progressPercentage: e.progressPercentage ?? 50,
        status: e.status || "IN_PROGRESS",
        deliverables: e.deliverables || "",
        blockers: e.blockers || "",
        supportRequired: e.supportRequired || "",
        nextDayPlan: e.nextDayPlan || "",
      }))
    );
    setMessage({
      type: "success",
      text: `Loaded ${sourceReport.entries.length} task entry(s) from ${sourceReport.reportingDate} into the ${reportingDate} sheet. Review and click Submit to save.`,
    });
  };

  const handleSelectCalendarDate = (dateStr: string) => {
    setReportingDate(dateStr);
    setMessage(null);
    const d = new Date(dateStr + "T00:00:00");
    if (
      d.getFullYear() !== calendarMonth.getFullYear() ||
      d.getMonth() !== calendarMonth.getMonth()
    ) {
      setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
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

      await api.post("/daily-reports", payload);
      setMessage({
        type: "success",
        text:
          submitStatus === "SUBMITTED"
            ? `Task sheet for ${reportingDate} submitted and marked as Updated on your calendar.`
            : `Draft saved for ${reportingDate}.`,
      });

      await loadExistingReportForDate(reportingDate, selectedUserId || user?.id || "");
      await loadHistoryReports(selectedUserId || user?.id || "");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save daily report." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Work Reporting &amp; Task Sheet Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track daily task sheets on the calendar, review updates from yesterday or previous weeks, and fill in any missed working days.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {canInspectOthers && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1">
                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {user?.role === "SUPER_ADMIN" && (
                    <option value="ALL">🌐 All Employees (Organization-Wide)</option>
                  )}
                  <option value={user?.id || ""}>My Task Sheet ({user?.fullName})</option>
                  {teamUsers
                    .filter((u) => u.id !== user?.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role.replace("_", " ")})
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowEmployeeFlow(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                title="View MATRIX Organizational Flow Chart"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Employee Flow</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-md">
            <button
              onClick={() => setActiveTab("form")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "form"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Calendar &amp; Task Sheet
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                loadHistoryReports();
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "history"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              All Previous Sheets ({historyReports.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSummaryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer shadow-2xs"
              title="Generate AI-Assisted Executive Summary of Daily Reports"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">Executive</span> Summary
            </button>

            <button
              type="button"
              disabled={downloadingCsv}
              onClick={() => handleDownloadCsv()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title={
                selectedUserId === "ALL"
                  ? "Download all organization daily reports as CSV"
                  : `Download ${selectedUserObj?.fullName}'s daily reports as CSV`
              }
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {downloadingCsv
                  ? "Exporting..."
                  : selectedUserId === "ALL"
                  ? "Export All (CSV)"
                  : "Export CSV"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* INTERACTIVE TASK SHEET CALENDAR & MISSED DAYS TRACKER */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-4.5 shadow-xs space-y-3.5">
        {selectedUserId === "ALL" && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Admin Organization-Wide View Active:</strong> Viewing aggregated data across all team members. Use <strong>All Previous Sheets ({historyReports.length})</strong> or <strong>Executive Summary</strong> to review company-wide metrics, or select an individual employee from the dropdown above to inspect their monthly calendar.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className="px-3 py-1 rounded bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
            >
              View All Sheets
            </button>
          </div>
        )}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-md p-1">
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                  )
                }
                className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-bold text-slate-900 dark:text-white min-w-[130px] text-center">
                {calendarMonth.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                  )
                }
                className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Jump Buttons: Yesterday & Today */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectCalendarDate(yesterdayStr)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  reportingDate === yesterdayStr
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-500"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Yesterday ({yesterdayStr})
                {yesterdayReport ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                    Updated
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold">
                    Missed
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSelectCalendarDate(todayStr)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  reportingDate === todayStr
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-500"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Today ({todayStr})
              </button>
            </div>
          </div>

          {/* Legend & Monthly Counters */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold">
              <span className="w-2 h-2 rounded-xs bg-emerald-500" />
              Updated Sheets: {updatedDatesCount}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-semibold">
              <span className="w-2 h-2 rounded-xs bg-rose-500" />
              Missed Workdays: {missedDatesInMonth.length}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-semibold">
              <span className="w-2 h-2 rounded-xs bg-amber-500" />
              Draft / Revision
            </span>
          </div>
        </div>

        {/* 7-Day Calendar Grid */}
        <div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              if (!cell.dateStr || cell.dayNumber === null) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-16 sm:h-20 rounded-md bg-slate-50/50 dark:bg-slate-950/30 border border-transparent"
                  />
                );
              }

              const rep = cell.report;
              const isSubmittedOrApproved =
                rep &&
                (rep.status === "SUBMITTED" ||
                  rep.status === "APPROVED" ||
                  rep.status === "UNDER_REVIEW");
              const isDraftOrRevision =
                rep && (rep.status === "DRAFT" || rep.status === "REVISION_REQUESTED");
              const isMissed = !rep && cell.isPastWorkday;

              let cellStyle =
                "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500";
              if (isSubmittedOrApproved) {
                cellStyle =
                  "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200 hover:border-emerald-500";
              } else if (isDraftOrRevision) {
                cellStyle =
                  "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 hover:border-amber-500";
              } else if (isMissed) {
                cellStyle =
                  "bg-rose-50/60 dark:bg-rose-950/25 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 hover:border-rose-500";
              } else if (cell.isWeekend) {
                cellStyle =
                  "bg-slate-50 dark:bg-slate-950/50 border-slate-200/60 dark:border-slate-800/60 text-slate-400 dark:text-slate-500 hover:border-blue-400";
              }

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => handleSelectCalendarDate(cell.dateStr!)}
                  className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-md border text-left flex flex-col justify-between transition-colors cursor-pointer relative ${cellStyle} ${
                    cell.isSelected ? "ring-2 ring-blue-600 dark:ring-blue-400" : ""
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        cell.isToday
                          ? "px-1.5 py-0.5 rounded bg-blue-600 text-white"
                          : ""
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {isSubmittedOrApproved && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    {isDraftOrRevision && (
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    {isMissed && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                    )}
                  </div>

                  <div className="w-full truncate">
                    {rep ? (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-tight truncate">
                          {rep.entriesCount || rep.entries?.length || 1} task(s)
                        </div>
                        <div className="text-[9px] opacity-80 truncate hidden sm:block">
                          {rep.entries?.[0]?.activityTitle || rep.status}
                        </div>
                      </div>
                    ) : isMissed ? (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        Missed
                      </span>
                    ) : cell.isToday ? (
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                        Today
                      </span>
                    ) : cell.isWeekend ? (
                      <span className="text-[9px] opacity-60 hidden sm:inline">Weekend</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Missed Days Quick-Fill Strip */}
        {missedDatesInMonth.length > 0 && (
          <div className="p-3 rounded-md bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>
                Missed Task Sheet Dates (click any date to open &amp; update the missed sheet):
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {missedDatesInMonth.slice(0, 8).map((dStr) => (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => {
                    handleSelectCalendarDate(dStr);
                    setActiveTab("form");
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    reportingDate === dStr
                      ? "bg-rose-600 text-white"
                      : "bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100"
                  }`}
                >
                  {dStr === yesterdayStr ? `${dStr} (Yesterday)` : dStr}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Updates Summary (Yesterday & Past Week Always Visible Today / Next Week) */}
        {historyReports.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recent Updated Task Sheets (Visible Across Days &amp; Weeks)
              </span>
              {isViewingSelf && latestPreviousReport && !activeReportForDate && (
                <button
                  type="button"
                  onClick={() => handleCopyPreviousTasks(latestPreviousReport)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy tasks from {latestPreviousReport.reportingDate} into {reportingDate}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {historyReports.slice(0, 7).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    handleSelectCalendarDate(r.reportingDate);
                    setActiveTab("form");
                  }}
                  className={`px-3 py-1.5 rounded-md border text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                    reportingDate === r.reportingDate
                      ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-blue-400"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>
                    {r.reportingDate === yesterdayStr
                      ? `${r.reportingDate} (Yesterday)`
                      : r.reportingDate === todayStr
                      ? `${r.reportingDate} (Today)`
                      : r.reportingDate}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                    {r.entriesCount || r.entries?.length || 1} task(s)
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg text-xs font-medium flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
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
      {/* TAB 1: REPORT FORM & SELECTED DATE TASK SHEET VIEW */}
      {/* ======================================================== */}
      {activeTab === "form" && (
        <div className="space-y-6">
          {/* Date Selector & Status Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Selected Task Sheet Date
                  </label>
                  <input
                    type="date"
                    value={reportingDate}
                    onChange={(e) => handleSelectCalendarDate(e.target.value)}
                    className="mt-1 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {activeReportForDate ? (
                <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                      <span>Task Sheet Recorded for {reportingDate}</span>
                      <Badge variant={activeReportForDate.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {activeReportForDate.entries?.length || activeReportForDate.entriesCount} task(s) logged
                      {activeReportForDate.id && (
                        <>
                          {" • "}
                          <Link
                            to={`/reports/${activeReportForDate.id}`}
                            className="underline font-semibold"
                          >
                            Open Full Report View
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold text-amber-900 dark:text-amber-200">
                      {reportingDate < todayStr
                        ? `No Task Sheet Updated on ${reportingDate} (Missed)`
                        : `Task Sheet Not Yet Submitted for ${reportingDate}`}
                    </div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-400">
                      {isViewingSelf
                        ? "Fill out your tasks below and click Submit to record this date on your calendar."
                        : "This employee has not submitted a task sheet for this date."}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 max-w-md text-xs text-blue-900 dark:text-blue-300">
              <Info className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
              <span>
                <strong>Persistent Task History:</strong> Tasks updated yesterday or last week remain visible on the calendar and automatically sync progress to the Task Board.
              </span>
            </div>
          </div>

          {/* Activity Entries List */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Task Sheet Entries for {reportingDate}</span>
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  {entries.length}
                </span>
              </h2>
              {isViewingSelf && (
                <div className="flex items-center gap-2">
                  {latestPreviousReport && (
                    <button
                      type="button"
                      onClick={() => handleCopyPreviousTasks(latestPreviousReport)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-blue-600" />
                      Load Tasks from {latestPreviousReport.reportingDate}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={addEntry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Activity
                  </button>
                </div>
              )}
            </div>

            {entries.map((entry, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4 relative"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Activity Entry #{index + 1}
                    </span>
                  </div>
                  {isViewingSelf && entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEntry(index)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  )}
                </div>

                {/* Title & Linked Task */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Activity Title *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isViewingSelf}
                      placeholder="e.g. Implement Role Scoping Middleware"
                      value={entry.activityTitle}
                      onChange={(e) => updateEntry(index, "activityTitle", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Link to Assigned Task (Syncs Progress)
                    </label>
                    <select
                      disabled={!isViewingSelf}
                      value={entry.taskId || ""}
                      onChange={(e) => {
                        const selectedTaskId = e.target.value || null;
                        updateEntry(index, "taskId", selectedTaskId);
                        if (selectedTaskId && !entry.activityTitle) {
                          const foundTask = tasks.find((t) => t.id === selectedTaskId);
                          if (foundTask) {
                            updateEntry(index, "activityTitle", foundTask.title);
                          }
                        }
                      }}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                    >
                      <option value="">-- No specific task --</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.taskCode}: {t.title} ({t.progressPercentage}%)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Detailed Work Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    disabled={!isViewingSelf}
                    placeholder="Provide detailed description of tasks executed, technical decisions, and progress..."
                    value={entry.description}
                    onChange={(e) => updateEntry(index, "description", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                  />
                </div>

                {/* Optional Hours Row */}
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Start Time (Optional)
                    </label>
                    <input
                      type="time"
                      disabled={!isViewingSelf}
                      value={entry.startTime || ""}
                      onChange={(e) => updateEntry(index, "startTime", e.target.value || null)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      End Time (Optional)
                    </label>
                    <input
                      type="time"
                      disabled={!isViewingSelf}
                      value={entry.endTime || ""}
                      onChange={(e) => updateEntry(index, "endTime", e.target.value || null)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Hours Spent (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      disabled={!isViewingSelf}
                      placeholder="Leave blank if not tracking"
                      value={entry.hoursSpent ?? ""}
                      onChange={(e) =>
                        updateEntry(
                          index,
                          "hoursSpent",
                          e.target.value === "" ? null : parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Progress & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Progress Percentage: {entry.progressPercentage}%
                      </label>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      disabled={!isViewingSelf}
                      value={entry.progressPercentage}
                      onChange={(e) =>
                        updateEntry(index, "progressPercentage", parseInt(e.target.value, 10))
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Activity Status
                    </label>
                    <select
                      disabled={!isViewingSelf}
                      value={entry.status}
                      onChange={(e) => updateEntry(index, "status", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Deliverables / Accomplishments
                    </label>
                    <input
                      type="text"
                      disabled={!isViewingSelf}
                      placeholder="e.g. Merged PR #104, tested in staging"
                      value={entry.deliverables || ""}
                      onChange={(e) => updateEntry(index, "deliverables", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Blockers / Challenges
                    </label>
                    <input
                      type="text"
                      disabled={!isViewingSelf}
                      placeholder="e.g. Waiting on VPN firewall rule exception"
                      value={entry.blockers || ""}
                      onChange={(e) => updateEntry(index, "blockers", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Support Required & Next Day Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Support Required (Optional)
                    </label>
                    <input
                      type="text"
                      disabled={!isViewingSelf}
                      placeholder="e.g. Need Manager escalation with IT team"
                      value={entry.supportRequired || ""}
                      onChange={(e) => updateEntry(index, "supportRequired", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Next Working Day's Plan
                    </label>
                    <input
                      type="text"
                      disabled={!isViewingSelf}
                      placeholder="e.g. Run load tests and benchmark response latency"
                      value={entry.nextDayPlan || ""}
                      onChange={(e) => updateEntry(index, "nextDayPlan", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Form Actions */}
          {isViewingSelf && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSave("DRAFT")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save as Draft ({reportingDate})
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSave("SUBMITTED")}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-md animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Task Sheet ({reportingDate})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: HISTORY BROWSER */}
      {/* ======================================================== */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  loadHistoryReports();
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REVISION_REQUESTED">Revision Requested</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSummaryModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Executive Summary
              </button>

              <button
                type="button"
                disabled={downloadingCsv}
                onClick={() => handleDownloadCsv()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {downloadingCsv
                  ? "Exporting..."
                  : selectedUserId === "ALL"
                  ? "Download All (CSV)"
                  : "Download CSV"}
              </button>

              <span className="text-xs text-slate-400 pl-1">
                Found {historyReports.length} task sheets
              </span>
            </div>
          </div>

          {historyReports.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs shadow-xs">
              No daily task sheets found matching this status filter.
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${previewReport ? "lg:grid-cols-12" : ""} gap-4 items-start`}>
              {/* History Table */}
              <div className={`${previewReport ? "lg:col-span-7" : "w-full"} bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200/80 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Reporting Date</th>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Tasks</th>
                        <th className="px-3 py-3">Hours</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {historyReports.map((r) => {
                        const isPreviewSelected = previewReport?.id === r.id;
                        return (
                          <tr
                            key={r.id}
                            onClick={() => setPreviewReport(r)}
                            className={`cursor-pointer transition-colors ${
                              isPreviewSelected
                                ? "bg-blue-50/80 dark:bg-blue-950/40"
                                : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                            }`}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                              {r.reportingDate}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {r.user?.fullName}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {r.entriesCount} task(s)
                              </span>
                            </td>
                            <td className="px-3 py-3 text-slate-600 dark:text-slate-400 font-mono">
                              {r.totalHoursRecorded ? `${r.totalHoursRecorded}h` : "-"}
                            </td>
                            <td className="px-3 py-3">
                              <Badge variant={r.status} size="sm" />
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewReport(r)}
                                  className="px-2 py-1 rounded-md text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                                  title="Open Side Preview"
                                >
                                  Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectCalendarDate(r.reportingDate);
                                    setActiveTab("form");
                                  }}
                                  className="px-2 py-1 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Open in Calendar"
                                >
                                  Calendar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Side Preview Panel */}
              {previewReport && (
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3.5 sticky top-20">
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Task Sheet: {previewReport.reportingDate}
                        </h3>
                        <Badge variant={previewReport.status} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {previewReport.user?.fullName} • {previewReport.entriesCount} activities
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewReport(null)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Close Preview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Activities summary */}
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {previewReport.entries && previewReport.entries.length > 0 ? (
                      previewReport.entries.map((entry: any, i: number) => (
                        <div
                          key={entry.id || i}
                          className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                            <span>{i + 1}. {entry.activityTitle}</span>
                            <span className="font-mono text-[10px] text-slate-400 font-normal">
                              {entry.hoursSpent ? `${entry.hoursSpent}h` : ""}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            {entry.description}
                          </p>
                          {entry.deliverables && (
                            <div className="text-[10px] text-slate-500">
                              <strong>Deliverable:</strong> {entry.deliverables}
                            </div>
                          )}
                          {entry.blockers && (
                            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                              <strong>Blocker:</strong> {entry.blockers}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No entry details available.</p>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectCalendarDate(previewReport.reportingDate);
                        setActiveTab("form");
                      }}
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Edit on Calendar
                    </button>
                    <button
                      type="button"
                      disabled={downloadingCsv}
                      onClick={() =>
                        handleDownloadCsv(
                          previewReport.userId || previewReport.user?.id,
                          previewReport.user?.fullName
                        )
                      }
                      className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                      title={`Download ${previewReport.user?.fullName}'s full reports CSV`}
                    >
                      <Download className="w-3.5 h-3.5" /> Export {previewReport.user?.fullName?.split(" ")[0]}'s CSV
                    </button>
                    <Link
                      to={`/reports/${previewReport.id}`}
                      className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold hover:underline"
                    >
                      Full Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <EmployeeFlowModal
        isOpen={showEmployeeFlow}
        onClose={() => setShowEmployeeFlow(false)}
      />

      <DailyReportsSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        targetUserId={selectedUserId}
        targetUserName={
          selectedUserId === "ALL"
            ? "All Employees (Organization-Wide)"
            : selectedUserId === user?.id
            ? user?.fullName
            : teamUsers.find((u) => u.id === selectedUserId)?.fullName || "Employee"
        }
        onDownloadCsv={(uid) => handleDownloadCsv(uid)}
      />
    </div>
  );
};

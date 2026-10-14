import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "./Modal";
import { api } from "../services/api";
import { Badge } from "./Badge";
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";

interface DateSubmissionsAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate?: string; // YYYY-MM-DD
  onDateChange?: (date: string) => void;
}

function toLocalYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const DateSubmissionsAuditModal: React.FC<DateSubmissionsAuditModalProps> = ({
  isOpen,
  onClose,
  targetDate,
  onDateChange,
}) => {
  const [currentDate, setCurrentDate] = useState<string>(
    targetDate || toLocalYMD(new Date())
  );
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [filterTab, setFilterTab] = useState<"submitted" | "pending" | "all">("submitted");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (targetDate) {
      setCurrentDate(targetDate);
    }
  }, [targetDate]);

  useEffect(() => {
    if (isOpen && currentDate) {
      loadDateAudit(currentDate);
    }
  }, [isOpen, currentDate]);

  const loadDateAudit = async (dateStr: string) => {
    setLoading(true);
    try {
      const res: any = await api.get(`/daily-reports/date-audit?date=${dateStr}`);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to load date audit:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateShift = (days: number) => {
    const [y, m, d] = currentDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const newStr = toLocalYMD(dateObj);
    setCurrentDate(newStr);
    if (onDateChange) onDateChange(newStr);
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setCurrentDate(val);
      if (onDateChange) onDateChange(val);
    }
  };

  const handleJumpToday = () => {
    const today = toLocalYMD(new Date());
    setCurrentDate(today);
    if (onDateChange) onDateChange(today);
  };

  const formattedDisplayDate = useMemo(() => {
    try {
      const [y, m, d] = currentDate.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return currentDate;
    }
  }, [currentDate]);

  const handleDownloadDateCsv = async () => {
    try {
      setDownloadingCsv(true);
      const token =
        localStorage.getItem("syncspace_token") ||
        localStorage.getItem("worktrack_token") ||
        "";
      const res = await fetch(
        `/api/v1/daily-reports/export?startDate=${currentDate}&endDate=${currentDate}&employeeId=ALL`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to export daily reports for this date");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SYNC_SPACE_Daily_Submissions_${currentDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Export date CSV error:", err);
      alert(err.message || "Failed to download daily report CSV for this date.");
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleCopyStandupSummary = () => {
    if (!data) return;
    const submittedCount = data.submittedCount || 0;
    const totalCount = data.totalActiveEmployees || 28;
    const rate = data.submissionRate || 0;
    const hours = data.totalHoursLogged || 0;

    let text = `📅 SYNC SPACE - DAILY SUBMISSIONS AUDIT\nDate: ${formattedDisplayDate} (${currentDate})\nCompliance: ${submittedCount} of ${totalCount} Submitted (${rate}%)\nTotal Productive Hours Logged: ${hours}h\n`;
    text += `====================================================\n\n`;

    if (data.submissions && data.submissions.length > 0) {
      text += `✅ SUBMITTED WORK (${submittedCount}):\n`;
      data.submissions.forEach((sub: any, idx: number) => {
        text += `\n${idx + 1}. ${sub.fullName} [${sub.employeeId}] - ${sub.department} (${sub.totalHours}h, Status: ${sub.status})\n`;
        if (sub.entries && sub.entries.length > 0) {
          sub.entries.forEach((entry: any, i: number) => {
            text += `   - Activity ${i + 1}: ${entry.activityTitle} (${entry.hoursSpent ? entry.hoursSpent + "h" : "No hours"}, ${entry.progressPercentage}%)\n`;
            if (entry.description) text += `     Summary: ${entry.description}\n`;
            if (entry.deliverables) text += `     Deliverables: ${entry.deliverables}\n`;
            if (entry.blockers) text += `     ⚠️ Blocker: ${entry.blockers}\n`;
          });
        }
      });
      text += `\n`;
    }

    if (data.missingEmployees && data.missingEmployees.length > 0) {
      text += `⏳ PENDING SUBMISSIONS (${data.missingEmployees.length}):\n`;
      data.missingEmployees.forEach((emp: any, idx: number) => {
        text += `${idx + 1}. ${emp.fullName} [${emp.employeeId}] - ${emp.department}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    if (!data?.submissions) return [];
    if (!searchQuery.trim()) return data.submissions;
    const q = searchQuery.toLowerCase();
    return data.submissions.filter((sub: any) => {
      const matchName = sub.fullName?.toLowerCase().includes(q);
      const matchId = sub.employeeId?.toLowerCase().includes(q);
      const matchDept = sub.department?.toLowerCase().includes(q);
      const matchEntries = sub.entries?.some(
        (e: any) =>
          e.activityTitle?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.deliverables?.toLowerCase().includes(q) ||
          e.blockers?.toLowerCase().includes(q)
      );
      return matchName || matchId || matchDept || matchEntries;
    });
  }, [data?.submissions, searchQuery]);

  // Filtered missing employees
  const filteredMissing = useMemo(() => {
    if (!data?.missingEmployees) return [];
    if (!searchQuery.trim()) return data.missingEmployees;
    const q = searchQuery.toLowerCase();
    return data.missingEmployees.filter((emp: any) => {
      const matchName = emp.fullName?.toLowerCase().includes(q);
      const matchId = emp.employeeId?.toLowerCase().includes(q);
      const matchDept = emp.department?.toLowerCase().includes(q);
      return matchName || matchId || matchDept;
    });
  }, [data?.missingEmployees, searchQuery]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Submissions Audit & Activity Breakdown"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Date Selector Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDateShift(-1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <input
                type="date"
                value={currentDate}
                onChange={handleDateSelect}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => handleDateShift(1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleJumpToday}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {formattedDisplayDate}
            </div>
            <div className="text-[10px] text-slate-400">
              Target Audit Date: <span className="font-mono">{currentDate}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Auditing employee submissions for {currentDate}...
            </p>
          </div>
        ) : !data ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Unable to load audit data for {currentDate}.
          </div>
        ) : (
          <>
            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Card 1: Submitted Staff */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Submitted
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                      data.submissionRate >= 80
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : data.submissionRate > 0
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {data.submissionRate}% Rate
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {data.submittedCount}
                  </span>
                  <span className="text-xs text-slate-400">
                    / {data.totalActiveEmployees} staff
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, data.submissionRate)}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Pending Staff */}
              <div
                className={`border rounded-xl p-3 shadow-2xs transition-colors ${
                  data.pendingCount > 0
                    ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pending / Late
                  </span>
                  {data.pendingCount === 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span
                    className={`text-2xl font-black ${
                      data.pendingCount > 0
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {data.pendingCount}
                  </span>
                  <span className="text-xs text-slate-400">awaiting sheets</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  {data.pendingCount === 0 ? "100% compliance reached" : "Needs reminder or follow-up"}
                </p>
              </div>

              {/* Card 3: Hours Logged */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Productive Hours
                  </span>
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {data.totalHoursLogged}h
                  </span>
                  <span className="text-xs text-slate-400">logged</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  {data.submittedCount > 0
                    ? `Avg ${(data.totalHoursLogged / data.submittedCount).toFixed(1)}h per sheet`
                    : "No hours recorded"}
                </p>
              </div>

              {/* Card 4: Total Activities */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Activities Logged
                  </span>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {data.totalActivitiesLogged}
                  </span>
                  <span className="text-xs text-slate-400">distinct items</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  {data.statusCounts?.APPROVED || 0} approved, {data.statusCounts?.SUBMITTED || 0} pending review
                </p>
              </div>
            </div>

            {/* Quick Actions & Export Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFilterTab("submitted")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    filterTab === "submitted"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Submitted ({data.submittedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("pending")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    filterTab === "pending"
                      ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Pending Submission ({data.pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("all")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    filterTab === "all"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  All Staff ({data.totalActiveEmployees})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyStandupSummary}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                  title="Copy formatted standup summary to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" /> Copy Briefing
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={downloadingCsv}
                  onClick={handleDownloadDateCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  title="Download all submissions for this date as a CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingCsv ? "Exporting..." : "Download Date CSV"}</span>
                </button>
              </div>
            </div>

            {/* Search filter input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by employee name, ID, department, activity title or deliverables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            {/* TAB CONTENT */}

            {/* 1. SUBMITTED TAB: What did they submit? */}
            {(filterTab === "submitted" || filterTab === "all") && (
              <div className="space-y-3">
                {filterTab === "all" && (
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                    <span>Submitted Task Sheets ({filteredSubmissions.length})</span>
                    <span className="text-[10px] text-slate-400">Detailed entries &amp; hours</span>
                  </div>
                )}

                {filteredSubmissions.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                    {searchQuery
                      ? "No submitted reports matching your search query."
                      : `Zero employee task sheets submitted for ${currentDate}.`}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {filteredSubmissions.map((sub: any) => (
                      <div
                        key={sub.reportId}
                        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs space-y-3"
                      >
                        {/* Employee Submissions Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {sub.fullName?.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {sub.fullName}
                                </span>
                                <span className="text-[11px] font-mono font-semibold text-slate-500">
                                  {sub.employeeId}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {sub.department}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                {sub.jobTitle}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {sub.totalHours}h logged
                            </span>
                            <Badge variant={sub.status} size="sm" />
                            <Link
                              to={`/reports/${sub.reportId}`}
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                              title="Open Full Report Details"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>

                        {/* Activities list: "What did they submit?" */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Submitted Activities ({sub.entries?.length || 0})
                          </span>

                          <div className="grid grid-cols-1 gap-2">
                            {sub.entries && sub.entries.length > 0 ? (
                              sub.entries.map((entry: any, eIdx: number) => (
                                <div
                                  key={entry.id || eIdx}
                                  className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-1.5"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="font-bold text-slate-900 dark:text-white">
                                      {eIdx + 1}. {entry.activityTitle}
                                      {entry.taskCode && (
                                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                                          {entry.taskCode}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-500">
                                      {entry.hoursSpent ? (
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                          {entry.hoursSpent}h
                                        </span>
                                      ) : null}
                                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                                        {entry.progressPercentage}%
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                    {entry.description}
                                  </p>

                                  {entry.deliverables && (
                                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/30 p-1.5 rounded border border-emerald-200/60 dark:border-emerald-900/40">
                                      <strong>Deliverables:</strong> {entry.deliverables}
                                    </div>
                                  )}

                                  {entry.blockers && (
                                    <div className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/30 p-1.5 rounded border border-rose-200/60 dark:border-rose-900/40 flex items-start gap-1.5">
                                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                                      <div>
                                        <strong>Blocker:</strong> {entry.blockers}
                                      </div>
                                    </div>
                                  )}

                                  {entry.nextDayPlan && (
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                      <strong>Next Day Plan:</strong> {entry.nextDayPlan}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">No entry rows provided.</p>
                            )}
                          </div>
                        </div>

                        {/* Supervisor Review Remarks if any */}
                        {sub.reviews && sub.reviews.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                            <span>
                              <strong>Reviewed by:</strong> {sub.reviews[0].reviewerName} ({sub.reviews[0].status})
                            </span>
                            <span className="italic text-slate-400">
                              "{sub.reviews[0].comments}"
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. PENDING SUBMISSION TAB: Who has NOT submitted? */}
            {(filterTab === "pending" || filterTab === "all") && (
              <div className="space-y-3">
                {filterTab === "all" && (
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between pt-2">
                    <span>Pending / Unsubmitted Staff ({filteredMissing.length})</span>
                    <span className="text-[10px] text-slate-400">Awaiting daily report</span>
                  </div>
                )}

                {filteredMissing.length === 0 ? (
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-8 text-center text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    All active employees have submitted their daily report for this date!
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto max-h-[380px]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200/80 dark:border-slate-800 sticky top-0">
                          <tr>
                            <th className="px-3.5 py-2.5">Employee</th>
                            <th className="px-3.5 py-2.5">ID</th>
                            <th className="px-3.5 py-2.5">Department</th>
                            <th className="px-3.5 py-2.5">Role</th>
                            <th className="px-3.5 py-2.5">Reporting Supervisor</th>
                            <th className="px-3.5 py-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredMissing.map((emp: any) => (
                            <tr key={emp.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="px-3.5 py-2.5 font-bold text-slate-900 dark:text-white">
                                {emp.fullName}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono text-slate-500">
                                {emp.employeeId}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-300">
                                {emp.department}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-500 text-[11px]">
                                {emp.jobTitle}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-500 text-[11px]">
                                {emp.teamLeadName || "Management"}
                              </td>
                              <td className="px-3.5 py-2.5 text-right">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                  NOT SUBMITTED
                                </span>
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
          </>
        )}
      </div>
    </Modal>
  );
};

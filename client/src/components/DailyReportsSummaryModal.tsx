import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { api } from "../services/api";
import {
  BarChart2,
  Download,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  RefreshCw,
  Sparkles,
  Building2,
  Calendar,
} from "lucide-react";

interface DailyReportsSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string;
  targetUserName?: string;
  onDownloadCsv: (userId?: string) => void;
}

export const DailyReportsSummaryModal: React.FC<DailyReportsSummaryModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
  onDownloadCsv,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSummary();
    }
  }, [isOpen, targetUserId]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const q = targetUserId && targetUserId !== "ALL" ? `employeeId=${targetUserId}` : "";
      const res: any = await api.get(`/daily-reports/summary?${q}`);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to load daily reports summary:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!data?.executiveSummaryText) return;
    navigator.clipboard.writeText(data.executiveSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!data) return;
    const isSingle = data.scope === "SINGLE_PERSON";
    const headerTitle = isSingle
      ? `${data.targetUser?.fullName} (${data.targetUser?.employeeId})`
      : "All Employees (Organization-Wide)";

    const content = `SYNC SPACE - EXECUTIVE DAILY REPORTS SUMMARY
============================================================
Scope: ${headerTitle}
Department: ${data.targetUser?.department?.name || "All Departments"}
Generated At: ${new Date().toLocaleString()}

EXECUTIVE BRIEFING:
-------------------
${data.executiveSummaryText}

KEY PERFORMANCE METRICS:
------------------------
- Total Task Sheets Logged: ${data.metrics.totalReports}
- Submission Compliance Rate: ${data.metrics.complianceRate}%
- Total Productive Hours Recorded: ${data.metrics.totalHoursRecorded}h (Avg ${data.metrics.avgHoursPerReport}h/sheet)
- Completed Activities: ${data.metrics.completedActivities} / ${data.metrics.totalActivities} (${data.metrics.inProgressActivities} in progress)
- Approved By Supervisor: ${data.metrics.approvedReports}
- Revision Requested: ${data.metrics.revisionRequestedReports}
- Pending Evaluation: ${data.metrics.submittedReports + data.metrics.underReviewReports}
- Operational Blockers: ${data.metrics.totalBlockers}

TOP ACTIVITIES RECORDED:
------------------------
${
  data.topActivities.length > 0
    ? data.topActivities
        .map((a: any, i: number) => `${i + 1}. ${a.title} (${a.count} occurrences, ${a.totalHours}h)`)
        .join("\n")
    : "No distinct activities recorded."
}

${
  data.recentBlockers.length > 0
    ? `FLAGGED OPERATIONAL BLOCKERS:
----------------------------
${data.recentBlockers
  .map((b: any, i: number) => `[${b.date}] ${b.employeeName} - ${b.title}: ${b.blocker}`)
  .join("\n")}`
    : "No operational blockers flagged."
}
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = isSingle
      ? data.targetUser.fullName.replace(/[^a-zA-Z0-9]/g, "_")
      : "Organization_Wide";
    a.download = `syncspace_reports_summary_${safeName}_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const isAll = !targetUserId || targetUserId === "ALL";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Executive Daily Reports Summary & Intelligence"
      maxWidth="2xl"
    >
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            Aggregating task sheet metrics and synthesizing report summary...
          </p>
        </div>
      ) : !data ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Unable to generate daily reports summary.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Scope Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                {isAll ? <Users className="w-4 h-4" /> : data.targetUser?.fullName?.[0] || "U"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {isAll ? "Organization-Wide (All Employees)" : data.targetUser?.fullName}
                  </h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {isAll ? "28 STAFF" : data.targetUser?.employeeId}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {isAll
                    ? "Aggregated evaluation across all MATRIX divisions"
                    : `${data.targetUser?.jobTitle} • ${data.targetUser?.department?.name || "Corporate"}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => onDownloadCsv(targetUserId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Download detailed CSV dataset"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Sheets
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {data.metrics.totalReports}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {data.metrics.complianceRate}% rate
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Productive Hours
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                  {data.metrics.totalHoursRecorded}h
                </span>
                <span className="text-[10px] text-slate-400">
                  ~{data.metrics.avgHoursPerReport}h/sheet
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Activities
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {data.metrics.completedActivities}
                </span>
                <span className="text-[10px] text-slate-400">
                  of {data.metrics.totalActivities} completed
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Blockers Logged
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span
                  className={`text-xl font-extrabold ${
                    data.metrics.totalBlockers > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {data.metrics.totalBlockers}
                </span>
                <span className="text-[10px] text-slate-400">
                  {data.metrics.totalBlockers === 0 ? "All clear" : "Urgent"}
                </span>
              </div>
            </div>
          </div>

          {/* Executive Briefing Text */}
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Executive Synthesis &amp; Briefing</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-xs font-semibold hover:bg-indigo-50 shadow-xs transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-xs font-semibold hover:bg-indigo-50 shadow-xs transition-colors cursor-pointer"
                  title="Download briefing as text file"
                >
                  <Download className="w-3 h-3" /> Save .txt
                </button>
              </div>
            </div>

            <p className="text-xs text-indigo-950 dark:text-indigo-100 leading-relaxed font-normal">
              {data.executiveSummaryText}
            </p>
          </div>

          {/* Review Status Distribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Top Activities */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Top Activities Tracked
                </span>
                <span className="text-[10px] text-slate-400">Occurrences &amp; Hours</span>
              </div>

              {data.topActivities.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No activity breakdown logged.</p>
              ) : (
                <div className="space-y-1.5">
                  {data.topActivities.map((act: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-0"
                    >
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]">
                        {idx + 1}. {act.title}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                          {act.count}x
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 font-semibold">
                          {act.totalHours > 0 ? `${act.totalHours}h` : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approval Breakdown */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Review &amp; Evaluation Status
                </span>
                <span className="text-[10px] text-slate-400">Decisions</span>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Approved by Supervisor
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {data.statusDistribution.APPROVED}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Submitted (Awaiting Review)
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {data.statusDistribution.SUBMITTED + data.statusDistribution.UNDER_REVIEW}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Revision Requested
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {data.statusDistribution.REVISION_REQUESTED}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> In Progress Drafts
                  </span>
                  <span className="font-bold text-slate-600 dark:text-slate-400">
                    {data.statusDistribution.DRAFT}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Blockers List (if any) */}
          {data.recentBlockers.length > 0 && (
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Active Operational Blockers ({data.recentBlockers.length})</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {data.recentBlockers.map((b: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-800/60 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-rose-900 dark:text-rose-300">
                      <span>{b.employeeName} — {b.title}</span>
                      <span className="text-[10px] text-slate-400">{b.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      {b.blocker}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">
              Reports database up to date • SYNC SPACE Platform
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
            >
              Close Summary
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

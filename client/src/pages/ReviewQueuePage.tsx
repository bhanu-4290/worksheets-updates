import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Badge } from "../components/Badge";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageSquare,
  Clock,
  Filter,
  Check,
  RotateCcw,
  User,
  Building2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Send,
} from "lucide-react";

export const ReviewQueuePage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Review Actions
  const [approveComments, setApproveComments] = useState("Acknowledged and approved.");
  const [revisionComments, setRevisionComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadReviewQueue();
  }, [statusFilter]);

  const loadReviewQueue = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/reviews/queue?status=${statusFilter}` : "/reviews/queue";
      const res: any = await api.get(url);
      if (res.success) {
        const data = res.data || [];
        setReports(data);
        if (data.length > 0 && !selectedReportId) {
          setSelectedReportId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load review queue:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.user?.fullName?.toLowerCase().includes(q) ||
      r.user?.employeeId?.toLowerCase().includes(q) ||
      r.reportingDate?.includes(q) ||
      r.user?.jobTitle?.toLowerCase().includes(q)
    );
  });

  const selectedReport = reports.find((r) => r.id === selectedReportId) || filtered[0] || null;

  const handleApprove = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await api.post(`/reviews/${selectedReport.id}/approve`, { comments: approveComments });
      setActionMessage({ type: "success", text: `Report for ${selectedReport.reportingDate} approved successfully!` });
      loadReviewQueue();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Approval failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!selectedReport) return;
    if (!revisionComments.trim()) {
      setActionMessage({ type: "error", text: "Mandatory comments are required when requesting revisions." });
      return;
    }
    setActionLoading(true);
    setActionMessage(null);
    try {
      await api.post(`/reviews/${selectedReport.id}/request-revision`, {
        comments: revisionComments.trim(),
      });
      setActionMessage({ type: "success", text: "Correction requested. Notification sent to employee." });
      setRevisionComments("");
      loadReviewQueue();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to request correction" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Report Review Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Supervisory evaluation console: acknowledge submissions, inspect task hours, and provide feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Task Sheet Calendar</span>
          </Link>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: "All Submissions" },
            { id: "SUBMITTED", label: "Awaiting Review" },
            { id: "REVISION_REQUESTED", label: "Revision Requested" },
            { id: "APPROVED", label: "Approved" },
            { id: "DRAFT", label: "Drafts" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-56"
          />
        </div>
      </div>

      {/* Split View Container */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-md animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        /* Useful Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Review Queue is All Caught Up
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            No submissions requiring action match "{statusFilter}". All daily work sheets in your scope are acknowledged.
          </p>
          <button
            onClick={() => setStatusFilter("ALL")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> View All Submitted Sheets
          </button>
        </div>
      ) : (
        /* ======================================================== */
        /* SPLIT VIEW: MASTER LIST ON LEFT, DETAIL ON RIGHT */
        /* ======================================================== */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Left Column: Report Queue List */}
          <div className="md:col-span-5 lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 shadow-xs max-h-[750px] overflow-y-auto space-y-1.5">
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
              <span>Submissions ({filtered.length})</span>
              <span>Select to inspect</span>
            </div>

            {filtered.map((r) => {
              const isSelected = selectedReport?.id === r.id;
              const initials = r.user?.fullName
                ?.split(" ")
                .filter(Boolean)
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("") || "EM";

              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedReportId(r.id);
                    setActionMessage(null);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-xs border-l-4 border-l-blue-600"
                      : "bg-white dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {r.user?.fullName}
                        </h4>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {r.user?.jobTitle}
                        </span>
                      </div>
                    </div>
                    <Badge variant={r.status} size="sm" />
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> {r.reportingDate}
                    </span>
                    <span className="font-mono text-slate-400">
                      {r.totalHoursRecorded ? `${r.totalHoursRecorded}h` : "Hours unlogged"}
                    </span>
                  </div>

                  {r.blockers && r.blockers.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{r.blockers.length} Blocker(s) reported</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Report Review Detail */}
          <div className="md:col-span-7 lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            {selectedReport ? (
              <>
                {/* Detail Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                      {selectedReport.user?.fullName
                        ?.split(" ")
                        .filter(Boolean)
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          {selectedReport.user?.fullName}
                        </h2>
                        <Badge variant={selectedReport.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedReport.user?.jobTitle} • {selectedReport.user?.department?.name || "Operations"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/reports/${selectedReport.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Full Page
                    </Link>
                  </div>
                </div>

                {/* Status Message */}
                {actionMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      actionMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
                        : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
                    }`}
                  >
                    {actionMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{actionMessage.text}</span>
                  </div>
                )}

                {/* Supervisor Review Action Box */}
                <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <ClipboardCheck className="w-4 h-4 text-blue-600" /> Supervisory Review &amp; Evaluation
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      Reporting Date: <strong>{selectedReport.reportingDate}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Approve form */}
                    <div className="space-y-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800">
                      <label className="block text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                        Approve Sheet
                      </label>
                      <input
                        type="text"
                        value={approveComments}
                        onChange={(e) => setApproveComments(e.target.value)}
                        placeholder="Acknowledgement comments..."
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                      />
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Acknowledge &amp; Approve</span>
                      </button>
                    </div>

                    {/* Request correction form */}
                    <div className="space-y-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800">
                      <label className="block text-[11px] font-bold uppercase text-amber-700 dark:text-amber-400">
                        Request Revisions
                      </label>
                      <input
                        type="text"
                        value={revisionComments}
                        onChange={(e) => setRevisionComments(e.target.value)}
                        placeholder="Feedback on what needs correction..."
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                      />
                      <button
                        onClick={handleRequestRevision}
                        disabled={actionLoading}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Return for Revision</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Activities Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>Activities Completed ({selectedReport.entries?.length || 0})</span>
                    <span className="font-mono text-slate-500">
                      Total Hours: {selectedReport.totalHoursRecorded ? `${selectedReport.totalHoursRecorded} hrs` : "N/A"}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedReport.entries?.map((entry: any, idx: number) => (
                      <div
                        key={entry.id || idx}
                        className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {idx + 1}. {entry.activityTitle}
                            </span>
                            {entry.task && (
                              <span className="ml-2 font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                                [{entry.task.taskCode}]
                              </span>
                            )}
                          </div>
                          <Badge variant={entry.status} size="sm" />
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 text-xs">
                          {entry.description}
                        </p>

                        {entry.deliverables && (
                          <div className="text-[11px] text-slate-500">
                            <strong>Deliverables:</strong> {entry.deliverables}
                          </div>
                        )}

                        {entry.blockers && (
                          <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[11px] flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                            <div>
                              <strong>Blocker:</strong> {entry.blockers}
                              {entry.supportRequired && (
                                <div className="mt-0.5">
                                  <strong>Support Required:</strong> {entry.supportRequired}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Progress: {entry.progressPercentage}%</span>
                          <span>Recorded: {entry.hoursSpent ? `${entry.hoursSpent} hrs` : "N/A"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">
                Select a report from the left list to inspect details and perform review.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

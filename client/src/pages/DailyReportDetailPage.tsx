import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { DailyReport } from "../types";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  MessageSquare,
  Shield,
  History,
  FileCheck,
} from "lucide-react";

export const DailyReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveComments, setApproveComments] = useState("Acknowledged and approved.");

  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionComments, setRevisionComments] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/daily-reports/${id}`);
      if (res.success) setReport(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.post(`/reviews/${id}/approve`, { comments: approveComments });
      setShowApproveModal(false);
      loadReport();
    } catch (err: any) {
      alert(err.message || "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionComments.trim()) {
      alert("Mandatory comment is required when requesting revisions.");
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/reviews/${id}/request-revision`, { comments: revisionComments });
      setShowRevisionModal(false);
      loadReport();
    } catch (err: any) {
      alert(err.message || "Revision request failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-6 text-center text-xs text-rose-800 dark:text-rose-300">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-semibold">{error || "Report not found"}</p>
        <Link to="/reports" className="inline-block mt-3 text-indigo-600 underline">
          Back to Reports
        </Link>
      </div>
    );
  }

  const isOwnReport = report.userId === user?.id;
  const canReview =
    (user?.role === "TEAM_LEAD" || user?.role === "SUPER_ADMIN") &&
    !isOwnReport &&
    (report.status === "SUBMITTED" || report.status === "UNDER_REVIEW");

  const totalRecordedHours = report.entries.reduce(
    (sum, e) => (e.hoursSpent ? sum + e.hoursSpent : sum),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Daily Report: {report.reportingDate}
              </h1>
              <Badge variant={report.status} label={report.status.replace("_", " ")} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Submitted by {report.user.fullName} ({report.user.jobTitle}) •{" "}
              {report.user.department?.name}
            </p>
          </div>
        </div>

        {/* Review Actions for Team Lead */}
        {canReview && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowRevisionModal(true)}
              className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold text-xs hover:bg-rose-100 transition-colors"
            >
              Request Revision
            </button>
            <button
              onClick={() => setShowApproveModal(true)}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Acknowledge & Approve
            </button>
          </div>
        )}

        {isOwnReport && report.status === "REVISION_REQUESTED" && (
          <Link
            to={`/reports/new?date=${report.reportingDate}`}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors"
          >
            Revise & Resubmit Report
          </Link>
        )}
      </div>

      {/* Review Feedback Banner */}
      {report.reviews && report.reviews.length > 0 && (
        <div
          className={`p-5 rounded-2xl border text-xs ${
            report.status === "APPROVED"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>Team Lead Review Feedback ({report.reviews[0].reviewer.fullName}):</span>
          </div>
          <p className="mt-1 text-sm font-medium italic">"{report.reviews[0].comments}"</p>
          <div className="text-[10px] text-slate-500 mt-2">
            Reviewed at {new Date(report.reviews[0].createdAt).toLocaleString()}
          </div>
        </div>
      )}

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Activities Reported</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {report.entries.length} entries
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Recorded Hours (Optional)</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {totalRecordedHours > 0 ? `${totalRecordedHours} hrs` : "Unreported"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Submission Timestamp</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {report.submittedAt ? new Date(report.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Draft"}
          </p>
        </div>
      </div>

      {/* Activities Detail Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Reported Activities
        </h2>

        {report.entries.map((entry, idx) => (
          <div
            key={entry.id || idx}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {entry.activityTitle}
                  </h3>
                  <Badge variant={entry.status as any} size="sm" />
                </div>
                {entry.task && (
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-mono font-medium">
                    Linked Task: {entry.task.taskCode} — {entry.task.title}
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {entry.progressPercentage}% Progress
                </span>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {entry.hoursSpent ? `${entry.hoursSpent} hrs` : "Hours: Unreported"}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Detailed Description:
              </h4>
              <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 leading-relaxed whitespace-pre-wrap">
                {entry.description}
              </p>
            </div>

            {/* Sub-grid for Deliverables and Blockers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {entry.deliverables && (
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                    Deliverables & Accomplishments:
                  </span>
                  <p className="text-xs text-emerald-900 dark:text-emerald-200 mt-0.5">
                    {entry.deliverables}
                  </p>
                </div>
              )}

              {entry.blockers && (
                <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                  <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300">
                    Blockers & Challenges:
                  </span>
                  <p className="text-xs text-rose-900 dark:text-rose-200 mt-0.5">
                    {entry.blockers}
                  </p>
                </div>
              )}
            </div>

            {entry.nextDayPlan && (
              <div className="text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Next Day's Plan:
                </span>{" "}
                {entry.nextDayPlan}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revision History Snapshots */}
      {report.revisionHistory && report.revisionHistory.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Revision History Log
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {report.revisionHistory.map((rev) => (
              <div key={rev.id} className="py-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Revision #{rev.revisionNumber}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {new Date(rev.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-500 mt-0.5">{rev.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Acknowledge & Approve Daily Report"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You are acknowledging this report for <strong>{report.user.fullName}</strong>. Your
            reviewer identity and timestamp will be recorded permanently in the audit trail.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Feedback Comments (Optional)
            </label>
            <textarea
              rows={3}
              value={approveComments}
              onChange={(e) => setApproveComments(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setShowApproveModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              disabled={actionLoading}
              onClick={handleApprove}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
            >
              {actionLoading ? "Approving..." : "Confirm Approval"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Revision Request Modal */}
      <Modal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        title="Request Corrections from Employee"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300">
            Mandatory comment required. Please specify what needs correction or clarification.
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mandatory Feedback Comments *
            </label>
            <textarea
              rows={4}
              required
              placeholder="e.g. Please clarify test coverage and provide pull request reference link."
              value={revisionComments}
              onChange={(e) => setRevisionComments(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setShowRevisionModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              disabled={actionLoading || !revisionComments.trim()}
              onClick={handleRequestRevision}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {actionLoading ? "Submitting..." : "Send Correction Request"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

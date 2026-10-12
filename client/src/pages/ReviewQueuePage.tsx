import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
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
} from "lucide-react";

export const ReviewQueuePage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");

  // Review Modals
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveComments, setApproveComments] = useState("Acknowledged and approved.");

  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionComments, setRevisionComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadReviewQueue();
  }, [statusFilter]);

  const loadReviewQueue = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/reviews/queue?status=${statusFilter}` : "/reviews/queue";
      const res: any = await api.get(url);
      if (res.success) setReports(res.data || []);
    } catch (err) {
      console.error("Failed to load review queue:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReportId) return;
    setActionLoading(true);
    try {
      await api.post(`/reviews/${selectedReportId}/approve`, { comments: approveComments });
      setShowApproveModal(false);
      setSelectedReportId(null);
      loadReviewQueue();
    } catch (err: any) {
      alert(err.message || "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!selectedReportId || !revisionComments.trim()) {
      alert("Mandatory comment is required when requesting revisions.");
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/reviews/${selectedReportId}/request-revision`, {
        comments: revisionComments,
      });
      setShowRevisionModal(false);
      setSelectedReportId(null);
      loadReviewQueue();
    } catch (err: any) {
      alert(err.message || "Correction request failed");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.user?.fullName?.toLowerCase().includes(q) ||
      r.user?.employeeId?.toLowerCase().includes(q) ||
      r.reportingDate?.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Report Review Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review daily activity logs submitted by subordinate team members. Acknowledge or request revisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee or date..."
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
            <option value="SUBMITTED">Awaiting Review</option>
            <option value="REVISION_REQUESTED">Revision Requested</option>
            <option value="APPROVED">Already Approved</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-slate-400 text-xs">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">Queue is Clear</p>
          <p className="mt-1">No reports pending review matching current filter.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Employee</th>
                  <th className="px-6 py-3.5 font-bold">Date</th>
                  <th className="px-6 py-3.5 font-bold">Activities</th>
                  <th className="px-6 py-3.5 font-bold">Recorded Hours</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold">Blockers</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {r.user.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {r.user.employeeId} • {r.user.jobTitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      {r.reportingDate}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {r.entriesCount} activities
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono">
                      {r.totalHoursRecorded ? `${r.totalHoursRecorded}h` : "Unreported"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={r.status} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      {r.blockers?.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" /> {r.blockers.length} Blocker(s)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/reports/${r.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Inspect Report"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {r.status !== "APPROVED" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedReportId(r.id);
                                setShowRevisionModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-[11px] font-semibold"
                            >
                              Request Revision
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReportId(r.id);
                                setShowApproveModal(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold shadow-sm flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            Confirm approval of daily report. The submission status will be set to <strong>APPROVED</strong> and recorded with your reviewer credentials.
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
        title="Request Corrections with Mandatory Comment"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300">
            Mandatory comment required. Please specify what corrections are needed so the employee can resubmit.
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Feedback Comments *
            </label>
            <textarea
              rows={4}
              required
              placeholder="e.g. Please specify the deliverables achieved and provide links to the repository PR."
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
              {actionLoading ? "Sending..." : "Submit Correction Request"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

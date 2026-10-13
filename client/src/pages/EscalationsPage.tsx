import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { BlockerEscalation, EscalationStatus, EscalationUrgency, Department, User } from "../types";
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  User as UserIcon,
} from "lucide-react";

export const EscalationsPage: React.FC = () => {
  const { user } = useAuth();
  const [escalations, setEscalations] = useState<BlockerEscalation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("");

  // Create Escalation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newEscalation, setNewEscalation] = useState({
    title: "",
    description: "",
    urgency: "HIGH" as EscalationUrgency,
    departmentId: user?.departmentId || "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Resolve / Update Modal
  const [selectedEscalation, setSelectedEscalation] = useState<BlockerEscalation | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveStatus, setResolveStatus] = useState<EscalationStatus>("RESOLVED");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [assignedOwnerId, setAssignedOwnerId] = useState("");
  const [deptUsers, setDeptUsers] = useState<User[]>([]);
  const [resolveLoading, setResolveLoading] = useState(false);

  useEffect(() => {
    loadEscalations();
    loadDepartments();
  }, [statusFilter, urgencyFilter]);

  const loadEscalations = async () => {
    setLoading(true);
    try {
      let q = "";
      if (statusFilter) q += `status=${statusFilter}&`;
      if (urgencyFilter) q += `urgency=${urgencyFilter}&`;
      const res: any = await api.get(`/escalations?${q}`);
      if (res.success) setEscalations(res.data || []);
    } catch (err) {
      console.error("Failed to load escalations:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const res: any = await api.get("/departments");
      if (res.success) setDepartments(res.data || []);
      const uRes: any = await api.get("/users");
      if (uRes.success) setDeptUsers(uRes.data || []);
    } catch {
      // Ignored
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.post("/escalations", newEscalation);
      setShowCreateModal(false);
      setNewEscalation({
        title: "",
        description: "",
        urgency: "HIGH",
        departmentId: user?.departmentId || "",
      });
      loadEscalations();
    } catch (err: any) {
      alert(err.message || "Failed to create escalation");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEscalation) return;
    setResolveLoading(true);
    try {
      await api.patch(`/escalations/${selectedEscalation.id}/resolve`, {
        status: resolveStatus,
        resolutionNotes,
        assignedOwnerId: assignedOwnerId || undefined,
      });
      setShowResolveModal(false);
      setSelectedEscalation(null);
      setResolutionNotes("");
      loadEscalations();
    } catch (err: any) {
      alert(err.message || "Failed to update escalation");
    } finally {
      setResolveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Blocker Escalation Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track and resolve critical engineering and operational blockers escalated by Team Leads.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Escalate New Blocker
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED_TO_ADMIN">Escalated to Super Admin</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
          >
            <option value="">All Urgencies</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>
        <span className="text-slate-400 font-medium">
          Found {escalations.length} escalations
        </span>
      </div>

      {/* Escalations Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-md animate-spin" />
        </div>
      ) : escalations.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-10 text-center text-slate-400 text-xs">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            No Active Escalations
          </p>
          <p className="mt-1">All department blockers have been handled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {escalations.map((esc) => (
            <div
              key={esc.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={esc.urgency} size="sm" />
                    <Badge variant={esc.status} size="sm" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                    {esc.title}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Department: {esc.department?.name}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {esc.description}
              </p>

              {esc.resolutionNotes && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    Resolution Note:
                  </span>
                  <p className="text-emerald-900 dark:text-emerald-200 mt-0.5">
                    {esc.resolutionNotes}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div>
                  <span>Escalated by {esc.escalatedBy?.fullName}</span>
                  <div className="text-[10px]">
                    {new Date(esc.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {(user?.role === "MANAGER" || user?.role === "SUPER_ADMIN") && (
                  <button
                    onClick={() => {
                      setSelectedEscalation(esc);
                      setResolutionNotes(esc.resolutionNotes || "");
                      setResolveStatus(
                        esc.status === "OPEN" ? "IN_PROGRESS" : (esc.status as EscalationStatus)
                      );
                      setShowResolveModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 transition-colors"
                  >
                    Manage / Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Escalation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Escalate Blocker to Department Manager"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Blocker Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Third-party OAuth API 500 error preventing login"
              value={newEscalation.title}
              onChange={(e) => setNewEscalation({ ...newEscalation, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Impact & Root Cause *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Explain the blocker, who is affected, and what management intervention is needed..."
              value={newEscalation.description}
              onChange={(e) =>
                setNewEscalation({ ...newEscalation, description: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <select
                required
                value={newEscalation.departmentId}
                onChange={(e) =>
                  setNewEscalation({ ...newEscalation, departmentId: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
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
                Urgency *
              </label>
              <select
                value={newEscalation.urgency}
                onChange={(e) =>
                  setNewEscalation({
                    ...newEscalation,
                    urgency: e.target.value as EscalationUrgency,
                  })
                }
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical (Impacting Releases)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {createLoading ? "Submitting..." : "Escalate Blocker"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Resolve / Manage Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="Manage & Resolve Blocker Escalation"
      >
        <form onSubmit={handleResolve} className="space-y-4">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
            <span className="font-bold text-slate-900 dark:text-white">
              {selectedEscalation?.title}
            </span>
            <p className="text-slate-500">{selectedEscalation?.description}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Escalation Status *
            </label>
            <select
              value={resolveStatus}
              onChange={(e) => setResolveStatus(e.target.value as EscalationStatus)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            >
              <option value="IN_PROGRESS">In Progress (Acknowledged)</option>
              <option value="RESOLVED">Resolved</option>
              <option value="ESCALATED_TO_ADMIN">Re-escalate to Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assign Action Owner (Optional)
            </label>
            <select
              value={assignedOwnerId}
              onChange={(e) => setAssignedOwnerId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            >
              <option value="">-- Keep Current Owner --</option>
              {deptUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Resolution Note / Action Taken *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Detail the management decision, root cause fix, or administrative escalation reason..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowResolveModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resolveLoading}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {resolveLoading ? "Saving..." : "Save Resolution"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

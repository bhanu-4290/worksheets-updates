import React, { useState, useEffect } from "react";
import {
  announcementService,
  AnnouncementItem,
  CreateAnnouncementInput,
} from "../services/announcement.service";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  Megaphone,
  Pin,
  Plus,
  Trash2,
  Calendar,
  Building,
  Users,
  AlertCircle,
  X,
  CheckCircle2,
} from "lucide-react";

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState<CreateAnnouncementInput>({
    title: "",
    content: "",
    priority: "NORMAL",
    targetScope: "ALL",
    departmentId: null,
    teamId: null,
    isPinned: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementService.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScopes = async () => {
    try {
      const [deptRes, teamRes] = await Promise.all([
        api.get<{ success: boolean; data: any[] }>("/departments"),
        api.get<{ success: boolean; data: any[] }>("/teams"),
      ]);
      setDepartments(deptRes.data || []);
      setTeams(teamRes.data || []);
    } catch (err) {
      console.error("Error loading departments/teams for announcement scope:", err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchScopes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await announcementService.createAnnouncement(formData);
      setIsModalOpen(false);
      setFormData({
        title: "",
        content: "",
        priority: "NORMAL",
        targetScope: "ALL",
        departmentId: null,
        teamId: null,
        isPinned: false,
      });
      fetchAnnouncements();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to publish announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await announcementService.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete announcement:", err);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      const updated = await announcementService.togglePin(id);
      setAnnouncements((prev) =>
        prev
          .map((a) => (a.id === id ? { ...a, isPinned: updated.isPinned } : a))
          .sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
      );
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200";
      case "HIGH":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200";
      case "LOW":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200";
    }
  };

  const canCreate = !!user;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold mb-3">
            <Megaphone className="w-3.5 h-3.5" />
            Company & Team Bulletins
          </div>
          <h1 className="text-2xl font-black tracking-tight">Official Announcements</h1>
          <p className="text-sm text-indigo-100 mt-1 max-w-xl">
            Stay updated with corporate notices, sprint deadlines, infrastructure schedules, and team updates.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        )}
      </div>

      {/* Announcements Stream */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            No Active Announcements
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no company-wide or departmental notices published for your account.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => {
            const canManage =
              user?.role === "SUPER_ADMIN" ||
              user?.role === "MANAGER" ||
              user?.role === "TEAM_LEAD" ||
              item.authorId === user?.id;

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-6 relative ${
                  item.isPinned
                    ? "border-indigo-300 dark:border-indigo-700/60 shadow-xs ring-1 ring-indigo-500/10"
                    : "border-slate-200 dark:border-slate-800 shadow-xs"
                }`}
              >
                {/* Top metadata row */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-[10px] font-bold">
                        <Pin className="w-3 h-3 fill-indigo-600" />
                        PINNED
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${getPriorityBadge(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                      {item.targetScope === "ALL" && "🌐 Company-Wide"}
                      {item.targetScope === "DEPARTMENT" && `🏢 Dept: ${item.department?.name || "Department"}`}
                      {item.targetScope === "TEAM" && `👥 Team: ${item.team?.name || "Team"}`}
                    </span>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePin(item.id)}
                        className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                          item.isPinned
                            ? "text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                        title={item.isPinned ? "Unpin Announcement" : "Pin Announcement"}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Announcement Title */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>

                {/* Content */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line mb-4">
                  {item.content}
                </p>

                {/* Footer details */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                      {item.author.fullName.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.author.fullName}
                    </span>
                    <span>• {item.author.jobTitle}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Publish New Announcement
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Scheduled Network Maintenance or All-Hands Meeting"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Priority & Target Scope */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e: any) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Audience Scope
                  </label>
                  <select
                    value={formData.targetScope}
                    onChange={(e: any) => setFormData({ ...formData, targetScope: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">Company-Wide (All Employees)</option>
                    <option value="DEPARTMENT">Department-Specific</option>
                    <option value="TEAM">Team-Specific</option>
                  </select>
                </div>
              </div>

              {/* Department Selector */}
              {formData.targetScope === "DEPARTMENT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Department
                  </label>
                  <select
                    value={formData.departmentId || ""}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value || null })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Team Selector */}
              {formData.targetScope === "TEAM" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Team
                  </label>
                  <select
                    value={formData.teamId || ""}
                    onChange={(e) => setFormData({ ...formData, teamId: e.target.value || null })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Team...</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pinned Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="pinCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Pin this announcement to the top
                </label>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter the full message for employees..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  {submitting ? "Publishing..." : "Publish Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  Globe,
  AlertCircle,
  X,
  Paperclip,
  Upload,
  Download,
  Eye,
  RefreshCw,
} from "lucide-react";

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
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
    attachmentUrl: null,
    attachmentName: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Attachment must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        attachmentUrl: reader.result as string,
        attachmentName: file.name,
      }));
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read the selected file.");
    };
    reader.readAsDataURL(file);
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await announcementService.getAnnouncements();
      const list = Array.isArray(data) ? data : [];
      setAnnouncements(list);

      const openId = searchParams.get("id");
      if (openId) {
        const found = list.find((a) => a.id === openId);
        if (found) {
          setSelectedAnnouncement(found);
        }
      }
    } catch (err: any) {
      console.error("Failed to load announcements:", err);
      setLoadError(err.message || "Unable to load announcements. Please click Refresh.");
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
        attachmentUrl: null,
        attachmentName: null,
      });
      fetchAnnouncements();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to publish announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await announcementService.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      if (selectedAnnouncement?.id === id) {
        setSelectedAnnouncement(null);
      }
    } catch (err) {
      console.error("Failed to delete announcement:", err);
    }
  };

  const handleTogglePin = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const updated = await announcementService.togglePin(id);
      setAnnouncements((prev) =>
        prev
          .map((a) => (a.id === id ? { ...a, isPinned: updated.isPinned } : a))
          .sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
      );
      if (selectedAnnouncement?.id === id) {
        setSelectedAnnouncement((prev) =>
          prev ? { ...prev, isPinned: updated.isPinned } : null
        );
      }
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const closeDetailModal = () => {
    setSelectedAnnouncement(null);
    if (searchParams.has("id")) {
      searchParams.delete("id");
      setSearchParams(searchParams, { replace: true });
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
      <div className="rounded-lg bg-slate-900 border border-slate-800 p-6 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600/20 text-blue-200 text-[11px] font-bold uppercase tracking-wider border border-blue-500/30 mb-2">
            <Megaphone className="w-3.5 h-3.5 text-blue-300" />
            Company &amp; Team Bulletins
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Official Announcements</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Internal corporate notices, reporting schedules, and department updates. Click any announcement card to open its full details.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchAnnouncements}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-md text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Announcements"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Announcement
            </button>
          )}
        </div>
      </div>

      {/* Announcements Stream */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400 font-medium">Loading announcements...</div>
      ) : loadError ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-rose-200 dark:border-rose-900/60 p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Could Not Load Announcements
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {loadError}
          </p>
          <button
            onClick={fetchAnnouncements}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-10 text-center">
          <Megaphone className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
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
                onClick={() => setSelectedAnnouncement(item)}
                className={`bg-white dark:bg-slate-900 rounded-lg border transition-colors p-5 relative cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 ${
                  item.isPinned
                    ? "border-blue-500/60 dark:border-blue-600/60 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 shadow-xs"
                }`}
              >
                {/* Top metadata row */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.isPinned && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                        <Pin className="w-3 h-3 fill-white" />
                        PINNED
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase border ${getPriorityBadge(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                      {item.targetScope === "ALL" && (
                        <>
                          <Globe className="w-3 h-3 text-blue-600" /> Company-Wide
                        </>
                      )}
                      {item.targetScope === "DEPARTMENT" && (
                        <>
                          <Building className="w-3 h-3 text-blue-600" /> Dept: {item.department?.name || "Department"}
                        </>
                      )}
                      {item.targetScope === "TEAM" && (
                        <>
                          <Users className="w-3 h-3 text-blue-600" /> Team: {item.team?.name || "Team"}
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAnnouncement(item);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Open
                    </button>
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleTogglePin(item.id, e)}
                          className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                            item.isPinned
                              ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                          title={item.isPinned ? "Unpin Announcement" : "Pin Announcement"}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Announcement Title */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>

                {/* Content */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line mb-4">
                  {item.content}
                </p>

                {/* Attachment Display */}
                {item.attachmentUrl && (
                  <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                    {item.attachmentUrl.startsWith("data:image/") ? (
                      <div className="space-y-2">
                        <img
                          src={item.attachmentUrl}
                          alt={item.attachmentName || item.title}
                          className="max-h-72 rounded-md border border-slate-200 dark:border-slate-800 object-contain bg-slate-50 dark:bg-slate-950"
                        />
                        <a
                          href={item.attachmentUrl}
                          download={item.attachmentName || "announcement-image"}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download {item.attachmentName || "Image"}
                        </a>
                      </div>
                    ) : (
                      <a
                        href={item.attachmentUrl}
                        download={item.attachmentName || "attachment"}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Paperclip className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-xs">{item.attachmentName || "Download Attachment"}</span>
                        <Download className="w-3.5 h-3.5 shrink-0 ml-1" />
                      </a>
                    )}
                  </div>
                )}

                {/* Footer details */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                      {item.author?.fullName?.charAt(0) || "U"}
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.author?.fullName || "User"}
                    </span>
                    {item.author?.jobTitle && <span>• {item.author.jobTitle}</span>}
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

      {/* View / Open Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div
          onClick={closeDetailModal}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-lg max-w-xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                {selectedAnnouncement.isPinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                    <Pin className="w-3 h-3 fill-white" />
                    PINNED
                  </span>
                )}
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase border ${getPriorityBadge(
                    selectedAnnouncement.priority
                  )}`}
                >
                  {selectedAnnouncement.priority}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                  {selectedAnnouncement.targetScope === "ALL" && (
                    <>
                      <Globe className="w-3 h-3 text-blue-600" /> Company-Wide
                    </>
                  )}
                  {selectedAnnouncement.targetScope === "DEPARTMENT" && (
                    <>
                      <Building className="w-3 h-3 text-blue-600" /> Dept:{" "}
                      {selectedAnnouncement.department?.name || "Department"}
                    </>
                  )}
                  {selectedAnnouncement.targetScope === "TEAM" && (
                    <>
                      <Users className="w-3 h-3 text-blue-600" /> Team:{" "}
                      {selectedAnnouncement.team?.name || "Team"}
                    </>
                  )}
                </span>
              </div>
              <button
                onClick={closeDetailModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedAnnouncement.title}
              </h2>

              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    {selectedAnnouncement.author?.fullName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedAnnouncement.author?.fullName || "User"}
                    </span>
                    {selectedAnnouncement.author?.jobTitle && (
                      <span className="text-slate-400"> • {selectedAnnouncement.author.jobTitle}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(selectedAnnouncement.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(selectedAnnouncement.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {selectedAnnouncement.content}
              </div>

              {selectedAnnouncement.attachmentUrl && (
                <div className="pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Attachment
                  </div>
                  {selectedAnnouncement.attachmentUrl.startsWith("data:image/") ? (
                    <div className="space-y-2">
                      <img
                        src={selectedAnnouncement.attachmentUrl}
                        alt={selectedAnnouncement.attachmentName || selectedAnnouncement.title}
                        className="max-h-96 w-full rounded-md border border-slate-200 dark:border-slate-800 object-contain bg-slate-50 dark:bg-slate-950"
                      />
                      <a
                        href={selectedAnnouncement.attachmentUrl}
                        download={selectedAnnouncement.attachmentName || "announcement-image"}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download {selectedAnnouncement.attachmentName || "Image"}
                      </a>
                    </div>
                  ) : (
                    <a
                      href={selectedAnnouncement.attachmentUrl}
                      download={selectedAnnouncement.attachmentName || "attachment"}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Download {selectedAnnouncement.attachmentName || "Attachment"}</span>
                      <Download className="w-3.5 h-3.5 ml-1" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={closeDetailModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Publish New Announcement
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs flex items-center gap-2">
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                    onChange={(e: any) =>
                      setFormData({
                        ...formData,
                        targetScope: e.target.value,
                        departmentId: e.target.value === "DEPARTMENT" ? formData.departmentId : null,
                        teamId: e.target.value === "TEAM" ? formData.teamId : null,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                  className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Optional Attachment / Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attach Image or File (Optional)
                </label>
                {!formData.attachmentUrl ? (
                  <label className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Click to upload image or document (Max 5 MB)</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                        {formData.attachmentName || "Attached file"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, attachmentUrl: null, attachmentName: null })
                      }
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
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

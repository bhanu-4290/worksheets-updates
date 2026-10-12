import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  FolderKanban,
  Building2,
  Network,
  UserCog,
  Settings,
  ShieldAlert,
  ClipboardCheck,
  MessageSquare,
  Megaphone,
  Sparkles,
  X,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") return true;
    if (path !== "/dashboard" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const linkClass = (path: string) => `
    group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors
    ${
      isActive(path)
        ? "bg-indigo-600 text-white font-semibold shadow-xs"
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-100"
    }
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200 dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight leading-none text-sm">
                WorkTrack
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                Enterprise
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* Main workspace */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <span>Workspace</span>
            </div>
            <div className="space-y-1">
              <Link to="/dashboard" onClick={onClose} className={linkClass("/dashboard")}>
                <LayoutDashboard className="w-4 h-4 transition-transform group-hover:scale-110" />
                Dashboard
              </Link>
              <Link to="/reports" onClick={onClose} className={linkClass("/reports")}>
                <FileText className="w-4 h-4 transition-transform group-hover:scale-110" />
                Daily Reports
              </Link>
              <Link to="/tasks" onClick={onClose} className={linkClass("/tasks")}>
                <CheckSquare className="w-4 h-4 transition-transform group-hover:scale-110" />
                Task Board
              </Link>
            </div>
          </div>

          {/* Communication */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <span>Communication</span>
            </div>
            <div className="space-y-1">
              <Link to="/chat" onClick={onClose} className={linkClass("/chat")}>
                <MessageSquare className="w-4 h-4 transition-transform group-hover:scale-110" />
                Direct Chat
              </Link>
              <Link to="/announcements" onClick={onClose} className={linkClass("/announcements")}>
                <Megaphone className="w-4 h-4 transition-transform group-hover:scale-110" />
                Announcements
              </Link>
            </div>
          </div>

          {/* Team and Management scope */}
          {(user.role === "TEAM_LEAD" || user.role === "MANAGER" || user.role === "SUPER_ADMIN") && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <span>Management</span>
              </div>
              <div className="space-y-1">
                <Link to="/reviews" onClick={onClose} className={linkClass("/reviews")}>
                  <ClipboardCheck className="w-4 h-4 transition-transform group-hover:scale-110" />
                  Review Queue
                </Link>
                <Link to="/team" onClick={onClose} className={linkClass("/team")}>
                  <Users className="w-4 h-4 transition-transform group-hover:scale-110" />
                  Team Overview
                </Link>
              </div>
            </div>
          )}

          {/* Organization & Analytics */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <span>Organization</span>
            </div>
            <div className="space-y-1">
              <Link to="/projects" onClick={onClose} className={linkClass("/projects")}>
                <FolderKanban className="w-4 h-4 transition-transform group-hover:scale-110" />
                Projects
              </Link>
              <Link to="/directory" onClick={onClose} className={linkClass("/directory")}>
                <Users className="w-4 h-4 transition-transform group-hover:scale-110" />
                Directory
              </Link>
            </div>
          </div>

          {/* Super Admin Console */}
          {user.role === "SUPER_ADMIN" && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <span>Administration</span>
              </div>
              <div className="space-y-1">
                <Link to="/admin/users" onClick={onClose} className={linkClass("/admin/users")}>
                  <UserCog className="w-4 h-4 transition-transform group-hover:scale-110" />
                  Users & Hierarchy
                </Link>
                <Link to="/admin/departments" onClick={onClose} className={linkClass("/admin/departments")}>
                  <Building2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                  Departments
                </Link>
                <Link to="/admin/teams" onClick={onClose} className={linkClass("/admin/teams")}>
                  <Network className="w-4 h-4 transition-transform group-hover:scale-110" />
                  Teams Setup
                </Link>
                <Link to="/settings" onClick={onClose} className={linkClass("/settings")}>
                  <Settings className="w-4 h-4 transition-transform group-hover:scale-110" />
                  Settings
                </Link>
                <Link to="/admin/audit-logs" onClick={onClose} className={linkClass("/admin/audit-logs")}>
                  <ShieldAlert className="w-4 h-4 transition-transform group-hover:scale-110" />
                  Audit Logs
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User mini badge at bottom */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700/80 transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-white dark:ring-slate-900 shrink-0">
                {user.fullName[0]}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {user.fullName}
                </span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 capitalize truncate">
                  {user.role.toLowerCase().replace("_", " ")}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </aside>
    </>
  );
};

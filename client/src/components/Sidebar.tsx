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
  BookOpen,
  Layers,
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
    group flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors
    ${
      isActive(path)
        ? "bg-blue-600 text-white font-semibold"
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
    }
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-14 px-5 border-b border-slate-200 dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight leading-none text-sm">
                WorkTrack
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                MATRIX
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* Main workspace */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Workspace</span>
            </div>
            <div className="space-y-1">
              <Link to="/dashboard" onClick={onClose} className={linkClass("/dashboard")}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link to="/reports" onClick={onClose} className={linkClass("/reports")}>
                <FileText className="w-4 h-4" />
                Daily Reports
              </Link>
              <Link to="/tasks" onClick={onClose} className={linkClass("/tasks")}>
                <CheckSquare className="w-4 h-4" />
                Task Board
              </Link>
            </div>
          </div>

          {/* Communication */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Communication</span>
            </div>
            <div className="space-y-1">
              <Link to="/chat" onClick={onClose} className={linkClass("/chat")}>
                <MessageSquare className="w-4 h-4" />
                Direct Chat
              </Link>
              <Link to="/announcements" onClick={onClose} className={linkClass("/announcements")}>
                <Megaphone className="w-4 h-4" />
                Announcements
              </Link>
            </div>
          </div>

          {/* Team and Management scope */}
          {(user.role === "TEAM_LEAD" || user.role === "MANAGER" || user.role === "SUPER_ADMIN") && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <span>Management</span>
              </div>
              <div className="space-y-1">
                <Link to="/reviews" onClick={onClose} className={linkClass("/reviews")}>
                  <ClipboardCheck className="w-4 h-4" />
                  Review Queue
                </Link>
                <Link to="/team" onClick={onClose} className={linkClass("/team")}>
                  <Users className="w-4 h-4" />
                  Team Overview
                </Link>
              </div>
            </div>
          )}

          {/* Organization */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Organization</span>
            </div>
            <div className="space-y-1">
              <Link to="/projects" onClick={onClose} className={linkClass("/projects")}>
                <FolderKanban className="w-4 h-4" />
                Projects
              </Link>
              <Link to="/directory" onClick={onClose} className={linkClass("/directory")}>
                <Users className="w-4 h-4" />
                Directory
              </Link>
              <Link to="/how-to-use" onClick={onClose} className={linkClass("/how-to-use")}>
                <BookOpen className="w-4 h-4" />
                How to Use
              </Link>
            </div>
          </div>

          {/* Super Admin Console */}
          {user.role === "SUPER_ADMIN" && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <span>Administration</span>
              </div>
              <div className="space-y-1">
                <Link to="/admin/users" onClick={onClose} className={linkClass("/admin/users")}>
                  <UserCog className="w-4 h-4" />
                  Users &amp; Hierarchy
                </Link>
                <Link to="/admin/departments" onClick={onClose} className={linkClass("/admin/departments")}>
                  <Building2 className="w-4 h-4" />
                  Departments
                </Link>
                <Link to="/admin/teams" onClick={onClose} className={linkClass("/admin/teams")}>
                  <Network className="w-4 h-4" />
                  Teams Setup
                </Link>
                <Link to="/settings" onClick={onClose} className={linkClass("/settings")}>
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <Link to="/admin/audit-logs" onClick={onClose} className={linkClass("/admin/audit-logs")}>
                  <ShieldAlert className="w-4 h-4" />
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
            className="flex items-center justify-between p-2 rounded-md hover:bg-white dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700/80 transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user.fullName[0]}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {user.fullName}
                </span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 capitalize truncate">
                  {user.role.toLowerCase().replace("_", " ")}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 transition-colors" />
          </Link>
        </div>
      </aside>
    </>
  );
};

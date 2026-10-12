import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  AlertTriangle,
  Users,
  FolderKanban,
  BarChart3,
  Building2,
  Network,
  UserCog,
  Settings,
  ShieldAlert,
  ClipboardCheck,
  MessageSquare,
  Megaphone,
  X,
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
    flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all
    ${
      isActive(path)
        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none"
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
    }
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100 dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200 dark:shadow-none">
              W
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight leading-none text-base">
                WorkTrack
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                Enterprise
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* Main workspace */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Workspace
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
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Communication
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
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Team Oversight
              </div>
              <div className="space-y-1">
                <Link to="/reviews" onClick={onClose} className={linkClass("/reviews")}>
                  <ClipboardCheck className="w-4 h-4" />
                  Review Queue
                </Link>
                <Link to="/escalations" onClick={onClose} className={linkClass("/escalations")}>
                  <AlertTriangle className="w-4 h-4" />
                  Blocker Escalations
                </Link>
                <Link to="/team" onClick={onClose} className={linkClass("/team")}>
                  <Users className="w-4 h-4" />
                  Team Overview
                </Link>
              </div>
            </div>
          )}

          {/* Organization & Analytics */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Organization
            </div>
            <div className="space-y-1">
              <Link to="/analytics" onClick={onClose} className={linkClass("/analytics")}>
                <BarChart3 className="w-4 h-4" />
                Analytics & Reports
              </Link>
              <Link to="/projects" onClick={onClose} className={linkClass("/projects")}>
                <FolderKanban className="w-4 h-4" />
                Projects
              </Link>
              <Link to="/directory" onClick={onClose} className={linkClass("/directory")}>
                <Users className="w-4 h-4" />
                Employee Directory
              </Link>
            </div>
          </div>

          {/* Super Admin Console */}
          {user.role === "SUPER_ADMIN" && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Administration
              </div>
              <div className="space-y-1">
                <Link to="/admin/users" onClick={onClose} className={linkClass("/admin/users")}>
                  <UserCog className="w-4 h-4" />
                  Users & Accounts
                </Link>
                <Link to="/admin/departments" onClick={onClose} className={linkClass("/admin/departments")}>
                  <Building2 className="w-4 h-4" />
                  Departments
                </Link>
                <Link to="/admin/teams" onClick={onClose} className={linkClass("/admin/teams")}>
                  <Network className="w-4 h-4" />
                  Teams
                </Link>
                <Link to="/settings" onClick={onClose} className={linkClass("/settings")}>
                  <Settings className="w-4 h-4" />
                  Company Settings
                </Link>
                <Link to="/admin/audit-logs" onClick={onClose} className={linkClass("/admin/audit-logs")}>
                  <ShieldAlert className="w-4 h-4" />
                  Security Audit Logs
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User mini badge at bottom */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-semibold text-xs">
              {user.fullName[0]}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user.fullName}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                {user.role.toLowerCase().replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

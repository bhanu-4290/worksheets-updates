import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Users,
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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") return true;
    if (path !== "/dashboard" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItem = (path: string, label: string, Icon: React.ComponentType<{ className?: string }>) => {
    const active = isActive(path);
    return (
      <Link
        to={path}
        onClick={onClose}
        title={isCollapsed ? label : undefined}
        className={`group flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
          active
            ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold border-l-3 border-blue-600 dark:border-blue-400"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 border-l-3 border-transparent"
        } ${isCollapsed ? "justify-center px-2" : ""}`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"}`} />
        {!isCollapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  };

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
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-all duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-16" : "w-60"}`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-14 px-3.5 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
              <Layers className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-900 dark:text-white tracking-tight leading-none text-sm truncate">
                  SYNC SPACE
                </span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5 truncate">
                  MATRIX
                </span>
              </div>
            )}
          </Link>
          <div className="flex items-center">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
          {/* Main workspace */}
          <div>
            {!isCollapsed ? (
              <div className="px-2.5 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Workspace
              </div>
            ) : (
              <div className="w-6 mx-auto mb-1.5 border-b border-slate-200 dark:border-slate-800" />
            )}
            <div className="space-y-0.5">
              {navItem("/dashboard", "Dashboard", LayoutDashboard)}
              {navItem("/reports", "Daily Reports", FileText)}
            </div>
          </div>

          {/* Communication */}
          <div>
            {!isCollapsed ? (
              <div className="px-2.5 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Communication
              </div>
            ) : (
              <div className="w-6 mx-auto mb-1.5 border-b border-slate-200 dark:border-slate-800" />
            )}
            <div className="space-y-0.5">
              {navItem("/chat", "Direct Chat", MessageSquare)}
              {navItem("/announcements", "Announcements", Megaphone)}
            </div>
          </div>

          {/* Team and Management scope */}
          {(user.role === "TEAM_LEAD" || user.role === "MANAGER" || user.role === "SUPER_ADMIN") && (
            <div>
              {!isCollapsed ? (
                <div className="px-2.5 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Management
                </div>
              ) : (
                <div className="w-6 mx-auto mb-1.5 border-b border-slate-200 dark:border-slate-800" />
              )}
              <div className="space-y-0.5">
                {navItem("/reviews", "Review Queue", ClipboardCheck)}
                {navItem("/team", "Team Overview", Users)}
              </div>
            </div>
          )}

          {/* Organization */}
          <div>
            {!isCollapsed ? (
              <div className="px-2.5 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Organization
              </div>
            ) : (
              <div className="w-6 mx-auto mb-1.5 border-b border-slate-200 dark:border-slate-800" />
            )}
            <div className="space-y-0.5">
              {navItem("/directory", "Directory", Users)}
              {navItem("/how-to-use", "How to Use", BookOpen)}
            </div>
          </div>

          {/* Super Admin Console */}
          {user.role === "SUPER_ADMIN" && (
            <div>
              {!isCollapsed ? (
                <div className="px-2.5 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Administration
                </div>
              ) : (
                <div className="w-6 mx-auto mb-1.5 border-b border-amber-300 dark:border-amber-800" />
              )}
              <div className="space-y-0.5">
                {navItem("/admin/users", "Users & Hierarchy", UserCog)}
                {navItem("/admin/departments", "Departments", Building2)}
                {navItem("/admin/teams", "Teams Setup", Network)}
                {navItem("/settings", "Settings", Settings)}
                {navItem("/admin/audit-logs", "Audit Logs", ShieldAlert)}
              </div>
            </div>
          )}
        </div>

        {/* User mini badge at bottom */}
        <div className="p-2 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
          <Link
            to="/profile"
            onClick={onClose}
            title={isCollapsed ? `${user.fullName} (${user.role})` : undefined}
            className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-800 transition-colors group`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {user.fullName[0]}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 capitalize truncate">
                    {user.role.toLowerCase().replace("_", " ")}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600" />
            )}
          </Link>
        </div>
      </aside>
    </>
  );
};

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { StatCard } from "../components/StatCard";
import { EmployeeFlowModal } from "../components/EmployeeFlowModal";
import { DailyReportPage } from "./DailyReportPage";
import { Link } from "react-router-dom";
import {
  FileText,
  CheckSquare,
  Clock,
  AlertTriangle,
  Users,
  Building2,
  FolderKanban,
  ArrowRight,
  ShieldAlert,
  Megaphone,
  Calendar,
  Layers,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showEmployeeFlow, setShowEmployeeFlow] = useState(false);
  const [adminTab, setAdminTab] = useState<"admin" | "report">("admin");

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      if (user?.role === "SUPER_ADMIN") {
        const [res, annRes]: [any, any] = await Promise.all([
          api.get("/analytics/dashboard"),
          api.get("/announcements").catch(() => ({ data: [] })),
        ]);
        if (res.success) {
          setData(res.data);
        }
        if (annRes.success) {
          setAnnouncements(annRes.data || []);
        }
      } else {
        // Non-admin users load announcements for top banner
        const annRes: any = await api.get("/announcements").catch(() => ({ data: [] }));
        if (annRes.success) {
          setAnnouncements(annRes.data || []);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const AnnouncementsBanner = () => {
    if (announcements.length === 0) return null;
    const top = announcements[0];
    return (
      <Link
        to={`/announcements?id=${top.id}`}
        className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-600 rounded-lg p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs transition-colors cursor-pointer"
      >
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {top.title}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-200/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                {top.priority}
              </span>
              {top.isPinned && (
                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  PINNED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
              {top.content}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0 flex items-center gap-1">
          Open announcement ({announcements.length}) <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </Link>
    );
  };

  // ==========================================
  // FOR ALL NON-ADMIN USERS:
  // Render Daily Work Report & Task Sheet Calendar directly in place of the empty dashboard
  // ==========================================
  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div className="space-y-3 sm:space-y-3.5">
        <AnnouncementsBanner />
        <DailyReportPage />
      </div>
    );
  }

  // ==========================================
  // SUPER ADMIN DASHBOARD
  // ==========================================
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-md animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <AnnouncementsBanner />

      {/* Admin Tab Switcher */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdminTab("admin")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              adminTab === "admin"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Organization Administration Console</span>
          </button>
          <button
            onClick={() => setAdminTab("report")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              adminTab === "report"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>My Daily Report &amp; Task Calendar</span>
          </button>
        </div>
      </div>

      {adminTab === "report" ? (
        <DailyReportPage />
      ) : (
        <>
          {/* Super Admin Welcome Banner */}
          <div className="bg-slate-900 border border-blue-800/60 rounded-lg p-5 text-white shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                  Organization Super Admin
                </span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
                  WorkTrack Administration Console
                </h1>
                <p className="text-xs text-blue-100 mt-1">
                  Company-wide governance, user permissions, audit tracking, and organization structure
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setShowEmployeeFlow(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-700/80 hover:bg-blue-600 text-white border border-blue-400/30 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  Employee Flow Chart
                </button>
                <Link
                  to="/admin/users"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white text-blue-900 font-semibold text-xs shadow-xs hover:bg-blue-50 transition-colors"
                >
                  Manage Accounts &amp; Roles
                </Link>
              </div>
            </div>
          </div>

          {/* Organization KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatCard
              title="Total Active Employees"
              value={data.totalEmployees}
              icon={Users}
              color="amber"
              onClick={() => setShowEmployeeFlow(true)}
              actionLabel="View Employee Flow"
            />
            <StatCard
              title="Departments"
              value={data.totalDepartments}
              icon={Building2}
              color="blue"
              to="/admin/departments"
              actionLabel="Manage Departments"
            />
            <StatCard
              title="Teams"
              value={data.totalTeams}
              icon={Users}
              color="blue"
              to="/admin/teams"
              actionLabel="Manage Teams"
            />
            <StatCard
              title="Active Projects"
              value={data.totalProjects}
              icon={FolderKanban}
              color="emerald"
              to="/projects"
              actionLabel="View Projects"
            />
          </div>

          {/* Operational Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatCard
              title="Today's Submissions"
              value={data.todaySubmissions}
              icon={FileText}
              color="emerald"
              to="/reviews"
              actionLabel="View Submissions"
            />
            <StatCard
              title="Pending Reviews"
              value={data.pendingReviews}
              icon={Clock}
              color="amber"
              to="/reviews"
              actionLabel="Open Review Queue"
            />
            <StatCard
              title="Active Escalations"
              value={data.activeEscalations}
              icon={AlertTriangle}
              color={data.activeEscalations > 0 ? "rose" : "slate"}
              to="/escalations"
              actionLabel="View Escalations"
            />
            <StatCard
              title="Active Tasks"
              value={data.activeTasks}
              icon={CheckSquare}
              color="blue"
              to="/tasks"
              actionLabel="Open Task Board"
            />
          </div>

          {/* Admin Quick Action Hub */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <Link
              to="/admin/users"
              className="p-4.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 transition-colors flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                  User Directory &amp; CSV Import
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Add users, modify roles, or bulk import CSV
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-500 shrink-0" />
            </Link>

            <Link
              to="/settings"
              className="p-4.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 transition-colors flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Working Days &amp; Holiday Calendar
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure reporting deadline &amp; grace period
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-500 shrink-0" />
            </Link>

            <Link
              to="/admin/audit-logs"
              className="p-4.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 transition-colors flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Security Audit Logs
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Inspect administrative events &amp; login history
                </p>
              </div>
              <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0" />
            </Link>
          </div>

          <EmployeeFlowModal
            isOpen={showEmployeeFlow}
            onClose={() => setShowEmployeeFlow(false)}
          />
        </>
      )}
    </div>
  );
};

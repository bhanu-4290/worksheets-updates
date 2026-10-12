import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { StatCard } from "../components/StatCard";
import { Badge } from "../components/Badge";
import { Link } from "react-router-dom";
import {
  FileText,
  CheckSquare,
  Clock,
  AlertTriangle,
  Users,
  Building2,
  TrendingUp,
  FolderKanban,
  ArrowRight,
  ShieldAlert,
  Send,
  Calendar,
  Eye,
  CheckCircle2,
  Megaphone,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [res, taskRes, annRes]: [any, any, any] = await Promise.all([
        api.get("/analytics/dashboard"),
        api.get("/tasks"),
        api.get("/announcements").catch(() => ({ data: [] })),
      ]);
      if (res.success) {
        setData(res.data);
      }
      if (taskRes.success) {
        setTasks(taskRes.data || []);
      }
      if (annRes.success) {
        setAnnouncements(annRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const AnnouncementsBanner = () => {
    if (announcements.length === 0) return null;
    const top = announcements[0];
    return (
      <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {top.title}
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-200/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                {top.priority}
              </span>
              {top.isPinned && (
                <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  PINNED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
              {top.content}
            </p>
          </div>
        </div>
        <Link
          to="/announcements"
          className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0 flex items-center gap-1"
        >
          View all notices ({announcements.length}) <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  };

  // ==========================================
  // EXECUTIVE DASHBOARD
  // ==========================================
  if (user?.role === "EXECUTIVE") {
    return (
      <div className="space-y-6">
        <AnnouncementsBanner />
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                Executive Workspace
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                Welcome, {user.fullName}
              </h1>
              <p className="text-sm text-indigo-100 mt-1">
                {user.jobTitle} • {user.department?.name || "Department"}
              </p>
            </div>
            <Link
              to="/reports/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-700 font-semibold text-xs shadow-md hover:bg-indigo-50 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
              {data.todayReportStatus === "NOT_STARTED"
                ? "Submit Today's Daily Report"
                : "Edit Today's Daily Report"}
            </Link>
          </div>
        </div>

        {/* Today Report Status Alert */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Today's Daily Report Status
              </div>
              <div className="flex items-center gap-2.5 mt-1">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
                </span>
                <Badge variant={data.todayReportStatus} label={data.todayReportStatus.replace("_", " ")} />
              </div>
            </div>
          </div>
          <Link
            to={data.todayReport ? `/reports/${data.todayReport.id}` : "/reports/new"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Eye className="w-4 h-4" /> View Report Details
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Assigned Tasks"
            value={data.assignedTasks}
            icon={CheckSquare}
            color="indigo"
          />
          <StatCard
            title="Tasks In Progress"
            value={data.inProgressTasks}
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Tasks Completed"
            value={data.completedTasks}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            title="Overdue Tasks"
            value={data.overdueTasks}
            icon={AlertTriangle}
            color={data.overdueTasks > 0 ? "rose" : "slate"}
          />
        </div>

        {/* Two Columns: Recent Reports & Current Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Reports */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Recent Daily Reports
              </h2>
              <Link to="/reports" className="text-xs font-medium text-indigo-600 hover:underline">
                View All
              </Link>
            </div>
            {data.recentReports?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No reports filed yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentReports.map((r: any) => (
                  <div key={r.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {r.reportingDate}
                        </span>
                        <Badge variant={r.status} size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {r.entriesCount} activities • {r.hoursSpent ? `${r.hoursSpent} hrs` : "Hours Unreported"}
                      </div>
                      {r.latestReview?.comments && (
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 italic">
                          Feedback: "{r.latestReview.comments}"
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/reports/${r.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Tasks */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Assigned Tasks
              </h2>
              <Link to="/tasks" className="text-xs font-medium text-indigo-600 hover:underline">
                Open Task Board
              </Link>
            </div>
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No tasks assigned.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.slice(0, 5).map((t: any) => (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                          {t.taskCode}
                        </span>
                        <Badge variant={t.priority} size="sm" />
                        <Badge variant={t.status} size="sm" />
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-1">
                        {t.title}
                      </h4>
                    </div>
                    <Link
                      to={`/tasks/${t.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TEAM LEAD DASHBOARD
  // ==========================================
  if (user?.role === "TEAM_LEAD") {
    return (
      <div className="space-y-6">
        <AnnouncementsBanner />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Team Lead Workspace
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Oversight of assigned subordinates, daily report reviews, and team task execution
            </p>
          </div>
          <Link
            to="/reviews"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors"
          >
            Review Submissions ({data.pendingReviews})
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Team Size"
            value={data.teamSize}
            subtitle="Subordinate members"
            icon={Users}
            color="indigo"
          />
          <StatCard
            title="Today's Submissions"
            value={`${data.todaySubmissions}/${data.teamSize}`}
            subtitle={`${data.pendingSubmissions} pending submission`}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Reports Awaiting Review"
            value={data.pendingReviews}
            subtitle="Require lead acknowledgement"
            icon={Clock}
            color={data.pendingReviews > 0 ? "amber" : "emerald"}
          />
          <StatCard
            title="Returned for Correction"
            value={data.revisionsReturned}
            subtitle="Awaiting resubmission"
            icon={AlertTriangle}
            color={data.revisionsReturned > 0 ? "rose" : "slate"}
          />
        </div>

        {/* Team Tasks Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Team Tasks Assigned"
            value={data.teamTasks}
            icon={CheckSquare}
            color="indigo"
          />
          <StatCard
            title="Overdue Tasks"
            value={data.overdueTasks}
            icon={AlertTriangle}
            color={data.overdueTasks > 0 ? "rose" : "slate"}
          />
          <StatCard
            title="Blocked Tasks"
            value={data.blockedTasks}
            subtitle="May require Manager escalation"
            icon={AlertTriangle}
            color={data.blockedTasks > 0 ? "amber" : "slate"}
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/reviews"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Report Review Queue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Acknowledge or request revisions
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-500" />
          </Link>

          <Link
            to="/escalations"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Escalate Blocker to Manager
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Forward critical issues to Dept Manager
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-500" />
          </Link>

          <Link
            to="/team"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Team Member Overview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Inspect workload and attendance
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-500" />
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // MANAGER DASHBOARD
  // ==========================================
  if (user?.role === "MANAGER") {
    return (
      <div className="space-y-6">
        <AnnouncementsBanner />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Department Management Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Authorized scope: {user.department?.name} • Monitor compliance & handle escalations
            </p>
          </div>
          <Link
            to="/escalations"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Critical Blockers ({data.criticalBlockers})
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Department Size"
            value={data.departmentEmployeeCount}
            subtitle={`${data.teamsCount} teams in department`}
            icon={Building2}
            color="blue"
          />
          <StatCard
            title="Today's Reporting Compliance"
            value={`${data.compliancePercentage}%`}
            subtitle={`${data.todaySubmissions} of ${data.departmentEmployeeCount} submitted`}
            icon={TrendingUp}
            color={data.compliancePercentage >= 80 ? "emerald" : "amber"}
          />
          <StatCard
            title="Pending Team Lead Reviews"
            value={data.pendingReviews}
            subtitle="Under team lead evaluation"
            icon={Clock}
            color="indigo"
          />
          <StatCard
            title="Critical Blockers"
            value={data.criticalBlockers}
            subtitle="Requires management action"
            icon={AlertTriangle}
            color={data.criticalBlockers > 0 ? "rose" : "slate"}
          />
        </div>

        {/* Department Tasks & Projects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Total Department Tasks"
            value={data.deptTasksCount}
            subtitle="Active across teams"
            icon={CheckSquare}
            color="indigo"
          />
          <StatCard
            title="Overdue Tasks in Department"
            value={data.deptOverdueTasks}
            subtitle="Needs managerial reassignment"
            icon={AlertTriangle}
            color={data.deptOverdueTasks > 0 ? "rose" : "emerald"}
          />
        </div>

        {/* Manager Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/escalations"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Handle Escalations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Assign owners & record resolution notes
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-500" />
          </Link>

          <Link
            to="/analytics"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Department Analytics & Exports
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Filter and export department CSV logs
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-500" />
          </Link>

          <Link
            to="/team"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Teams & Team Leads
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Monitor team leads and team allocations
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-500" />
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // SUPER ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="space-y-6">
      <AnnouncementsBanner />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Organization Super Admin Console
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Company-wide visibility, system health, security governance, and organization structure
          </p>
        </div>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition-colors"
        >
          Manage Accounts & Roles
        </Link>
      </div>

      {/* Organization KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Active Employees"
          value={data.totalEmployees}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Departments"
          value={data.totalDepartments}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Teams"
          value={data.totalTeams}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Active Projects"
          value={data.totalProjects}
          icon={FolderKanban}
          color="emerald"
        />
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Submissions"
          value={data.todaySubmissions}
          icon={FileText}
          color="emerald"
        />
        <StatCard
          title="Pending Reviews"
          value={data.pendingReviews}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Active Escalations"
          value={data.activeEscalations}
          icon={AlertTriangle}
          color={data.activeEscalations > 0 ? "rose" : "slate"}
        />
        <StatCard
          title="Active Tasks"
          value={data.activeTasks}
          icon={CheckSquare}
          color="indigo"
        />
      </div>

      {/* Admin Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500 transition-colors flex items-center justify-between"
        >
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              User Directory & CSV Import
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add users, modify roles, or bulk import CSV
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-purple-500" />
        </Link>

        <Link
          to="/settings"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500 transition-colors flex items-center justify-between"
        >
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Working Days & Holiday Calendar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure reporting deadline & grace period
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-purple-500" />
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500 transition-colors flex items-center justify-between"
        >
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Security Audit Logs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Inspect administrative events & login history
            </p>
          </div>
          <ShieldAlert className="w-5 h-5 text-purple-500" />
        </Link>
      </div>
    </div>
  );
};

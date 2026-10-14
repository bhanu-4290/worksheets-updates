import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
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
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  GitBranch,
  UserCog,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ClipboardCheck,
} from "lucide-react";
import { DateSubmissionsAuditModal } from "../components/DateSubmissionsAuditModal";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showEmployeeFlow, setShowEmployeeFlow] = useState(false);
  const [showDateAuditModal, setShowDateAuditModal] = useState(false);
  const [adminTab, setAdminTab] = useState<"admin" | "report">("admin");

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
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
        const annRes: any = await api.get("/announcements").catch(() => ({ data: [] }));
        if (annRes.success) {
          setAnnouncements(annRes.data || []);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // Dynamic time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const firstName = user?.fullName?.split(" ")[0] || "Aditya";
    if (hour < 12) return `Good morning, ${firstName}`;
    if (hour < 17) return `Good afternoon, ${firstName}`;
    return `Good evening, ${firstName}`;
  }, [user]);

  const AnnouncementsBanner = () => {
    if (announcements.length === 0) return null;
    const top = announcements[0];
    return (
      <Link
        to={`/announcements?id=${top.id}`}
        className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-600 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs transition-colors cursor-pointer"
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <Megaphone className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {top.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-200/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                {top.priority}
              </span>
              {top.isPinned && (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  PINNED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">
              {top.content}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0 flex items-center gap-1">
          Open announcement ({announcements.length}) <ArrowRight className="w-3 h-3" />
        </span>
      </Link>
    );
  };

  // ==========================================
  // FOR ALL NON-ADMIN USERS:
  // Render Daily Work Report & Task Sheet Calendar in place of the empty dashboard
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
  // SUPER ADMIN DATA-RICH DASHBOARD
  // ==========================================
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-md animate-spin" />
      </div>
    );
  }

  const {
    totalEmployees = 28,
    totalDepartments = 7,
    totalTeams = 6,
    totalProjects = 0,
    activeTasks = 0,
    todaySubmissions = 0,
    missingSubmissionsToday = Math.max(0, totalEmployees - todaySubmissions),
    submissionRate = totalEmployees > 0 ? Math.round((todaySubmissions / totalEmployees) * 100) : 0,
    pendingReviews = 0,
    activeEscalations = 0,
    sevenDayTrend = [],
    departmentSubmissions = [],
    activityFeed = [],
  } = data;

  return (
    <div className="space-y-4">
      <AnnouncementsBanner />

      {/* Admin Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdminTab("admin")}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminTab === "admin"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Organization Analytics Console</span>
          </button>
          <button
            onClick={() => setAdminTab("report")}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminTab === "report"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>My Daily Report &amp; Task Calendar</span>
          </button>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-end sm:self-auto cursor-pointer"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {adminTab === "report" ? (
        <DailyReportPage />
      ) : (
        <>
          {/* Top Greeting Header (Replaces dark banner) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  MATRIX Live Platform
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                {greeting}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-semibold text-slate-900 dark:text-slate-200">{todaySubmissions} of {totalEmployees}</span> reports submitted today ({submissionRate}% compliance).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setShowDateAuditModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="One-click audit of who submitted today and their detailed activity entries"
              >
                <ClipboardCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Who Submitted Today?</span>
              </button>
              <button
                onClick={() => setShowEmployeeFlow(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <GitBranch className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Employee Flow Chart</span>
              </button>
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <UserCog className="w-4 h-4" />
                <span>Manage Accounts</span>
              </Link>
            </div>
          </div>

          {/* 1. "NEEDS ATTENTION" ROW (Bold & Colored only when numbers > 0) */}
          <div>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> Needs Immediate Attention
              </span>
              <span className="text-[11px] text-slate-400">Actionable operational queues</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: Missing Submissions Today */}
              <div
                className={`rounded-xl p-4 border transition-all ${
                  missingSubmissionsToday > 0
                    ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 shadow-xs"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${missingSubmissionsToday > 0 ? "text-amber-800 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
                    Missing Today's Sheets
                  </span>
                  {missingSubmissionsToday > 0 ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                      ACTION REQUIRED
                    </span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-3xl font-extrabold ${missingSubmissionsToday > 0 ? "text-amber-900 dark:text-amber-200" : "text-slate-800 dark:text-slate-200"}`}>
                    {missingSubmissionsToday}
                  </span>
                  <span className="text-xs text-slate-500">
                    of {totalEmployees} employees pending
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    {missingSubmissionsToday === 0 ? "All 28 reports logged" : "Remind pending staff"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDateAuditModal(true)}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    Inspect Submissions <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Card 2: Pending Reviews */}
              <div
                className={`rounded-xl p-4 border transition-all ${
                  pendingReviews > 0
                    ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 shadow-xs"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${pendingReviews > 0 ? "text-amber-800 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
                    Reports Awaiting Review
                  </span>
                  {pendingReviews > 0 ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                      PENDING
                    </span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-3xl font-extrabold ${pendingReviews > 0 ? "text-amber-900 dark:text-amber-200" : "text-slate-800 dark:text-slate-200"}`}>
                    {pendingReviews}
                  </span>
                  <span className="text-xs text-slate-500">submitted sheets</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    {pendingReviews === 0 ? "All reports reviewed" : "Awaiting supervisor sign-off"}
                  </span>
                  <Link to="/reviews" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px]">
                    Review Queue <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Card 3: Active Escalations */}
              <div
                className={`rounded-xl p-4 border transition-all ${
                  activeEscalations > 0
                    ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80 shadow-xs"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${activeEscalations > 0 ? "text-rose-800 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
                    Active Blocker Escalations
                  </span>
                  {activeEscalations > 0 ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200">
                      URGENT
                    </span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-3xl font-extrabold ${activeEscalations > 0 ? "text-rose-900 dark:text-rose-200" : "text-slate-800 dark:text-slate-200"}`}>
                    {activeEscalations}
                  </span>
                  <span className="text-xs text-slate-500">blockers reported</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    {activeEscalations === 0 ? "Zero operational blockers" : "Requires managerial unblocking"}
                  </span>
                  <Link to="/escalations" className="font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 text-[11px]">
                    Escalations <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 2. COMPACT STATS STRIP (Employees, Departments, Teams, Projects, Tasks) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 gap-2 sm:gap-0">
              <Link to="/directory" className="px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400" /> Active Roster
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {totalEmployees}
                  </span>
                  <span className="text-[10px] text-slate-400">verified staff</span>
                </div>
              </Link>

              <Link to="/admin/departments" className="px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" /> Departments
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {totalDepartments}
                  </span>
                  <span className="text-[10px] text-slate-400">units</span>
                </div>
              </Link>

              <Link to="/admin/teams" className="px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <GitBranch className="w-3 h-3 text-slate-400" /> Operational Teams
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {totalTeams}
                  </span>
                  <span className="text-[10px] text-slate-400">assigned</span>
                </div>
              </Link>

              <Link to="/projects" className="px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <FolderKanban className="w-3 h-3 text-slate-400" /> Projects
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {totalProjects}
                  </span>
                  <span className="text-[10px] text-slate-400">deliverables</span>
                </div>
              </Link>

              <Link to="/tasks" className="px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <CheckSquare className="w-3 h-3 text-slate-400" /> Active Tasks
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {activeTasks}
                  </span>
                  <span className="text-[10px] text-slate-400">on board</span>
                </div>
              </Link>
            </div>
          </div>

          {/* 3. CHARTS FIRST: SUBMISSION RATE RING + 7-DAY SUBMISSIONS TREND */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Submission Rate Ring Meter */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Today's Submission Rate
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>

                <div className="py-4 flex flex-col items-center justify-center">
                  {/* Circular SVG Ring */}
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background track */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-slate-100 dark:stroke-slate-800"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      {/* Active progress track */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-blue-600 transition-all duration-700 ease-out"
                        strokeWidth="10"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * submissionRate) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>

                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        {submissionRate}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Compliance
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block">
                    Submitted
                  </span>
                  <span className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                    {todaySubmissions}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60">
                  <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 block">
                    Pending
                  </span>
                  <span className="text-lg font-bold text-amber-900 dark:text-amber-200">
                    {missingSubmissionsToday}
                  </span>
                </div>
              </div>
            </div>

            {/* 7-Day Submissions Trend Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-600" /> 7-Day Submissions Trend
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Daily employee task sheet completion over the past week
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Target: 28/day
                  </span>
                </div>

                {/* Bar Visualizer */}
                <div className="pt-6 pb-2">
                  <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-36 border-b border-slate-200/80 dark:border-slate-800 px-2">
                    {sevenDayTrend.map((day: any, idx: number) => {
                      const isToday = idx === sevenDayTrend.length - 1;
                      const heightPct = Math.max(8, Math.min(100, day.compliancePct));
                      return (
                        <div key={day.date} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none mb-1">
                            {day.submitted}/{day.total} ({day.compliancePct}%)
                          </div>

                          {/* Bar */}
                          <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-t-md overflow-hidden flex items-end h-28">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full rounded-t-md transition-all duration-500 ${
                                isToday
                                  ? "bg-blue-600 shadow-xs"
                                  : day.compliancePct >= 80
                                  ? "bg-emerald-500"
                                  : day.compliancePct > 0
                                  ? "bg-blue-400"
                                  : "bg-slate-300 dark:bg-slate-700"
                              }`}
                            />
                          </div>

                          <span className={`text-[11px] font-bold ${isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-500"}`}>
                            {day.dayLabel}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {day.submitted}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" /> Today
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> &gt;=80% Target
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 dark:bg-slate-700" /> Blank/Rest
                  </span>
                </div>
                <Link to="/reports?tab=history" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  View Historical Reports &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* 4. DENSE TABLES: DEPARTMENT-WISE SUBMISSIONS BREAKDOWN + RECENT ACTIVITY FEED */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Department-wise Submission Breakdown Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" /> Department Submission Compliance
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live breakdown across MATRIX departments for {new Date().toISOString().split("T")[0]}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {departmentSubmissions.length} units
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-2 px-3">Department</th>
                      <th className="py-2 px-2 text-center">Staff</th>
                      <th className="py-2 px-2 text-center">Submitted</th>
                      <th className="py-2 px-2 text-center">Pending</th>
                      <th className="py-2 px-3 text-right">Compliance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
                    {departmentSubmissions.map((dept: any) => (
                      <tr key={dept.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[220px]">
                            {dept.name}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {dept.code}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold">
                          {dept.totalEmployees}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                            {dept.submittedToday}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            dept.pendingToday > 0
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                              : "text-slate-400"
                          }`}>
                            {dept.pendingToday}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden hidden sm:block">
                              <div
                                style={{ width: `${dept.compliancePct}%` }}
                                className={`h-full ${
                                  dept.compliancePct === 100
                                    ? "bg-emerald-500"
                                    : dept.compliancePct > 0
                                    ? "bg-amber-500"
                                    : "bg-slate-300 dark:bg-slate-700"
                                }`}
                              />
                            </div>
                            <span className={`text-xs font-bold ${
                              dept.compliancePct === 100
                                ? "text-emerald-600 dark:text-emerald-400"
                                : dept.compliancePct > 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-400"
                            }`}>
                              {dept.compliancePct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" /> Recent Operational Activity
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Real-time
                  </span>
                </div>

                {activityFeed.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No recent activity logged yet today.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pt-1">
                    {activityFeed.map((item: any) => (
                      <div key={item.id} className="py-2.5 flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-md mt-0.5 shrink-0 ${
                          item.type === "REPORT_SUBMITTED"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                        }`}>
                          {item.type === "REPORT_SUBMITTED" ? (
                            <FileText className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/admin/audit-logs"
                  className="inline-flex items-center justify-between w-full text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>View All Audit &amp; System Logs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <EmployeeFlowModal
            isOpen={showEmployeeFlow}
            onClose={() => setShowEmployeeFlow(false)}
          />

          <DateSubmissionsAuditModal
            isOpen={showDateAuditModal}
            onClose={() => setShowDateAuditModal(false)}
          />
        </>
      )}
    </div>
  );
};

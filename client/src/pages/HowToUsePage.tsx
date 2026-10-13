import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  Users,
  CheckSquare,
  FileText,
  ClipboardCheck,
  MessageSquare,
  Megaphone,
  Cake,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

export const HowToUsePage: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "How to Use WorkTrack | MATRIX Operations Guide";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Step-by-step operational guide for using WorkTrack by MATRIX: role hierarchy, task assignment, daily reports, and team communication."
      );
    }
  }, []);

  const content = (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                How to Use WorkTrack
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Operational manual for Super Admins, Managers, Team Leads, and Executives.
              </p>
            </div>
          </div>

          <Link
            to={user ? "/dashboard" : "/login"}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {user ? "Back to Dashboard" : "Back to Sign In"}
          </Link>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
          WorkTrack is the internal work reporting and task coordination system for MATRIX. Every employee signs in with their assigned corporate account to record daily activities, manage assigned deliverables, and communicate across departments.
        </p>
      </div>

      {/* Section 1: Organizational Hierarchy */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            1. Role Hierarchy and Access Levels
          </h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          WorkTrack enforces a four-tier reporting structure. Each role has specific permissions for viewing data, assigning tasks, and reviewing daily reports:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                Tier 1: Super Admin
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold text-[10px]">
                SUPER_ADMIN
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Full company-wide governance. Creates departments, teams, projects, and user accounts. Can view the live Organization Employee Flow Chart, inspect security audit logs, and configure working days and submission deadlines.
            </p>
          </div>

          <div className="p-4 rounded-md border border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                Tier 2: Department Manager
              </span>
              <span className="px-2 py-0.5 rounded bg-orange-200/80 dark:bg-orange-900 text-orange-900 dark:text-orange-200 font-bold text-[10px]">
                MANAGER
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Oversees one or more departments and branches. Can create projects, assign tasks to Team Leads (TL) and Executives, review daily work submissions, and monitor department compliance.
            </p>
          </div>

          <div className="p-4 rounded-md border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                Tier 3: Team Lead / DC
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold text-[10px]">
                TEAM_LEAD
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Supervises a team of Executives. Can create tasks for Executives, delegate Manager-assigned tasks to Executives, and approve or request revisions on daily work reports submitted by team members.
            </p>
          </div>

          <div className="p-4 rounded-md border border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                Tier 4: Executive (L1 / L2)
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-200/80 dark:bg-blue-900 text-blue-900 dark:text-blue-200 font-bold text-[10px]">
                EXECUTIVE
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Executes assigned tasks, updates task status and completion percentage on the Task Board, and submits daily work reports detailing completed activities, hours spent, deliverables, and any blockers.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Task Assignment & Delegation Workflow */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            2. How Task Assignment and Delegation Works
          </h2>
        </div>

        <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <li>
            <strong>Manager Assigns to Team Lead or Executive:</strong> Open the <strong>Task Board</strong> (<code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">/tasks</code>) and click <strong>Create & Assign Task</strong>. A Manager can select one or more <strong>Team Leads (TL)</strong>, one or more <strong>Executives</strong>, or both.
          </li>
          <li>
            <strong>Team Lead Delegates to Executive:</strong> When a Manager assigns a task to a Team Lead, the Team Lead sees the task on their Task Board and can click <strong>Assign to Executive</strong> on the task card. Selecting an Executive delegates the execution to that Executive while keeping the Team Lead attached as the supervising Team Lead.
          </li>
          <li>
            <strong>Executive Updates Status:</strong> Assigned Executives move the task across columns (<strong>To Do</strong>, <strong>In Progress</strong>, <strong>Blocked</strong>, <strong>In Review</strong>, <strong>Completed</strong>) and log their daily hours against the task in their Daily Report.
          </li>
          <li>
            <strong>Derived Work Hours:</strong> Actual hours shown on a task are calculated automatically from daily work report entries linked to that task.
          </li>
        </ol>
      </section>

      {/* Section 3: Daily Work Reports & Review Queue */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            3. Submitting and Reviewing Daily Work Reports
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              For Employees: Filing a Daily Report
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
              <li>Go to <strong>Daily Reports</strong> and click <strong>Submit Today's Report</strong>.</li>
              <li>Add one or more work entries describing the activity title, detailed work done, status, and progress percentage.</li>
              <li>Optionally link the entry to an assigned task and record hours spent.</li>
              <li>Save as a <strong>Draft</strong> while working, or click <strong>Submit Final Report</strong> before the daily deadline.</li>
            </ul>
          </div>

          <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
              For Team Leads & Managers: Review Queue
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
              <li>Open <strong>Review Queue</strong> (<code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700">/reviews</code>) under Management.</li>
              <li>Click any submitted report to inspect each activity, linked task, and recorded hours.</li>
              <li>Click <strong>Approve Report</strong> if complete, or <strong>Request Revision</strong> with feedback comments if corrections are needed.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 4: Onboarding Users & Org Flow Chart */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. Onboarding Employees and Viewing the Employee Flow Chart
          </h2>
        </div>

        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <li>
            <strong>Create Departments and Teams First:</strong> As Super Admin, create your departments under <strong>Administration &gt; Departments</strong> and teams under <strong>Teams Setup</strong>.
          </li>
          <li>
            <strong>Add Users in Hierarchy Order:</strong> Under <strong>Users &amp; Hierarchy</strong>, add Managers first, then Team Leads (selecting their Manager), and then Executives (selecting both their Manager and Team Lead).
          </li>
          <li>
            <strong>Include Date of Birth for Automated Wishes:</strong> When creating or editing a user, fill in the <strong>Date of Birth (Birthday)</strong> field. On that date, WorkTrack automatically posts a pinned company-wide birthday announcement and sends a direct message wish from the Super Admin.
          </li>
          <li>
            <strong>View Live Employee Flow:</strong> On the Dashboard, click the <strong>Total Active Employees</strong> card (or the <strong>Employee Flow Chart</strong> button) to open the interactive four-tier visual hierarchy diagram.
          </li>
        </ol>
      </section>

      {/* Section 5: Communication */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            5. Direct Chat, Announcements, and Notifications
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3.5 rounded-md border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Direct Chat
            </div>
            One-on-one internal messaging with any active employee across the organization, with read receipts and unread counters.
          </div>
          <div className="p-3.5 rounded-md border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-blue-600" /> Announcements
            </div>
            Publish company-wide, department-specific, or team-specific bulletins. Important notices can be pinned to the top.
          </div>
          <div className="p-3.5 rounded-md border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <Cake className="w-3.5 h-3.5 text-blue-600" /> Birthday Celebrations
            </div>
            Automatically detects employee birthdays each day and delivers an announcement banner, direct chat wish, and notification.
          </div>
        </div>

        <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-900 dark:text-white">Organization:</span> MATRIX
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white">Support Email:</span>{" "}
            <a href="mailto:gbhanu2811@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
              gbhanu2811@gmail.com
            </a>
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white">Contact:</span>{" "}
            <a href="tel:7337504290" className="text-blue-600 dark:text-blue-400 hover:underline">
              7337504290
            </a>
          </div>
        </div>
      </section>
    </div>
  );

  if (user) {
    return content;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between py-10 px-4 sm:px-6">
      {content}
      <footer className="max-w-4xl w-full mx-auto mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <span>MATRIX - WorkTrack Platform</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hover:text-blue-600 hover:underline">
            Sign In
          </Link>
          <Link to="/privacy-policy" className="hover:text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms-and-conditions" className="hover:text-blue-600 hover:underline">
            Terms &amp; Conditions
          </Link>
        </div>
      </footer>
    </div>
  );
};

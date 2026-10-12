import React from "react";
import { Role, TaskPriority, TaskStatus, ReportStatus, EscalationStatus, EscalationUrgency } from "../types";

interface BadgeProps {
  children?: React.ReactNode;
  variant?:
    | Role
    | TaskPriority
    | TaskStatus
    | ReportStatus
    | EscalationStatus
    | EscalationUrgency
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "default";
  label?: string;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "default", label, size = "md" }) => {
  const text = label || children;

  const getStyle = () => {
    switch (variant) {
      // Roles
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "MANAGER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "TEAM_LEAD":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "EXECUTIVE":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";

      // Report Statuses
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
      case "SUBMITTED":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800";
      case "REVISION_REQUESTED":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800";
      case "DRAFT":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";

      // Task Statuses
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300";
      case "IN_PROGRESS":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300";
      case "TO_DO":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300";
      case "BLOCKED":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300";
      case "IN_REVIEW":
        return "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300";
      case "CANCELLED":
        return "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-300";

      // Priorities
      case "URGENT":
      case "CRITICAL":
        return "bg-rose-500 text-white border-transparent font-bold animate-pulse";
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300";
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300";
      case "LOW":
      case "NORMAL":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200";

      // Escalation Statuses
      case "OPEN":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300";
      case "RESOLVED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300";
      case "ESCALATED_TO_ADMIN":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 font-semibold";

      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200";
    }
  };

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm transition-colors ${getStyle()} ${sizeClass}`}
    >
      {text}
    </span>
  );
};

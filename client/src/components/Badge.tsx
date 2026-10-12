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
    | "default"
    | string;
  label?: string;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "default", label, size = "md" }) => {
  const text = label || children;

  const getStyle = (): { container: string; dot: string } => {
    switch (variant) {
      // Roles
      case "SUPER_ADMIN":
        return {
          container: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/80",
          dot: "bg-purple-500",
        };
      case "MANAGER":
        return {
          container: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80",
          dot: "bg-blue-500",
        };
      case "TEAM_LEAD":
        return {
          container: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80",
          dot: "bg-amber-500",
        };
      case "EXECUTIVE":
        return {
          container: "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          dot: "bg-slate-400",
        };

      // Report Statuses
      case "APPROVED":
        return {
          container: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 font-semibold",
          dot: "bg-emerald-500",
        };
      case "SUBMITTED":
        return {
          container: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 font-semibold",
          dot: "bg-amber-500 animate-pulse",
        };
      case "UNDER_REVIEW":
        return {
          container: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/80 font-semibold",
          dot: "bg-blue-500 animate-pulse",
        };
      case "REVISION_REQUESTED":
        return {
          container: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/80 font-semibold",
          dot: "bg-rose-500",
        };
      case "DRAFT":
        return {
          container: "bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 border-slate-200 dark:border-slate-700",
          dot: "bg-slate-400",
        };

      // Task Statuses
      case "COMPLETED":
        return {
          container: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          dot: "bg-emerald-500",
        };
      case "IN_PROGRESS":
        return {
          container: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
          dot: "bg-indigo-500 animate-pulse",
        };
      case "TO_DO":
        return {
          container: "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          dot: "bg-slate-400",
        };
      case "BLOCKED":
        return {
          container: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
          dot: "bg-rose-500",
        };
      case "IN_REVIEW":
        return {
          container: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800",
          dot: "bg-sky-500",
        };
      case "CANCELLED":
        return {
          container: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
          dot: "bg-zinc-400",
        };

      // Priorities
      case "URGENT":
      case "CRITICAL":
        return {
          container: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800 font-semibold",
          dot: "bg-rose-500",
        };
      case "HIGH":
        return {
          container: "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800",
          dot: "bg-orange-500",
        };
      case "MEDIUM":
        return {
          container: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          dot: "bg-amber-500",
        };
      case "LOW":
      case "NORMAL":
        return {
          container: "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          dot: "bg-slate-400",
        };

      // Escalation Statuses
      case "OPEN":
        return {
          container: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          dot: "bg-amber-500",
        };
      case "RESOLVED":
        return {
          container: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          dot: "bg-emerald-500",
        };

      default:
        return {
          container: "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          dot: "bg-slate-400",
        };
    }
  };

  const style = getStyle();
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-normal font-medium transition-colors ${style.container} ${sizeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      <span>{text}</span>
    </span>
  );
};

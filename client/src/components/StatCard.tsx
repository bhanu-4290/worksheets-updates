import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "indigo" | "emerald" | "amber" | "rose" | "blue" | "purple" | "slate";
  badge?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "indigo",
  badge,
  trend,
}) => {
  const colorStyles = {
    indigo: {
      iconBg: "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/10",
      pill: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
      glow: "hover:border-indigo-300 dark:hover:border-indigo-700/60",
    },
    emerald: {
      iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/10",
      pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
      glow: "hover:border-emerald-300 dark:hover:border-emerald-700/60",
    },
    amber: {
      iconBg: "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-500/10",
      pill: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
      glow: "hover:border-amber-300 dark:hover:border-amber-700/60",
    },
    rose: {
      iconBg: "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-500/10",
      pill: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
      glow: "hover:border-rose-300 dark:hover:border-rose-700/60",
    },
    blue: {
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/10",
      pill: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
      glow: "hover:border-blue-300 dark:hover:border-blue-700/60",
    },
    purple: {
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-500/10",
      pill: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
      glow: "hover:border-purple-300 dark:hover:border-purple-700/60",
    },
    slate: {
      iconBg: "bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-md shadow-slate-500/20 ring-2 ring-slate-500/10",
      pill: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      glow: "hover:border-slate-300 dark:hover:border-slate-700",
    },
  };

  const currentTheme = colorStyles[color] || colorStyles.indigo;

  return (
    <div
      className={`group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5.5 shadow-xs hover-card-lift ${currentTheme.glow}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${currentTheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-4 flex items-baseline gap-2.5">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>
        {badge && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${currentTheme.pill}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Subtitle / Context Note */}
      {subtitle && (
        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          {subtitle}
        </p>
      )}

      {/* Decorative gradient corner aura */}
      <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none group-hover:scale-150 transition-transform duration-500" />
    </div>
  );
};

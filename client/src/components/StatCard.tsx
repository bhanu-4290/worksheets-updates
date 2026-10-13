import React from "react";
import { LucideIcon, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  onClick?: () => void;
  to?: string;
  actionLabel?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "indigo",
  badge,
  onClick,
  to,
  actionLabel,
}) => {
  const navigate = useNavigate();

  const colorStyles = {
    indigo: {
      iconBg:
        "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 group-hover:bg-indigo-600 group-hover:text-white transition-colors",
      pill: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
      hoverBorder: "hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-indigo-500/10",
      actionText: "text-indigo-600 dark:text-indigo-400",
    },
    emerald: {
      iconBg:
        "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 group-hover:bg-emerald-600 group-hover:text-white transition-colors",
      pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
      hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-emerald-500/10",
      actionText: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
      iconBg:
        "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 group-hover:bg-amber-500 group-hover:text-white transition-colors",
      pill: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
      hoverBorder: "hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-amber-500/10",
      actionText: "text-amber-600 dark:text-amber-400",
    },
    rose: {
      iconBg:
        "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 group-hover:bg-rose-600 group-hover:text-white transition-colors",
      pill: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
      hoverBorder: "hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-rose-500/10",
      actionText: "text-rose-600 dark:text-rose-400",
    },
    blue: {
      iconBg:
        "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 group-hover:bg-blue-600 group-hover:text-white transition-colors",
      pill: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
      hoverBorder: "hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-blue-500/10",
      actionText: "text-blue-600 dark:text-blue-400",
    },
    purple: {
      iconBg:
        "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 group-hover:bg-purple-600 group-hover:text-white transition-colors",
      pill: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
      hoverBorder: "hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-purple-500/10",
      actionText: "text-purple-600 dark:text-purple-400",
    },
    slate: {
      iconBg:
        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 group-hover:bg-slate-700 group-hover:text-white transition-colors",
      pill: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      hoverBorder: "hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-slate-500/10",
      actionText: "text-slate-600 dark:text-slate-400",
    },
  };

  const currentTheme = colorStyles[color] || colorStyles.indigo;
  const isInteractive = Boolean(onClick || to);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    }
  };

  const content = (
    <>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 w-full">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
          {title}
        </span>
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${currentTheme.iconBg}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-3 flex items-baseline justify-between gap-2 w-full">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </span>
          {badge && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${currentTheme.pill}`}>
              {badge}
            </span>
          )}
        </div>

        {isInteractive && !actionLabel && (
          <ArrowUpRight
            className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${currentTheme.actionText}`}
          />
        )}
      </div>

      {/* Subtitle or Interactive Action Footer */}
      {(subtitle || actionLabel) && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 w-full">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {subtitle || actionLabel}
          </span>
          {isInteractive && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-semibold shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${currentTheme.actionText}`}
            >
              {subtitle && actionLabel ? actionLabel : ""}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      )}
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`group w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] cursor-pointer flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${currentTheme.hoverBorder}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover-card-lift flex flex-col justify-between">
      {content}
    </div>
  );
};


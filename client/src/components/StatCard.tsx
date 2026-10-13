import React from "react";
import { LucideIcon, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "emerald" | "amber" | "rose" | "blue" | "slate";
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
  color = "blue",
  badge,
  onClick,
  to,
  actionLabel,
}) => {
  const navigate = useNavigate();

  const colorStyles = {
    emerald: {
      iconBg:
        "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 group-hover:bg-emerald-600 group-hover:text-white transition-colors",
      pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
      hoverBorder: "hover:border-emerald-500 dark:hover:border-emerald-500",
      actionText: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
      iconBg:
        "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 group-hover:bg-amber-500 group-hover:text-white transition-colors",
      pill: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
      hoverBorder: "hover:border-amber-500 dark:hover:border-amber-500",
      actionText: "text-amber-600 dark:text-amber-400",
    },
    rose: {
      iconBg:
        "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 group-hover:bg-rose-600 group-hover:text-white transition-colors",
      pill: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
      hoverBorder: "hover:border-rose-500 dark:hover:border-rose-500",
      actionText: "text-rose-600 dark:text-rose-400",
    },
    blue: {
      iconBg:
        "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 group-hover:bg-blue-600 group-hover:text-white transition-colors",
      pill: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
      hoverBorder: "hover:border-blue-500 dark:hover:border-blue-500",
      actionText: "text-blue-600 dark:text-blue-400",
    },
    slate: {
      iconBg:
        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 group-hover:bg-slate-700 group-hover:text-white transition-colors",
      pill: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      hoverBorder: "hover:border-slate-400 dark:hover:border-slate-600",
      actionText: "text-slate-600 dark:text-slate-400",
    },
  };

  const currentTheme = colorStyles[color] || colorStyles.blue;
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
          className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${currentTheme.iconBg}`}
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
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${currentTheme.pill}`}>
              {badge}
            </span>
          )}
        </div>

        {isInteractive && !actionLabel && (
          <ArrowUpRight
            className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${currentTheme.actionText}`}
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
              className={`inline-flex items-center gap-0.5 text-[11px] font-semibold shrink-0 ${currentTheme.actionText}`}
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
        className={`group w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs transition-colors duration-150 cursor-pointer flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${currentTheme.hoverBorder}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs flex flex-col justify-between">
      {content}
    </div>
  );
};

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

/**
 * AROS KPI Card Component
 * 
 * Enhanced KPI cards with:
 * - Trend indicators
 * - Progress bars
 * - Comparison data
 * - Sparkline charts (optional)
 * 
 * Used for dashboard role-based views:
 * - Manager Giorgio: High-level KPIs
 * - Technician Marco: Job-specific metrics
 * - Receptionist Laura: Quick stats
 */

type Trend = "up" | "down" | "neutral";
type KpiSize = "sm" | "default" | "lg";
type KpiVariant = "default" | "success" | "warning" | "critical" | "info";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    direction: Trend;
    value: string;
    label?: string;
  };
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
  comparison?: {
    label: string;
    value: string;
  };
  size?: KpiSize;
  variant?: KpiVariant;
  onClick?: () => void;
  className?: string;
  loading?: boolean;
}

const variantStyles: Record<KpiVariant, { bg: string; icon: string; text: string }> = {
  default: {
    bg: "bg-slate-50 dark:bg-slate-900/50",
    icon: "bg-slate-500",
    text: "text-slate-600 dark:text-slate-400",
  },
  success: {
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    icon: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
    icon: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  critical: {
    bg: "bg-red-50/50 dark:bg-red-950/20",
    icon: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
  info: {
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
    icon: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
};

const trendIcons: Record<Trend, React.ComponentType<{ className?: string }>> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendColors: Record<Trend, string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-red-600 dark:text-red-400",
  neutral: "text-slate-400",
};

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  progress,
  comparison,
  size = "default",
  variant = "default",
  onClick,
  className,
  loading = false,
}: KpiCardProps) {
  const styles = variantStyles[variant];
  const TrendIcon = trend ? trendIcons[trend.direction] : null;

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 animate-pulse",
          className
        )}
      >
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700",
        "bg-white dark:bg-slate-800",
        "transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:border-blue-500/30",
        className
      )}
    >
      {/* Background accent */}
      <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10", styles.icon)} />

      <div className={cn("relative", size === "sm" ? "p-4" : size === "lg" ? "p-8" : "p-6")}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className={cn("text-sm font-medium", styles.text)}>{title}</p>
            <h3
              className={cn(
                "font-bold text-slate-900 dark:text-slate-100 mt-1",
                size === "sm" ? "text-xl" : size === "lg" ? "text-4xl" : "text-3xl"
              )}
            >
              {value}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>

          {Icon && (
            <div
              className={cn(
                "flex items-center justify-center rounded-xl text-white",
                styles.icon,
                size === "sm" ? "w-10 h-10" : size === "lg" ? "w-16 h-16" : "w-12 h-12"
              )}
            >
              <Icon className={size === "lg" ? "h-8 w-8" : "h-5 w-5"} />
            </div>
          )}
        </div>

        {/* Trend */}
        {trend && TrendIcon && (
          <div className="flex items-center gap-2 mt-4">
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                trend.direction === "up" && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
                trend.direction === "down" && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
                trend.direction === "neutral" && "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              )}
            >
              <TrendIcon className="h-3 w-3" />
              <span>{trend.value}</span>
            </div>
            {trend.label && (
              <span className="text-xs text-slate-500">{trend.label}</span>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {progress && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500">{progress.label || "Progresso"}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {progress.current}/{progress.total}
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", styles.icon)}
                style={{ width: `${Math.min((progress.current / progress.total) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Comparison */}
        {comparison && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{comparison.label}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {comparison.value}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * KPI Grid - Responsive grid for multiple KPIs
 */
interface KpiGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3 | 4 | 5;
}

function KpiGrid({ children, className, columns = 4 }: KpiGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}

/**
 * KPI Group - Grouped KPIs with title
 */
interface KpiGroupProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function KpiGroup({ title, children, className, action }: KpiGroupProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * Mini Stat - Compact stat for dense layouts
 */
interface MiniStatProps {
  label: string;
  value: string | number;
  trend?: Trend;
  className?: string;
}

function MiniStat({ label, value, trend, className }: MiniStatProps) {
  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <div className={cn("text-center", className)}>
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="flex items-center justify-center gap-1 mt-1">
        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</span>
        {TrendIcon && trend && <TrendIcon className={cn("h-3.5 w-3.5", trendColors[trend])} />}
      </div>
    </div>
  );
}

export {
  KpiCard,
  KpiGrid,
  KpiGroup,
  MiniStat,
};
export type {
  KpiCardProps,
  KpiGridProps,
  KpiGroupProps,
  MiniStatProps,
  Trend,
  KpiSize,
  KpiVariant,
};

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { StatusBadge } from "./status-badge";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Wrench,
  Car,
  Phone,
  MessageCircle,
  Package,
  User,
  ChevronRight,
} from "lucide-react";

/**
 * AROS Timeline Component
 * 
 * Visual timeline for tracking work orders, appointments, and activities.
 * Optimized for garage management workflows.
 * 
 * Features:
 * - Status indicators with colors
 * - Time tracking
 * - User avatars
 * - Expandable details
 */

type TimelineItemStatus = "completed" | "in_progress" | "pending" | "critical" | "warning";

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date;
  status: TimelineItemStatus;
  icon?: React.ComponentType<{ className?: string }>;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: {
    label: string;
    value: string;
  }[];
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  showTime?: boolean;
  emptyMessage?: string;
}

const statusConfig: Record<TimelineItemStatus, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  completed: { color: "bg-emerald-500", icon: CheckCircle2 },
  in_progress: { color: "bg-blue-500", icon: Clock },
  pending: { color: "bg-amber-500", icon: Clock },
  critical: { color: "bg-red-500", icon: AlertCircle },
  warning: { color: "bg-orange-500", icon: AlertCircle },
};

function Timeline({
  items,
  className,
  showTime = true,
  emptyMessage = "Nessuna attività recente",
}: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className={cn("text-center py-8 text-slate-500", className)}>
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item, index) => (
        <TimelineItemComponent
          key={item.id}
          item={item}
          isLast={index === items.length - 1}
          showTime={showTime}
        />
      ))}
    </div>
  );
}

interface TimelineItemComponentProps {
  item: TimelineItem;
  isLast: boolean;
  showTime: boolean;
}

function TimelineItemComponent({ item, isLast, showTime }: TimelineItemComponentProps) {
  const [expanded, setExpanded] = React.useState(false);
  const config = statusConfig[item.status];
  const Icon = item.icon || config.icon;

  return (
    <div className={cn("relative pl-8", !isLast && "pb-6")}>
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] top-7 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
      )}

      {/* Timeline dot */}
      <div
        className={cn(
          "absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center",
          config.color,
          item.status === "in_progress" && "animate-pulse"
        )}
      >
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                {item.title}
              </h4>
              <StatusBadge
                status={
                  item.status === "completed"
                    ? "success"
                    : item.status === "in_progress"
                    ? "info"
                    : item.status === "critical"
                    ? "critical"
                    : item.status === "warning"
                    ? "warning"
                    : "neutral"
                }
                size="sm"
              />
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {item.description}
              </p>
            )}

            {/* Time and User */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              {showTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(item.timestamp, "HH:mm", { locale: it })}
                </span>
              )}
              {item.user && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {item.user.name}
                </span>
              )}
            </div>

            {/* Metadata */}
            {item.metadata && expanded && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-2">
                {item.metadata.map((meta, idx) => (
                  <div key={idx}>
                    <p className="text-xs text-slate-500">{meta.label}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {meta.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Action */}
            {item.action && (
              <button
                onClick={item.action.onClick}
                className="mt-3 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
              >
                {item.action.label}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Expand toggle */}
          {item.metadata && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <ChevronRight
                className={cn(
                  "h-5 w-5 transition-transform",
                  expanded && "rotate-90"
                )}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Activity Feed - Specialized timeline for recent activities
 */
interface Activity {
  id: string;
  type: "work_order" | "appointment" | "call" | "message" | "part" | "vehicle";
  title: string;
  description: string;
  timestamp: Date;
  user: string;
}

const activityIcons: Record<Activity["type"], React.ComponentType<{ className?: string }>> = {
  work_order: Wrench,
  appointment: Clock,
  call: Phone,
  message: MessageCircle,
  part: Package,
  vehicle: Car,
};

const activityColors: Record<Activity["type"], string> = {
  work_order: "bg-blue-500",
  appointment: "bg-purple-500",
  call: "bg-green-500",
  message: "bg-cyan-500",
  part: "bg-orange-500",
  vehicle: "bg-indigo-500",
};

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
  maxItems?: number;
}

function ActivityFeed({ activities, className, maxItems = 10 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className={cn("space-y-3", className)}>
      {displayActivities.map((activity) => {
        const Icon = activityIcons[activity.type];
        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                activityColors[activity.type]
              )}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {activity.title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{activity.description}</p>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                <span>{activity.user}</span>
                <span>•</span>
                <span>
                  {format(activity.timestamp, "HH:mm", { locale: it })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Work Order Progress Timeline
 * Specialized for tracking work order stages
 */
interface WorkOrderStage {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
  timestamp?: Date;
  user?: string;
}

interface WorkOrderProgressProps {
  stages: WorkOrderStage[];
  className?: string;
}

function WorkOrderProgress({ stages, className }: WorkOrderProgressProps) {
  const currentIndex = stages.findIndex((s) => s.current);
  const progress = ((currentIndex + 1) / stages.length) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Bar */}
      <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stages */}
      <div className="grid grid-cols-5 gap-2">
        {stages.map((stage, index) => (
          <div key={stage.id} className="text-center">
            <div
              className={cn(
                "w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium",
                stage.completed && "bg-emerald-500 text-white",
                stage.current && "bg-blue-500 text-white ring-4 ring-blue-500/20",
                !stage.completed && !stage.current && "bg-slate-100 dark:bg-slate-800 text-slate-400"
              )}
            >
              {stage.completed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <p
              className={cn(
                "text-xs mt-2 font-medium",
                stage.current
                  ? "text-blue-600 dark:text-blue-400"
                  : stage.completed
                  ? "text-slate-700 dark:text-slate-300"
                  : "text-slate-400"
              )}
            >
              {stage.label}
            </p>
            {stage.timestamp && (
              <p className="text-[10px] text-slate-400">
                {format(stage.timestamp, "HH:mm", { locale: it })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export {
  Timeline,
  ActivityFeed,
  WorkOrderProgress,
};
export type {
  TimelineItem,
  TimelineProps,
  Activity,
  ActivityFeedProps,
  WorkOrderStage,
  WorkOrderProgressProps,
};

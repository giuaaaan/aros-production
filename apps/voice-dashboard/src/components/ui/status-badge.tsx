"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle2,
  Clock,
  Wrench,
  Package,
  Car,
  Phone
} from "lucide-react";

/**
 * AROS Status Badge System
 * 
 * 🔴 Critico - Richiede azione immediata
 * 🟠 Warning - Attenzione richiesta
 * 🟡 Info - Notifica informativa
 * 🟢 Success - Operazione completata
 * 
 * Usage:
 * <StatusBadge status="critical" label="Fermo macchina" />
 * <StatusBadge status="warning" label="In attesa ricambi" />
 */

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
  {
    variants: {
      status: {
        // 🔴 Critico - Fermo macchina, incidente, guasto grave
        critical: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
        // 🟠 Warning - In attesa, ritardo, da verificare
        warning: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
        // 🟡 Info - In corso, programmato, nota
        info: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
        // 🟢 Success - Completato, consegnato, OK
        success: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
        // ⚪ Neutral - Default, bozza, archiviato
        neutral: "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
      pulse: {
        true: "animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      status: "neutral",
      size: "default",
      pulse: false,
    },
  }
);

const statusIcons = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
  neutral: Clock,
};

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  label?: string;
  icon?: React.ComponentType<{ className?: string }> | null;
  showDot?: boolean;
}

function StatusBadge({
  className,
  status,
  size,
  pulse,
  label,
  icon: CustomIcon,
  showDot = true,
  children,
  ...props
}: StatusBadgeProps) {
  const Icon = CustomIcon === null ? null : (CustomIcon || statusIcons[status || "neutral"]);
  
  return (
    <span
      className={cn(statusBadgeVariants({ status, size, pulse }), className)}
      {...props}
    >
      {showDot && !Icon && (
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            status === "critical" && "bg-red-500",
            status === "warning" && "bg-amber-500",
            status === "info" && "bg-blue-500",
            status === "success" && "bg-emerald-500",
            status === "neutral" && "bg-slate-400"
          )}
        />
      )}
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label || children}
    </span>
  );
}

/**
 * Work Order Status Badge - Pre-configured for work order states
 */
const workOrderStatuses = {
  pending: { status: "warning" as const, label: "In Attesa", icon: Clock },
  in_progress: { status: "info" as const, label: "In Lavorazione", icon: Wrench },
  waiting_parts: { status: "warning" as const, label: "In Attesa Ricambi", icon: Package },
  completed: { status: "success" as const, label: "Completato", icon: CheckCircle2 },
  delivered: { status: "success" as const, label: "Consegnato", icon: Car },
  critical: { status: "critical" as const, label: "Urgente", icon: AlertCircle },
};

interface WorkOrderStatusBadgeProps extends Omit<StatusBadgeProps, "status" | "label" | "icon"> {
  workStatus: keyof typeof workOrderStatuses;
}

function WorkOrderStatusBadge({ workStatus, ...props }: WorkOrderStatusBadgeProps) {
  const config = workOrderStatuses[workStatus];
  return (
    <StatusBadge
      status={config.status}
      label={config.label}
      icon={config.icon}
      {...props}
    />
  );
}

/**
 * Alert Banner - Full-width alert for critical notifications
 */
const alertVariants = cva(
  "flex items-start gap-3 p-4 rounded-lg border",
  {
    variants: {
      variant: {
        critical: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-900 dark:text-red-100",
        warning: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-100",
        info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-100",
        success: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-100",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

interface AlertBannerProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof alertVariants> {
  title?: string;
  description?: string;
  onDismiss?: () => void;
}

function AlertBanner({
  className,
  variant,
  title,
  description,
  onDismiss,
  children,
  ...props
}: AlertBannerProps) {
  const Icon = statusIcons[variant === "critical" ? "critical" : variant === "warning" ? "warning" : variant === "success" ? "success" : "info"];
  
  return (
    <div
      className={cn(alertVariants({ variant }), className)}
      role="alert"
      {...props}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold text-sm">{title}</h4>}
        {description && <p className="text-sm opacity-90 mt-1">{description}</p>}
        {children}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export { StatusBadge, WorkOrderStatusBadge, AlertBanner };
export type { StatusBadgeProps, WorkOrderStatusBadgeProps, AlertBannerProps };

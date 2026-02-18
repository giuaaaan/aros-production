"use client";

import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Clock, User, Car, Phone, MessageCircle, ChevronRight, CalendarX } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Today Appointments Component - Enhanced Version
 * 
 * Features:
 * - Status badges with proper colors
 * - Vehicle info with license plate
 * - Contact quick actions
 * - Mobile-optimized layout
 */

interface Appointment {
  id: string;
  scheduled_at: string;
  service_type: string;
  status: 'confirmed' | 'in_progress' | 'pending' | 'completed' | 'cancelled';
  channel?: 'phone' | 'whatsapp' | 'web' | 'voice';
  customers: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  vehicles: {
    make: string | null;
    model: string | null;
    license_plate: string | null;
  } | null;
}

interface TodayAppointmentsProps {
  appointments: Appointment[];
  className?: string;
  maxDisplay?: number;
}

const statusConfig = {
  confirmed: { 
    variant: 'success' as const, 
    label: 'Confermato',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  in_progress: { 
    variant: 'info' as const, 
    label: 'In corso',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  pending: { 
    variant: 'warning' as const, 
    label: 'In attesa',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  completed: { 
    variant: 'neutral' as const, 
    label: 'Completato',
    bgColor: 'bg-slate-50 dark:bg-slate-900/50',
    borderColor: 'border-slate-200 dark:border-slate-700',
  },
  cancelled: { 
    variant: 'critical' as const, 
    label: 'Cancellato',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
  },
};

const channelIcons = {
  phone: Phone,
  whatsapp: MessageCircle,
  web: CalendarX,
  voice: Phone,
};

export function TodayAppointments({ 
  appointments, 
  className,
  maxDisplay = 10,
}: TodayAppointmentsProps) {
  const sortedAppointments = [...appointments]
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, maxDisplay);

  if (appointments.length === 0) {
    return (
      <div className={cn(
        "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center",
        className
      )}>
        <CalendarX className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <h3 className="font-medium text-slate-900 dark:text-slate-100">Nessun appuntamento</h3>
        <p className="text-sm text-slate-500 mt-1">
          Non ci sono appuntamenti programmati per oggi
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Appuntamenti di Oggi
          </h3>
          <span className="text-sm text-slate-500">
            {appointments.length} totali
          </span>
        </div>
      </div>

      {/* Appointments List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {sortedAppointments.map((apt) => {
          const config = statusConfig[apt.status];
          const ChannelIcon = apt.channel ? channelIcons[apt.channel] : null;
          const time = format(new Date(apt.scheduled_at), 'HH:mm', { locale: it });

          return (
            <div
              key={apt.id}
              className={cn(
                "p-4 sm:p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                config.bgColor.replace('bg-', 'hover:bg-').replace('dark:hover:bg-', 'dark:hover:bg-')
              )}
            >
              <div className="flex items-start gap-4">
                {/* Time Column */}
                <div className="flex-shrink-0 w-16 text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {time}
                  </p>
                  {ChannelIcon && (
                    <ChannelIcon className="h-4 w-4 mx-auto mt-1 text-slate-400" />
                  )}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {/* Customer Name */}
                      <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        {apt.customers?.first_name} {apt.customers?.last_name}
                      </p>

                      {/* Vehicle Info */}
                      {apt.vehicles && (
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                          <Car className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span>
                            {apt.vehicles.make} {apt.vehicles.model}
                          </span>
                          {apt.vehicles.license_plate && (
                            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                              {apt.vehicles.license_plate}
                            </span>
                          )}
                        </p>
                      )}

                      {/* Service Type */}
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        {apt.service_type}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <StatusBadge
                      status={config.variant}
                      label={config.label}
                      size="sm"
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    {apt.customers?.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => window.open(`tel:${apt.customers?.phone}`)}
                      >
                        <Phone className="h-3.5 w-3.5 mr-1" />
                        Chiama
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-slate-500"
                    >
                      Dettagli
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {appointments.length > maxDisplay && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center">
          <Button variant="ghost" size="sm">
            Vedi tutti ({appointments.length})
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Mini Appointment List - Compact version for sidebars
 */
interface MiniAppointmentListProps {
  appointments: Appointment[];
  className?: string;
}

export function MiniAppointmentList({ appointments, className }: MiniAppointmentListProps) {
  const upcoming = appointments
    .filter(a => new Date(a.scheduled_at) > new Date())
    .slice(0, 3);

  return (
    <div className={cn("space-y-2", className)}>
      {upcoming.map((apt) => (
        <div
          key={apt.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
        >
          <div className="text-center min-w-[48px]">
            <p className="text-sm font-bold">
              {format(new Date(apt.scheduled_at), 'HH:mm', { locale: it })}
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {apt.customers?.first_name} {apt.customers?.last_name}
            </p>
            <p className="text-xs text-slate-500 truncate">{apt.service_type}</p>
          </div>
          <div className={cn(
            "w-2 h-2 rounded-full",
            apt.status === 'confirmed' && "bg-emerald-500",
            apt.status === 'in_progress' && "bg-blue-500",
            apt.status === 'pending' && "bg-amber-500",
          )} />
        </div>
      ))}
      {upcoming.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">
          Nessun appuntamento imminente
        </p>
      )}
    </div>
  );
}

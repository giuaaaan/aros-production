"use client";

import { Calendar, Phone, MessageCircle, TrendingUp, Users, Clock } from 'lucide-react';
import { KpiCard, KpiGrid } from '@/components/ui/kpi-card';

/**
 * Stats Cards Component - Using new KPI Card system
 * 
 * Displays key metrics for the dashboard:
 * - Today's appointments
 * - AI calls handled
 * - WhatsApp conversations
 * - Conversion rate
 */

interface StatsCardsProps {
  todayAppointments: number;
  successfulCalls: number;
  whatsappChats: number;
  conversionRate?: string;
  className?: string;
}

export function StatsCards({ 
  todayAppointments, 
  successfulCalls, 
  whatsappChats, 
  conversionRate = "87%",
  className 
}: StatsCardsProps) {
  return (
    <KpiGrid columns={4} className={className}>
      <KpiCard
        title="Appuntamenti Oggi"
        value={todayAppointments}
        icon={Calendar}
        variant="info"
        trend={{ direction: 'up', value: '+2', label: 'vs ieri' }}
      />
      <KpiCard
        title="Chiamate AI Gestite"
        value={successfulCalls}
        icon={Phone}
        variant="success"
        trend={{ direction: 'up', value: '+12%', label: 'efficienza' }}
      />
      <KpiCard
        title="Conversazioni WhatsApp"
        value={whatsappChats}
        icon={MessageCircle}
        variant="info"
      />
      <KpiCard
        title="Tasso Conversione"
        value={conversionRate}
        icon={TrendingUp}
        variant="success"
        trend={{ direction: 'up', value: '+5%', label: 'vs mese scorso' }}
        comparison={{ label: 'Obiettivo', value: '85%' }}
      />
    </KpiGrid>
  );
}

/**
 * Compact Stats Row - For mobile or dense layouts
 */
interface CompactStatsProps {
  todayAppointments: number;
  successfulCalls: number;
  pendingTasks?: number;
  className?: string;
}

export function CompactStats({
  todayAppointments,
  successfulCalls,
  pendingTasks = 0,
  className,
}: CompactStatsProps) {
  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 text-center">
        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{todayAppointments}</p>
        <p className="text-xs text-slate-500">Appuntamenti</p>
      </div>
      <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 text-center">
        <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{successfulCalls}</p>
        <p className="text-xs text-slate-500">Chiamate</p>
      </div>
      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-center">
        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{pendingTasks}</p>
        <p className="text-xs text-slate-500">In attesa</p>
      </div>
    </div>
  );
}

/**
 * Stats with Progress - Shows progress towards goals
 */
interface StatsWithProgressProps {
  dailyGoal: number;
  currentAppointments: number;
  completedCalls: number;
  targetCalls: number;
  className?: string;
}

export function StatsWithProgress({
  dailyGoal,
  currentAppointments,
  completedCalls,
  targetCalls,
  className,
}: StatsWithProgressProps) {
  return (
    <KpiGrid columns={2} className={className}>
      <KpiCard
        title="Obiettivo Giornaliero"
        value={`${currentAppointments}/${dailyGoal}`}
        subtitle="appuntamenti"
        icon={Calendar}
        variant="info"
        progress={{ 
          current: currentAppointments, 
          total: dailyGoal, 
          label: 'Completamento' 
        }}
      />
      <KpiCard
        title="Chiamate Completate"
        value={`${completedCalls}/${targetCalls}`}
        subtitle="gestite dall'AI"
        icon={Phone}
        variant="success"
        progress={{ 
          current: completedCalls, 
          total: targetCalls, 
          label: 'Progresso' 
        }}
      />
    </KpiGrid>
  );
}

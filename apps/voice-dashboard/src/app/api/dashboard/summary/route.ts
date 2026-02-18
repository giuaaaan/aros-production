/**
 * GET /api/dashboard/summary
 * Get dashboard summary with all advanced features metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Strict types for database entities
interface VehicleKey {
  status: string;
  assigned_at: string | null;
}

interface TechnicalStop {
  severity: string;
  vehicle_immobilized: boolean;
}

interface PendingDecision {
  sent_at: string;
  reminder_3d_sent_at: string | null;
  reminder_7d_sent_at: string | null;
  reminder_14d_sent_at: string | null;
}

interface QualityCheck {
  passed: boolean;
}

interface ConsumableItem {
  current_quantity: number;
  min_threshold: number;
}

interface TimeTrackingSession {
  id: string;
  started_at: string;
  completed_at: string | null;
  total_minutes: number;
  technician_id: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user's org_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // 3. Get counts in parallel
    const [
      keysResult,
      technicalStopsResult,
      pendingDecisionsResult,
      qualityChecksResult,
      consumablesResult,
      timeTrackingResult,
    ] = await Promise.all([
      // Keys
      supabase
        .from("vehicle_keys")
        .select("status, assigned_at")
        .eq("org_id", profile.org_id),
      
      // Technical stops
      supabase
        .from("technical_stops")
        .select("severity, vehicle_immobilized, resolved_at")
        .eq("org_id", profile.org_id)
        .is("resolved_at", null),
      
      // Pending decisions
      supabase
        .from("pending_decisions")
        .select("sent_at, reminder_3d_sent_at, reminder_7d_sent_at, reminder_14d_sent_at")
        .eq("org_id", profile.org_id)
        .eq("status", "waiting"),
      
      // Quality checks
      supabase
        .from("quality_checks")
        .select("passed, created_at")
        .eq("org_id", profile.org_id)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      
      // Consumables
      supabase
        .from("consumables_inventory")
        .select("current_quantity, min_threshold")
        .eq("org_id", profile.org_id),
      
      // Time tracking
      supabase
        .from("time_tracking")
        .select("id, started_at, completed_at, total_minutes, technician_id")
        .eq("org_id", profile.org_id)
        .eq("technician_id", profile.id)
        .is("completed_at", null),
    ]);

    // 4. Calculate metrics
    const now = new Date();
    const KEY_OVERDUE_MINUTES = 480; // 8 hours

    // Keys metrics
    const keysIssued = keysResult.data?.filter((k: VehicleKey) => k.status === "issued") || [];
    const keysOverdue = keysIssued.filter((k: VehicleKey) => {
      if (!k.assigned_at) return false;
      const assignedAt = new Date(k.assigned_at);
      return (now.getTime() - assignedAt.getTime()) / (1000 * 60) > KEY_OVERDUE_MINUTES;
    });

    // Technical stops metrics
    const criticalStops = technicalStopsResult.data?.filter(
      (s: TechnicalStop) => s.severity === "critical" || s.vehicle_immobilized
    ) || [];

    // Pending decisions metrics
    const decisionsNeedingReminder = pendingDecisionsResult.data?.filter((d: PendingDecision) => {
      const sentAt = new Date(d.sent_at);
      const daysWaiting = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24));
      return (
        (daysWaiting >= 3 && !d.reminder_3d_sent_at) ||
        (daysWaiting >= 7 && !d.reminder_7d_sent_at) ||
        (daysWaiting >= 14 && !d.reminder_14d_sent_at)
      );
    }) || [];

    // Quality checks metrics
    const failedChecks = qualityChecksResult.data?.filter((q: QualityCheck) => !q.passed) || [];

    // Consumables metrics
    const lowStockItems = consumablesResult.data?.filter(
      (i: ConsumableItem) => i.current_quantity <= i.min_threshold
    ) || [];

    // Time tracking metrics
    const activeSessions: TimeTrackingSession[] = timeTrackingResult.data || [];
    const todayMinutes = activeSessions.reduce((sum: number, s: TimeTrackingSession) => {
      const startedAt = new Date(s.started_at);
      const minutes = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60));
      return sum + minutes;
    }, 0);

    // 5. Build summary
    const summary = {
      keys_issued: keysIssued.length,
      keys_overdue: keysOverdue.length,
      active_technical_stops: technicalStopsResult.data?.length || 0,
      critical_stops: criticalStops.length,
      pending_decisions: pendingDecisionsResult.data?.length || 0,
      decisions_needing_reminder: decisionsNeedingReminder.length,
      quality_checks_today: qualityChecksResult.data?.length || 0,
      quality_checks_failed: failedChecks.length,
      low_stock_items: lowStockItems.length,
      active_sessions: activeSessions.length,
      total_hours_today: Math.round((todayMinutes / 60) * 100) / 100,
      total_alerts: keysOverdue.length + criticalStops.length + decisionsNeedingReminder.length + lowStockItems.length,
    };

    return NextResponse.json({
      summary,
      alerts: {
        keys_overdue: keysOverdue.length > 0,
        critical_stops: criticalStops.length > 0,
        decisions_need_attention: decisionsNeedingReminder.length > 0,
        low_stock: lowStockItems.length > 0,
      },
    });

  } catch (error) {
    console.error("Dashboard summary API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

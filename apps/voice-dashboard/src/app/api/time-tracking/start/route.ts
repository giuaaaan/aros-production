/**
 * POST /api/time-tracking/start
 * Start time tracking for an ODL
 * Can be auto-started when key is issued
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { TimeTracking, TimeTrackingWorkType } from "@/types/advanced-features";

const startTrackingSchema = z.object({
  odl_id: z.string().uuid(),
  work_type: z.enum(["repair", "diagnostic", "maintenance", "warranty", "other"] as const).default("repair"),
  notes: z.string().optional(),
  auto_started: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user's org_id and profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, id, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // 3. Validate input
    const body = await request.json();
    const validation = startTrackingSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { odl_id, work_type, notes, auto_started } = validation.data;

    // 4. Verify work order exists and belongs to org
    const { data: workOrder } = await supabase
      .from("work_orders")
      .select("id, status")
      .eq("id", odl_id)
      .eq("org_id", profile.org_id)
      .single();

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }

    if (workOrder.status === "completed" || workOrder.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot start tracking for completed or cancelled work order" },
        { status: 409 }
      );
    }

    // 5. Check if there's already an active tracking for this ODL by this technician
    const { data: existingTracking } = await supabase
      .from("time_tracking")
      .select("id, started_at, is_paused")
      .eq("odl_id", odl_id)
      .eq("technician_id", profile.id)
      .is("completed_at", null)
      .maybeSingle();

    if (existingTracking) {
      return NextResponse.json(
        { 
          error: "Active tracking session already exists",
          tracking_id: existingTracking.id,
          started_at: existingTracking.started_at,
        },
        { status: 409 }
      );
    }

    // 6. Check if technician has another active tracking (warn but allow)
    const { data: otherActiveTracking } = await supabase
      .from("time_tracking")
      .select(`
        id,
        started_at,
        odl:work_orders(wo_number)
      `)
      .eq("technician_id", profile.id)
      .is("completed_at", null)
      .maybeSingle();

    // 7. Create time tracking session
    const now = new Date().toISOString();
    const { data: tracking, error: createError } = await supabase
      .from("time_tracking")
      .insert({
        odl_id,
        technician_id: profile.id,
        started_at: now,
        work_type,
        notes,
        auto_started,
        org_id: profile.org_id,
      })
      .select(`
        *,
        odl:work_orders(wo_number, description),
        technician:profiles(first_name, last_name)
      `)
      .single();

    if (createError) {
      console.error("Time tracking creation error:", createError);
      return NextResponse.json(
        { error: "Failed to start time tracking" },
        { status: 500 }
      );
    }

    // 8. Update work order status if needed
    if (workOrder.status === "pending") {
      await supabase
        .from("work_orders")
        .update({ status: "in_progress", started_at: now })
        .eq("id", odl_id);
    }

    return NextResponse.json({
      success: true,
      message: "Time tracking started",
      tracking,
      warning: otherActiveTracking ? {
        message: "You have another active tracking session",
        other_tracking: otherActiveTracking,
      } : undefined,
    }, { status: 201 });

  } catch (error) {
    console.error("Start time tracking API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/time-tracking/start
 * Get active tracking sessions for current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user's org_id and profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // 3. Get active tracking sessions
    const { data: activeSessions, error } = await supabase
      .from("time_tracking")
      .select(`
        id,
        odl_id,
        started_at,
        paused_at,
        total_minutes,
        work_type,
        auto_started,
        odl:work_orders(wo_number, description, status)
      `)
      .eq("technician_id", profile.id)
      .is("completed_at", null)
      .order("started_at", { ascending: false });

    if (error) {
      console.error("Active sessions query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch active sessions" },
        { status: 500 }
      );
    }

    // Supabase returns joined relations as arrays
    interface ActiveSessionRaw {
      id: string;
      odl_id: string;
      started_at: string;
      paused_at?: string | null;
      total_minutes?: number | null;
      work_type: TimeTrackingWorkType;
      auto_started: boolean;
      odl?: Array<{
        wo_number: string;
        description: string;
        status: string;
      }> | null;
    }

    interface ActiveSession {
      id: string;
      odl_id: string;
      started_at: string;
      paused_at?: string | null;
      total_minutes?: number | null;
      work_type: TimeTrackingWorkType;
      auto_started: boolean;
      odl?: {
        wo_number: string;
        description: string;
        status: string;
      } | null;
    }

    // Calculate current session minutes
    const rawSessions = (activeSessions as ActiveSessionRaw[] | null) ?? [];
    const sessionsWithCurrentMinutes: (ActiveSession & { current_session_minutes: number; is_paused: boolean })[] = rawSessions.map((session) => {
      const startedAt = new Date(session.started_at);
      const now = new Date();
      const totalMinutes = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60));
      const pausedMinutes = session.total_minutes ?? 0;
      
      return {
        id: session.id,
        odl_id: session.odl_id,
        started_at: session.started_at,
        paused_at: session.paused_at,
        total_minutes: session.total_minutes,
        work_type: session.work_type,
        auto_started: session.auto_started,
        odl: session.odl?.[0] ?? null,
        current_session_minutes: totalMinutes - pausedMinutes,
        is_paused: !!session.paused_at,
      };
    });

    return NextResponse.json({
      active_sessions: sessionsWithCurrentMinutes,
      count: sessionsWithCurrentMinutes.length,
    });

  } catch (error) {
    console.error("Get active sessions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

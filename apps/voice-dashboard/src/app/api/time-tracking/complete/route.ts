/**
 * POST /api/time-tracking/complete
 * Complete a time tracking session
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const completeTrackingSchema = z.object({
  time_tracking_id: z.string().uuid(),
  billable_minutes: z.number().min(0).optional(),
  notes: z.string().optional(),
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
      .select("org_id, id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // 3. Validate input
    const body = await request.json();
    const validation = completeTrackingSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { time_tracking_id, billable_minutes, notes } = validation.data;

    // 4. Verify tracking exists and belongs to user
    const { data: tracking, error: trackingError } = await supabase
      .from("time_tracking")
      .select("*")
      .eq("id", time_tracking_id)
      .eq("technician_id", profile.id)
      .eq("org_id", profile.org_id)
      .single();

    if (trackingError || !tracking) {
      return NextResponse.json({ error: "Time tracking session not found" }, { status: 404 });
    }

    if (tracking.completed_at) {
      return NextResponse.json(
        { error: "Time tracking session is already completed" },
        { status: 409 }
      );
    }

    // 5. Calculate total minutes
    const startedAt = new Date(tracking.started_at);
    const now = new Date();
    let totalMinutes = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60));

    // Calculate paused time
    const pauses = tracking.pauses || [];
    let pausedMinutes = 0;
    
    for (const pause of pauses) {
      if (pause.ended) {
        const pauseStart = new Date(pause.started);
        const pauseEnd = new Date(pause.ended);
        pausedMinutes += Math.floor((pauseEnd.getTime() - pauseStart.getTime()) / (1000 * 60));
      } else if (tracking.paused_at) {
        // Handle case where tracking is currently paused
        const pauseStart = new Date(pause.started);
        const pauseEnd = now;
        pausedMinutes += Math.floor((pauseEnd.getTime() - pauseStart.getTime()) / (1000 * 60));
      }
    }

    totalMinutes = Math.max(0, totalMinutes - pausedMinutes);
    const finalBillableMinutes = billable_minutes ?? totalMinutes;

    // 6. Complete tracking
    const { data: completedTracking, error: updateError } = await supabase
      .from("time_tracking")
      .update({
        completed_at: now.toISOString(),
        total_minutes: totalMinutes,
        billable_minutes: finalBillableMinutes,
        notes: notes ? `${tracking.notes || ''}\n${notes}`.trim() : tracking.notes,
        updated_at: now.toISOString(),
      })
      .eq("id", time_tracking_id)
      .select(`
        *,
        odl:work_orders(wo_number, description),
        technician:profiles(first_name, last_name)
      `)
      .single();

    if (updateError) {
      console.error("Complete tracking error:", updateError);
      return NextResponse.json(
        { error: "Failed to complete time tracking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Time tracking completed",
      tracking: completedTracking,
      summary: {
        total_minutes: totalMinutes,
        billable_minutes: finalBillableMinutes,
        paused_minutes: pausedMinutes,
        total_hours: Math.round((totalMinutes / 60) * 100) / 100,
      },
    });

  } catch (error) {
    console.error("Complete time tracking API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/time-tracking/complete
 * Get completed time tracking sessions summary
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
      .select("org_id, id, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");
    const technicianId = searchParams.get("technician_id") || profile.id;
    
    // 4. Build query for completed sessions
    let query = supabase
      .from("time_tracking")
      .select(`
        id,
        odl_id,
        started_at,
        completed_at,
        total_minutes,
        billable_minutes,
        work_type,
        auto_started,
        odl:work_orders(wo_number, description),
        technician:profiles(first_name, last_name)
      `)
      .eq("org_id", profile.org_id)
      .not("completed_at", "is", null);

    if (technicianId) {
      query = query.eq("technician_id", technicianId);
    }

    if (dateFrom) {
      query = query.gte("started_at", dateFrom);
    }

    if (dateTo) {
      query = query.lte("started_at", dateTo);
    }

    const { data: sessions, error } = await query
      .order("started_at", { ascending: false });

    if (error) {
      console.error("Completed sessions query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch completed sessions" },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const summary = {
      total_sessions: sessions?.length || 0,
      total_minutes: sessions?.reduce((sum, s) => sum + (s.total_minutes || 0), 0) || 0,
      total_billable_minutes: sessions?.reduce((sum, s) => sum + (s.billable_minutes || 0), 0) || 0,
      total_hours: Math.round(((sessions?.reduce((sum, s) => sum + (s.total_minutes || 0), 0) || 0) / 60) * 100) / 100,
      billable_hours: Math.round(((sessions?.reduce((sum, s) => sum + (s.billable_minutes || 0), 0) || 0) / 60) * 100) / 100,
    };

    // Group by work type
    const byWorkType = (sessions || []).reduce((acc, session) => {
      const type = session.work_type || 'other';
      if (!acc[type]) {
        acc[type] = { count: 0, minutes: 0 };
      }
      acc[type].count++;
      acc[type].minutes += session.total_minutes || 0;
      return acc;
    }, {} as Record<string, { count: number; minutes: number }>);

    return NextResponse.json({
      sessions: sessions || [],
      summary: {
        ...summary,
        by_work_type: byWorkType,
      },
    });

  } catch (error) {
    console.error("Get completed sessions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

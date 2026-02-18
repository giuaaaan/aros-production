/**
 * POST /api/time-tracking/pause
 * Pause an active time tracking session
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const pauseTrackingSchema = z.object({
  time_tracking_id: z.string().uuid(),
  reason: z.string().optional(),
});

const resumeTrackingSchema = z.object({
  time_tracking_id: z.string().uuid(),
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
    const validation = pauseTrackingSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { time_tracking_id, reason } = validation.data;

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

    if (tracking.paused_at) {
      return NextResponse.json(
        { error: "Time tracking session is already paused" },
        { status: 409 }
      );
    }

    // 5. Calculate elapsed time before pause
    const startedAt = new Date(tracking.started_at);
    const now = new Date();
    const elapsedMinutes = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60));
    
    // Add to pauses array
    const pauses = tracking.pauses || [];
    pauses.push({
      started: now.toISOString(),
      reason: reason || "Manual pause",
    });

    // 6. Update tracking
    const { data: updatedTracking, error: updateError } = await supabase
      .from("time_tracking")
      .update({
        paused_at: now.toISOString(),
        total_minutes: elapsedMinutes,
        pauses,
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
      console.error("Pause tracking error:", updateError);
      return NextResponse.json(
        { error: "Failed to pause time tracking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Time tracking paused",
      tracking: updatedTracking,
    });

  } catch (error) {
    console.error("Pause time tracking API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/time-tracking/pause
 * Resume a paused time tracking session
 */
export async function PUT(request: NextRequest) {
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
    const validation = resumeTrackingSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { time_tracking_id } = validation.data;

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

    if (!tracking.paused_at) {
      return NextResponse.json(
        { error: "Time tracking session is not paused" },
        { status: 409 }
      );
    }

    // 5. Update pauses array to close the last pause
    const pauses = tracking.pauses || [];
    const now = new Date().toISOString();
    
    if (pauses.length > 0) {
      pauses[pauses.length - 1].ended = now;
    }

    // 6. Resume tracking
    const { data: updatedTracking, error: updateError } = await supabase
      .from("time_tracking")
      .update({
        paused_at: null,
        resumed_at: now,
        pauses,
        updated_at: now,
      })
      .eq("id", time_tracking_id)
      .select(`
        *,
        odl:work_orders(wo_number, description),
        technician:profiles(first_name, last_name)
      `)
      .single();

    if (updateError) {
      console.error("Resume tracking error:", updateError);
      return NextResponse.json(
        { error: "Failed to resume time tracking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Time tracking resumed",
      tracking: updatedTracking,
    });

  } catch (error) {
    console.error("Resume time tracking API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

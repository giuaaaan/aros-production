/**
 * POST /api/technical-stop/resolve
 * Resolve a technical stop
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const resolveTechnicalStopSchema = z.object({
  technical_stop_id: z.string().uuid(),
  resolution_notes: z.string().min(1),
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
    const validation = resolveTechnicalStopSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { technical_stop_id, resolution_notes } = validation.data;

    // 4. Verify technical stop exists and is not already resolved
    const { data: stop, error: stopError } = await supabase
      .from("technical_stops")
      .select("*")
      .eq("id", technical_stop_id)
      .eq("org_id", profile.org_id)
      .single();

    if (stopError || !stop) {
      return NextResponse.json({ error: "Technical stop not found" }, { status: 404 });
    }

    if (stop.resolved_at) {
      return NextResponse.json(
        { error: "Technical stop is already resolved" },
        { status: 409 }
      );
    }

    // 5. Resolve the technical stop
    const { data: resolvedStop, error: updateError } = await supabase
      .from("technical_stops")
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: profile.id,
        resolution_notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", technical_stop_id)
      .select(`
        *,
        vehicle:vehicles(make, model, license_plate),
        reporter:profiles!reported_by(first_name, last_name),
        resolver:profiles!resolved_by(first_name, last_name)
      `)
      .single();

    if (updateError) {
      console.error("Technical stop resolve error:", updateError);
      return NextResponse.json(
        { error: "Failed to resolve technical stop" },
        { status: 500 }
      );
    }

    // 6. If there was a work order, update its status if needed
    if (stop.work_order_id) {
      // Check if there are any other active technical stops for this work order
      const { data: activeStops } = await supabase
        .from("technical_stops")
        .select("id")
        .eq("work_order_id", stop.work_order_id)
        .is("resolved_at", null);

      // If no more active stops, we could update work order status here
      if (!activeStops || activeStops.length === 0) {
        // Optional: Update work order status
        // await supabase.from("work_orders").update({ status: "in_progress" }).eq("id", stop.work_order_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Technical stop resolved successfully",
      technical_stop: resolvedStop,
    });

  } catch (error) {
    console.error("Resolve technical stop API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/technical-stop/resolve
 * Get list of active technical stops
 */
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
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");
    const showResolved = searchParams.get("resolved") === "true";
    const vehicleId = searchParams.get("vehicle_id");

    // 4. Build query
    let query = supabase
      .from("technical_stops")
      .select(`
        *,
        vehicle:vehicles(make, model, license_plate, vin),
        reporter:profiles!reported_by(first_name, last_name),
        resolver:profiles!resolved_by(first_name, last_name),
        work_order:work_orders(wo_number)
      `)
      .eq("org_id", profile.org_id);

    if (!showResolved) {
      query = query.is("resolved_at", null);
    }

    if (severity) {
      query = query.eq("severity", severity);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (vehicleId) {
      query = query.eq("vehicle_id", vehicleId);
    }

    // Order by priority (critical first, then immobilized, then by date)
    const { data: stops, error } = await query
      .order("priority_override", { ascending: false })
      .order("vehicle_immobilized", { ascending: false })
      .order("reported_at", { ascending: false });

    if (error) {
      console.error("Technical stops query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch technical stops" },
        { status: 500 }
      );
    }

    // Summary statistics
    const summary = {
      total: stops?.length || 0,
      critical: stops?.filter((s) => s.severity === "critical").length || 0,
      high: stops?.filter((s) => s.severity === "high").length || 0,
      immobilized: stops?.filter((s) => s.vehicle_immobilized).length || 0,
    };

    return NextResponse.json({
      technical_stops: stops || [],
      summary,
    });

  } catch (error) {
    console.error("Get technical stops API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

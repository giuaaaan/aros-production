/**
 * GET /api/keys/status
 * Get status of all keys or a specific key
 * Query params: key_id, vehicle_id, status, overdue
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VehicleKey, VehicleKeyLog } from "@/types/advanced-features";

const KEY_OVERDUE_MINUTES = 480; // 8 hours

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
    const keyId = searchParams.get("key_id");
    const vehicleId = searchParams.get("vehicle_id");
    const status = searchParams.get("status");
    const showOverdue = searchParams.get("overdue") === "true";
    const includeHistory = searchParams.get("history") === "true";

    // 4. Get specific key with details
    if (keyId) {
      const { data: key, error } = await supabase
        .from("vehicle_keys")
        .select(`
          *,
          vehicle:vehicles(make, model, license_plate, vin),
          assigned:profiles(first_name, last_name, email),
          odl:work_orders(wo_number, description, status)
        `)
        .eq("id", keyId)
        .eq("org_id", profile.org_id)
        .single();

      if (error || !key) {
        return NextResponse.json({ error: "Key not found" }, { status: 404 });
      }

      let history: VehicleKeyLog[] = [];
      if (includeHistory) {
        const { data: logs } = await supabase
          .from("vehicle_key_logs")
          .select(`
            *,
            performer:profiles!performed_by(first_name, last_name)
          `)
          .eq("key_id", keyId)
          .order("performed_at", { ascending: false });
        history = logs || [];
      }

      // Calculate overdue status
      const isOverdue = key.status === "issued" && key.assigned_at &&
        (new Date().getTime() - new Date(key.assigned_at).getTime()) / (1000 * 60) > KEY_OVERDUE_MINUTES;
      
      const overdueMinutes = isOverdue && key.assigned_at
        ? Math.floor((new Date().getTime() - new Date(key.assigned_at).getTime()) / (1000 * 60))
        : undefined;

      return NextResponse.json({
        key,
        history,
        isOverdue,
        overdueMinutes,
      });
    }

    // 5. Build query for multiple keys
    let query = supabase
      .from("vehicle_keys")
      .select(`
        *,
        vehicle:vehicles(make, model, license_plate),
        assigned:profiles(first_name, last_name),
        odl:work_orders(wo_number)
      `)
      .eq("org_id", profile.org_id);

    if (vehicleId) {
      query = query.eq("vehicle_id", vehicleId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: keys, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Keys status query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch keys" },
        { status: 500 }
      );
    }

    // Calculate overdue for each key
    const keysWithOverdue = (keys || []).map((key: VehicleKey & { assigned_at?: string }) => {
      const isOverdue = key.status === "issued" && key.assigned_at &&
        (new Date().getTime() - new Date(key.assigned_at).getTime()) / (1000 * 60) > KEY_OVERDUE_MINUTES;
      
      return {
        ...key,
        isOverdue,
        overdueMinutes: isOverdue && key.assigned_at
          ? Math.floor((new Date().getTime() - new Date(key.assigned_at).getTime()) / (1000 * 60))
          : undefined,
      };
    });

    // Filter overdue only if requested
    const filteredKeys = showOverdue
      ? keysWithOverdue.filter((k) => k.isOverdue)
      : keysWithOverdue;

    // Summary statistics
    const summary = {
      total: keys?.length || 0,
      in_safe: keys?.filter((k) => k.status === "in_safe").length || 0,
      issued: keys?.filter((k) => k.status === "issued").length || 0,
      overdue: keysWithOverdue.filter((k) => k.isOverdue).length || 0,
    };

    return NextResponse.json({
      keys: filteredKeys,
      summary,
    });

  } catch (error) {
    console.error("Keys status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

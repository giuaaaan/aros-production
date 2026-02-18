/**
 * POST /api/keys/issue
 * Issue a vehicle key to a technician
 * Triggers automatic time tracking start if ODL is provided
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { VehicleKey } from "@/types/advanced-features";

const issueKeySchema = z.object({
  key_id: z.string().uuid(),
  technician_id: z.string().uuid(),
  odl_id: z.string().uuid().optional(),
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

    // 2. Get user's org_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // 3. Validate input
    const body = await request.json();
    const validation = issueKeySchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { key_id, technician_id, odl_id, notes } = validation.data;

    // 4. Verify key exists and is available
    const { data: key, error: keyError } = await supabase
      .from("vehicle_keys")
      .select("*")
      .eq("id", key_id)
      .eq("org_id", profile.org_id)
      .single();

    if (keyError || !key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    if (key.status !== "in_safe") {
      return NextResponse.json(
        { error: `Key is not available (current status: ${key.status})` },
        { status: 409 }
      );
    }

    // 5. Verify technician exists and belongs to same org
    const { data: technician } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", technician_id)
      .eq("org_id", profile.org_id)
      .single();

    if (!technician) {
      return NextResponse.json({ error: "Technician not found" }, { status: 404 });
    }

    // 6. Issue the key
    const { data: updatedKey, error: updateError } = await supabase
      .from("vehicle_keys")
      .update({
        status: "issued",
        assigned_to: technician_id,
        assigned_at: new Date().toISOString(),
        odl_id: odl_id || null,
        notes: notes || null,
      })
      .eq("id", key_id)
      .select(`
        *,
        vehicle:vehicles(make, model, license_plate),
        assigned:profiles(first_name, last_name),
        odl:work_orders(wo_number)
      `)
      .single();

    if (updateError) {
      console.error("Key issue error:", updateError);
      return NextResponse.json(
        { error: "Failed to issue key" },
        { status: 500 }
      );
    }

    // 7. If ODL provided, auto-start time tracking
    if (odl_id) {
      const { data: existingTracking } = await supabase
        .from("time_tracking")
        .select("id")
        .eq("odl_id", odl_id)
        .eq("technician_id", technician_id)
        .is("completed_at", null)
        .maybeSingle();

      if (!existingTracking) {
        await supabase
          .from("time_tracking")
          .insert({
            odl_id,
            technician_id,
            started_at: new Date().toISOString(),
            auto_started: true,
            org_id: profile.org_id,
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Key issued successfully",
      key: updatedKey,
    });

  } catch (error) {
    console.error("Issue key API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

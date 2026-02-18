/**
 * POST /api/keys/return
 * Return a vehicle key to the safe
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const returnKeySchema = z.object({
  key_id: z.string().uuid(),
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
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // 3. Validate input
    const body = await request.json();
    const validation = returnKeySchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { key_id, notes } = validation.data;

    // 4. Verify key exists and is issued
    const { data: key, error: keyError } = await supabase
      .from("vehicle_keys")
      .select("*, odl_id, assigned_to")
      .eq("id", key_id)
      .eq("org_id", profile.org_id)
      .single();

    if (keyError || !key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    if (key.status !== "issued") {
      return NextResponse.json(
        { error: `Key cannot be returned (current status: ${key.status})` },
        { status: 409 }
      );
    }

    // 5. Return the key
    const { data: updatedKey, error: updateError } = await supabase
      .from("vehicle_keys")
      .update({
        status: "returned",
        returned_at: new Date().toISOString(),
        notes: notes || key.notes,
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
      console.error("Key return error:", updateError);
      return NextResponse.json(
        { error: "Failed to return key" },
        { status: 500 }
      );
    }

    // 6. Pause time tracking if there's an active session
    if (key.odl_id && key.assigned_to) {
      const { data: activeTracking } = await supabase
        .from("time_tracking")
        .select("id, pauses")
        .eq("odl_id", key.odl_id)
        .eq("technician_id", key.assigned_to)
        .is("completed_at", null)
        .maybeSingle();

      if (activeTracking) {
        const pauses = activeTracking.pauses || [];
        pauses.push({
          started: new Date().toISOString(),
          reason: "Key returned - work paused",
        });

        await supabase
          .from("time_tracking")
          .update({
            paused_at: new Date().toISOString(),
            pauses,
          })
          .eq("id", activeTracking.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Key returned successfully",
      key: updatedKey,
    });

  } catch (error) {
    console.error("Return key API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

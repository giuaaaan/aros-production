/**
 * GET /api/consumables/kits
 * Get consumable kits for quick selection
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const serviceType = searchParams.get("service_type");
    const activeOnly = searchParams.get("active") !== "false";

    // 4. Build query
    let query = supabase
      .from("consumable_kits")
      .select("*")
      .eq("org_id", profile.org_id);

    if (serviceType) {
      query = query.eq("service_type", serviceType);
    }

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data: kits, error } = await query.order("name");

    if (error) {
      console.error("Kits query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch kits" },
        { status: 500 }
      );
    }

    // Group by service type
    const byServiceType = (kits || []).reduce((acc: any, kit: any) => {
      if (!acc[kit.service_type]) {
        acc[kit.service_type] = [];
      }
      acc[kit.service_type].push(kit);
      return acc;
    }, {});

    return NextResponse.json({
      kits: kits || [],
      by_service_type: byServiceType,
    });

  } catch (error) {
    console.error("Kits API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

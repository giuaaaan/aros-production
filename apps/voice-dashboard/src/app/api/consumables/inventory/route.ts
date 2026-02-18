/**
 * GET /api/consumables/inventory
 * Get consumables inventory with low stock alerts
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
    const category = searchParams.get("category");
    const lowStock = searchParams.get("low_stock") === "true";
    const search = searchParams.get("search");

    // 4. Build query
    let query = supabase
      .from("consumables_inventory")
      .select("*")
      .eq("org_id", profile.org_id);

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: inventory, error } = await query.order("name");

    if (error) {
      console.error("Inventory query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch inventory" },
        { status: 500 }
      );
    }

    // Calculate low stock status
    const itemsWithStatus = (inventory || []).map((item: any) => ({
      ...item,
      is_low_stock: item.current_quantity <= item.min_threshold,
      days_until_empty: item.current_quantity > 0 && item.reorder_point > 0
        ? Math.floor((item.current_quantity / item.reorder_point) * 30)
        : undefined,
    }));

    // Filter low stock if requested
    const filteredItems = lowStock
      ? itemsWithStatus.filter((i: any) => i.is_low_stock)
      : itemsWithStatus;

    // Summary
    const summary = {
      total_items: inventory?.length || 0,
      low_stock_items: itemsWithStatus.filter((i: any) => i.is_low_stock).length,
      categories: Array.from(new Set(inventory?.map((i: any) => i.category) || [])),
      total_value: inventory?.reduce((sum: number, i: any) => 
        sum + (i.current_quantity * (i.unit_cost || 0)), 0
      ) || 0,
    };

    return NextResponse.json({
      inventory: filteredItems,
      summary,
    });

  } catch (error) {
    console.error("Inventory API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

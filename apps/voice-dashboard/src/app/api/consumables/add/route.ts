/**
 * POST /api/consumables/add
 * Add consumables used for an ODL
 * Decreases inventory stock automatically
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ConsumablesInventory, ConsumableItem, ConsumableKitItem } from "@/types/advanced-features";

// Inventory item type from database query
interface InventoryItem {
  sku: string;
  name: string;
  current_quantity: number;
  min_threshold: number;
}

const consumableItemSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  cost: z.number().min(0).optional(),
});

const addConsumablesSchema = z.object({
  odl_id: z.string().uuid(),
  items: z.array(consumableItemSchema).min(1),
  notes: z.string().optional(),
});

const useKitSchema = z.object({
  odl_id: z.string().uuid(),
  kit_id: z.string().uuid(),
  custom_quantities: z.record(z.number().positive()).optional(),
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
      .select("org_id, id, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // 3. Parse body and determine operation type
    const body = await request.json();

    // Check if this is a kit usage request
    if (body.kit_id) {
      return handleKitUsage(supabase, body, profile);
    }

    // Otherwise handle individual items
    return handleIndividualItems(supabase, body, profile);

  } catch (error) {
    console.error("Add consumables API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleIndividualItems(
  supabase: SupabaseClient,
  body: unknown,
  profile: { org_id: string; id: string; first_name: string; last_name: string }
) {
  // Validate input
  const validation = addConsumablesSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.error.errors },
      { status: 400 }
    );
  }

  const { odl_id, items, notes } = validation.data;

  // Verify work order exists
  const { data: workOrder } = await supabase
    .from("work_orders")
    .select("id")
    .eq("id", odl_id)
    .eq("org_id", profile.org_id)
    .single();

  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  // Check inventory availability
  const skus = items.map((item) => item.sku);
  const { data: inventory } = await supabase
    .from("consumables_inventory")
    .select("sku, name, current_quantity, min_threshold")
    .in("sku", skus)
    .eq("org_id", profile.org_id);

  const inventoryMap = new Map<string, InventoryItem>(
    (inventory as InventoryItem[] | null)?.map((i) => [i.sku, i]) || []
  );

  // Validate stock availability
  const stockErrors: Array<{ sku: string; error: string }> = [];
  for (const item of items) {
    const inv = inventoryMap.get(item.sku);
    if (!inv) {
      stockErrors.push({ sku: item.sku, error: "Item not found in inventory" });
    } else if (inv.current_quantity < item.quantity) {
      stockErrors.push({ 
        sku: item.sku, 
        error: `Insufficient stock (available: ${inv.current_quantity}, requested: ${item.quantity})`,
      });
    }
  }

  if (stockErrors.length > 0) {
    return NextResponse.json(
      { error: "Stock validation failed", details: stockErrors },
      { status: 409 }
    );
  }

  // Create consumables tracking record
  const { data: tracking, error: trackingError } = await supabase
    .from("consumables_tracking")
    .insert({
      odl_id,
      items_used: items,
      technician_id: profile.id,
      notes,
      org_id: profile.org_id,
    })
    .select(`
      *,
      odl:work_orders(wo_number),
      technician:profiles(first_name, last_name)
    `)
    .single();

  if (trackingError) {
    console.error("Consumables tracking error:", trackingError);
    return NextResponse.json(
      { error: "Failed to track consumables" },
      { status: 500 }
    );
  }

  // Stock is automatically decremented by trigger, but let's verify
  interface LowStockItem {
    sku: string;
    name: string | undefined;
    current_quantity: number;
    min_threshold: number | undefined;
  }
  const lowStockItems: LowStockItem[] = [];
  for (const item of items) {
    const inv = inventoryMap.get(item.sku);
    const newQuantity = (inv?.current_quantity ?? 0) - item.quantity;
    if (newQuantity <= (inv?.min_threshold ?? 0)) {
      lowStockItems.push({
        sku: item.sku,
        name: inv?.name,
        current_quantity: newQuantity,
        min_threshold: inv?.min_threshold,
      });
    }
  }

  // Create low stock notifications
  if (lowStockItems.length > 0) {
    await supabase
      .from("notification_queue")
      .insert({
        type: "consumable_low_stock",
        priority: 6,
        payload: {
          items: lowStockItems,
          triggered_by: `${profile.first_name} ${profile.last_name}`,
        },
        org_id: profile.org_id,
      });
  }

  return NextResponse.json({
    success: true,
    message: "Consumables added successfully",
    tracking,
    summary: {
      items_count: items.length,
      total_cost: items.reduce((sum, i) => sum + (i.cost || 0) * i.quantity, 0),
      low_stock_alerts: lowStockItems.length,
    },
  }, { status: 201 });
}

interface ConsumableKit {
  id: string;
  name: string;
  service_type: string;
  items: ConsumableKitItem[];
  estimated_cost?: number;
}

async function handleKitUsage(
  supabase: SupabaseClient,
  body: unknown,
  profile: { org_id: string; id: string; first_name: string; last_name: string }
) {
  // Validate input
  const validation = useKitSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.error.errors },
      { status: 400 }
    );
  }

  const { odl_id, kit_id, custom_quantities, notes } = validation.data;

  // Get kit
  const { data: kit, error: kitError } = await supabase
    .from("consumable_kits")
    .select("*")
    .eq("id", kit_id)
    .eq("org_id", profile.org_id)
    .single();

  if (kitError || !kit) {
    return NextResponse.json({ error: "Kit not found" }, { status: 404 });
  }

  // Build items list with custom quantities
  const items: ConsumableItem[] = (kit as ConsumableKit).items.map((kitItem) => ({
    sku: kitItem.sku,
    name: kitItem.name,
    quantity: custom_quantities?.[kitItem.sku] ?? kitItem.default_quantity,
    unit: kitItem.unit,
  }));

  // Verify work order exists
  const { data: workOrder } = await supabase
    .from("work_orders")
    .select("id")
    .eq("id", odl_id)
    .eq("org_id", profile.org_id)
    .single();

  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  // Create consumables tracking record
  const { data: tracking, error: trackingError } = await supabase
    .from("consumables_tracking")
    .insert({
      odl_id,
      items_used: items,
      technician_id: profile.id,
      notes: notes || `Used kit: ${kit.name}`,
      org_id: profile.org_id,
    })
    .select(`
      *,
      odl:work_orders(wo_number),
      technician:profiles(first_name, last_name)
    `)
    .single();

  if (trackingError) {
    console.error("Consumables tracking error:", trackingError);
    return NextResponse.json(
      { error: "Failed to track consumables" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Kit "${kit.name}" applied successfully`,
    tracking,
    kit: {
      id: kit.id,
      name: kit.name,
      service_type: kit.service_type,
    },
    summary: {
      items_count: items.length,
      estimated_cost: kit.estimated_cost,
    },
  }, { status: 201 });
}

/**
 * GET /api/consumables/add
 * Get consumables used for an ODL
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
    const odlId = searchParams.get("odl_id");

    if (!odlId) {
      return NextResponse.json({ error: "odl_id is required" }, { status: 400 });
    }

    // 4. Get consumables tracking
    const { data: tracking, error } = await supabase
      .from("consumables_tracking")
      .select(`
        *,
        odl:work_orders(wo_number),
        technician:profiles(first_name, last_name)
      `)
      .eq("odl_id", odlId)
      .eq("org_id", profile.org_id)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Consumables query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch consumables" },
        { status: 500 }
      );
    }

    interface TrackingRecord {
      items_used?: ConsumableItem[];
    }

    // Calculate totals
    const totalCost = ((tracking as TrackingRecord[] | null) ?? []).reduce((sum, t) => {
      return sum + (t.items_used ?? []).reduce((itemSum: number, item) => {
        return itemSum + (item.cost ?? 0) * item.quantity;
      }, 0);
    }, 0);

    return NextResponse.json({
      tracking: tracking || [],
      summary: {
        entries: tracking?.length || 0,
        total_cost: totalCost,
      },
    });

  } catch (error) {
    console.error("Get consumables API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

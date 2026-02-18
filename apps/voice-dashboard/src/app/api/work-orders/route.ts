import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const workOrderSchema = z.object({
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid().optional(),
  description: z.string().min(1),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  estimated_hours: z.number().min(0).optional(),
  assigned_to: z.string().uuid().optional(),
});

// GET /api/work-orders - Lista ordini di lavoro
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customer_id");

    let query = supabase
      .from("work_orders")
      .select(`
        *,
        customer:customers(first_name, last_name, phone),
        vehicle:vehicles(make, model, license_plate),
        assigned:profiles(first_name, last_name)
      `)
      .eq("org_id", profile.data?.org_id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Work orders GET error:", error);
    return NextResponse.json({ error: "Failed to fetch work orders" }, { status: 500 });
  }
}

// POST /api/work-orders - Crea nuovo ordine
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    const body = await request.json();
    const validated = workOrderSchema.parse(body);

    // Genera numero ordine: OL-2026-000001
    const year = new Date().getFullYear();
    const { data: lastOrder } = await supabase
      .from("work_orders")
      .select("wo_number")
      .eq("org_id", profile.data?.org_id)
      .ilike("wo_number", `OL-${year}-%`)
      .order("wo_number", { ascending: false })
      .limit(1)
      .single();

    const lastNum = lastOrder?.wo_number 
      ? parseInt(lastOrder.wo_number.split("-")[2]) 
      : 0;
    const woNumber = `OL-${year}-${String(lastNum + 1).padStart(6, "0")}`;

    const { data, error } = await supabase
      .from("work_orders")
      .insert({
        ...validated,
        wo_number: woNumber,
        org_id: profile.data?.org_id,
        created_by: user.id,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Work orders POST error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create work order" }, { status: 500 });
  }
}

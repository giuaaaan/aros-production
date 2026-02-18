import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const partSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  oem_code: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  cost_price: z.number().min(0),
  sale_price: z.number().min(0),
  quantity: z.number().int().min(0),
  min_stock: z.number().int().min(0).default(1),
  location: z.string().optional(),
});

// GET /api/parts - Lista ricambi
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user org
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const lowStock = searchParams.get("lowStock");

    let query = supabase
      .from("parts")
      .select("*")
      .eq("org_id", profile?.org_id)
      .eq("is_active", true)
      .order("name");

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,oem_code.ilike.%${search}%`);
    }

    if (lowStock === "true") {
      query = query.lte("quantity", 5); // Scorta bassa
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Parts GET error:", error);
    return NextResponse.json({ error: "Failed to fetch parts" }, { status: 500 });
  }
}

// POST /api/parts - Crea nuovo ricambio
export async function POST(request: Request) {
  try {
    const supabase = createClient();
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
    const validated = partSchema.parse(body);

    const { data, error } = await supabase
      .from("parts")
      .insert({
        ...validated,
        org_id: profile.data?.org_id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Parts POST error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create part" }, { status: 500 });
  }
}

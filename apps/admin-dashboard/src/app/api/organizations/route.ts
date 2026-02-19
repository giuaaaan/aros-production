import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const tier = searchParams.get("tier") || "all";
    const city = searchParams.get("city") || "";

    const supabase = createAdminClient();

    // Simplified query without complex counts
    let query = supabase
      .from("organizations")
      .select('*', { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone_number.ilike.%${search}%`);
    }

    if (status !== "all") {
      query = query.eq("subscription_status", status);
    }

    if (tier !== "all") {
      query = query.eq("subscription_tier", tier);
    }

    if (city) {
      query = query.ilike("city", `%${city}%`);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching organizations:", error);
      return NextResponse.json(
        { error: "Failed to fetch organizations", details: error.message },
        { status: 500 }
      );
    }

    // Transform with default counts (will be 0 for now)
    const organizations = data?.map((org: any) => ({
      ...org,
      user_count: 0,
      appointment_count: 0,
    })) || [];

    return NextResponse.json({ organizations, total: count || 0 });
  } catch (error) {
    console.error("Error in organizations API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

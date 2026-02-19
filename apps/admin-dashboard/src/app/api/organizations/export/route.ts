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

    let query = supabase.from("organizations").select(
      `
        *,
        users:profiles(count),
        appointments:appointments(count)
      `
    );

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

    // Order by created_at desc
    query = query.order("created_at", { ascending: false });

    // No limit for export - fetch all
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching organizations for export:", error);
      return NextResponse.json(
        { error: "Failed to fetch organizations" },
        { status: 500 }
      );
    }

    // Transform data to match expected format
    const organizations = data?.map((org: any) => ({
      ...org,
      user_count: org.users?.[0]?.count || 0,
      appointment_count: org.appointments?.[0]?.count || 0,
    }));

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Error in organizations export API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

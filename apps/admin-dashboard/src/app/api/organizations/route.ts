import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const tier = searchParams.get("tier") || "all";

    const supabase = createAdminClient();

    let query = supabase.from("organizations").select(
      `
        *,
        users:profiles(count),
        appointments:appointments(count)
      `,
      { count: "exact" }
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

    // Order by created_at desc
    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching organizations:", error);
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

    return NextResponse.json({ organizations, total: count });
  } catch (error) {
    console.error("Error in organizations API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

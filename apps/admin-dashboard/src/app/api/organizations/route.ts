import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    
    // Temporary: use anon key for debugging
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

    let query = supabase
      .from("organizations")
      .select('*', { count: "exact" });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone_number.ilike.%${search}%`);
    }

    if (status !== "all") {
      query = query.eq("subscription_status", status);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error("Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      organizations: data || [], 
      total: count || 0 
    });
  } catch (error) {
    console.error("Exception:", error);
    return NextResponse.json(
      { error: "Exception", details: String(error) },
      { status: 500 }
    );
  }
}

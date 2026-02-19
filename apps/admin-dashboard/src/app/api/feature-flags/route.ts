import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/feature-flags - List all feature flags
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feature flags:", error);
      return NextResponse.json(
        { error: "Failed to fetch feature flags" },
        { status: 500 }
      );
    }

    return NextResponse.json({ flags: data || [] });
  } catch (error) {
    console.error("Error in feature flags API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/feature-flags - Create new feature flag
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, name, description, scope = "global", organization_id } = body;

    if (!key || !name) {
      return NextResponse.json(
        { error: "Key and name are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("feature_flags")
      // @ts-ignore - Supabase types need database types
      .insert({
        key,
        name,
        description,
        scope,
        organization_id: scope === "organization" ? organization_id : null,
        enabled: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating feature flag:", error);
      return NextResponse.json(
        { error: "Failed to create feature flag" },
        { status: 500 }
      );
    }

    return NextResponse.json({ flag: data });
  } catch (error) {
    console.error("Error in feature flags API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

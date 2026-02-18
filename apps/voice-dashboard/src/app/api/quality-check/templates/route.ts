/**
 * GET /api/quality-check/templates
 * Get quality check templates
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

    // 3. Get templates (org-specific and default)
    const { data: templates, error } = await supabase
      .from("quality_check_templates")
      .select("*")
      .or(`org_id.eq.${profile.org_id},is_default.eq.true`)
      .order("is_default", { ascending: false })
      .order("name");

    if (error) {
      console.error("Templates query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      templates: templates || [],
    });

  } catch (error) {
    console.error("Get templates API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

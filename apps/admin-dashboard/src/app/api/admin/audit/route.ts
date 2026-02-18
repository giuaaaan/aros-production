import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Autenticazione
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verifica permessi (solo super_admin)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null };
      
    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Parametri query
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const severity = searchParams.get("severity");
    const userId = searchParams.get("user_id");
    const from = searchParams.get("from"); // ISO date
    const to = searchParams.get("to"); // ISO date
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");
    
    // Build query
    let query = (supabase
      .from("audit_logs" as any)
      .select("*, user:user_id(email)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)) as any;
      
    if (action) {
      query = query.eq("action", action);
    }
    
    if (severity) {
      query = query.eq("severity", severity);
    }
    
    if (userId) {
      query = query.eq("user_id", userId);
    }
    
    if (from) {
      query = query.gte("created_at", from);
    }
    
    if (to) {
      query = query.lte("created_at", to);
    }
    
    const { data: logs, error } = await query as { data: any[] | null; error: any };
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ logs });
    
  } catch (error) {
    console.error("Audit logs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

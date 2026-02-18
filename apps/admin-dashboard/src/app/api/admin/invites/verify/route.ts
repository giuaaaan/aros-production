import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    
    if (!token) {
      return NextResponse.json(
        { error: "Token required" },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    const tokenHash = hashToken(token);
    
    // Cerca invito
    const { data: invite, error } = await supabase
      .from("auth_invites")
      .select("*, inviter:invited_by(email)")
      .eq("token_hash", tokenHash)
      .single() as { data: { expires_at: string; used_at: string | null; role: string; id: string; invited_by: string } | null; error: any };
      
    if (error || !invite) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 404 }
      );
    }
    
    // Verifica scadenza
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    
    if (expiresAt < now) {
      return NextResponse.json(
        { error: "Token expired", expired_at: invite.expires_at },
        { status: 410 }
      );
    }
    
    // Verifica già usato
    if (invite.used_at) {
      return NextResponse.json(
        { error: "Token already used", used_at: invite.used_at },
        { status: 410 }
      );
    }
    
    // Token valido - ritorna info (senza email per privacy)
    return NextResponse.json({
      valid: true,
      role: invite.role,
      expires_at: invite.expires_at,
    });
    
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Marca invito come usato
export async function POST(request: NextRequest) {
  try {
    const { token, user_id } = await request.json();
    
    if (!token || !user_id) {
      return NextResponse.json(
        { error: "Token and user_id required" },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    const tokenHash = hashToken(token);
    
    // Aggiorna invito come usato
    const { data: invite, error } = await (supabase
      .from("auth_invites") as any)
      .update({ used_at: new Date().toISOString() })
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .select()
      .single() as { data: { id: string } | null; error: any };
      
    if (error || !invite) {
      return NextResponse.json(
        { error: "Invalid or already used token" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Mark invite used error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

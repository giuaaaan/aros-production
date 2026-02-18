import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";

// Validazione input
const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "manager", "viewer"]).default("admin"),
  expiresInHours: z.number().min(1).max(168).default(24), // Max 7 giorni
});

// Rate limiting in-memory (in produzione usare Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 3600000): boolean {
  const now = Date.now();
  const current = rateLimitMap.get(identifier);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

function generateSecureToken(): string {
  // 32 bytes = 256 bit di entropia
  return randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Autenticazione
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Verifica permessi (solo super_admin può invitare)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null };
      
    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // 3. Rate limiting per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(`invite:${ip}`, 5, 3600000)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again in 1 hour." },
        { status: 429 }
      );
    }
    
    // 4. Validazione input
    const body = await request.json();
    const validation = inviteSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { email, role, expiresInHours } = validation.data;
    
    // 5. Verifica che email non sia già registrata
    const { data: existingUser } = await (supabase
      .from("profiles" as any)
      .select("id")
      .eq("email", email)
      .maybeSingle()) as { data: { id: string } | null };
      
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }
    
    // 6. Genera token sicuro
    const token = generateSecureToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    
    // 7. Salva invito nel database
    const { data: invite, error: inviteError } = await supabase
      .from("auth_invites")
      .insert({
        email,
        token_hash: tokenHash,
        role,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        metadata: {
          ip,
          user_agent: request.headers.get("user-agent"),
        },
      } as any)
      .select()
      .single() as { data: { id: string } | null; error: any };
      
    if (inviteError || !invite) {
      console.error("Invite creation error:", inviteError);
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 500 }
      );
    }
    
    // 9. Costruisci link invito
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin-dashboard-green-five-49.vercel.app";
    const inviteLink = `${baseUrl}/signup?invite=${token}`;
    
    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email,
        role,
        expires_at: expiresAt.toISOString(),
        link: inviteLink,
      },
    });
    
  } catch (error) {
    console.error("Invite API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Lista inviti (solo super_admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verifica permessi
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
    const status = searchParams.get("status"); // 'pending', 'used', 'expired'
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    
    // Build query
    let query = (supabase
      .from("auth_invites" as any)
      .select("*, inviter:invited_by(email)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)) as any;
      
    if (status === "pending") {
      query = query.is("used_at", null).gt("expires_at", new Date().toISOString());
    } else if (status === "used") {
      query = query.not("used_at", "is", null);
    } else if (status === "expired") {
      query = query.is("used_at", null).lt("expires_at", new Date().toISOString());
    }
    
    const { data: invites, error } = await query as { data: any[] | null; error: any };
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ invites });
    
  } catch (error) {
    console.error("List invites error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

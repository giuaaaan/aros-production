import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    const { count } = await supabase.from("organizations").select("*", { count: "exact", head: true });
    
    if (count && count > 0) {
      return NextResponse.json({ status: "already_seeded", count });
    }
    
    const { data, error } = await supabase.from("organizations").insert([
      { id: 'f1111111-1111-1111-1111-111111111111', name: 'Officina Demo Milano', slug: 'officina-demo-milano', phone_number: '+3902123456789', email: 'demo@officinamilano.it', city: 'Milano', subscription_tier: 'professional', subscription_status: 'active' },
      { id: 'f2222222-2222-2222-2222-222222222222', name: 'Car Service Bianchi', slug: 'car-service-bianchi', phone_number: '+3902987654321', email: 'info@carservicebianchi.it', city: 'Roma', subscription_tier: 'starter', subscription_status: 'active' },
      { id: 'f3333333-3333-3333-3333-333333333333', name: 'Moto Garage Verdi', slug: 'moto-garage-verdi', phone_number: '+390211223344', email: 'contatti@motogarageverdi.it', city: 'Torino', subscription_tier: 'enterprise', subscription_status: 'active' }
    ]).select();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ status: "success", count: data?.length || 0 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ready", message: "POST to seed" });
}

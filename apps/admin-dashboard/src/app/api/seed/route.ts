import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createAdminClient();
  
  try {
    const { count } = await supabase
      .from("organizations")
      .select("*", { count: "exact", head: true });
    
    if (count && count > 0) {
      return NextResponse.json({ status: "already_seeded", count });
    }
    
    const { data, error } = await supabase.from("organizations").insert([
      { name: "Officina Demo Milano", slug: "officina-demo-milano", phone_number: "+3902123456789", email: "demo@officinamilano.it", city: "Milano", subscription_tier: "professional", subscription_status: "active" },
      { name: "Car Service Bianchi", slug: "car-service-bianchi", phone_number: "+3902987654321", email: "info@carservicebianchi.it", city: "Roma", subscription_tier: "starter", subscription_status: "active" },
      { name: "Moto Garage Verdi", slug: "moto-garage-verdi", phone_number: "+390211223344", email: "contatti@motogarageverdi.it", city: "Torino", subscription_tier: "enterprise", subscription_status: "active" },
    ]).select();
    
    if (error) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ status: "success", count: data?.length || 0 });
  } catch (e) {
    return NextResponse.json({ status: "exception", message: String(e) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: "ready", 
    message: "Use POST to seed database",
    endpoint: "/api/seed",
    method: "POST"
  });
}

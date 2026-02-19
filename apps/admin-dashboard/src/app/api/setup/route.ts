import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createAdminClient();
    
    // Check if already seeded
    const { count } = await supabase
      .from("organizations")
      .select("*", { count: "exact", head: true });
    
    if (count && count > 0) {
      return NextResponse.json({ 
        status: "already_seeded", 
        count,
        message: "Database already populated" 
      });
    }
    
    // Seed organizations
    const orgs = [
      { id: "00000000-0000-0000-0000-000000000001", name: "Officina Demo Milano", slug: "officina-demo-milano", phone_number: "+3902123456789", whatsapp_number: "+3902123456789", email: "demo@officinamilano.it", address: "Via Roma 123", city: "Milano", postal_code: "20121", subscription_tier: "professional", subscription_status: "active" },
      { id: "00000000-0000-0000-0000-000000000002", name: "Car Service Bianchi", slug: "car-service-bianchi", phone_number: "+3902987654321", whatsapp_number: "+3902987654321", email: "info@carservicebianchi.it", address: "Via Milano 456", city: "Roma", postal_code: "00100", subscription_tier: "starter", subscription_status: "active" },
      { id: "00000000-0000-0000-0000-000000000003", name: "Moto Garage Verdi", slug: "moto-garage-verdi", phone_number: "+390211223344", whatsapp_number: "+390211223344", email: "contatti@motogarageverdi.it", address: "Corso Torino 789", city: "Torino", postal_code: "10100", subscription_tier: "enterprise", subscription_status: "active" },
    ];
    
    const { error: orgError } = await supabase.from("organizations").upsert(orgs);
    if (orgError) throw orgError;
    
    // Seed customers
    const customers = [
      { org_id: "00000000-0000-0000-0000-000000000001", first_name: "Mario", last_name: "Rossi", email: "mario.rossi@email.it", phone: "+393331234567", city: "Milano" },
      { org_id: "00000000-0000-0000-0000-000000000001", first_name: "Laura", last_name: "Bianchi", email: "laura.bianchi@email.it", phone: "+393332345678", city: "Milano" },
      { org_id: "00000000-0000-0000-0000-000000000001", first_name: "Giuseppe", last_name: "Verdi", email: "giuseppe.verdi@email.it", phone: "+393333456789", city: "Milano" },
    ];
    
    const { error: custError } = await supabase.from("customers").insert(customers);
    if (custError) throw custError;
    
    return NextResponse.json({ 
      status: "success", 
      message: "Database seeded successfully",
      organizations: orgs.length,
      customers: customers.length
    });
    
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ 
      status: "error", 
      message: "Seeding failed",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: "ready",
    message: "Use POST to seed database",
    endpoint: "/api/setup",
    method: "POST"
  });
}

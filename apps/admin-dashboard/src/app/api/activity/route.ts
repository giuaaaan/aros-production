import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get recent conversations as activity
    const { data: conversations } = await supabase
      .from("conversations")
      .select(
        `
        id,
        channel,
        status,
        created_at,
        organizations:org_id(name)
      `
      )
      .order("created_at", { ascending: false })
      .limit(10);

    // Get recent appointments
    const { data: appointments } = await supabase
      .from("appointments")
      .select(
        `
        id,
        source,
        status,
        created_at,
        organizations:org_id(name)
      `
      )
      .order("created_at", { ascending: false })
      .limit(5);

    // Combine and transform to activity items
    const activities = [
      ...(conversations?.map((conv: any) => ({
        id: `conv-${conv.id}`,
        type: conv.channel === "voice" ? "call" : "whatsapp",
        organization: conv.organizations?.name || "Unknown",
        description:
          conv.channel === "voice"
            ? "AI voice call completed"
            : "WhatsApp conversation handled",
        timestamp: conv.created_at,
      })) || []),
      ...(appointments?.map((apt: any) => ({
        id: `apt-${apt.id}`,
        type: apt.source?.startsWith("ai") ? "appointment" : "signup",
        organization: apt.organizations?.name || "Unknown",
        description:
          apt.source === "ai_voice"
            ? "Appointment booked via AI voice"
            : apt.source === "ai_whatsapp"
            ? "Appointment booked via WhatsApp"
            : "New appointment created",
        timestamp: apt.created_at,
      })) || []),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}

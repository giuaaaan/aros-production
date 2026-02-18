import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get last 7 days of data
    const days = 7;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const monthName = date.toLocaleDateString("en-US", { month: "short" });

      // Get conversations for this day
      const { count: callsCount } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("channel", "voice")
        .gte("created_at", `${dateStr}T00:00:00`)
        .lte("created_at", `${dateStr}T23:59:59`);

      const { count: whatsappCount } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("channel", "whatsapp")
        .gte("created_at", `${dateStr}T00:00:00`)
        .lte("created_at", `${dateStr}T23:59:59`);

      // Estimate revenue based on active orgs (simplified)
      const { data: dayOrgs } = await supabase
        .from("organizations")
        .select("subscription_tier")
        .eq("subscription_status", "active");

      const tierValues: Record<string, number> = {
        starter: 79,
        professional: 149,
        enterprise: 299,
      };

      const revenue =
        dayOrgs?.reduce(
          (acc, org) => acc + (tierValues[org.subscription_tier] || 0),
          0
        ) || 0;

      data.push({
        date: monthName,
        calls: callsCount || 0,
        whatsapp: whatsappCount || 0,
        revenue: Math.round(revenue / 30), // Daily estimate
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 }
    );
  }
}

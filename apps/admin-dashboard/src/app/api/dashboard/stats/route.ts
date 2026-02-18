import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get total revenue (sum of subscription tiers estimated value)
    const { data: orgs } = await supabase
      .from("organizations")
      .select("subscription_tier, subscription_status");

    const tierValues: Record<string, number> = {
      starter: 79,
      professional: 149,
      enterprise: 299,
    };

    const activeCustomers =
      orgs?.filter((o) => o.subscription_status === "active").length || 0;

    const totalRevenue =
      orgs?.reduce((acc, org) => {
        if (org.subscription_status === "active") {
          return acc + (tierValues[org.subscription_tier] || 0);
        }
        return acc;
      }, 0) || 0;

    // Get today's calls from conversations
    const today = new Date().toISOString().split("T")[0];
    const { count: todayCalls } = await supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    // Calculate changes (mock for now - would compare with previous period)
    const revenueChange = 12.5;
    const customersChange = 8.2;
    const callsChange = 15.3;

    // System health (mock - would check external services)
    const systemHealth = 99.9;
    const healthStatus = "operational" as const;

    return NextResponse.json({
      totalRevenue,
      revenueChange,
      activeCustomers,
      customersChange,
      todayCalls: todayCalls || 0,
      callsChange,
      systemHealth,
      healthStatus,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

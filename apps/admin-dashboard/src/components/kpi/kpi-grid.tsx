import { KPICard } from "./kpi-card";
import { DollarSign, Users, Phone, HeartPulse } from "lucide-react";
import { DashboardStats } from "@/types";

interface KPIGridProps {
  stats: DashboardStats;
}

export function KPIGrid({ stats }: KPIGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Monthly Revenue"
        value={stats.totalRevenue}
        format="currency"
        change={stats.revenueChange}
        icon={<DollarSign className="w-4 h-4" />}
        trend={stats.revenueChange >= 0 ? "up" : "down"}
      />
      <KPICard
        title="Active Customers"
        value={stats.activeCustomers}
        format="number"
        change={stats.customersChange}
        icon={<Users className="w-4 h-4" />}
        trend={stats.customersChange >= 0 ? "up" : "down"}
      />
      <KPICard
        title="Today's Calls"
        value={stats.todayCalls}
        format="number"
        change={stats.callsChange}
        changeLabel="vs yesterday"
        icon={<Phone className="w-4 h-4" />}
        trend={stats.callsChange >= 0 ? "up" : "down"}
      />
      <KPICard
        title="System Health"
        value={stats.systemHealth}
        format="percentage"
        icon={<HeartPulse className="w-4 h-4" />}
        trend={stats.healthStatus === "operational" ? "up" : "down"}
      />
    </div>
  );
}

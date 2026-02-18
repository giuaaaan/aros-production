"use client";

import { useCallback, useState } from "react";
import { Header } from "@/components/layout/header";
import { KPIGrid } from "@/components/kpi/kpi-grid";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { ActivityChart } from "@/components/charts/activity-chart";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/use-dashboard";
import { useRealtimeActivity } from "@/hooks/use-realtime";
import { ActivityItem } from "@/types";

export default function DashboardPage() {
  const { stats, chartData, activities: initialActivities, loading, error } = useDashboard();
  
  // Combine initial activities with real-time ones
  const [realtimeActivities, setRealtimeActivities] = useState<ActivityItem[]>([]);
  
  const handleNewActivity = useCallback((activity: ActivityItem) => {
    setRealtimeActivities((prev) => [activity, ...prev].slice(0, 5));
  }, []);
  
  const { isConnected: isRealtimeConnected } = useRealtimeActivity(handleNewActivity);
  
  // Merge initial and realtime activities
  const allActivities = [...realtimeActivities, ...initialActivities].slice(0, 10);

  if (error) {
    return (
      <div>
        <Header
          title="Dashboard Overview"
          description="Monitor your business metrics and system performance"
        />
        <div className="p-6">
          <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-lg text-red-500">
            Error loading dashboard: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Dashboard Overview"
        description="Monitor your business metrics and system performance"
      />
      <div className="p-6 space-y-6">
        {/* Real-time indicator */}
        {isRealtimeConnected && (
          <div className="flex items-center gap-2 text-xs text-green-500">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Real-time updates active
          </div>
        )}

        {/* KPI Cards */}
        {loading || !stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <KPIGrid stats={stats} />
        )}

        {/* Charts Row */}
        {loading || chartData.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-[400px] col-span-2 rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <RevenueChart data={chartData} />
            <ActivityChart data={chartData} />
          </div>
        )}

        {/* Activity Feed */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <ActivityFeed 
              activities={allActivities} 
              highlightNew={realtimeActivities.length > 0}
            />
          </div>
        )}
      </div>
    </div>
  );
}

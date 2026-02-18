"use client";

import { useEffect, useState } from "react";
import { DashboardStats, ChartData, ActivityItem } from "@/types";

interface DashboardData {
  stats: DashboardStats | null;
  chartData: ChartData[];
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
}

export function useDashboard(): DashboardData {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [statsRes, chartRes, activityRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/chart-data"),
          fetch("/api/activity"),
        ]);

        if (!statsRes.ok || !chartRes.ok || !activityRes.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const [statsData, chartDataData, activityData] = await Promise.all([
          statsRes.json(),
          chartRes.json(),
          activityRes.json(),
        ]);

        setStats(statsData);
        setChartData(chartDataData);
        setActivities(activityData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, chartData, activities, loading, error };
}

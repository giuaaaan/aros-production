import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityChart } from "@/components/charts/activity-chart";
import { ChartData } from "@/types";

const mockChartData: ChartData[] = [
  { date: "Jan", calls: 1200, whatsapp: 800, revenue: 12000 },
  { date: "Feb", calls: 1350, whatsapp: 950, revenue: 13500 },
  { date: "Mar", calls: 1400, whatsapp: 1100, revenue: 14200 },
  { date: "Apr", calls: 1250, whatsapp: 900, revenue: 12800 },
  { date: "May", calls: 1600, whatsapp: 1300, revenue: 16000 },
  { date: "Jun", calls: 1750, whatsapp: 1450, revenue: 17500 },
  { date: "Jul", calls: 1800, whatsapp: 1500, revenue: 18000 },
];

export default function AnalyticsPage() {
  return (
    <div>
      <Header
        title="Analytics"
        description="Detailed insights and performance metrics"
      />
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                AI Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground mt-1">
                +2.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Call Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">2m 34s</div>
              <p className="text-xs text-muted-foreground mt-1">
                -12s from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Churn Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3.2%</div>
              <p className="text-xs text-muted-foreground mt-1">
                -0.5% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                NPS Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">72</div>
              <p className="text-xs text-muted-foreground mt-1">
                +5 from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <ActivityChart data={mockChartData} />
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Auto Service Bianchi", calls: 423, growth: 15 },
                  { name: "Officina Rossi", calls: 156, growth: 8 },
                  { name: "Car Repair Neri", calls: 89, growth: -2 },
                ].map((org, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {i + 1}
                      </div>
                      <span className="font-medium">{org.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{org.calls} calls</p>
                      <p className={`text-xs ${org.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {org.growth >= 0 ? '+' : ''}{org.growth}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

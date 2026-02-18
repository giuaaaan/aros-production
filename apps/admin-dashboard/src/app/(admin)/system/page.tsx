import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SystemStatus } from "@/types";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

const mockSystemStatus: SystemStatus[] = [
  {
    service: "Vapi.ai Voice",
    status: "operational",
    latency: 245,
    uptime: 99.99,
    lastChecked: new Date().toISOString(),
  },
  {
    service: "WhatsApp API",
    status: "operational",
    latency: 180,
    uptime: 99.95,
    lastChecked: new Date().toISOString(),
  },
  {
    service: "OpenAI",
    status: "operational",
    latency: 450,
    uptime: 99.90,
    lastChecked: new Date().toISOString(),
  },
  {
    service: "Supabase",
    status: "operational",
    latency: 15,
    uptime: 99.99,
    lastChecked: new Date().toISOString(),
  },
  {
    service: "Vercel Edge",
    status: "operational",
    latency: 45,
    uptime: 99.99,
    lastChecked: new Date().toISOString(),
  },
];

const statusConfig = {
  operational: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "Operational",
  },
  degraded: {
    icon: AlertCircle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    label: "Degraded",
  },
  down: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Down",
  },
};

export default function SystemPage() {
  return (
    <div>
      <Header
        title="System Health"
        description="Monitor system status and performance"
      />
      <div className="p-6 space-y-6">
        {/* Overall Status */}
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">All Systems Operational</h2>
                <p className="text-muted-foreground">
                  All services are running normally. Last updated: just now
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockSystemStatus.map((service) => {
            const config = statusConfig[service.status];
            const Icon = config.icon;
            return (
              <Card key={service.service}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{service.service}</CardTitle>
                    <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="outline" className={config.bgColor + " " + config.color}>
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Latency</span>
                      <span className="font-mono text-sm">{service.latency}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Uptime</span>
                      <span className="font-mono text-sm">{service.uptime}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

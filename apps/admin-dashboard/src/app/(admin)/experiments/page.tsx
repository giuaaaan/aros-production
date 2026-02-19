"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FlaskConical, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw,
  TrendingUp,
  Users,
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: "draft" | "running" | "paused" | "completed";
  variant_a: {
    name: string;
    traffic: number;
    conversions: number;
  };
  variant_b: {
    name: string;
    traffic: number;
    conversions: number;
  };
  start_date: string;
  end_date?: string;
  winner?: "A" | "B" | "tie";
}

const mockExperiments: Experiment[] = [
  {
    id: "1",
    name: "Landing Page Hero",
    description: "Test new hero section with video background",
    status: "running",
    variant_a: { name: "Current (Image)", traffic: 5234, conversions: 156 },
    variant_b: { name: "New (Video)", traffic: 4876, conversions: 189 },
    start_date: "2026-02-01",
  },
  {
    id: "2",
    name: "Pricing Page Layout",
    description: "Compare grid vs list pricing display",
    status: "completed",
    variant_a: { name: "Grid View", traffic: 8934, conversions: 412 },
    variant_b: { name: "List View", traffic: 8934, conversions: 445 },
    start_date: "2026-01-15",
    end_date: "2026-02-15",
    winner: "B",
  },
  {
    id: "3",
    name: "CTA Button Color",
    description: "Green vs Blue primary CTA",
    status: "paused",
    variant_a: { name: "Green CTA", traffic: 3200, conversions: 89 },
    variant_b: { name: "Blue CTA", traffic: 3156, conversions: 92 },
    start_date: "2026-01-20",
  },
  {
    id: "4",
    name: "Signup Form Fields",
    description: "3 fields vs 5 fields signup",
    status: "draft",
    variant_a: { name: "Short Form", traffic: 0, conversions: 0 },
    variant_b: { name: "Long Form", traffic: 0, conversions: 0 },
    start_date: "",
  },
];

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-500/10 text-gray-500", icon: AlertCircle },
  running: { label: "Running", color: "bg-green-500/10 text-green-500", icon: Play },
  paused: { label: "Paused", color: "bg-yellow-500/10 text-yellow-500", icon: Pause },
  completed: { label: "Completed", color: "bg-blue-500/10 text-blue-500", icon: CheckCircle2 },
};

function calculateConversionRate(conversions: number, traffic: number): string {
  if (traffic === 0) return "0.00%";
  return ((conversions / traffic) * 100).toFixed(2) + "%";
}

function calculateUplift(exp: Experiment): string {
  const rateA = exp.variant_a.conversions / Math.max(exp.variant_a.traffic, 1);
  const rateB = exp.variant_b.conversions / Math.max(exp.variant_b.traffic, 1);
  if (rateA === 0) return "N/A";
  const uplift = ((rateB - rateA) / rateA) * 100;
  return (uplift > 0 ? "+" : "") + uplift.toFixed(1) + "%";
}

export default function ExperimentsPage() {
  const [experiments] = useState<Experiment[]>(mockExperiments);
  const [search, setSearch] = useState("");

  const filteredExperiments = experiments.filter(
    (exp) =>
      exp.name.toLowerCase().includes(search.toLowerCase()) ||
      exp.description.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: experiments.length,
    running: experiments.filter((e) => e.status === "running").length,
    completed: experiments.filter((e) => e.status === "completed").length,
    totalTraffic: experiments.reduce((sum, e) => sum + e.variant_a.traffic + e.variant_b.traffic, 0),
  };

  return (
    <div>
      <Header
        title="A/B Testing"
        description="Run experiments and optimize conversion rates"
      />
      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Running</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.running}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Visitors</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalTraffic.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Input
              placeholder="Search experiments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Experiment
          </Button>
        </div>

        {/* Experiments List */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="running">Running ({stats.running})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {filteredExperiments.map((exp) => (
              <ExperimentCard key={exp.id} experiment={exp} />
            ))}
          </TabsContent>

          <TabsContent value="running" className="space-y-4 mt-4">
            {filteredExperiments
              .filter((e) => e.status === "running")
              .map((exp) => (
                <ExperimentCard key={exp.id} experiment={exp} />
              ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-4">
            {filteredExperiments
              .filter((e) => e.status === "completed")
              .map((exp) => (
                <ExperimentCard key={exp.id} experiment={exp} />
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ExperimentCard({ experiment: exp }: { experiment: Experiment }) {
  const status = statusConfig[exp.status];
  const StatusIcon = status.icon;
  const uplift = calculateUplift(exp);
  const isPositiveUplift = uplift.startsWith("+") && !uplift.includes("N/A");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={cn("p-2 rounded-lg", status.color)}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{exp.name}</CardTitle>
              <CardDescription>{exp.description}</CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={status.color}>
                  {status.label}
                </Badge>
                {exp.winner && (
                  <Badge className="bg-primary text-primary-foreground">
                    Winner: Variant {exp.winner}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  Started: {exp.start_date || "Not started"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {exp.status === "draft" && (
              <Button size="sm" className="gap-2">
                <Play className="w-4 h-4" />
                Start
              </Button>
            )}
            {exp.status === "running" && (
              <Button size="sm" variant="outline" className="gap-2">
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}
            {exp.status === "paused" && (
              <Button size="sm" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Resume
              </Button>
            )}
            {exp.status === "completed" && (
              <Button size="sm" variant="outline" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analysis
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Variant A */}
          <div className={cn(
            "p-4 rounded-lg border",
            exp.winner === "A" ? "border-green-500 bg-green-500/5" : "border-border"
          )}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">{exp.variant_a.name}</span>
              {exp.winner === "A" && (
                <Badge className="bg-green-500 text-white">Winner</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Traffic</span>
                <span className="font-medium">{exp.variant_a.traffic.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Conversions</span>
                <span className="font-medium">{exp.variant_a.conversions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Conv. Rate</span>
                <span className="font-medium">
                  {calculateConversionRate(exp.variant_a.conversions, exp.variant_a.traffic)}
                </span>
              </div>
            </div>
          </div>

          {/* Variant B */}
          <div className={cn(
            "p-4 rounded-lg border",
            exp.winner === "B" ? "border-green-500 bg-green-500/5" : "border-border"
          )}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">{exp.variant_b.name}</span>
              {exp.winner === "B" && (
                <Badge className="bg-green-500 text-white">Winner</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Traffic</span>
                <span className="font-medium">{exp.variant_b.traffic.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Conversions</span>
                <span className="font-medium">{exp.variant_b.conversions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Conv. Rate</span>
                <span className="font-medium">
                  {calculateConversionRate(exp.variant_b.conversions, exp.variant_b.traffic)}
                </span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Results</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uplift</span>
                <span className={cn(
                  "font-medium",
                  isPositiveUplift ? "text-green-600" : "text-red-600"
                )}>
                  {uplift}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Significance</span>
                <span className="font-medium">95%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sample Size</span>
                <span className="font-medium">
                  {(exp.variant_a.traffic + exp.variant_b.traffic).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

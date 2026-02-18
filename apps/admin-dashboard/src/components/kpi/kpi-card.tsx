"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number;
  format?: "currency" | "number" | "percentage";
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function KPICard({
  title,
  value,
  format = "number",
  change,
  changeLabel = "vs last month",
  icon,
  trend = "neutral",
}: KPICardProps) {
  const formattedValue = format === "currency" 
    ? formatCurrency(value)
    : format === "percentage"
    ? `${value}%`
    : formatNumber(value);

  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {change !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <Badge 
              variant={isPositive ? "success" : isNegative ? "destructive" : "secondary"}
              className="text-xs"
            >
              {isPositive && <ArrowUpRight className="w-3 h-3 mr-1" />}
              {isNegative && <ArrowDownRight className="w-3 h-3 mr-1" />}
              {isPositive ? "+" : ""}{change}%
            </Badge>
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          </div>
        )}
      </CardContent>
      {/* Background gradient decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
    </Card>
  );
}

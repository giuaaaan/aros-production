"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart3, 
  Users, 
  Calendar, 
  TrendingUp, 
  Download, 
  FileText,
  PieChart,
  Activity,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const reportTypes: ReportType[] = [
  {
    id: "organizations-summary",
    name: "Organizations Summary",
    description: "Overview of all organizations with key metrics",
    icon: <Users className="w-5 h-5" />,
    category: "Overview",
  },
  {
    id: "subscription-analytics",
    name: "Subscription Analytics",
    description: "Breakdown by plan tier and status",
    icon: <PieChart className="w-5 h-5" />,
    category: "Analytics",
  },
  {
    id: "growth-report",
    name: "Growth Report",
    description: "New organizations and trends over time",
    icon: <TrendingUp className="w-5 h-5" />,
    category: "Growth",
  },
  {
    id: "appointment-analytics",
    name: "Appointment Analytics",
    description: "Booking trends and statistics",
    icon: <Calendar className="w-5 h-5" />,
    category: "Analytics",
  },
  {
    id: "system-usage",
    name: "System Usage",
    description: "Platform usage and activity metrics",
    icon: <Activity className="w-5 h-5" />,
    category: "System",
  },
];

const dateRangeOptions = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
  { value: "all", label: "All time" },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>("organizations-summary");
  const [dateRange, setDateRange] = useState<string>("30d");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${selectedReport}?range=${dateRange}`);
      if (!res.ok) throw new Error("Failed to generate report");
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: "csv" | "pdf") => {
    if (!reportData) return;
    
    if (format === "csv") {
      // Export to CSV
      const headers = reportData.columns?.map((col: any) => col.name).join(",") || "";
      const rows = reportData.rows?.map((row: any) => 
        reportData.columns.map((col: any) => {
          const value = row[col.key];
          if (value === null || value === undefined) return "";
          const str = String(value);
          if (str.includes('"') || str.includes(",") || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(",")
      ).join("\n") || "";
      
      const csvContent = [headers, rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedReport}-${dateRange}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const selectedReportType = reportTypes.find((r) => r.id === selectedReport);

  return (
    <div>
      <Header
        title="Custom Reports"
        description="Generate and export custom analytics reports"
      />
      <div className="p-6 space-y-6">
        {/* Report Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => (
            <Card
              key={report.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedReport === report.id && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {report.icon}
                  </div>
                  <Badge variant="outline">{report.category}</Badge>
                </div>
                <CardTitle className="text-base mt-3">{report.name}</CardTitle>
                <CardDescription className="text-xs">
                  {report.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configure Report</CardTitle>
            <CardDescription>
              {selectedReportType?.name} - {selectedReportType?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select
                  value={dateRange}
                  onChange={setDateRange}
                  options={dateRangeOptions}
                />
              </div>
              <Button 
                onClick={generateReport} 
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Results */}
        {reportData && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{reportData.title}</CardTitle>
                <CardDescription>{reportData.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportReport("csv")}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              {reportData.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {reportData.summary.map((stat: any, idx: number) => (
                    <div key={idx} className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Data Table */}
              {reportData.rows && reportData.columns && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {reportData.columns.map((col: any) => (
                          <TableHead key={col.key}>{col.name}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.rows.map((row: any, idx: number) => (
                        <TableRow key={idx}>
                          {reportData.columns.map((col: any) => (
                            <TableCell key={col.key}>
                              {row[col.key]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Empty State */}
              {(!reportData.rows || reportData.rows.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

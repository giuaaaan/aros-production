"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Organization } from "@/types";

interface ExportButtonProps {
  organizations: Organization[];
  filters?: {
    search?: string;
    status?: string;
    tier?: string;
    city?: string;
  };
  disabled?: boolean;
}

export function ExportButton({ organizations, filters, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const generateFilename = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    const parts = ["organizations"];
    
    if (filters?.status && filters.status !== "all") {
      parts.push(filters.status);
    }
    if (filters?.tier && filters.tier !== "all") {
      parts.push(filters.tier);
    }
    if (filters?.city) {
      parts.push(filters.city.toLowerCase().replace(/\s+/g, "-"));
    }
    
    parts.push(timestamp);
    return `${parts.join("-")}.csv`;
  };

  const escapeCsv = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    // Escape quotes and wrap in quotes if contains special characters
    if (str.includes('"') || str.includes(",") || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExport = async () => {
    if (organizations.length === 0) return;

    setIsExporting(true);

    try {
      // CSV Headers
      const headers = [
        "ID",
        "Name",
        "Phone Number",
        "Email",
        "Address",
        "City",
        "Postal Code",
        "Plan",
        "Status",
        "Users",
        "Appointments",
        "Created At",
        "Updated At",
      ];

      // CSV Rows
      const rows = organizations.map((org) => [
        org.id,
        org.name,
        org.phone_number,
        org.email || "",
        org.address || "",
        org.city || "",
        org.postal_code || "",
        org.subscription_tier,
        org.subscription_status,
        org.user_count || 0,
        org.appointment_count || 0,
        org.created_at,
        org.updated_at,
      ]);

      // Build CSV content
      const csvContent = [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(",")),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = generateFilename();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || isExporting || organizations.length === 0}
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export CSV
        </>
      )}
    </Button>
  );
}

// Export all organizations (bypass pagination)
interface ExportAllButtonProps {
  filters?: {
    search?: string;
    status?: string;
    tier?: string;
    city?: string;
  };
  totalCount: number;
}

export function ExportAllButton({ filters, totalCount }: ExportAllButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAll = async () => {
    setIsExporting(true);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.status && filters.status !== "all") params.set("status", filters.status);
      if (filters?.tier && filters.tier !== "all") params.set("tier", filters.tier);
      if (filters?.city) params.set("city", filters.city);
      params.set("export", "all");

      // Fetch all organizations
      const response = await fetch(`/api/organizations/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch organizations for export");
      }

      const data = await response.json();
      const organizations: Organization[] = data.organizations;

      if (organizations.length === 0) {
        return;
      }

      // Generate filename
      const timestamp = new Date().toISOString().split("T")[0];
      const parts = ["organizations"];
      if (filters?.status && filters.status !== "all") parts.push(filters.status);
      if (filters?.tier && filters.tier !== "all") parts.push(filters.tier);
      parts.push(timestamp);
      const filename = `${parts.join("-")}.csv`;

      // CSV Headers
      const headers = [
        "ID",
        "Name",
        "Phone Number",
        "Email",
        "Address",
        "City",
        "Postal Code",
        "Plan",
        "Status",
        "Users",
        "Appointments",
        "Created At",
        "Updated At",
      ];

      // Escape CSV values
      const escapeCsv = (value: string | number | null | undefined): string => {
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (str.includes('"') || str.includes(",") || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // CSV Rows
      const rows = organizations.map((org) => [
        org.id,
        org.name,
        org.phone_number,
        org.email || "",
        org.address || "",
        org.city || "",
        org.postal_code || "",
        org.subscription_tier,
        org.subscription_status,
        org.user_count || 0,
        org.appointment_count || 0,
        org.created_at,
        org.updated_at,
      ]);

      // Build CSV content
      const csvContent = [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(",")),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExportAll}
      disabled={isExporting || totalCount === 0}
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting {totalCount} records...
        </>
      ) : (
        <>
          <FileSpreadsheet className="w-4 h-4" />
          Export All ({totalCount})
        </>
      )}
    </Button>
  );
}

"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface OrganizationFilters {
  search: string;
  status: string;
  tier: string;
  city: string;
}

interface OrganizationFiltersProps {
  filters: OrganizationFilters;
  onChange: (filters: OrganizationFilters) => void;
  className?: string;
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
];

const tierOptions = [
  { value: "all", label: "All Plans" },
  { value: "starter", label: "Starter" },
  { value: "professional", label: "Professional" },
  { value: "enterprise", label: "Enterprise" },
];

export function OrganizationFiltersPanel({
  filters,
  onChange,
  className,
}: OrganizationFiltersProps) {
  const hasActiveFilters =
    filters.status !== "all" ||
    filters.tier !== "all" ||
    filters.city !== "" ||
    filters.search !== "";

  const handleReset = () => {
    onChange({
      search: "",
      status: "all",
      tier: "all",
      city: "",
    });
  };

  const activeFiltersCount = [
    filters.status !== "all",
    filters.tier !== "all",
    filters.city !== "",
    filters.search !== "",
  ].filter(Boolean).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Top Row - Search and Quick Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            className="pl-9"
            value={filters.search}
            onChange={(e) =>
              onChange({ ...filters, search: e.target.value })
            }
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-2 text-muted-foreground"
          >
            <X className="w-4 h-4" />
            Clear filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        <Select
          value={filters.status}
          onChange={(value) => onChange({ ...filters, status: value })}
          options={statusOptions}
          placeholder="Status"
          className="w-40"
        />

        <Select
          value={filters.tier}
          onChange={(value) => onChange({ ...filters, tier: value })}
          options={tierOptions}
          placeholder="Plan"
          className="w-44"
        />

        <div className="w-48">
          <Input
            placeholder="Filter by city..."
            value={filters.city}
            onChange={(e) =>
              onChange({ ...filters, city: e.target.value })
            }
            className="h-9"
          />
        </div>
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <span className="text-xs text-muted-foreground">Active:</span>
          
          {filters.search && (
            <FilterPill
              label={`Search: "${filters.search}"`}
              onRemove={() => onChange({ ...filters, search: "" })}
            />
          )}
          
          {filters.status !== "all" && (
            <FilterPill
              label={`Status: ${filters.status}`}
              onRemove={() => onChange({ ...filters, status: "all" })}
            />
          )}
          
          {filters.tier !== "all" && (
            <FilterPill
              label={`Plan: ${filters.tier}`}
              onRemove={() => onChange({ ...filters, tier: "all" })}
            />
          )}
          
          {filters.city && (
            <FilterPill
              label={`City: ${filters.city}`}
              onRemove={() => onChange({ ...filters, city: "" })}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface FilterPillProps {
  label: string;
  onRemove: () => void;
}

function FilterPill({ label, onRemove }: FilterPillProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

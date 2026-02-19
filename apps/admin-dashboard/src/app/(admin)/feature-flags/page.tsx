"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFeatureFlags, FeatureFlag } from "@/hooks/use-feature-flags";
import { Plus, Search, ToggleLeft, ToggleRight, Trash2, Edit, Globe, Building } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FeatureFlagsPage() {
  const { flags, loading, error, refresh } = useFeatureFlags();
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const filteredFlags = flags.filter(
    (flag) =>
      flag.name.toLowerCase().includes(search.toLowerCase()) ||
      flag.key.toLowerCase().includes(search.toLowerCase()) ||
      flag.description.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFlag = async (flag: FeatureFlag) => {
    setUpdating(flag.id);
    try {
      const res = await fetch(`/api/feature-flags/${flag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
      if (!res.ok) throw new Error("Failed to update flag");
      await refresh();
    } catch (err) {
      console.error("Error toggling flag:", err);
    } finally {
      setUpdating(null);
    }
  };

  if (error) {
    return (
      <div>
        <Header title="Feature Flags" description="Manage feature toggles for the platform" />
        <div className="p-6">
          <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-lg text-red-500">
            Error loading feature flags: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Feature Flags"
        description="Manage feature toggles for the platform"
      />
      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search feature flags..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Flag
          </Button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total:</span>
              <strong>{flags.length}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">●</span>
              <span className="text-muted-foreground">Enabled:</span>
              <strong>{flags.filter((f) => f.enabled).length}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">●</span>
              <span className="text-muted-foreground">Disabled:</span>
              <strong>{flags.filter((f) => !f.enabled).length}</strong>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="border rounded-lg">
          {loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {search ? "No feature flags match your search" : "No feature flags configured"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFlags.map((flag) => (
                    <TableRow key={flag.id} className="group">
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{flag.name}</p>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {flag.key}
                            </code>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {flag.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            flag.scope === "global"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-purple-500/10 text-purple-500"
                          )}
                        >
                          {flag.scope === "global" ? (
                            <Globe className="w-3 h-3 mr-1" />
                          ) : (
                            <Building className="w-3 h-3 mr-1" />
                          )}
                          {flag.scope}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {flag.enabled ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-sm font-medium text-green-600">Enabled</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-gray-400" />
                              <span className="text-sm text-muted-foreground">Disabled</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8",
                              flag.enabled && "text-green-600 hover:text-green-700 hover:bg-green-50"
                            )}
                            onClick={() => toggleFlag(flag)}
                            disabled={updating === flag.id}
                          >
                            {updating === flag.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : flag.enabled ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { useOrganizations } from "@/hooks/use-organizations";

const tierColors: Record<string, string> = {
  starter: "bg-gray-500/10 text-gray-500",
  professional: "bg-blue-500/10 text-blue-500",
  enterprise: "bg-purple-500/10 text-purple-500",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-500",
  paused: "bg-yellow-500/10 text-yellow-500",
  cancelled: "bg-red-500/10 text-red-500",
};

export default function OrganizationsPage() {
  const [search, setSearch] = useState("");
  const { organizations, total, loading, error } = useOrganizations({ search });

  if (error) {
    return (
      <div>
        <Header title="Organizations" description="Manage your customer organizations" />
        <div className="p-6">
          <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-lg text-red-500">
            Error loading organizations: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Organizations"
        description="Manage your customer organizations"
      />
      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Organization
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          {loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Appointments</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No organizations found
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((org) => (
                    <TableRow key={org.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-muted-foreground">{org.phone_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>{org.city}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={tierColors[org.subscription_tier]}>
                          {org.subscription_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[org.subscription_status]}>
                          {org.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{org.user_count}</TableCell>
                      <TableCell>{org.appointment_count}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Total count */}
        {!loading && (
          <p className="text-sm text-muted-foreground">
            Showing {organizations.length} of {total} organizations
          </p>
        )}
      </div>
    </div>
  );
}

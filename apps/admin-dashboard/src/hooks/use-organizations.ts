"use client";

import { useEffect, useState } from "react";
import { Organization } from "@/types";

interface UseOrganizationsOptions {
  search?: string;
  status?: string;
  tier?: string;
}

interface OrganizationsData {
  organizations: Organization[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useOrganizations(options: UseOrganizationsOptions = {}): OrganizationsData {
  const { search = "", status = "all", tier = "all" } = options;
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (status !== "all") params.set("status", status);
        if (tier !== "all") params.set("tier", tier);

        const res = await fetch(`/api/organizations?${params.toString()}`);

        if (!res.ok) {
          throw new Error("Failed to fetch organizations");
        }

        const data = await res.json();
        setOrganizations(data.organizations);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizations();
  }, [search, status, tier]);

  return { organizations, total, loading, error };
}

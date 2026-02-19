"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: "global" | "organization";
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

interface FeatureFlagsContextType {
  flags: FeatureFlag[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isEnabled: (key: string) => boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/feature-flags");
      if (!res.ok) throw new Error("Failed to fetch feature flags");
      const data = await res.json();
      setFlags(data.flags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const isEnabled = (key: string): boolean => {
    const flag = flags.find((f) => f.key === key);
    return flag?.enabled ?? false;
  };

  return (
    <FeatureFlagsContext.Provider
      value={{ flags, loading, error, refresh: fetchFlags, isEnabled }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagsProvider");
  }
  return context;
}

export function useFeatureFlag(key: string): boolean {
  const { isEnabled, loading } = useFeatureFlags();
  if (loading) return false;
  return isEnabled(key);
}

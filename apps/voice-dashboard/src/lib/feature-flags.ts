import { createClient } from "./supabase/client";

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
}

// Default feature flags
const defaultFlags: Record<string, boolean> = {
  "new-dashboard-ui": false,
  "ai-suggestions": true,
  "inventory-management": false,
  "customer-portal": false,
  "whatsapp-business-api": true,
  "advanced-analytics": false,
  "multi-location": false,
  "automatic-invoicing": false,
};

class FeatureFlagsManager {
  private flags: Map<string, boolean> = new Map();
  private initialized = false;

  async init() {
    if (this.initialized) return;
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("feature_flags")
        .select("key, enabled");
      
      if (error) {
        console.error("Failed to load feature flags:", error);
        // Use defaults
        Object.entries(defaultFlags).forEach(([key, enabled]) => {
          this.flags.set(key, enabled);
        });
      } else {
        // Merge with defaults
        Object.entries(defaultFlags).forEach(([key, defaultValue]) => {
          const dbFlag = data?.find((f) => f.key === key);
          this.flags.set(key, dbFlag?.enabled ?? defaultValue);
        });
      }
      
      this.initialized = true;
    } catch (error) {
      console.error("Feature flags init error:", error);
      // Fallback to defaults
      Object.entries(defaultFlags).forEach(([key, enabled]) => {
        this.flags.set(key, enabled);
      });
    }
  }

  isEnabled(key: string): boolean {
    return this.flags.get(key) ?? false;
  }

  async enable(key: string): Promise<void> {
    const supabase = createClient();
    await supabase
      .from("feature_flags")
      .upsert({ key, enabled: true, updated_at: new Date().toISOString() });
    this.flags.set(key, true);
  }

  async disable(key: string): Promise<void> {
    const supabase = createClient();
    await supabase
      .from("feature_flags")
      .upsert({ key, enabled: false, updated_at: new Date().toISOString() });
    this.flags.set(key, false);
  }

  getAll(): Record<string, boolean> {
    return Object.fromEntries(this.flags);
  }
}

export const featureFlags = new FeatureFlagsManager();

// React hook for feature flags
import { useState, useEffect } from "react";

export function useFeatureFlag(key: string): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    featureFlags.init().then(() => {
      setEnabled(featureFlags.isEnabled(key));
    });
  }, [key]);

  return enabled;
}

// HOC for feature-gated components
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flagKey: string,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureGatedComponent(props: P) {
    const isEnabled = useFeatureFlag(flagKey);
    
    if (!isEnabled) {
      return FallbackComponent ? <FallbackComponent {...props} /> : null;
    }
    
    return <Component {...props} />;
  };
}

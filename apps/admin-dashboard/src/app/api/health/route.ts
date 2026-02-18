import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: {
      status: "up" | "down";
      latency: number;
      message?: string;
    };
    memory: {
      status: "up" | "down";
      usage: string;
      limit: string;
    };
    uptime: {
      status: "up";
      seconds: number;
    };
  };
  metadata: {
    region?: string;
    commit?: string;
    deployTime?: string;
  };
}

// Track startup time
const startTime = Date.now();

export async function GET() {
  const checks: HealthCheck["checks"] = {
    database: { status: "down", latency: 0 },
    memory: { status: "up", usage: "0MB", limit: "0MB" },
    uptime: { status: "up", seconds: Math.floor((Date.now() - startTime) / 1000) },
  };

  let overallStatus: HealthCheck["status"] = "healthy";

  // Database check
  const dbStart = Date.now();
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("organizations").select("count").limit(1);
    
    checks.database.status = error ? "down" : "up";
    checks.database.latency = Date.now() - dbStart;
    
    if (error) {
      checks.database.message = error.message;
      overallStatus = "unhealthy";
    }
  } catch (error) {
    checks.database.status = "down";
    checks.database.latency = Date.now() - dbStart;
    checks.database.message = error instanceof Error ? error.message : "Unknown error";
    overallStatus = "unhealthy";
  }

  // Memory check
  if (process.memoryUsage) {
    const usage = process.memoryUsage();
    checks.memory.usage = `${Math.round(usage.heapUsed / 1024 / 1024)}MB`;
    checks.memory.limit = `${Math.round(usage.heapTotal / 1024 / 1024)}MB`;
    
    // Degraded if using > 80% of heap
    const usagePercent = usage.heapUsed / usage.heapTotal;
    if (usagePercent > 0.8) {
      checks.memory.status = "down";
      if (overallStatus === "healthy") {
        overallStatus = "degraded";
      }
    }
  }

  const response: HealthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    checks,
    metadata: {
      region: process.env.VERCEL_REGION,
      commit: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
      deployTime: process.env.VERCEL_DEPLOYMENT_ID,
    },
  };

  const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

  return NextResponse.json(response, { 
    status: statusCode,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
    },
  });
}

// HEAD request for simple uptime checks
export async function HEAD() {
  return new Response(null, { 
    status: 200,
    headers: {
      "Cache-Control": "no-cache",
    },
  });
}

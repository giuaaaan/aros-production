import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const startTime = Date.now();

export async function GET() {
  const checks = {
    database: { status: "down" as const, latency: 0 },
    uptime: { status: "up" as const, seconds: Math.floor((Date.now() - startTime) / 1000) },
  };

  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

  // Database check
  const dbStart = Date.now();
  try {
    const supabase = createClient();
    const { error } = await supabase.from("organizations").select("count").limit(1);
    
    checks.database.status = error ? "down" : "up";
    checks.database.latency = Date.now() - dbStart;
    
    if (error) overallStatus = "unhealthy";
  } catch (error) {
    checks.database.status = "down";
    checks.database.latency = Date.now() - dbStart;
    overallStatus = "unhealthy";
  }

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    checks,
  };

  const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

  return NextResponse.json(response, { 
    status: statusCode,
    headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
  });
}

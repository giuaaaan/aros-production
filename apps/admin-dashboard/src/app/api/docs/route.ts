import { NextResponse } from "next/server";
import { openApiJson } from "@/lib/openapi";

export const dynamic = "force-dynamic";

/**
 * GET /api/docs
 * Returns OpenAPI specification
 */
export async function GET() {
  return new NextResponse(openApiJson, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

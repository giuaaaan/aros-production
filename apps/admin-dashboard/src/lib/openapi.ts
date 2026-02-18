/**
 * OpenAPI Specification for Admin Dashboard API
 * This can be used with Swagger UI or similar tools
 */

export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "AROS Admin Dashboard API",
    version: "1.0.0",
    description: "API for managing AROS Voice platform - Admin operations",
    contact: {
      name: "AROS Support",
      email: "support@aiaros.it",
    },
  },
  servers: [
    {
      url: "/api",
      description: "Current environment",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health check endpoint",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Service is healthy or degraded",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { enum: ["healthy", "degraded"] },
                    timestamp: { type: "string", format: "date-time" },
                    version: { type: "string" },
                    environment: { type: "string" },
                    checks: {
                      type: "object",
                      properties: {
                        database: {
                          type: "object",
                          properties: {
                            status: { enum: ["up", "down"] },
                            latency: { type: "number" },
                            message: { type: "string" },
                          },
                        },
                        memory: {
                          type: "object",
                          properties: {
                            status: { enum: ["up", "down"] },
                            usage: { type: "string" },
                            limit: { type: "string" },
                          },
                        },
                        uptime: {
                          type: "object",
                          properties: {
                            status: { enum: ["up"] },
                            seconds: { type: "number" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "503": {
            description: "Service is unhealthy",
          },
        },
      },
    },
    "/dashboard/stats": {
      get: {
        summary: "Get dashboard statistics",
        tags: ["Dashboard"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Dashboard statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalRevenue: { type: "number" },
                    revenueChange: { type: "number" },
                    activeCustomers: { type: "integer" },
                    customersChange: { type: "number" },
                    todayCalls: { type: "integer" },
                    callsChange: { type: "number" },
                    systemHealth: { type: "number" },
                    healthStatus: { enum: ["operational", "degraded", "down"] },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/activity": {
      get: {
        summary: "Get recent activity feed",
        tags: ["Activity"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of activity items",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      type: { enum: ["call", "whatsapp", "signup", "appointment", "error"] },
                      organization: { type: "string" },
                      description: { type: "string" },
                      timestamp: { type: "string", format: "date-time" },
                      metadata: { type: "object" },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/organizations": {
      get: {
        summary: "List organizations",
        tags: ["Organizations"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Search by name or phone",
          },
          {
            name: "status",
            in: "query",
            schema: { enum: ["all", "active", "paused", "cancelled"] },
            description: "Filter by subscription status",
          },
          {
            name: "tier",
            in: "query",
            schema: { enum: ["all", "starter", "professional", "enterprise"] },
            description: "Filter by subscription tier",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 },
            description: "Items per page",
          },
        ],
        responses: {
          "200": {
            description: "List of organizations",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    organizations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          slug: { type: "string" },
                          phone_number: { type: "string", nullable: true },
                          whatsapp_number: { type: "string", nullable: true },
                          city: { type: "string", nullable: true },
                          subscription_tier: { enum: ["starter", "professional", "enterprise"] },
                          subscription_status: { enum: ["active", "paused", "cancelled"] },
                          created_at: { type: "string", format: "date-time" },
                          updated_at: { type: "string", format: "date-time" },
                          user_count: { type: "integer" },
                          appointment_count: { type: "integer" },
                        },
                      },
                    },
                    total: { type: "integer" },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        totalPages: { type: "integer" },
                        hasNext: { type: "boolean" },
                        hasPrev: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "429": { description: "Too many requests" },
          "500": { description: "Internal server error" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          code: { type: "string" },
          details: { type: "object" },
        },
      },
    },
  },
};

// Export as JSON string for serving
export const openApiJson = JSON.stringify(openApiSpec, null, 2);

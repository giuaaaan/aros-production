import { z } from "zod";

// Organization schemas
export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  phone_number: z.string().nullable(),
  whatsapp_number: z.string().nullable(),
  city: z.string().nullable(),
  subscription_tier: z.enum(["starter", "professional", "enterprise"]),
  subscription_status: z.enum(["active", "paused", "cancelled"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  phone_number: z.string().optional().nullable(),
  whatsapp_number: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  subscription_tier: z.enum(["starter", "professional", "enterprise"]).default("starter"),
  subscription_status: z.enum(["active", "paused", "cancelled"]).default("active"),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

// Query schemas
export const organizationsQuerySchema = z.object({
  search: z.string().max(100).optional(),
  status: z.enum(["all", "active", "paused", "cancelled"]).default("all"),
  tier: z.enum(["all", "starter", "professional", "enterprise"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.enum(["name", "created_at", "subscription_status"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Dashboard stats schema
export const dashboardStatsSchema = z.object({
  totalRevenue: z.number().min(0),
  revenueChange: z.number(),
  activeCustomers: z.number().int().min(0),
  customersChange: z.number(),
  todayCalls: z.number().int().min(0),
  callsChange: z.number(),
  systemHealth: z.number().min(0).max(100),
  healthStatus: z.enum(["operational", "degraded", "down"]),
});

// Activity schemas
export const activityTypeSchema = z.enum(["call", "whatsapp", "signup", "appointment", "error"]);

export const activityItemSchema = z.object({
  id: z.string(),
  type: activityTypeSchema,
  organization: z.string(),
  description: z.string(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

// User schemas
export const userRoleSchema = z.enum(["super_admin", "admin", "support"]);

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  role: userRoleSchema,
  last_sign_in_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

// Chart data schema
export const chartDataSchema = z.object({
  date: z.string(),
  calls: z.number().int().min(0),
  whatsapp: z.number().int().min(0),
  revenue: z.number().min(0),
});

// System status schema
export const systemStatusSchema = z.object({
  service: z.string(),
  status: z.enum(["operational", "degraded", "down"]),
  latency: z.number().min(0),
  uptime: z.number().min(0).max(100),
  lastChecked: z.string().datetime(),
});

// API Response schemas
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: z.object({
      timestamp: z.string().datetime(),
      requestId: z.string().optional(),
    }).optional(),
  });

export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
  meta: z.object({
    timestamp: z.string().datetime(),
    requestId: z.string().optional(),
  }).optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

// Health check schema
export const healthCheckSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  timestamp: z.string().datetime(),
  version: z.string(),
  environment: z.string(),
  checks: z.object({
    database: z.object({
      status: z.enum(["up", "down"]),
      latency: z.number(),
      message: z.string().optional(),
    }),
    memory: z.object({
      status: z.enum(["up", "down"]),
      usage: z.string(),
      limit: z.string(),
    }),
    uptime: z.object({
      status: z.enum(["up"]),
      seconds: z.number(),
    }),
  }),
  metadata: z.record(z.string().optional()).optional(),
});

// Export types
type Organization = z.infer<typeof organizationSchema>;
type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
type OrganizationsQuery = z.infer<typeof organizationsQuerySchema>;
type DashboardStats = z.infer<typeof dashboardStatsSchema>;
type ActivityItem = z.infer<typeof activityItemSchema>;
type User = z.infer<typeof userSchema>;
type ChartData = z.infer<typeof chartDataSchema>;
type SystemStatus = z.infer<typeof systemStatusSchema>;
type HealthCheck = z.infer<typeof healthCheckSchema>;

export type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationsQuery,
  DashboardStats,
  ActivityItem,
  User,
  ChartData,
  SystemStatus,
  HealthCheck,
};

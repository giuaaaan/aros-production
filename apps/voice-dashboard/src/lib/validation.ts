import { z } from "zod";

// Customer schemas
export const customerSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string(),
  email: z.string().email().optional().nullable(),
  created_at: z.string().datetime(),
});

export const createCustomerSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string(),
  email: z.string().email().optional().nullable(),
});

// Vehicle schemas
export const vehicleSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.string().uuid(),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  license_plate: z.string().min(1).max(20),
  year: z.number().int().min(1900).max(2030).optional().nullable(),
  created_at: z.string().datetime(),
});

export const createVehicleSchema = z.object({
  customer_id: z.string().uuid(),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  license_plate: z.string().min(1).max(20),
  year: z.number().int().min(1900).max(2030).optional().nullable(),
});

// Appointment schemas
export const appointmentSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid().optional().nullable(),
  scheduled_at: z.string().datetime(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  service_type: z.string(),
  notes: z.string().optional().nullable(),
  source: z.enum(["ai_voice", "ai_whatsapp", "manual"]),
  created_at: z.string().datetime(),
});

export const createAppointmentSchema = z.object({
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid().optional().nullable(),
  scheduled_at: z.string().datetime(),
  service_type: z.string(),
  notes: z.string().optional().nullable(),
});

// Conversation schemas
export const conversationSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  customer_id: z.string().uuid().optional().nullable(),
  channel: z.enum(["voice", "whatsapp"]),
  status: z.enum(["active", "completed", "failed"]),
  customer_phone: z.string(),
  created_at: z.string().datetime(),
});

// Webhook schemas
export const vapiWebhookSchema = z.object({
  message: z.object({
    type: z.string(),
    call: z.object({
      id: z.string(),
      status: z.string(),
      customer: z.object({
        number: z.string(),
      }).optional(),
    }),
    analysis: z.object({
      summary: z.string().optional(),
      appointment_booked: z.boolean().optional(),
    }).optional(),
  }),
});

export const whatsappWebhookSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    changes: z.array(z.object({
      value: z.object({
        messages: z.array(z.object({
          from: z.string(),
          id: z.string(),
          type: z.string(),
          text: z.object({ body: z.string() }).optional(),
        })).optional(),
      }),
    })),
  })),
});

// Organization schema (read-only for customers)
export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  phone_number: z.string().nullable(),
  whatsapp_number: z.string().nullable(),
  city: z.string().nullable(),
  subscription_tier: z.enum(["starter", "professional", "enterprise"]),
  subscription_status: z.enum(["active", "paused", "cancelled"]),
});

// Stats schema
export const dashboardStatsSchema = z.object({
  todayAppointments: z.number().int().min(0),
  successfulCalls: z.number().int().min(0),
  whatsappChats: z.number().int().min(0),
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
    }),
    uptime: z.object({
      status: z.enum(["up"]),
      seconds: z.number(),
    }),
  }),
});

// Export types
type Customer = z.infer<typeof customerSchema>;
type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
type Vehicle = z.infer<typeof vehicleSchema>;
type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
type Appointment = z.infer<typeof appointmentSchema>;
type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
type Conversation = z.infer<typeof conversationSchema>;
type DashboardStats = z.infer<typeof dashboardStatsSchema>;
type HealthCheck = z.infer<typeof healthCheckSchema>;

export type {
  Customer,
  CreateCustomerInput,
  Vehicle,
  CreateVehicleInput,
  Appointment,
  CreateAppointmentInput,
  Conversation,
  DashboardStats,
  HealthCheck,
};

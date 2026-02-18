/**
 * POST /api/technical-stop/create
 * Create a new technical stop (fermo tecnico)
 * Critical/immobilized stops trigger immediate notifications
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { TechnicalStop, TechnicalStopSeverity, TechnicalStopCategory } from "@/types/advanced-features";

// Interface for profile data
interface ProfileData {
  org_id: string;
  id: string;
  first_name: string;
  last_name: string;
}

// Interface for vehicle data
interface VehicleData {
  id: string;
  make: string;
  model: string;
  license_plate: string;
}

// Interface for work order data (minimal)
interface WorkOrderData {
  id: string;
}

// Interface for technician profile lookup
interface TechnicianProfile {
  id: string;
}

const createTechnicalStopSchema = z.object({
  vehicle_id: z.string().uuid(),
  work_order_id: z.string().uuid().optional(),
  reason: z.string().min(1).max(255),
  severity: z.enum(["low", "medium", "high", "critical"] as const),
  category: z.enum(["engine", "brakes", "suspension", "transmission", "electrical", "safety", "other"] as const),
  description: z.string().min(1),
  vehicle_immobilized: z.boolean().default(false),
  priority_override: z.number().min(0).max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user's org_id and profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("org_id, id, first_name, last_name")
      .eq("id", user.id)
      .single<ProfileData>();
    
    const profile: ProfileData | null = profileData;

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }
    
    const typedProfile = profile as ProfileData;

    // 3. Validate input
    const body = await request.json();
    const validation = createTechnicalStopSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 4. Verify vehicle exists and belongs to org
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, make, model, license_plate")
      .eq("id", data.vehicle_id)
      .eq("org_id", typedProfile.org_id)
      .single<VehicleData>();

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // 5. Verify work order if provided
    if (data.work_order_id) {
      const { data: workOrder } = await supabase
        .from("work_orders")
        .select("id")
        .eq("id", data.work_order_id)
        .eq("org_id", typedProfile.org_id)
        .single<WorkOrderData>();

      if (!workOrder) {
        return NextResponse.json({ error: "Work order not found" }, { status: 404 });
      }
    }

    // 6. Calculate priority override for critical/immobilized vehicles
    let priorityOverride = data.priority_override || 0;
    if (data.vehicle_immobilized) {
      priorityOverride = Math.max(priorityOverride, 90);
    }
    if (data.severity === "critical") {
      priorityOverride = Math.max(priorityOverride, 100);
    }

    // 7. Create technical stop
    const { data: technicalStop, error: createError } = await supabase
      .from("technical_stops")
      .insert({
        vehicle_id: data.vehicle_id,
        work_order_id: data.work_order_id,
        reason: data.reason,
        severity: data.severity,
        category: data.category,
        description: data.description,
        reported_by: typedProfile.id,
        vehicle_immobilized: data.vehicle_immobilized,
        priority_override: priorityOverride,
        org_id: typedProfile.org_id,
      })
      .select(`
        *,
        vehicle:vehicles(make, model, license_plate),
        reporter:profiles!reported_by(first_name, last_name)
      `)
      .single();

    if (createError) {
      console.error("Technical stop creation error:", createError);
      return NextResponse.json(
        { error: "Failed to create technical stop" },
        { status: 500 }
      );
    }

    // 8. If critical or immobilized, create notification
    if (data.severity === "critical" || data.vehicle_immobilized) {
      // Get all technicians/admin to notify
      const { data: technicians } = await supabase
        .from("profiles")
        .select("id")
        .eq("org_id", typedProfile.org_id)
        .in("role", ["admin", "technician", "manager"]);

      const notificationIds = technicians?.map((t: TechnicianProfile) => t.id) || [];

      // Create notification in queue
      await supabase
        .from("notification_queue")
        .insert({
          type: "critical_technical_stop",
          priority: 10,
          payload: {
            technical_stop_id: technicalStop.id,
            vehicle_id: data.vehicle_id,
            vehicle_info: `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
            reason: data.reason,
            severity: data.severity,
            immobilized: data.vehicle_immobilized,
            reported_by: `${typedProfile.first_name} ${typedProfile.last_name}`,
          },
          org_id: typedProfile.org_id,
        });

      // Update the stop with notification info
      await supabase
        .from("technical_stops")
        .update({
          notified_at: new Date().toISOString(),
          notification_sent_to: notificationIds,
        })
        .eq("id", technicalStop.id);
    }

    return NextResponse.json({
      success: true,
      message: "Technical stop created successfully",
      technical_stop: technicalStop as TechnicalStop,
      alert_triggered: data.severity === "critical" || data.vehicle_immobilized,
    }, { status: 201 });

  } catch (error) {
    console.error("Create technical stop API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

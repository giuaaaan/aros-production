/**
 * POST /api/pending-decisions/create
 * Create a pending decision (preventivo inviato in attesa)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { PendingDecision } from "@/types/advanced-features";

// Interface for profile data
interface ProfileData {
  org_id: string;
  id: string;
}

// Interface for work order data
interface WorkOrderData {
  id: string;
  status: string;
  wo_number: string;
}

// Interface for customer data
interface CustomerData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

// Interface for existing pending decision
interface ExistingPendingDecision {
  id: string;
  status: string;
}

// Interface for pending decision with joined fields
interface PendingDecisionWithJoins {
  id: string;
  odl_id: string;
  quote_id?: string;
  customer_id: string;
  sent_at: string;
  quote_amount: number;
  quote_description?: string;
  reminder_3d_sent_at?: string | null;
  reminder_7d_sent_at?: string | null;
  reminder_14d_sent_at?: string | null;
  escalated_at?: string;
  escalated_to?: string;
  escalation_reason?: string;
  status: string;
  customer_response?: string;
  responded_at?: string;
  org_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  odl?: {
    wo_number: string;
    description: string;
  };
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  quote?: {
    quote_number: string;
  };
}

// Interface for reminder item
interface ReminderItem {
  type: '3d' | '7d' | '14d';
  sent: boolean;
  due: boolean;
}

// Interface for decision with reminder info
interface DecisionWithReminders extends PendingDecisionWithJoins {
  days_waiting: number;
  reminders: ReminderItem[];
  next_reminder_due?: string;
  needs_escalation: boolean;
}

// Interface for summary statistics
interface DecisionSummary {
  total: number;
  waiting_3d: number;
  waiting_7d: number;
  waiting_14d: number;
  needs_reminder: number;
  needs_escalation: number;
}

const createPendingDecisionSchema = z.object({
  odl_id: z.string().uuid(),
  quote_id: z.string().uuid().optional(),
  customer_id: z.string().uuid(),
  quote_amount: z.number().positive(),
  quote_description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user's org_id
    const { data: profileData } = await supabase
      .from("profiles")
      .select("org_id, id")
      .eq("id", user.id)
      .single<ProfileData>();
    
    const profile: ProfileData | null = profileData;

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }
    
    const profileDataTyped = profile as ProfileData;

    // 3. Validate input
    const body = await request.json();
    const validation = createPendingDecisionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 4. Verify work order exists
    const { data: workOrder } = await supabase
      .from("work_orders")
      .select("id, status, wo_number")
      .eq("id", data.odl_id)
      .eq("org_id", profileDataTyped.org_id)
      .single<WorkOrderData>();

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }

    // 5. Verify customer exists
    const { data: customer } = await supabase
      .from("customers")
      .select("id, first_name, last_name, email, phone")
      .eq("id", data.customer_id)
      .eq("org_id", profileDataTyped.org_id)
      .single<CustomerData>();

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // 6. Check if there's already a pending decision for this ODL
    const { data: existingDecision } = await supabase
      .from("pending_decisions")
      .select("id, status")
      .eq("odl_id", data.odl_id)
      .eq("status", "waiting")
      .maybeSingle<ExistingPendingDecision>();

    if (existingDecision) {
      return NextResponse.json(
        { error: "There's already a pending decision for this work order" },
        { status: 409 }
      );
    }

    // 7. Create pending decision
    const { data: decision, error: createError } = await supabase
      .from("pending_decisions")
      .insert({
        odl_id: data.odl_id,
        quote_id: data.quote_id,
        customer_id: data.customer_id,
        quote_amount: data.quote_amount,
        quote_description: data.quote_description,
        status: "waiting",
        sent_at: new Date().toISOString(),
        org_id: profileDataTyped.org_id,
        created_by: user.id,
      })
      .select(`
        *,
        odl:work_orders(wo_number, description),
        customer:customers(first_name, last_name, email, phone)
      `)
      .single();

    if (createError) {
      console.error("Pending decision creation error:", createError);
      return NextResponse.json(
        { error: "Failed to create pending decision" },
        { status: 500 }
      );
    }

    // 8. Update work order status
    await supabase
      .from("work_orders")
      .update({ status: "waiting_approval" })
      .eq("id", data.odl_id);

    return NextResponse.json({
      success: true,
      message: "Pending decision created successfully",
      decision,
    }, { status: 201 });

  } catch (error) {
    console.error("Create pending decision API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pending-decisions/create
 * List pending decisions with reminder info
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user's org_id
    const { data: profileData } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single<Pick<ProfileData, 'org_id'>>();
    
    const profile = profileData;

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "waiting";
    const overdue = searchParams.get("overdue") === "true";

    const typedProfile = profile as { org_id: string };
    
    // 4. Build query
    let query = supabase
      .from("pending_decisions")
      .select(`
        *,
        odl:work_orders(wo_number, description),
        customer:customers(first_name, last_name, email, phone)
      `)
      .eq("org_id", typedProfile.org_id);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: decisions, error } = await query.order("sent_at", { ascending: false });

    if (error) {
      console.error("Pending decisions query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch pending decisions" },
        { status: 500 }
      );
    }

    // Calculate reminder info for each decision
    const now = new Date();
    const decisionsWithReminders: DecisionWithReminders[] = (decisions as PendingDecisionWithJoins[] || []).map((d) => {
      const sentAt = new Date(d.sent_at);
      const daysWaiting = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24));
      
      const reminders: ReminderItem[] = [
        { type: '3d', sent: !!d.reminder_3d_sent_at, due: daysWaiting >= 3 },
        { type: '7d', sent: !!d.reminder_7d_sent_at, due: daysWaiting >= 7 },
        { type: '14d', sent: !!d.reminder_14d_sent_at, due: daysWaiting >= 14 },
      ];

      const nextReminderDue = reminders.find((r) => r.due && !r.sent);
      const needsEscalation = daysWaiting >= 14 && d.status === 'waiting';

      return {
        ...d,
        days_waiting: daysWaiting,
        reminders,
        next_reminder_due: nextReminderDue?.type,
        needs_escalation: needsEscalation,
      };
    });

    // Filter overdue if requested
    const filteredDecisions = overdue
      ? decisionsWithReminders.filter((d) => d.days_waiting >= 3)
      : decisionsWithReminders;

    // Summary
    const summary: DecisionSummary = {
      total: decisions?.length || 0,
      waiting_3d: decisionsWithReminders.filter((d) => d.days_waiting >= 3 && d.days_waiting < 7).length,
      waiting_7d: decisionsWithReminders.filter((d) => d.days_waiting >= 7 && d.days_waiting < 14).length,
      waiting_14d: decisionsWithReminders.filter((d) => d.days_waiting >= 14).length,
      needs_reminder: decisionsWithReminders.filter((d) => !!d.next_reminder_due).length,
      needs_escalation: decisionsWithReminders.filter((d) => d.needs_escalation).length,
    };

    return NextResponse.json({
      decisions: filteredDecisions,
      summary,
    });

  } catch (error) {
    console.error("Get pending decisions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

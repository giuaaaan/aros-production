/**
 * POST /api/pending-decisions/update
 * Update a pending decision (customer response, escalation, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updatePendingDecisionSchema = z.object({
  decision_id: z.string().uuid(),
  status: z.enum(["waiting", "approved", "rejected", "expired", "escalated"] as const),
  customer_response: z.string().optional(),
});

const escalateDecisionSchema = z.object({
  decision_id: z.string().uuid(),
  escalate_to: z.string().uuid(),
  reason: z.string().min(1),
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // 3. Parse body to determine operation type
    const body = await request.json();

    // Check if this is an escalation request
    if (body.escalate_to) {
      return handleEscalation(supabase, body, profile);
    }

    // Otherwise handle regular update
    return handleUpdate(supabase, body, profile);

  } catch (error) {
    console.error("Update pending decision API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleUpdate(
  supabase: any,
  body: any,
  profile: { org_id: string; id: string }
) {
  // Validate input
  const validation = updatePendingDecisionSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.error.errors },
      { status: 400 }
    );
  }

  const { decision_id, status, customer_response } = validation.data;

  // 4. Verify decision exists
  const { data: decision, error: decisionError } = await supabase
    .from("pending_decisions")
    .select("*, odl:work_orders(id, status)")
    .eq("id", decision_id)
    .eq("org_id", profile.org_id)
    .single();

  if (decisionError || !decision) {
    return NextResponse.json({ error: "Decision not found" }, { status: 404 });
  }

  if (decision.status !== "waiting") {
    return NextResponse.json(
      { error: `Decision is already ${decision.status}` },
      { status: 409 }
    );
  }

  // 5. Update decision
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (customer_response) {
    updates.customer_response = customer_response;
  }

  if (status === "approved" || status === "rejected") {
    updates.responded_at = new Date().toISOString();
  }

  const { data: updatedDecision, error: updateError } = await supabase
    .from("pending_decisions")
    .update(updates)
    .eq("id", decision_id)
    .select(`
      *,
      odl:work_orders(wo_number, description),
      customer:customers(first_name, last_name, email, phone)
    `)
    .single();

  if (updateError) {
    console.error("Decision update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update decision" },
      { status: 500 }
    );
  }

  // 6. Update work order status based on decision
  if (status === "approved") {
    await supabase
      .from("work_orders")
      .update({ status: "approved" })
      .eq("id", decision.odl_id);
  } else if (status === "rejected") {
    await supabase
      .from("work_orders")
      .update({ status: "cancelled" })
      .eq("id", decision.odl_id);
  }

  return NextResponse.json({
    success: true,
    message: `Decision updated to ${status}`,
    decision: updatedDecision,
  });
}

async function handleEscalation(
  supabase: any,
  body: any,
  profile: { org_id: string; id: string }
) {
  // Validate input
  const validation = escalateDecisionSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.error.errors },
      { status: 400 }
    );
  }

  const { decision_id, escalate_to, reason } = validation.data;

  // 4. Verify decision exists
  const { data: decision, error: decisionError } = await supabase
    .from("pending_decisions")
    .select("*")
    .eq("id", decision_id)
    .eq("org_id", profile.org_id)
    .single();

  if (decisionError || !decision) {
    return NextResponse.json({ error: "Decision not found" }, { status: 404 });
  }

  // 5. Verify escalate_to user exists
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("id", escalate_to)
    .eq("org_id", profile.org_id)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: "Escalation target not found" }, { status: 404 });
  }

  // 6. Update decision with escalation
  const { data: updatedDecision, error: updateError } = await supabase
    .from("pending_decisions")
    .update({
      status: "escalated",
      escalated_at: new Date().toISOString(),
      escalated_to: escalate_to,
      escalation_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", decision_id)
    .select(`
      *,
      odl:work_orders(wo_number, description),
      customer:customers(first_name, last_name, email, phone),
      escalated:profiles!escalated_to(first_name, last_name)
    `)
    .single();

  if (updateError) {
    console.error("Escalation error:", updateError);
    return NextResponse.json(
      { error: "Failed to escalate decision" },
      { status: 500 }
    );
  }

  // 7. Create escalation notification
  await supabase
    .from("notification_queue")
    .insert({
      type: "pending_decision_escalation",
      priority: 8,
      payload: {
        decision_id,
        odl_id: decision.odl_id,
        escalate_to,
        reason,
        days_waiting: Math.floor((new Date().getTime() - new Date(decision.sent_at).getTime()) / (1000 * 60 * 60 * 24)),
      },
      org_id: profile.org_id,
    });

  return NextResponse.json({
    success: true,
    message: "Decision escalated successfully",
    decision: updatedDecision,
  });
}

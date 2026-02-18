/**
 * GET /api/pending-decisions/reminders
 * Get reminders that need to be sent
 * POST /api/pending-decisions/reminders
 * Mark a reminder as sent
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const markReminderSentSchema = z.object({
  decision_id: z.string().uuid(),
  reminder_type: z.enum(["3d", "7d", "14d"] as const),
});

/**
 * GET - Get reminders that need to be sent
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // 3. Get pending decisions needing reminders
    const { data: decisions, error } = await supabase
      .from("pending_decisions")
      .select(`
        id,
        odl_id,
        customer_id,
        sent_at,
        quote_amount,
        reminder_3d_sent_at,
        reminder_7d_sent_at,
        reminder_14d_sent_at,
        odl:work_orders(wo_number, description),
        customer:customers(first_name, last_name, email, phone)
      `)
      .eq("org_id", profile.org_id)
      .eq("status", "waiting");

    if (error) {
      console.error("Reminders query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch reminders" },
        { status: 500 }
      );
    }

    // Calculate which reminders need to be sent
    const now = new Date();
    const remindersDue = [];

    for (const decision of decisions || []) {
      const sentAt = new Date(decision.sent_at);
      const daysWaiting = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24));

      if (daysWaiting >= 14 && !decision.reminder_14d_sent_at) {
        remindersDue.push({
          decision_id: decision.id,
          odl_id: decision.odl_id,
          customer: decision.customer,
          wo_number: decision.odl?.[0]?.wo_number,
          days_waiting: daysWaiting,
          reminder_type: '14d',
          urgency: 'high',
          quote_amount: decision.quote_amount,
        });
      } else if (daysWaiting >= 7 && !decision.reminder_7d_sent_at) {
        remindersDue.push({
          decision_id: decision.id,
          odl_id: decision.odl_id,
          customer: decision.customer,
          wo_number: decision.odl?.[0]?.wo_number,
          days_waiting: daysWaiting,
          reminder_type: '7d',
          urgency: 'medium',
          quote_amount: decision.quote_amount,
        });
      } else if (daysWaiting >= 3 && !decision.reminder_3d_sent_at) {
        remindersDue.push({
          decision_id: decision.id,
          odl_id: decision.odl_id,
          customer: decision.customer,
          wo_number: decision.odl?.[0]?.wo_number,
          days_waiting: daysWaiting,
          reminder_type: '3d',
          urgency: 'low',
          quote_amount: decision.quote_amount,
        });
      }
    }

    // Sort by urgency
    remindersDue.sort((a, b) => {
      const urgencyOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

    return NextResponse.json({
      reminders_due: remindersDue,
      total: remindersDue.length,
      by_urgency: {
        high: remindersDue.filter((r) => r.urgency === 'high').length,
        medium: remindersDue.filter((r) => r.urgency === 'medium').length,
        low: remindersDue.filter((r) => r.urgency === 'low').length,
      },
    });

  } catch (error) {
    console.error("Get reminders API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Mark a reminder as sent
 */
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
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // 3. Validate input
    const body = await request.json();
    const validation = markReminderSentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { decision_id, reminder_type } = validation.data;
    const now = new Date().toISOString();

    // 4. Determine which field to update
    const updateField = reminder_type === '3d' ? 'reminder_3d_sent_at' :
                       reminder_type === '7d' ? 'reminder_7d_sent_at' :
                       'reminder_14d_sent_at';

    // 5. Update decision
    const { data: decision, error } = await supabase
      .from("pending_decisions")
      .update({
        [updateField]: now,
        updated_at: now,
      })
      .eq("id", decision_id)
      .eq("org_id", profile.org_id)
      .select(`
        *,
        odl:work_orders(wo_number),
        customer:customers(first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error("Mark reminder error:", error);
      return NextResponse.json(
        { error: "Failed to mark reminder as sent" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Reminder ${reminder_type} marked as sent`,
      decision,
    });

  } catch (error) {
    console.error("Mark reminder API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

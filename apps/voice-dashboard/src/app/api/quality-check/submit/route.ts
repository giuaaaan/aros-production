/**
 * POST /api/quality-check/submit
 * Submit a quality check for an ODL
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { QualityChecklistItem, QualityCheck } from "@/types/advanced-features";

// Interface for the profile data returned from Supabase
interface ProfileData {
  org_id: string;
  id: string;
  first_name: string;
  last_name: string;
}

// Interface for the work order data
interface WorkOrderData {
  id: string;
  status: string;
}

// Interface for existing quality check lookup
interface ExistingQualityCheck {
  id: string;
}

const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.string(),
  critical: z.boolean(),
  checked: z.boolean(),
  notes: z.string().optional(),
});

const submitQualityCheckSchema = z.object({
  odl_id: z.string().uuid(),
  checklist_items: z.array(checklistItemSchema).min(1),
  test_drive_performed: z.boolean().default(false),
  test_drive_notes: z.string().optional(),
  test_drive_issues: z.boolean().default(false),
  photos_before: z.array(z.string().url()).optional(),
  photos_after: z.array(z.string().url()).optional(),
  passed: z.boolean(),
  overall_score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
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
      .single();
    
    const profile = profileData as ProfileData | null;

    if (!profile || !(profile as ProfileData).org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // 3. Validate input
    const body = await request.json();
    const validation = submitQualityCheckSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 4. Verify work order exists and belongs to org
    const { data: workOrder } = await supabase
      .from("work_orders")
      .select("id, status")
      .eq("id", data.odl_id)
      .eq("org_id", (profile as ProfileData).org_id)
      .single<WorkOrderData>();

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }

    // 5. Check if quality check already exists for this ODL by this tester
    const { data: existingCheck } = await supabase
      .from("quality_checks")
      .select("id")
      .eq("odl_id", data.odl_id)
      .eq("tester_id", (profile as ProfileData).id)
      .maybeSingle<ExistingQualityCheck>();

    let result: QualityCheck;
    
    if (existingCheck) {
      // Update existing check
      const { data: updated, error: updateError } = await supabase
        .from("quality_checks")
        .update({
          checklist_items: data.checklist_items,
          test_drive_performed: data.test_drive_performed,
          test_drive_notes: data.test_drive_notes,
          test_drive_issues: data.test_drive_issues,
          photos_before: data.photos_before || [],
          photos_after: data.photos_after || [],
          passed: data.passed,
          overall_score: data.overall_score,
          notes: data.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingCheck.id)
        .select(`
          *,
          odl:work_orders(wo_number),
          tester:profiles(first_name, last_name)
        `)
        .single();

      if (updateError) {
        console.error("Quality check update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update quality check" },
          { status: 500 }
        );
      }

      result = updated;
    } else {
      // Create new check
      const { data: created, error: createError } = await supabase
        .from("quality_checks")
        .insert({
          odl_id: data.odl_id,
          tester_id: profile.id,
          checklist_items: data.checklist_items,
          test_drive_performed: data.test_drive_performed,
          test_drive_notes: data.test_drive_notes,
          test_drive_issues: data.test_drive_issues,
          photos_before: data.photos_before || [],
          photos_after: data.photos_after || [],
          passed: data.passed,
          overall_score: data.overall_score,
          notes: data.notes,
          org_id: profile.org_id,
        })
        .select(`
          *,
          odl:work_orders(wo_number),
          tester:profiles(first_name, last_name)
        `)
        .single();

      if (createError) {
        console.error("Quality check creation error:", createError);
        return NextResponse.json(
          { error: "Failed to create quality check" },
          { status: 500 }
        );
      }

      result = created;
    }

    // 6. If check failed critical items, create notification
    const criticalItems = data.checklist_items.filter((item) => item.critical && !item.checked);
    if (criticalItems.length > 0 && !data.passed) {
      await supabase
        .from("notification_queue")
        .insert({
          type: "quality_check_failed",
          priority: 7,
          payload: {
            quality_check_id: result.id,
            odl_id: data.odl_id,
            critical_items_failed: criticalItems.map((i) => i.label),
            tester: `${profile.first_name} ${profile.last_name}`,
          },
          org_id: profile.org_id,
        });
    }

    // 7. Update work order status if quality check passed
    if (data.passed && workOrder.status !== "completed") {
      await supabase
        .from("work_orders")
        .update({ 
          status: "ready_for_delivery",
          quality_check_passed: true,
        })
        .eq("id", data.odl_id);
    }

    return NextResponse.json({
      success: true,
      message: existingCheck ? "Quality check updated" : "Quality check submitted",
      quality_check: result,
      summary: {
        total_items: data.checklist_items.length,
        checked_items: data.checklist_items.filter((i) => i.checked).length,
        critical_items_failed: criticalItems.length,
        passed: data.passed,
      },
    });

  } catch (error) {
    console.error("Submit quality check API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/quality-check/submit
 * Get quality check for an ODL
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

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const odlId = searchParams.get("odl_id");

    if (!odlId) {
      return NextResponse.json({ error: "odl_id is required" }, { status: 400 });
    }

    // 4. Get quality check
    const { data: qualityCheck, error } = await supabase
      .from("quality_checks")
      .select(`
        *,
        odl:work_orders(wo_number, description),
        tester:profiles(first_name, last_name)
      `)
      .eq("odl_id", odlId)
      .eq("org_id", profile.org_id)
      .maybeSingle();

    if (error) {
      console.error("Quality check query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch quality check" },
        { status: 500 }
      );
    }

    if (!qualityCheck) {
      return NextResponse.json({ error: "Quality check not found" }, { status: 404 });
    }

    return NextResponse.json({
      quality_check: qualityCheck,
    });

  } catch (error) {
    console.error("Get quality check API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

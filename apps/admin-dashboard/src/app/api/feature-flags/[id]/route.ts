import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// PATCH /api/feature-flags/[id] - Update feature flag
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { enabled, name, description } = body;

    const supabase = createAdminClient();

    const updates: { enabled?: boolean; name?: string; description?: string } = {};
    if (enabled !== undefined) updates.enabled = enabled;
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    const { data, error } = await supabase
      .from("feature_flags")
      // @ts-ignore - Supabase types need database types
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating feature flag:", error);
      return NextResponse.json(
        { error: "Failed to update feature flag" },
        { status: 500 }
      );
    }

    return NextResponse.json({ flag: data });
  } catch (error) {
    console.error("Error in feature flags API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/feature-flags/[id] - Delete feature flag
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("feature_flags")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting feature flag:", error);
      return NextResponse.json(
        { error: "Failed to delete feature flag" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in feature flags API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

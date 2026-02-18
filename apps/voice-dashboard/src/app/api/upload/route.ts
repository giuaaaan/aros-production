import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    // Upload to Supabase Storage (easier than S3 for now)
    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(`${Date.now()}-${file.name}`, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("uploads")
      .getPublicUrl(data.path);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

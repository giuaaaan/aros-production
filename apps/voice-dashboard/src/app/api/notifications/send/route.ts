import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

// Configure web-push
webpush.setVapidDetails(
  "mailto:support@aiaros.it",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { title, body, userId, data } = await request.json();
    
    // Get user's push subscription
    const { data: subscription } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId)
      .single();
    
    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }
    
    // Send push notification
    const payload = JSON.stringify({
      title,
      body,
      data,
      tag: "aros-notification",
      actions: [
        { action: "view", title: "Vedi" },
        { action: "dismiss", title: "Chiudi" },
      ],
    });
    
    await webpush.sendNotification(
      subscription.subscription,
      payload
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}

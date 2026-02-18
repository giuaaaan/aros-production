import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

function initWebPush() {
  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error("VAPID keys not configured");
  }
  webpush.setVapidDetails(
    "mailto:admin@aiaros.it",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export async function POST(request: Request) {
  try {
    initWebPush();
    const { title, body, userId, data } = await request.json();
    const supabase = await createClient();
    
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId);
    
    if (!subscriptions?.length) {
      return NextResponse.json({ error: "No subscriptions" }, { status: 404 });
    }
    
    const payload = JSON.stringify({
      title,
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      tag: data?.tag || "notification",
      requireInteraction: true,
      data,
    });
    
    const results = await Promise.allSettled(
      subscriptions.map((sub: any) =>
        webpush.sendNotification(sub.subscription, payload)
      )
    );
    
    const successful = results.filter((r: any) => r.status === "fulfilled").length;
    
    return NextResponse.json({ success: true, sent: successful });
  } catch (error) {
    console.error("Push error:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });
}

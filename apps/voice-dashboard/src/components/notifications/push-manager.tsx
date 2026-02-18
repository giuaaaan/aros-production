"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [vapidKey, setVapidKey] = useState("");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      checkSubscription();
      fetch("/api/web-push").then(r => r.json()).then(d => setVapidKey(d.publicKey));
    }
  }, []);

  const checkSubscription = async () => {
    const reg = await navigator.serviceWorker?.ready;
    const sub = await reg?.pushManager.getSubscription();
    setIsSubscribed(!!sub);
  };

  const subscribe = async () => {
    const perm = await Notification.requestPermission();
    setPermission(perm);
    
    if (perm === "granted" && vapidKey) {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: Buffer.from(vapidKey, "base64"),
      });

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from("push_subscriptions").upsert({
          user_id: user.id,
          subscription: sub.toJSON(),
        });
        setIsSubscribed(true);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifiche Push</CardTitle>
      </CardHeader>
      <CardContent>
        {isSubscribed ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span>Notifiche attive!</span>
          </div>
        ) : (
          <Button onClick={subscribe} className="w-full">
            <Bell className="w-4 h-4 mr-2" />
            Attiva Notifiche
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeOptions {
  channel: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  table: string;
  schema?: string;
  filter?: string;
  onData: (payload: any) => void;
}

export function useRealtime({
  channel: channelName,
  event = "*",
  table,
  schema = "public",
  filter,
  onData,
}: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    let channel: RealtimeChannel;

    try {
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event,
            schema,
            table,
            filter,
          },
          (payload) => {
            onData(payload);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setIsConnected(true);
            setError(null);
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            setIsConnected(false);
            setError("Connection lost");
          }
        });
    } catch (err) {
      setError("Failed to connect");
      setIsConnected(false);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [channelName, event, table, schema, filter, onData]);

  return { isConnected, error };
}

// Hook specifico per activity feed real-time
export function useRealtimeActivity(onNewActivity: (activity: any) => void) {
  const [activities, setActivities] = useState<any[]>([]);
  
  const handleNewConversation = useCallback((payload: any) => {
    const newActivity = {
      id: `conv-${payload.new.id}`,
      type: payload.new.channel === "voice" ? "call" : "whatsapp",
      organization: "Loading...", // Would need to fetch org name
      description: payload.new.channel === "voice" 
        ? "AI voice call started" 
        : "WhatsApp message received",
      timestamp: payload.new.created_at,
    };
    
    onNewActivity(newActivity);
    setActivities((prev) => [newActivity, ...prev].slice(0, 10));
  }, [onNewActivity]);

  const { isConnected, error } = useRealtime({
    channel: "admin-activity",
    table: "conversations",
    event: "INSERT",
    onData: handleNewConversation,
  });

  return { activities, isConnected, error };
}

// Hook per monitoring multipli canali
export function useRealtimeStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel("connection-check")
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return isConnected;
}

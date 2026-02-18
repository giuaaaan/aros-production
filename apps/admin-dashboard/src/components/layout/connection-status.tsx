"use client";

import { useRealtimeStatus } from "@/hooks/use-realtime";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ConnectionStatus() {
  const isConnected = useRealtimeStatus();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 cursor-pointer">
            <div
              className={cn(
                "h-2 w-2 rounded-full transition-colors duration-300",
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              )}
            />
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-500" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                isConnected ? "text-green-500" : "text-red-500"
              )}
            >
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isConnected
              ? "Real-time connection active"
              : "Real-time connection lost. Data may be stale."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

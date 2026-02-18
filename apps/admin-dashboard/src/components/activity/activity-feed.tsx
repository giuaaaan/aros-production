"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityItem } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { Phone, MessageCircle, UserPlus, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  activities: ActivityItem[];
  highlightNew?: boolean;
}

const activityIcons = {
  call: Phone,
  whatsapp: MessageCircle,
  signup: UserPlus,
  appointment: Calendar,
  error: AlertCircle,
};

const activityColors = {
  call: "bg-blue-500/10 text-blue-500",
  whatsapp: "bg-green-500/10 text-green-500",
  signup: "bg-purple-500/10 text-purple-500",
  appointment: "bg-orange-500/10 text-orange-500",
  error: "bg-red-500/10 text-red-500",
};

export function ActivityFeed({ activities, highlightNew = false }: ActivityFeedProps) {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        {highlightNew && (
          <span className="text-xs text-green-500 animate-pulse">
            ● Live updates
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity
            </p>
          ) : (
            activities.map((activity, index) => {
              const Icon = activityIcons[activity.type];
              const isNew = highlightNew && index < 3;
              
              return (
                <div 
                  key={activity.id} 
                  className={cn(
                    "flex items-start gap-3 p-2 rounded-lg transition-all",
                    isNew && "bg-green-500/5 animate-in slide-in-from-top-2"
                  )}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activityColors[activity.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.organization}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                  {isNew && (
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

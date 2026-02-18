"use client";

import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Phone, MessageCircle, Bot, User, CheckCircle2, PhoneForwarded, Clock, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Recent Conversations Component - Enhanced Version
 * 
 * Features:
 * - Channel indicators with icons
 * - Status badges for conversation state
 * - Time ago display
 * - Customer info with fallback to phone number
 * - Mobile-optimized cards
 */

interface Conversation {
  id: string;
  channel: 'voice' | 'whatsapp' | 'web' | 'sms';
  status: 'completed' | 'transferred' | 'in_progress' | 'failed' | 'pending';
  phone_number: string;
  started_at: string;
  summary: string | null;
  customers: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  duration?: number; // in seconds
}

interface RecentConversationsProps {
  conversations: Conversation[];
  className?: string;
  maxDisplay?: number;
  showViewAll?: boolean;
}

const channelConfig = {
  voice: {
    icon: Phone,
    label: 'Chiamata',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  whatsapp: {
    icon: MessageCircle,
    label: 'WhatsApp',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
  },
  web: {
    icon: Bot,
    label: 'Web',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400',
  },
  sms: {
    icon: MessageCircle,
    label: 'SMS',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
};

const statusConfig = {
  completed: {
    variant: 'success' as const,
    label: 'Completata',
    icon: CheckCircle2,
  },
  transferred: {
    variant: 'warning' as const,
    label: 'Trasferita',
    icon: PhoneForwarded,
  },
  in_progress: {
    variant: 'info' as const,
    label: 'In corso',
    icon: Clock,
  },
  failed: {
    variant: 'critical' as const,
    label: 'Fallita',
    icon: Phone,
  },
  pending: {
    variant: 'neutral' as const,
    label: 'In attesa',
    icon: Clock,
  },
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export function RecentConversations({
  conversations,
  className,
  maxDisplay = 5,
  showViewAll = true,
}: RecentConversationsProps) {
  const displayConversations = conversations.slice(0, maxDisplay);

  if (conversations.length === 0) {
    return (
      <div className={cn(
        "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center",
        className
      )}>
        <Bot className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <h3 className="font-medium text-slate-900 dark:text-slate-100">Nessuna conversazione</h3>
        <p className="text-sm text-slate-500 mt-1">
          Le conversazioni AI appariranno qui
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-500" />
            Conversazioni Recenti
          </h3>
          <span className="text-sm text-slate-500">
            {conversations.length} totali
          </span>
        </div>
      </div>

      {/* Conversations List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {displayConversations.map((conv) => {
          const channel = channelConfig[conv.channel];
          const status = statusConfig[conv.status];
          const ChannelIcon = channel.icon;
          const StatusIcon = status.icon;

          return (
            <div
              key={conv.id}
              className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Channel Icon */}
                <div className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                  channel.bgColor
                )}>
                  <ChannelIcon className={cn("h-5 w-5", channel.textColor)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {/* Customer / Phone */}
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {conv.customers ? (
                          `${conv.customers.first_name} ${conv.customers.last_name}`
                        ) : (
                          <span className="font-mono text-sm">{conv.phone_number}</span>
                        )}
                      </p>

                      {/* Summary or Default Text */}
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {conv.summary || `Conversazione ${channel.label}`}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {/* Channel Badge */}
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          channel.bgColor,
                          channel.textColor
                        )}>
                          <ChannelIcon className="h-3 w-3" />
                          {channel.label}
                        </span>

                        {/* Status Badge */}
                        <StatusBadge
                          status={status.variant}
                          label={status.label}
                          size="sm"
                          icon={StatusIcon}
                          showDot={false}
                        />

                        {/* Duration */}
                        {conv.duration && (
                          <span className="text-xs text-slate-400">
                            {formatDuration(conv.duration)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Time Ago */}
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(conv.started_at), {
                        addSuffix: true,
                        locale: it,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {showViewAll && conversations.length > maxDisplay && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center">
          <Button variant="ghost" size="sm">
            Vedi tutte ({conversations.length})
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Mini Conversations List - Compact version for sidebars
 */
interface MiniConversationsProps {
  conversations: Conversation[];
  className?: string;
}

export function MiniConversations({ conversations, className }: MiniConversationsProps) {
  const recent = conversations.slice(0, 3);

  return (
    <div className={cn("space-y-2", className)}>
      {recent.map((conv) => {
        const channel = channelConfig[conv.channel];
        const ChannelIcon = channel.icon;

        return (
          <div
            key={conv.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              channel.bgColor
            )}>
              <ChannelIcon className={cn("h-3.5 w-3.5", channel.textColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {conv.customers 
                  ? `${conv.customers.first_name} ${conv.customers.last_name}`
                  : conv.phone_number
                }
              </p>
              <p className="text-xs text-slate-500 truncate">
                {formatDistanceToNow(new Date(conv.started_at), {
                  addSuffix: true,
                  locale: it,
                })}
              </p>
            </div>
            <div className={cn(
              "w-2 h-2 rounded-full",
              conv.status === 'completed' && "bg-emerald-500",
              conv.status === 'in_progress' && "bg-blue-500 animate-pulse",
              conv.status === 'transferred' && "bg-amber-500",
            )} />
          </div>
        );
      })}
      {recent.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">
          Nessuna conversazione recente
        </p>
      )}
    </div>
  );
}

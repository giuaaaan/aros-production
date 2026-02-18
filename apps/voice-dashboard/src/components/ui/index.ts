/**
 * AROS UI Components - Barrel Export
 * 
 * Usage:
 * import { Button, Card, StatusBadge } from '@/components/ui';
 */

// Core Components
export { Button, ButtonGroup, IconButton, buttonVariants } from './button';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
export { Input } from './input';
export { Badge, badgeVariants } from './badge';

// Design System Components
export { 
  StatusBadge, 
  WorkOrderStatusBadge, 
  AlertBanner,
  type StatusBadgeProps,
  type WorkOrderStatusBadgeProps,
  type AlertBannerProps,
} from './status-badge';

export { 
  Navigation, 
  Breadcrumbs, 
  CommandPalette,
  mainNavItems,
  type NavigationProps,
} from './navigation';

export { 
  QuickActionsWidget, 
  TechnicianFab,
  quickActions,
  type QuickActionsWidgetProps,
  type TechnicianFabProps,
  type QuickAction,
} from './quick-actions';

export { 
  Timeline, 
  ActivityFeed, 
  WorkOrderProgress,
  type TimelineItem,
  type TimelineProps,
  type Activity,
  type ActivityFeedProps,
  type WorkOrderStage,
  type WorkOrderProgressProps,
} from './timeline';

export { 
  KpiCard, 
  KpiGrid, 
  KpiGroup, 
  MiniStat,
  type KpiCardProps,
  type KpiGridProps,
  type KpiGroupProps,
  type MiniStatProps,
  type Trend,
  type KpiSize,
  type KpiVariant,
} from './kpi-card';

export { VoiceInput } from './voice-input';

// Re-export types
export type { ButtonProps } from './button';
export type { InputProps } from './input';
export type { BadgeProps } from './badge';

/**
 * AROS Advanced Features Types
 * Production-ready TypeScript types for:
 * - Vehicle Key Management
 * - Technical Stops
 * - Pending Decisions
 * - Quality Checks
 * - Consumables Tracking
 * - Time Tracking
 */

// ============================================================
// 1. VEHICLE KEY MANAGEMENT
// ============================================================

export type VehicleKeyStatus = 'in_safe' | 'issued' | 'returned' | 'lost' | 'damaged';

export interface VehicleKey {
  id: string;
  vehicle_id: string;
  key_code: string;
  key_slot?: number;
  status: VehicleKeyStatus;
  assigned_to?: string;
  assigned_at?: string;
  odl_id?: string;
  returned_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  org_id?: string;
  // Joined fields
  vehicle?: {
    make: string;
    model: string;
    license_plate: string;
  };
  assigned?: {
    first_name: string;
    last_name: string;
  };
  odl?: {
    wo_number: string;
  };
}

export interface VehicleKeyLog {
  id: string;
  key_id: string;
  action: 'issued' | 'returned' | 'transferred' | 'lost' | 'found' | 'damaged';
  performed_by: string;
  performed_at: string;
  from_technician?: string;
  to_technician?: string;
  odl_id?: string;
  notes?: string;
  location?: string;
  // Joined fields
  performer?: {
    first_name: string;
    last_name: string;
  };
}

export interface IssueKeyRequest {
  key_id: string;
  technician_id: string;
  odl_id?: string;
  notes?: string;
}

export interface ReturnKeyRequest {
  key_id: string;
  notes?: string;
}

export interface KeyStatusResponse {
  key: VehicleKey;
  history: VehicleKeyLog[];
  isOverdue: boolean;
  overdueMinutes?: number;
}

// ============================================================
// 2. TECHNICAL STOPS (FERMO TECNICO)
// ============================================================

export type TechnicalStopSeverity = 'low' | 'medium' | 'high' | 'critical';
export type TechnicalStopCategory = 'engine' | 'brakes' | 'suspension' | 'transmission' | 'electrical' | 'safety' | 'other';

export interface TechnicalStop {
  id: string;
  vehicle_id: string;
  work_order_id?: string;
  reason: string;
  severity: TechnicalStopSeverity;
  category: TechnicalStopCategory;
  description: string;
  reported_by: string;
  reported_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  vehicle_immobilized: boolean;
  priority_override: number;
  notified_at?: string;
  notification_sent_to?: string[];
  org_id?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  vehicle?: {
    make: string;
    model: string;
    license_plate: string;
  };
  reporter?: {
    first_name: string;
    last_name: string;
  };
  resolver?: {
    first_name: string;
    last_name: string;
  };
  work_order?: {
    wo_number: string;
  };
}

export interface CreateTechnicalStopRequest {
  vehicle_id: string;
  work_order_id?: string;
  reason: string;
  severity: TechnicalStopSeverity;
  category: TechnicalStopCategory;
  description: string;
  vehicle_immobilized?: boolean;
  priority_override?: number;
}

export interface ResolveTechnicalStopRequest {
  technical_stop_id: string;
  resolution_notes: string;
}

export interface TechnicalStopAlert {
  id: string;
  severity: TechnicalStopSeverity;
  vehicle_info: string;
  reason: string;
  reported_at: string;
  requiresImmediateAction: boolean;
}

// ============================================================
// 3. PENDING DECISIONS (IN ATTESA DI DECISIONE)
// ============================================================

export type PendingDecisionStatus = 'waiting' | 'approved' | 'rejected' | 'expired' | 'escalated';

export interface PendingDecision {
  id: string;
  odl_id: string;
  quote_id?: string;
  customer_id: string;
  sent_at: string;
  quote_amount: number;
  quote_description?: string;
  reminder_3d_sent_at?: string;
  reminder_7d_sent_at?: string;
  reminder_14d_sent_at?: string;
  escalated_at?: string;
  escalated_to?: string;
  escalation_reason?: string;
  status: PendingDecisionStatus;
  customer_response?: string;
  responded_at?: string;
  org_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  odl?: {
    wo_number: string;
    description: string;
  };
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  quote?: {
    quote_number: string;
  };
}

export interface CreatePendingDecisionRequest {
  odl_id: string;
  quote_id?: string;
  customer_id: string;
  quote_amount: number;
  quote_description?: string;
}

export interface UpdatePendingDecisionRequest {
  decision_id: string;
  status: PendingDecisionStatus;
  customer_response?: string;
}

export interface ReminderInfo {
  type: '3d' | '7d' | '14d';
  sent_at?: string;
  should_send: boolean;
}

export interface PendingDecisionWithReminders extends PendingDecision {
  days_waiting: number;
  reminders: ReminderInfo[];
  next_reminder_due?: string;
}

// ============================================================
// 4. QUALITY CHECKS (WORKFLOW QUALITÀ)
// ============================================================

export interface QualityChecklistItem {
  id: string;
  label: string;
  category: string;
  critical: boolean;
  checked: boolean;
  notes?: string;
}

export interface QualityCheck {
  id: string;
  odl_id: string;
  tester_id: string;
  checklist_items: QualityChecklistItem[];
  test_drive_performed: boolean;
  test_drive_notes?: string;
  test_drive_issues: boolean;
  photos_before: string[];
  photos_after: string[];
  passed: boolean;
  overall_score?: number;
  notes?: string;
  customer_approved: boolean;
  customer_signature_url?: string;
  customer_approved_at?: string;
  org_id?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  tester?: {
    first_name: string;
    last_name: string;
  };
  odl?: {
    wo_number: string;
  };
}

export interface QualityCheckTemplate {
  id: string;
  name: string;
  description?: string;
  items: QualityChecklistTemplateItem[];
  is_default: boolean;
  org_id?: string;
  created_at: string;
  updated_at: string;
}

export interface QualityChecklistTemplateItem {
  id: string;
  label: string;
  category: string;
  critical: boolean;
}

export interface SubmitQualityCheckRequest {
  odl_id: string;
  checklist_items: QualityChecklistItem[];
  test_drive_performed: boolean;
  test_drive_notes?: string;
  test_drive_issues: boolean;
  photos_before?: string[];
  photos_after?: string[];
  passed: boolean;
  overall_score?: number;
  notes?: string;
}

export interface CustomerApprovalRequest {
  quality_check_id: string;
  customer_signature_url: string;
}

export interface QualityCheckSummary {
  total_checks: number;
  passed: number;
  failed: number;
  pending_customer: number;
  average_score?: number;
}

// ============================================================
// 5. CONSUMABLES TRACKING (GESTIONE CONSUMABILI)
// ============================================================

export interface ConsumableItem {
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
}

export interface ConsumablesTracking {
  id: string;
  odl_id: string;
  items_used: ConsumableItem[];
  technician_id: string;
  timestamp: string;
  notes?: string;
  org_id?: string;
  created_at: string;
  // Joined fields
  technician?: {
    first_name: string;
    last_name: string;
  };
  odl?: {
    wo_number: string;
  };
}

export interface ConsumableKit {
  id: string;
  name: string;
  description?: string;
  service_type: string;
  items: ConsumableKitItem[];
  estimated_cost?: number;
  is_active: boolean;
  org_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsumableKitItem {
  sku: string;
  name: string;
  default_quantity: number;
  unit: string;
}

export interface ConsumablesInventory {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  current_quantity: number;
  min_threshold: number;
  max_threshold?: number;
  reorder_point: number;
  unit_cost?: number;
  supplier?: string;
  location?: string;
  barcode?: string;
  org_id?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  is_low_stock: boolean;
  days_until_empty?: number;
}

export interface AddConsumablesRequest {
  odl_id: string;
  items: ConsumableItem[];
  notes?: string;
}

export interface UseConsumablesFromKitRequest {
  odl_id: string;
  kit_id: string;
  custom_quantities?: Record<string, number>; // sku -> quantity override
  notes?: string;
}

export interface ConsumableAlert {
  item_id: string;
  sku: string;
  name: string;
  current_quantity: number;
  min_threshold: number;
  shortage: number;
}

// ============================================================
// 6. TIME TRACKING (TIME TRACKING AUTOMATICO)
// ============================================================

export type TimeTrackingWorkType = 'repair' | 'diagnostic' | 'maintenance' | 'warranty' | 'other';

export interface TimeTrackingPause {
  started: string;
  ended?: string;
  reason?: string;
}

export interface TimeTracking {
  id: string;
  odl_id: string;
  technician_id: string;
  started_at: string;
  paused_at?: string;
  resumed_at?: string;
  completed_at?: string;
  total_minutes: number;
  billable_minutes: number;
  pauses: TimeTrackingPause[];
  work_type: TimeTrackingWorkType;
  notes?: string;
  auto_started: boolean;
  org_id?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  technician?: {
    first_name: string;
    last_name: string;
  };
  odl?: {
    wo_number: string;
    description: string;
  };
  // Computed fields
  is_active: boolean;
  is_paused: boolean;
  current_session_minutes: number;
}

export interface StartTimeTrackingRequest {
  odl_id: string;
  work_type?: TimeTrackingWorkType;
  notes?: string;
  auto_started?: boolean;
}

export interface PauseTimeTrackingRequest {
  time_tracking_id: string;
  reason?: string;
}

export interface ResumeTimeTrackingRequest {
  time_tracking_id: string;
}

export interface CompleteTimeTrackingRequest {
  time_tracking_id: string;
  billable_minutes?: number;
  notes?: string;
}

export interface TechnicianTimeSummary {
  technician_id: string;
  technician_name: string;
  org_id: string;
  work_date: string;
  sessions_count: number;
  total_minutes: number;
  billable_minutes: number;
  odl_ids: string[];
  // Computed
  total_hours: number;
  billable_hours: number;
  utilization_rate: number;
}

export interface ActiveTimeTracking {
  id: string;
  odl_id: string;
  wo_number: string;
  started_at: string;
  current_minutes: number;
  is_paused: boolean;
  paused_at?: string;
}

// ============================================================
// 7. NOTIFICATION QUEUE
// ============================================================

export type NotificationType = 
  | 'key_overdue'
  | 'critical_technical_stop'
  | 'pending_decision_reminder'
  | 'pending_decision_escalation'
  | 'consumable_low_stock'
  | 'quality_check_failed';

export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'failed';

export interface NotificationQueueItem {
  id: string;
  type: NotificationType;
  priority: number;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  attempts: number;
  max_attempts: number;
  processed_at?: string;
  error_message?: string;
  org_id?: string;
  created_at: string;
}

// ============================================================
// 8. API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface DashboardSummary {
  // Chiavi
  keys_issued: number;
  keys_overdue: number;
  
  // Fermi tecnici
  active_technical_stops: number;
  critical_stops: number;
  
  // Decisioni in attesa
  pending_decisions: number;
  decisions_needing_reminder: number;
  
  // Qualità
  quality_checks_today: number;
  quality_checks_failed: number;
  
  // Consumabili
  low_stock_items: number;
  
  // Time tracking
  active_sessions: number;
  total_hours_today: number;
  
  // Total alerts
  total_alerts: number;
}

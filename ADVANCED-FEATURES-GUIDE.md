# AROS Advanced Features Implementation Guide

## Overview
This document describes the implementation of 6 critical advanced features for AROS (Automotive Repair Operating System):

1. **Gestione Chiavi Veicolo** (Vehicle Key Management)
2. **Fermo Tecnico** (Technical Stops)
3. **In Attesa di Decisione** (Pending Decisions)
4. **Workflow Qualità** (Quality Checks)
5. **Gestione Consumabili** (Consumables Tracking)
6. **Time Tracking Automatico** (Automatic Time Tracking)

---

## 1. Database Schema

### File: `supabase/migrations/005_advanced_features.sql`

The migration creates the following tables:

### 1.1 Vehicle Key Management Tables
```sql
- vehicle_keys: Main table for key storage and tracking
- vehicle_key_logs: History of all key movements
```

**Features:**
- QR code support (key_code field)
- Key slot tracking for electronic safe
- Status tracking: `in_safe`, `issued`, `returned`, `lost`, `damaged`
- Automatic logging via triggers
- Overdue detection (configurable, default 8 hours)

### 1.2 Technical Stops Tables
```sql
- technical_stops: Track vehicle immobilization issues
```

**Features:**
- Severity levels: `low`, `medium`, `high`, `critical`
- Categories: `engine`, `brakes`, `suspension`, `transmission`, `electrical`, `safety`, `other`
- Vehicle immobilization flag
- Priority override system
- Automatic notifications for critical stops

### 1.3 Pending Decisions Tables
```sql
- pending_decisions: Track customer quote approvals
```

**Features:**
- Automatic reminder tracking (3, 7, 14 days)
- Escalation support
- Status: `waiting`, `approved`, `rejected`, `expired`, `escalated`
- Customer response tracking

### 1.4 Quality Checks Tables
```sql
- quality_checks: Pre-delivery inspections
- quality_check_templates: Reusable checklist templates
```

**Features:**
- 15-20 point checklist (customizable via JSONB)
- Test drive tracking
- Photo before/after comparison
- Customer signature capture
- Pass/fail scoring
- Default template included

### 1.5 Consumables Tracking Tables
```sql
- consumables_tracking: Usage tracking
- consumable_kits: Predefined kits per service type
- consumables_inventory: Stock management
```

**Features:**
- Predefined kits per service type
- Automatic stock decrement via triggers
- Low stock threshold alerts
- Barcode support
- Supplier tracking

### 1.6 Time Tracking Tables
```sql
- time_tracking: Session tracking
```

**Features:**
- Automatic start when key is issued
- Multiple pause/resume support
- Work type categorization
- Billable vs non-billable time
- Auto-started flag

### 1.7 Supporting Tables
```sql
- notification_queue: For async notification processing
```

---

## 2. API Routes

### 2.1 Vehicle Keys API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/keys/issue` | POST | Issue a key to technician |
| `/api/keys/return` | POST | Return key to safe |
| `/api/keys/status` | GET | Get key status (supports filters) |

**Key Features:**
- Auto-starts time tracking when key issued with ODL
- Pauses time tracking when key returned
- Overdue detection

### 2.2 Technical Stops API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/technical-stop/create` | POST | Create technical stop |
| `/api/technical-stop/resolve` | POST/GET | Resolve/list stops |

**Key Features:**
- Automatic notifications for critical/immobilized vehicles
- Priority override calculation
- Resolution tracking

### 2.3 Time Tracking API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/time-tracking/start` | POST/GET | Start/get active sessions |
| `/api/time-tracking/pause` | POST/PUT | Pause/resume tracking |
| `/api/time-tracking/complete` | POST/GET | Complete/get completed |

**Key Features:**
- Conflict detection (multiple active sessions)
- Automatic pause time calculation
- Work type categorization
- Billable time tracking

### 2.4 Quality Checks API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/quality-check/submit` | POST/GET | Submit/get checks |
| `/api/quality-check/templates` | GET | Get templates |

**Key Features:**
- 15-20 point checklist support
- Photo upload support
- Customer signature
- Test drive tracking
- Automatic work order status update

### 2.5 Consumables API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/consumables/add` | POST/GET | Add/get consumables |
| `/api/consumables/inventory` | GET | Get inventory |
| `/api/consumables/kits` | GET | Get predefined kits |

**Key Features:**
- Kit-based quick selection
- Automatic stock decrement
- Low stock notifications
- Inventory search and filtering

### 2.6 Pending Decisions API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pending-decisions/create` | POST/GET | Create/list decisions |
| `/api/pending-decisions/update` | POST | Update/escalate |
| `/api/pending-decisions/reminders` | GET/POST | Get/mark reminders |

**Key Features:**
- Automatic reminder scheduling (3, 7, 14 days)
- Escalation workflow
- Customer response tracking

### 2.7 Dashboard API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/summary` | GET | Get all metrics |

---

## 3. TypeScript Types

### File: `apps/voice-dashboard/src/types/advanced-features.ts`

Contains 568 lines of comprehensive type definitions including:

- **VehicleKey**, **VehicleKeyLog**
- **TechnicalStop**
- **PendingDecision**
- **QualityCheck**, **QualityCheckTemplate**
- **ConsumablesTracking**, **ConsumableKit**, **ConsumablesInventory**
- **TimeTracking**
- **NotificationQueueItem**
- Request/Response types for all APIs
- Dashboard summary types

---

## 4. Integration Points

### 4.1 Automatic Workflows

1. **Key Issued → Time Tracking Starts**
   - When `/api/keys/issue` is called with `odl_id`
   - Automatic creation of time_tracking record

2. **Key Returned → Time Tracking Pauses**
   - When `/api/keys/return` is called
   - Finds active time tracking and adds pause entry

3. **Consumables Added → Stock Decremented**
   - Trigger automatically updates consumables_inventory
   - Creates low stock notification if needed

4. **Critical Technical Stop → Notification Created**
   - Trigger creates notification_queue entry
   - Sends to all admins/technicians

### 4.2 RLS Policies

All tables have Row Level Security enabled with organization isolation:
- Users can only access data from their organization
- Super admins can access all data
- Technician-level permissions for appropriate tables

---

## 5. Usage Examples

### Issue a Key and Start Time Tracking
```typescript
const response = await fetch('/api/keys/issue', {
  method: 'POST',
  body: JSON.stringify({
    key_id: 'uuid',
    technician_id: 'uuid',
    odl_id: 'uuid',  // Time tracking auto-starts
    notes: 'Starting brake service'
  })
});
```

### Create Critical Technical Stop
```typescript
const response = await fetch('/api/technical-stop/create', {
  method: 'POST',
  body: JSON.stringify({
    vehicle_id: 'uuid',
    reason: 'Brake system failure',
    severity: 'critical',
    category: 'brakes',
    description: 'Master cylinder leaking',
    vehicle_immobilized: true  // Triggers immediate notification
  })
});
```

### Submit Quality Check
```typescript
const response = await fetch('/api/quality-check/submit', {
  method: 'POST',
  body: JSON.stringify({
    odl_id: 'uuid',
    checklist_items: [
      { id: 'oil_level', label: 'Oil Level', category: 'engine', critical: true, checked: true },
      // ... 14 more items
    ],
    test_drive_performed: true,
    test_drive_notes: 'All systems normal',
    passed: true,
    overall_score: 95
  })
});
```

### Use Consumables Kit
```typescript
const response = await fetch('/api/consumables/add', {
  method: 'POST',
  body: JSON.stringify({
    odl_id: 'uuid',
    kit_id: 'oil-change-kit-uuid',
    custom_quantities: { 'OIL-5W30-1L': 5 },  // Override default
    notes: 'Used premium kit'
  })
});
```

---

## 6. Security Features

- **Authentication**: All routes verify Supabase auth session
- **Authorization**: Organization-level isolation via RLS
- **Input Validation**: Zod schemas for all request bodies
- **Rate Limiting**: Can be added at API gateway level
- **Audit Logging**: All key movements automatically logged

---

## 7. Monitoring & Alerts

The system tracks and can alert on:
- Keys not returned after 8 hours
- Critical technical stops
- Vehicles immobilized
- Low consumables stock
- Pending decisions needing reminders (3, 7, 14 days)
- Quality check failures

---

## 8. Migration Instructions

1. Run the migration file:
   ```bash
   supabase db push
   # or
   psql -f supabase/migrations/005_advanced_features.sql
   ```

2. Verify tables created:
   ```sql
   \dt vehicle_keys technical_stops pending_decisions quality_checks consumables_tracking time_tracking
   ```

3. Test API endpoints using the examples above

---

## 9. Future Enhancements

- QR code generation for keys
- Push notifications for mobile apps
- Integration with barcode scanners
- AI-powered quality check image analysis
- Predictive consumables ordering
- Advanced time tracking analytics

---

## 10. File Summary

| File | Lines | Purpose |
|------|-------|---------|
| `005_advanced_features.sql` | 649 | Database schema |
| `advanced-features.ts` | 568 | TypeScript types |
| `keys/issue/route.ts` | ~130 | Issue key API |
| `keys/return/route.ts` | ~115 | Return key API |
| `keys/status/route.ts` | ~160 | Key status API |
| `technical-stop/create/route.ts` | ~170 | Create stop API |
| `technical-stop/resolve/route.ts` | ~190 | Resolve stop API |
| `time-tracking/start/route.ts` | ~200 | Start tracking API |
| `time-tracking/pause/route.ts` | ~190 | Pause/resume API |
| `time-tracking/complete/route.ts` | ~220 | Complete tracking API |
| `quality-check/submit/route.ts` | ~230 | Quality check API |
| `quality-check/templates/route.ts` | ~50 | Templates API |
| `consumables/add/route.ts` | ~290 | Add consumables API |
| `consumables/inventory/route.ts` | ~85 | Inventory API |
| `consumables/kits/route.ts` | ~65 | Kits API |
| `pending-decisions/create/route.ts` | ~200 | Create decision API |
| `pending-decisions/update/route.ts` | ~170 | Update decision API |
| `pending-decisions/reminders/route.ts` | ~170 | Reminders API |
| `dashboard/summary/route.ts` | ~140 | Dashboard API |

**Total: ~3,500 lines of production-ready code**

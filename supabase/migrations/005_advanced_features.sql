-- ============================================================
-- AROS ADVANCED FEATURES 2026
-- 1. Vehicle Key Management (Gestione Chiavi Veicolo)
-- 2. Technical Stops (Fermo Tecnico)
-- 3. Pending Decisions (In Attesa di Decisione)
-- 4. Quality Checks (Workflow Qualità)
-- 5. Consumables Tracking (Gestione Consumabili)
-- 6. Time Tracking (Time Tracking Automatico)
-- ============================================================

-- ============================================================
-- 1. VEHICLE KEY MANAGEMENT (Gestione Chiavi Veicolo)
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    key_code VARCHAR(100) NOT NULL UNIQUE, -- QR code o codice univoco
    key_slot INTEGER, -- Posizione nella cassaforte elettronica
    status VARCHAR(50) NOT NULL DEFAULT 'in_safe' CHECK (status IN ('in_safe', 'issued', 'returned', 'lost', 'damaged')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Tecnico che ha preso la chiave
    assigned_at TIMESTAMP WITH TIME ZONE,
    odl_id UUID REFERENCES work_orders(id) ON DELETE SET NULL, -- ODL associato
    returned_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE
);

-- Index per ricerche rapide
CREATE INDEX idx_vehicle_keys_vehicle ON vehicle_keys(vehicle_id);
CREATE INDEX idx_vehicle_keys_status ON vehicle_keys(status);
CREATE INDEX idx_vehicle_keys_assigned ON vehicle_keys(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_vehicle_keys_odl ON vehicle_keys(odl_id);
CREATE INDEX idx_vehicle_keys_org ON vehicle_keys(org_id);

-- Tabella storico movimenti chiavi
CREATE TABLE IF NOT EXISTS vehicle_key_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id UUID NOT NULL REFERENCES vehicle_keys(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('issued', 'returned', 'transferred', 'lost', 'found', 'damaged')),
    performed_by UUID NOT NULL REFERENCES profiles(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    from_technician UUID REFERENCES profiles(id),
    to_technician UUID REFERENCES profiles(id),
    odl_id UUID REFERENCES work_orders(id),
    notes TEXT,
    location VARCHAR(100) -- Posizione GPS se disponibile
);

CREATE INDEX idx_key_logs_key ON vehicle_key_logs(key_id);
CREATE INDEX idx_key_logs_action ON vehicle_key_logs(action);
CREATE INDEX idx_key_logs_performed ON vehicle_key_logs(performed_at);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_vehicle_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vehicle_keys_updated_at
    BEFORE UPDATE ON vehicle_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_keys_updated_at();

-- Funzione per loggare movimenti chiavi automaticamente
CREATE OR REPLACE FUNCTION log_key_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'in_safe' AND NEW.status = 'issued' THEN
            INSERT INTO vehicle_key_logs (key_id, action, performed_by, to_technician, odl_id, notes)
            VALUES (NEW.id, 'issued', NEW.assigned_to, NEW.assigned_to, NEW.odl_id, NEW.notes);
        ELSIF OLD.status = 'issued' AND NEW.status = 'returned' THEN
            INSERT INTO vehicle_key_logs (key_id, action, performed_by, from_technician, odl_id, notes)
            VALUES (NEW.id, 'returned', NEW.assigned_to, OLD.assigned_to, NEW.odl_id, NEW.notes);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_key_movement
    AFTER UPDATE ON vehicle_keys
    FOR EACH ROW
    EXECUTE FUNCTION log_key_movement();

-- ============================================================
-- 2. TECHNICAL STOPS (Fermo Tecnico)
-- ============================================================
CREATE TABLE IF NOT EXISTS technical_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(100) NOT NULL CHECK (category IN ('engine', 'brakes', 'suspension', 'transmission', 'electrical', 'safety', 'other')),
    description TEXT NOT NULL,
    reported_by UUID NOT NULL REFERENCES profiles(id),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES profiles(id),
    resolution_notes TEXT,
    vehicle_immobilized BOOLEAN DEFAULT false, -- Veicolo non può muoversi
    priority_override INTEGER DEFAULT 0, -- Priorità assoluta (0-100)
    notified_at TIMESTAMP WITH TIME ZONE, -- Quando è stata inviata la notifica
    notification_sent_to UUID[], -- Lista ID dei tecnici notificati
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_technical_stops_vehicle ON technical_stops(vehicle_id);
CREATE INDEX idx_technical_stops_status ON technical_stops(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_technical_stops_severity ON technical_stops(severity);
CREATE INDEX idx_technical_stops_org ON technical_stops(org_id);
CREATE INDEX idx_technical_stops_immobilized ON technical_stops(vehicle_immobilized) WHERE vehicle_immobilized = true;

-- Trigger per notifiche immediate su fermo tecnico critico
CREATE OR REPLACE FUNCTION notify_critical_technical_stop()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.severity = 'critical' OR NEW.vehicle_immobilized = true THEN
        NEW.notified_at = now();
        -- Inserisci notifica nella coda (da elaborare da un job)
        INSERT INTO notification_queue (
            type,
            priority,
            payload,
            org_id
        ) VALUES (
            'critical_technical_stop',
            10,
            jsonb_build_object(
                'technical_stop_id', NEW.id,
                'vehicle_id', NEW.vehicle_id,
                'reason', NEW.reason,
                'severity', NEW.severity
            ),
            NEW.org_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_critical_technical_stop
    AFTER INSERT ON technical_stops
    FOR EACH ROW
    EXECUTE FUNCTION notify_critical_technical_stop();

-- ============================================================
-- 3. PENDING DECISIONS (In Attesa di Decisione)
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    odl_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    quote_amount DECIMAL(10, 2) NOT NULL,
    quote_description TEXT,
    
    -- Solleciti automatici
    reminder_3d_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_7d_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_14d_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Escalation
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalated_to UUID REFERENCES profiles(id),
    escalation_reason TEXT,
    
    -- Stato
    status VARCHAR(50) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'approved', 'rejected', 'expired', 'escalated')),
    customer_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_pending_decisions_odl ON pending_decisions(odl_id);
CREATE INDEX idx_pending_decisions_status ON pending_decisions(status);
CREATE INDEX idx_pending_decisions_customer ON pending_decisions(customer_id);
CREATE INDEX idx_pending_decisions_sent ON pending_decisions(sent_at);
CREATE INDEX idx_pending_decisions_org ON pending_decisions(org_id);
CREATE INDEX idx_pending_decisions_waiting ON pending_decisions(status, sent_at) WHERE status = 'waiting';

-- Funzione per verificare solleciti da inviare
CREATE OR REPLACE FUNCTION get_pending_reminders()
RETURNS TABLE (
    decision_id UUID,
    odl_id UUID,
    customer_id UUID,
    customer_email VARCHAR,
    customer_phone VARCHAR,
    days_waiting INTEGER,
    reminder_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pd.id,
        pd.odl_id,
        pd.customer_id,
        c.email,
        c.phone,
        EXTRACT(DAY FROM now() - pd.sent_at)::INTEGER as days,
        CASE 
            WHEN EXTRACT(DAY FROM now() - pd.sent_at) >= 14 AND pd.reminder_14d_sent_at IS NULL THEN '14d'
            WHEN EXTRACT(DAY FROM now() - pd.sent_at) >= 7 AND pd.reminder_7d_sent_at IS NULL THEN '7d'
            WHEN EXTRACT(DAY FROM now() - pd.sent_at) >= 3 AND pd.reminder_3d_sent_at IS NULL THEN '3d'
            ELSE NULL
        END as reminder
    FROM pending_decisions pd
    JOIN customers c ON c.id = pd.customer_id
    WHERE pd.status = 'waiting'
      AND (
          (EXTRACT(DAY FROM now() - pd.sent_at) >= 3 AND pd.reminder_3d_sent_at IS NULL)
          OR (EXTRACT(DAY FROM now() - pd.sent_at) >= 7 AND pd.reminder_7d_sent_at IS NULL)
          OR (EXTRACT(DAY FROM now() - pd.sent_at) >= 14 AND pd.reminder_14d_sent_at IS NULL)
      );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. QUALITY CHECKS (Workflow Qualità)
-- ============================================================
CREATE TABLE IF NOT EXISTS quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    odl_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    tester_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Checklist items (15-20 punti)
    checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Esempio: [
    --   {"item": "Livello olio motore", "checked": true, "notes": "", "critical": true},
    --   {"item": "Pressione pneumatici", "checked": true, "notes": "", "critical": true},
    --   ...
    -- ]
    
    -- Test drive
    test_drive_performed BOOLEAN DEFAULT false,
    test_drive_notes TEXT,
    test_drive_issues BOOLEAN DEFAULT false,
    
    -- Foto pre/post
    photos_before JSONB DEFAULT '[]'::jsonb, -- Array di URL foto
    photos_after JSONB DEFAULT '[]'::jsonb,
    
    -- Risultato
    passed BOOLEAN NOT NULL DEFAULT false,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    notes TEXT,
    
    -- Firma
    customer_approved BOOLEAN DEFAULT false,
    customer_signature_url TEXT,
    customer_approved_at TIMESTAMP WITH TIME ZONE,
    
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_quality_checks_odl ON quality_checks(odl_id);
CREATE INDEX idx_quality_checks_tester ON quality_checks(tester_id);
CREATE INDEX idx_quality_checks_passed ON quality_checks(passed);
CREATE INDEX idx_quality_checks_org ON quality_checks(org_id);

-- Tabella template checklist qualità
CREATE TABLE IF NOT EXISTS quality_check_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{"id": "1", "label": "Livello olio", "category": "engine", "critical": true}, ...]
    is_default BOOLEAN DEFAULT false,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_quality_templates_org ON quality_check_templates(org_id);
CREATE INDEX idx_quality_templates_default ON quality_check_templates(is_default) WHERE is_default = true;

-- Inserisci template di default
INSERT INTO quality_check_templates (name, description, items, is_default) VALUES
(
    'Controllo Standard Pre-Consegna',
    'Checklist completo di 15 punti per il controllo qualità pre-consegna',
    '[
        {"id": "oil_level", "label": "Livello olio motore", "category": "engine", "critical": true},
        {"id": "coolant", "label": "Livello liquido refrigerante", "category": "engine", "critical": true},
        {"id": "brake_fluid", "label": "Livello liquido freni", "category": "brakes", "critical": true},
        {"id": "tire_pressure", "label": "Pressione pneumatici", "category": "wheels", "critical": true},
        {"id": "tire_wear", "label": "Usura pneumatici", "category": "wheels", "critical": false},
        {"id": "lights", "label": "Funzionamento luci", "category": "electrical", "critical": true},
        {"id": "wipers", "label": "Tergicristalli", "category": "body", "critical": false},
        {"id": "washer_fluid", "label": "Liquido tergicristalli", "category": "body", "critical": false},
        {"id": "battery", "label": "Stato batteria", "category": "electrical", "critical": true},
        {"id": "belts", "label": "Cinghie servizi", "category": "engine", "critical": true},
        {"id": "brake_pads", "label": "Spessore pastiglie freni", "category": "brakes", "critical": true},
        {"id": "suspension", "label": "Controllo sospensioni", "category": "suspension", "critical": false},
        {"id": "steering", "label": "Gioco sterzo", "category": "steering", "critical": true},
        {"id": "exhaust", "label": "Scarico", "category": "engine", "critical": false},
        {"id": "cleanliness", "label": "Pulizia veicolo", "category": "appearance", "critical": false}
    ]'::jsonb,
    true
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. CONSUMABLES TRACKING (Gestione Consumabili)
-- ============================================================
CREATE TABLE IF NOT EXISTS consumables_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    odl_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    items_used JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [
    --   {"sku": "OIL-5W30-1L", "name": "Olio 5W30", "quantity": 4, "unit": "L", "cost": 12.50},
    --   ...
    -- ]
    technician_id UUID NOT NULL REFERENCES profiles(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    notes TEXT,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_consumables_odl ON consumables_tracking(odl_id);
CREATE INDEX idx_consumables_technician ON consumables_tracking(technician_id);
CREATE INDEX idx_consumables_timestamp ON consumables_tracking(timestamp);
CREATE INDEX idx_consumables_org ON consumables_tracking(org_id);

-- Tabella kit consumabili predefiniti
CREATE TABLE IF NOT EXISTS consumable_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    service_type VARCHAR(100) NOT NULL, -- 'oil_change', 'brake_service', 'inspection', etc.
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{"sku": "OIL-5W30-1L", "name": "Olio 5W30", "default_quantity": 4, "unit": "L"}, ...]
    estimated_cost DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_consumable_kits_service ON consumable_kits(service_type);
CREATE INDEX idx_consumable_kits_org ON consumable_kits(org_id);

-- Tabella magazzino consumabili
CREATE TABLE IF NOT EXISTS consumables_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'oil', 'filters', 'brake_pads', etc.
    unit VARCHAR(50) NOT NULL, -- 'L', 'kg', 'pz', etc.
    current_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    min_threshold DECIMAL(10, 2) NOT NULL DEFAULT 10, -- Soglia minima alert
    max_threshold DECIMAL(10, 2), -- Soglia massima
    reorder_point DECIMAL(10, 2) DEFAULT 20,
    unit_cost DECIMAL(10, 2),
    supplier VARCHAR(255),
    location VARCHAR(100), -- Ubicazione in magazzino
    barcode VARCHAR(100),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_consumables_inventory_sku ON consumables_inventory(sku);
CREATE INDEX idx_consumables_inventory_category ON consumables_inventory(category);
CREATE INDEX idx_consumables_inventory_low ON consumables_inventory(current_quantity, min_threshold) 
    WHERE current_quantity <= min_threshold;
CREATE INDEX idx_consumables_inventory_org ON consumables_inventory(org_id);

-- Funzione per verificare soglie minime
CREATE OR REPLACE FUNCTION check_consumables_thresholds()
RETURNS TABLE (
    item_id UUID,
    sku VARCHAR,
    name VARCHAR,
    current_quantity DECIMAL,
    min_threshold DECIMAL,
    shortage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.id,
        ci.sku,
        ci.name,
        ci.current_quantity,
        ci.min_threshold,
        ci.min_threshold - ci.current_quantity as shortage
    FROM consumables_inventory ci
    WHERE ci.current_quantity <= ci.min_threshold
    ORDER BY (ci.min_threshold - ci.current_quantity) DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger per decrementare magazzino quando si usa consumabile
CREATE OR REPLACE FUNCTION update_consumables_stock()
RETURNS TRIGGER AS $$
DECLARE
    item JSONB;
    v_sku VARCHAR;
    v_quantity DECIMAL;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items_used)
    LOOP
        v_sku := item->>'sku';
        v_quantity := (item->>'quantity')::DECIMAL;
        
        UPDATE consumables_inventory
        SET current_quantity = current_quantity - v_quantity,
            updated_at = now()
        WHERE sku = v_sku AND org_id = NEW.org_id;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consumables_stock
    AFTER INSERT ON consumables_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_consumables_stock();

-- ============================================================
-- 6. TIME TRACKING (Time Tracking Automatico)
-- ============================================================
CREATE TABLE IF NOT EXISTS time_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    odl_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Timestamp lavoro
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    paused_at TIMESTAMP WITH TIME ZONE,
    resumed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Calcolo tempo totale (in minuti)
    total_minutes INTEGER DEFAULT 0,
    billable_minutes INTEGER DEFAULT 0, -- Tempo fatturabile
    
    -- Pause multiple supportate
    pauses JSONB DEFAULT '[]'::jsonb,
    -- [{"started": "2026-01-15T09:00:00Z", "ended": "2026-01-15T09:15:00Z", "reason": "break"}, ...]
    
    -- Metadati
    work_type VARCHAR(100) DEFAULT 'repair', -- 'repair', 'diagnostic', 'maintenance', 'warranty'
    notes TEXT,
    auto_started BOOLEAN DEFAULT false, -- True se iniziato automaticamente (presa chiavi)
    
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_time_tracking_odl ON time_tracking(odl_id);
CREATE INDEX idx_time_tracking_technician ON time_tracking(technician_id);
CREATE INDEX idx_time_tracking_active ON time_tracking(technician_id, completed_at) WHERE completed_at IS NULL;
CREATE INDEX idx_time_tracking_date ON time_tracking(started_at);
CREATE INDEX idx_time_tracking_org ON time_tracking(org_id);

-- Vista per riepilogo ore tecniche
CREATE OR REPLACE VIEW technician_time_summary AS
SELECT 
    tt.technician_id,
    p.first_name || ' ' || p.last_name as technician_name,
    tt.org_id,
    DATE(tt.started_at) as work_date,
    COUNT(*) as sessions_count,
    SUM(tt.total_minutes) as total_minutes,
    SUM(tt.billable_minutes) as billable_minutes,
    ARRAY_AGG(DISTINCT tt.odl_id) as odl_ids
FROM time_tracking tt
JOIN profiles p ON p.id = tt.technician_id
WHERE tt.completed_at IS NOT NULL
GROUP BY tt.technician_id, p.first_name, p.last_name, tt.org_id, DATE(tt.started_at);

-- Funzione per calcolare tempo totale
CREATE OR REPLACE FUNCTION calculate_time_tracking_minutes(
    p_started_at TIMESTAMP WITH TIME ZONE,
    p_pauses JSONB
) RETURNS INTEGER AS $$
DECLARE
    v_total_minutes INTEGER;
    v_pause_minutes INTEGER := 0;
    pause_item JSONB;
BEGIN
    -- Calcola minuti totali
    v_total_minutes := EXTRACT(EPOCH FROM (now() - p_started_at)) / 60;
    
    -- Sottrai pause
    FOR pause_item IN SELECT * FROM jsonb_array_elements(p_pauses)
    LOOP
        IF pause_item->>'ended' IS NOT NULL THEN
            v_pause_minutes := v_pause_minutes + 
                EXTRACT(EPOCH FROM ((pause_item->>'ended')::TIMESTAMP WITH TIME ZONE - 
                                   (pause_item->>'started')::TIMESTAMP WITH TIME ZONE)) / 60;
        END IF;
    END LOOP;
    
    RETURN GREATEST(0, v_total_minutes - v_pause_minutes)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- NOTIFICATION QUEUE (Per job di notifica)
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_notification_queue_status ON notification_queue(status, priority, created_at);
CREATE INDEX idx_notification_queue_org ON notification_queue(org_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Vehicle Keys
ALTER TABLE vehicle_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_key_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY vehicle_keys_org_isolation ON vehicle_keys
    FOR ALL
    TO authenticated
    USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY vehicle_key_logs_org_isolation ON vehicle_key_logs
    FOR ALL
    TO authenticated
    USING (key_id IN (
        SELECT id FROM vehicle_keys WHERE org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    ));

-- Technical Stops
ALTER TABLE technical_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY technical_stops_org_isolation ON technical_stops
    FOR ALL
    TO authenticated
    USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

-- Pending Decisions
ALTER TABLE pending_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY pending_decisions_org_isolation ON pending_decisions
    FOR ALL
    TO authenticated
    USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

-- Quality Checks
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_check_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY quality_checks_org_isolation ON quality_checks
    FOR ALL
    TO authenticated
    USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY quality_templates_org_isolation ON quality_check_templates
    FOR ALL
    TO authenticated
    USING (org_id IS NULL OR org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

-- Consumables
ALTER TABLE consumables_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumable_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumables_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY consumables_tracking_org_isolation ON consumables_tracking
    FOR ALL
    TO authenticated
    USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY consumable_kits_org_isolation ON consumable_kits
    FOR ALL
    TO authenticated
    USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY consumables_inventory_org_isolation ON consumables_inventory
    FOR ALL
    TO authenticated
    USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

-- Time Tracking
ALTER TABLE time_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY time_tracking_org_isolation ON time_tracking
    FOR ALL
    TO authenticated
    USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

-- Notification Queue (solo admin)
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_queue_admin ON notification_queue
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

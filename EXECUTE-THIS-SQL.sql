-- ============================================================
-- AROS - ESEGUI QUESTO SQL IN SUPABASE
-- ============================================================
-- 1. Vai su https://supabase.com/dashboard/project/elruhdwcrsxeirbbsozd/sql
-- 2. Copia e incolla TUTTO questo codice
-- 3. Clicca "Run"
-- ============================================================

-- Estensioni
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Funzione per eseguire SQL dinamico
CREATE OR REPLACE FUNCTION exec_sql(query text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN EXECUTE query; END; $$;

-- ============================================================
-- TABELLE BASE
-- ============================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID,
  customer_id UUID,
  plate TEXT,
  vin TEXT,
  make TEXT,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID,
  wo_number TEXT,
  customer_id UUID,
  vehicle_id UUID,
  technician_id UUID,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELLE AVANZATE (AROS Features)
-- ============================================================

-- Gestione Chiavi Veicolo
CREATE TABLE IF NOT EXISTS vehicle_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID,
  key_code TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  odl_id UUID,
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_key_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_id UUID REFERENCES vehicle_keys(id),
  action TEXT NOT NULL,
  performed_by UUID,
  odl_id UUID,
  notes TEXT,
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fermo Tecnico
CREATE TABLE IF NOT EXISTS technical_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  vehicle_immobilized BOOLEAN DEFAULT true,
  reported_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- In Attesa di Decisione
CREATE TABLE IF NOT EXISTS pending_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  odl_id UUID NOT NULL,
  quote_id UUID,
  customer_id UUID,
  sent_at TIMESTAMPTZ NOT NULL,
  quote_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  reminder_3d_sent_at TIMESTAMPTZ,
  reminder_7d_sent_at TIMESTAMPTZ,
  reminder_14d_sent_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  escalated_to UUID,
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Controllo Qualità
CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  odl_id UUID NOT NULL,
  checklist JSONB NOT NULL,
  tester_id UUID,
  passed BOOLEAN DEFAULT false,
  score INTEGER,
  notes TEXT,
  test_drive_km INTEGER,
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consumabili
CREATE TABLE IF NOT EXISTS consumables_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  odl_id UUID NOT NULL,
  items_used JSONB NOT NULL,
  technician_id UUID,
  total_cost DECIMAL(10,2),
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consumable_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL,
  applicable_work_types TEXT[],
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Tracking
CREATE TABLE IF NOT EXISTS time_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  odl_id UUID NOT NULL,
  technician_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_minutes INTEGER DEFAULT 0,
  billable_minutes INTEGER DEFAULT 0,
  work_type TEXT,
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SICUREZZA & COMPLIANCE
-- ============================================================

-- MFA
CREATE TABLE IF NOT EXISTS user_mfa_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_enabled BOOLEAN DEFAULT FALSE,
  webauthn_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  email_enabled BOOLEAN DEFAULT FALSE,
  backup_codes_hash TEXT[],
  preferred_method TEXT DEFAULT 'totp',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID,
  event_type TEXT NOT NULL,
  event_category TEXT,
  severity TEXT DEFAULT 'info',
  user_id UUID,
  user_email TEXT,
  action TEXT,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  request_method TEXT,
  request_path TEXT,
  gdpr_category TEXT,
  personal_data_involved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GDPR
CREATE TABLE IF NOT EXISTS gdpr_consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL,
  subject_type TEXT DEFAULT 'user',
  organization_id UUID,
  purpose TEXT NOT NULL,
  granted BOOLEAN DEFAULT FALSE,
  consent_marketing_email BOOLEAN DEFAULT FALSE,
  consent_marketing_sms BOOLEAN DEFAULT FALSE,
  consent_analytics BOOLEAN DEFAULT FALSE,
  consent_profiling BOOLEAN DEFAULT FALSE,
  ip_address INET,
  user_agent TEXT,
  granted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gdpr_export_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL,
  organization_id UUID,
  status TEXT DEFAULT 'pending',
  export_format TEXT DEFAULT 'json',
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fatturazione Elettronica
CREATE TABLE IF NOT EXISTS company_sdi_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  ragione_sociale TEXT NOT NULL,
  partita_iva TEXT NOT NULL,
  codice_destinatario TEXT,
  pec_destinatario TEXT,
  regime_fiscale TEXT DEFAULT 'RF01',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS electronic_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_year INTEGER NOT NULL,
  customer_id UUID,
  sdi_identificativo TEXT,
  sdi_status TEXT DEFAULT 'draft',
  importo_totale DECIMAL(15,2),
  imponibile DECIMAL(15,2),
  imposta DECIMAL(15,2),
  xml_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumables_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mfa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_invoices ENABLE ROW LEVEL SECURITY;

-- Policy base per org_id
CREATE POLICY IF NOT EXISTS "org_isolation_vehicles" ON vehicles FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY IF NOT EXISTS "org_isolation_work_orders" ON work_orders FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY IF NOT EXISTS "org_isolation_vehicle_keys" ON vehicle_keys FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY IF NOT EXISTS "org_isolation_technical_stops" ON technical_stops FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY IF NOT EXISTS "org_isolation_pending_decisions" ON pending_decisions FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY IF NOT EXISTS "org_isolation_quality_checks" ON quality_checks FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY IF NOT EXISTS "org_isolation_consumables" ON consumables_tracking FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY IF NOT EXISTS "org_isolation_time_tracking" ON time_tracking FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY IF NOT EXISTS "own_mfa_config" ON user_mfa_config FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_vehicles_org ON vehicles(org_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_org ON work_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_keys_org ON vehicle_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_technical_stops_org ON technical_stops(org_id);
CREATE INDEX IF NOT EXISTS idx_pending_decisions_org ON pending_decisions(org_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_org ON quality_checks(org_id);
CREATE INDEX IF NOT EXISTS idx_consumables_org ON consumables_tracking(org_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_org ON time_tracking(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- DEFAULT DATA
-- ============================================================

-- Kit consumabili di default
INSERT INTO consumable_kits (name, description, items, applicable_work_types, org_id) VALUES
('Tagliando Base', 'Kit per tagliando standard', '[{"sku": "OLIO-5W40", "name": "Olio motore 5W40", "quantity": 5}, {"sku": "FILTRO-OLIO", "name": "Filtro olio", "quantity": 1}, {"sku": "FILTRO-ARIA", "name": "Filtro aria", "quantity": 1}]', '{"tagliando"}', NULL),
('Cambio Freni', 'Kit per sostituzione pastiglie freni', '[{"sku": "PASTIGLIE-FRENO", "name": "Pastiglie freno", "quantity": 1}, {"sku": "DISCHI-FRENO", "name": "Dischi freno", "quantity": 2}]', '{"freni"}', NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ✅ FATTO! DATABASE AROS PRONTO
-- ============================================================

-- SOLO PARTI AVANZATE (senza tabelle base già esistenti)
-- Da eseguire se FIX_DATABASE.sql è già stato eseguito

-- Verifica che tabelle base esistano
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations') THEN
        RAISE EXCEPTION 'Tabelle base mancanti! Esegui prima FIX_DATABASE.sql';
    END IF;
END $$;

-- Aggiungi colonne mancanti se non esistono
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS key_code TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS key_status TEXT DEFAULT 'available';

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS fermo_tecnico BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS pending_decision BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS time_tracking_started_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS time_tracking_paused_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS time_tracking_total_seconds INTEGER DEFAULT 0;

-- Tabelle features avanzate
CREATE TABLE IF NOT EXISTS vehicle_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id),
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

-- Tabelle fatturazione
CREATE TABLE IF NOT EXISTS fatture (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID,
    numero TEXT NOT NULL,
    anno INTEGER NOT NULL,
    data_emissione DATE DEFAULT CURRENT_DATE,
    customer_id UUID,
    odl_id UUID,
    importo_totale DECIMAL(10,2) DEFAULT 0,
    stato_sdi TEXT DEFAULT 'DA_INVIARE',
    sdi_id TEXT,
    sdi_pec TEXT,
    data_invio_sdi TIMESTAMPTZ,
    xml_content TEXT,
    pec_message_id TEXT,
    pec_events JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, anno, numero)
);

CREATE TABLE IF NOT EXISTS fatture_linee (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fattura_id UUID REFERENCES fatture(id) ON DELETE CASCADE,
    descrizione TEXT NOT NULL,
    quantita DECIMAL(10,2) DEFAULT 1,
    prezzo_unitario DECIMAL(10,2) NOT NULL,
    aliquota_iva DECIMAL(5,2) DEFAULT 22.00,
    importo_totale DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies per nuove tabelle
ALTER TABLE vehicle_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_key_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fatture ENABLE ROW LEVEL SECURITY;
ALTER TABLE fatture_linee ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "Org members can view vehicle_keys" ON vehicle_keys FOR SELECT USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Org members can manage vehicle_keys" ON vehicle_keys FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Org members can view key_logs" ON vehicle_key_logs FOR SELECT USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Org members can view technical_stops" ON technical_stops FOR SELECT USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Org members can manage technical_stops" ON technical_stops FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Org members can view pending_decisions" ON pending_decisions FOR SELECT USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Org members can manage pending_decisions" ON pending_decisions FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Org members can view fatture" ON fatture FOR SELECT USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Org members can manage fatture" ON fatture FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Org members can view fatture_linee" ON fatture_linee FOR SELECT USING (
    fattura_id IN (SELECT id FROM fatture WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
);

-- Funzione exec_sql
CREATE OR REPLACE FUNCTION exec_sql(query text) 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$ 
BEGIN 
    EXECUTE query; 
END; 
$$;

-- Messaggio di successo
DO $$
BEGIN
    RAISE NOTICE '✅ MIGRATION AVANZATA COMPLETATA!';
END $$;

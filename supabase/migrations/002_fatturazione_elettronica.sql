-- ============================================
-- AROS FATTURAZIONE ELETTRONICA SDI
-- Sistema di Interscambio (Italy)
-- ============================================

-- ============================================
-- 1. SDI CONFIGURATION
-- ============================================

-- Company SDI configuration
CREATE TABLE IF NOT EXISTS company_sdi_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    
    -- Company identification
    ragione_sociale TEXT NOT NULL,
    partita_iva TEXT NOT NULL,
    codice_fiscale TEXT,
    
    -- SDI identifiers
    codice_destinatario VARCHAR(7),
    pec_destinatario TEXT,
    codice_ipa TEXT, -- For Public Administration
    
    -- Registration data
    registro_cciaa TEXT,
    numero_rea TEXT,
    capitale_sociale DECIMAL(15,2),
    socio_unico BOOLEAN DEFAULT FALSE,
    
    -- Contact
    indirizzo JSONB,
    telefono TEXT,
    email TEXT,
    
    -- SDI specific
    regime_fiscale VARCHAR(4) DEFAULT 'RF01',
    default_natura_iva VARCHAR(4),
    
    -- Certificati
    digital_signature_cert TEXT,
    cert_expires_at TIMESTAMPTZ,
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id)
);

-- Customer SDI data
CREATE TABLE IF NOT EXISTS customers_sdi_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL,
    organization_id UUID,
    
    -- Customer type
    tipo_cliente VARCHAR(20), -- privato, azienda, pa
    
    -- SDI identifiers
    codice_destinatario VARCHAR(7),
    pec_destinatario TEXT,
    codice_ipa TEXT,
    
    -- Split payment (for PA)
    split_payment_eligible BOOLEAN DEFAULT FALSE,
    split_payment_default BOOLEAN DEFAULT FALSE,
    
    -- Foreign invoicing
    is_foreign BOOLEAN DEFAULT FALSE,
    country_code VARCHAR(2),
    vat_number_foreign TEXT,
    
    -- Tax regime
    regime_fiscale VARCHAR(4),
    natura_iva_default VARCHAR(4),
    
    -- Special regimes
    esenzione_iva BOOLEAN DEFAULT FALSE,
    esenzione_causale TEXT,
    documento_esenzione TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ELECTRONIC INVOICES
-- ============================================

CREATE TABLE IF NOT EXISTS electronic_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    
    -- Invoice identification
    invoice_number VARCHAR(50) NOT NULL,
    invoice_year INTEGER NOT NULL,
    invoice_date DATE NOT NULL,
    
    -- References
    work_order_id UUID,
    customer_id UUID NOT NULL,
    
    -- SDI data
    sdi_identificativo TEXT,
    sdi_file_name TEXT,
    sdi_xml_content TEXT,
    sdi_xml_hash TEXT,
    
    -- Invoice totals
    importo_totale DECIMAL(15,2) NOT NULL,
    imponibile DECIMAL(15,2) NOT NULL,
    imposta DECIMAL(15,2) NOT NULL,
    
    -- Status
    sdi_status VARCHAR(10) DEFAULT 'draft', -- draft, queued, sent, rc, mc, ns, ne, dt, at
    sdi_status_description TEXT,
    
    -- Status timestamps
    sdi_sent_at TIMESTAMPTZ,
    sdi_delivered_at TIMESTAMPTZ,
    sdi_accepted_at TIMESTAMPTZ,
    sdi_rejected_at TIMESTAMPTZ,
    
    -- Rejection details
    sdi_rejection_code TEXT,
    sdi_rejection_description TEXT,
    
    -- Conservazione
    conservazione_sostitutiva BOOLEAN DEFAULT FALSE,
    conservazione_date TIMESTAMPTZ,
    conservazione_id TEXT,
    
    -- XML storage
    xml_generated_at TIMESTAMPTZ,
    xml_signed_at TIMESTAMPTZ,
    xml_transmitted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, invoice_year, invoice_number)
);

-- SDI status history
CREATE TABLE IF NOT EXISTS sdi_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES electronic_invoices(id) ON DELETE CASCADE,
    
    old_status VARCHAR(10),
    new_status VARCHAR(10) NOT NULL,
    
    sdi_notification_id TEXT,
    sdi_notification_date TIMESTAMPTZ,
    sdi_notification_xml TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. INVOICE LINE ITEMS (for XML generation)
-- ============================================

CREATE TABLE IF NOT EXISTS electronic_invoice_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES electronic_invoices(id) ON DELETE CASCADE,
    
    line_number INTEGER NOT NULL,
    
    -- Product/Service
    description TEXT NOT NULL,
    codice_articolo TEXT,
    
    -- Quantities
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_of_measure VARCHAR(10) DEFAULT 'PZ',
    
    -- Pricing
    unit_price DECIMAL(15,4) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    
    -- VAT
    vat_rate DECIMAL(5,2) DEFAULT 22.00,
    vat_nature VARCHAR(4), -- N1, N2, etc.
    
    -- Discounts
    discount_type VARCHAR(20), -- percentuale, fisso
    discount_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Reference to work order line
    work_order_line_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TRANSMISSION QUEUE
-- ============================================

CREATE TABLE IF NOT EXISTS electronic_invoice_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES electronic_invoices(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, sent, failed, retry
    priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
    
    -- Retry logic
    attempt_count INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ,
    max_attempts INTEGER DEFAULT 5,
    
    -- Error tracking
    last_error TEXT,
    error_code TEXT,
    
    -- Processing
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processed_by TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SDI notifications log
CREATE TABLE IF NOT EXISTS sdi_notifications_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    notification_type VARCHAR(10) NOT NULL, -- RC, MC, NS, NE, DT, AT
    sdi_identificativo TEXT,
    sdi_message_id TEXT,
    
    -- Related invoice
    invoice_id UUID REFERENCES electronic_invoices(id),
    
    -- Raw data
    notification_xml TEXT,
    notification_json JSONB,
    
    -- Processing
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. CONSERVAZIONE SOSTITUTIVA
-- ============================================

CREATE TABLE IF NOT EXISTS conservazione_sostitutiva (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    
    -- Package info
    package_id TEXT NOT NULL,
    package_type VARCHAR(20), -- fatture, corrispettivi, etc.
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Contents
    invoice_count INTEGER DEFAULT 0,
    total_amount DECIMAL(15,2),
    
    -- Storage
    storage_location TEXT,
    storage_hash TEXT,
    
    -- PdC (Processo di Conservazione)
    pdc_provider TEXT,
    pdc_timestamp TIMESTAMPTZ,
    pdc_signature TEXT,
    
    -- Verification
    integrity_verified BOOLEAN DEFAULT FALSE,
    last_verified_at TIMESTAMPTZ,
    
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Link invoices to conservation
CREATE TABLE IF NOT EXISTS conservazione_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conservazione_id UUID NOT NULL REFERENCES conservazione_sostitutiva(id),
    invoice_id UUID NOT NULL REFERENCES electronic_invoices(id),
    
    -- File info
    file_path TEXT,
    file_hash TEXT,
    file_size INTEGER,
    
    added_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. VAT SUMMARY (for periodic declarations)
-- ============================================

CREATE TABLE IF NOT EXISTS vat_periodic_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    
    period_type VARCHAR(10) NOT NULL, -- monthly, quarterly
    period_year INTEGER NOT NULL,
    period_number INTEGER NOT NULL, -- 1-12 for monthly, 1-4 for quarterly
    
    -- Totals
    total_invoiced DECIMAL(15,2) DEFAULT 0,
    total_vat_collected DECIMAL(15,2) DEFAULT 0,
    total_vat_paid DECIMAL(15,2) DEFAULT 0,
    
    -- Breakdown
    taxable_amount_22 DECIMAL(15,2) DEFAULT 0,
    vat_amount_22 DECIMAL(15,2) DEFAULT 0,
    taxable_amount_10 DECIMAL(15,2) DEFAULT 0,
    vat_amount_10 DECIMAL(15,2) DEFAULT 0,
    taxable_amount_4 DECIMAL(15,2) DEFAULT 0,
    vat_amount_4 DECIMAL(15,2) DEFAULT 0,
    taxable_amount_0 DECIMAL(15,2) DEFAULT 0,
    
    -- Exemptions
    exempt_amount_n1 DECIMAL(15,2) DEFAULT 0, -- escluse ex art. 15
    exempt_amount_n2 DECIMAL(15,2) DEFAULT 0, -- non soggette
    exempt_amount_n3 DECIMAL(15,2) DEFAULT 0, -- non imponibili
    exempt_amount_n4 DECIMAL(15,2) DEFAULT 0, -- esenti
    
    -- Status
    declared BOOLEAN DEFAULT FALSE,
    declared_at TIMESTAMPTZ,
    declaration_reference TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, period_type, period_year, period_number)
);

-- ============================================
-- 7. RLS POLICIES
-- ============================================

ALTER TABLE company_sdi_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers_sdi_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdi_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_invoice_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdi_notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE conservazione_sostitutiva ENABLE ROW LEVEL SECURITY;
ALTER TABLE conservazione_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_periodic_summary ENABLE ROW LEVEL SECURITY;

-- Organization-based policies
CREATE POLICY "Users can view own org SDI config"
    ON company_sdi_config FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can view own org invoices"
    ON electronic_invoices FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage invoices"
    ON electronic_invoices FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'admin', 'manager')
        )
    );

-- ============================================
-- 8. FUNCTIONS
-- ============================================

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(org_id UUID, year INTEGER)
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    result TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[^/]+$') AS INTEGER)), 0) + 1
    INTO next_num
    FROM electronic_invoices
    WHERE organization_id = org_id
    AND invoice_year = year;
    
    result := 'FATT/' || year || '/' || LPAD(next_num::TEXT, 5, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals(inv_id UUID)
RETURNS TABLE (
    total DECIMAL(15,2),
    taxable DECIMAL(15,2),
    vat DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(total_price), 0) as total,
        COALESCE(SUM(total_price / (1 + vat_rate/100)), 0) as taxable,
        COALESCE(SUM(total_price - (total_price / (1 + vat_rate/100))), 0) as vat
    FROM electronic_invoice_lines
    WHERE invoice_id = inv_id;
END;
$$ LANGUAGE plpgsql;

-- Update invoice status with history
CREATE OR REPLACE FUNCTION update_invoice_sdi_status(
    inv_id UUID,
    new_status VARCHAR(10),
    notification_xml TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    old_status VARCHAR(10);
BEGIN
    -- Get current status
    SELECT sdi_status INTO old_status
    FROM electronic_invoices
    WHERE id = inv_id;
    
    -- Update invoice
    UPDATE electronic_invoices
    SET 
        sdi_status = new_status,
        sdi_status_description = CASE new_status
            WHEN 'RC' THEN 'Ricevuta Consegna'
            WHEN 'MC' THEN 'Mancata Consegna'
            WHEN 'NS' THEN 'Notifica Scarto'
            WHEN 'NE' THEN 'Notifica Esito'
            WHEN 'DT' THEN 'Decorrenza Termini'
            WHEN 'AT' THEN 'Attestazione Trasmissione'
            ELSE sdi_status_description
        END,
        sdi_delivered_at = CASE WHEN new_status = 'RC' THEN NOW() ELSE sdi_delivered_at END,
        sdi_accepted_at = CASE WHEN new_status = 'NE' THEN NOW() ELSE sdi_accepted_at END,
        updated_at = NOW()
    WHERE id = inv_id;
    
    -- Insert history
    INSERT INTO sdi_status_history (
        invoice_id,
        old_status,
        new_status,
        sdi_notification_xml,
        sdi_notification_date
    ) VALUES (
        inv_id,
        old_status,
        new_status,
        notification_xml,
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. INDEXES
-- ============================================

CREATE INDEX idx_einvoices_org ON electronic_invoices(organization_id, created_at DESC);
CREATE INDEX idx_einvoices_status ON electronic_invoices(sdi_status);
CREATE INDEX idx_einvoices_customer ON electronic_invoices(customer_id);
CREATE INDEX idx_einvoices_number ON electronic_invoices(invoice_number);
CREATE INDEX idx_sdi_history_invoice ON sdi_status_history(invoice_id, created_at DESC);
CREATE INDEX idx_invoice_queue_status ON electronic_invoice_queue(status, next_attempt_at);
CREATE INDEX idx_vat_summary_period ON vat_periodic_summary(organization_id, period_year, period_number);

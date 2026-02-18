-- ============================================================
-- AROS COMPLETE UNIFIED MIGRATION
-- Combined from:
--   001_security_schema.sql
--   002_fatturazione_elettronica.sql
--   005_advanced_features.sql
-- ============================================================
-- This file can be executed via CLI to set up all AROS features at once
-- ============================================================

-- ============================================================
-- SECTION 1: EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SECTION 2: TABLES - SECURITY & COMPLIANCE
-- ============================================================

-- -----------------------------------------
-- 2.1 MFA CONFIGURATION
-- -----------------------------------------

CREATE TABLE IF NOT EXISTS user_mfa_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID,
    
    -- TOTP Settings
    totp_enabled BOOLEAN DEFAULT FALSE,
    totp_secret_encrypted TEXT,
    totp_verified_at TIMESTAMPTZ,
    
    -- WebAuthn/FIDO2 Settings
    webauthn_enabled BOOLEAN DEFAULT FALSE,
    webauthn_credentials JSONB DEFAULT '[]',
    
    -- SMS Settings
    sms_enabled BOOLEAN DEFAULT FALSE,
    sms_phone_encrypted TEXT,
    sms_verified_at TIMESTAMPTZ,
    
    -- Email Settings
    email_enabled BOOLEAN DEFAULT FALSE,
    email_backup TEXT,
    
    -- Backup Codes (hashed)
    backup_codes_hash TEXT[],
    backup_codes_used BOOLEAN[] DEFAULT '{}',
    
    -- Preferences
    preferred_method VARCHAR(20) DEFAULT 'totp',
    require_mfa_for_login BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Backup codes table
CREATE TABLE IF NOT EXISTS mfa_backup_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID,
    
    -- Session data
    token_hash TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    
    -- MFA status
    mfa_verified BOOLEAN DEFAULT FALSE,
    mfa_verified_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Revocation
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT
);

-- Login attempts (brute force protection)
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username_or_email TEXT,
    ip_address INET NOT NULL,
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT FALSE,
    failure_reason TEXT,
    user_agent TEXT,
    
    -- Tracking
    attempt_count INTEGER DEFAULT 1,
    blocked_until TIMESTAMPTZ,
    blocked_reason TEXT
);

-- MFA attempts
CREATE TABLE IF NOT EXISTS mfa_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET,
    method VARCHAR(20),
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT FALSE,
    failure_reason TEXT
);

-- -----------------------------------------
-- 2.2 AUDIT LOGGING (WORM - Write Once Read Many)
-- -----------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID,
    
    -- Event details
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    severity VARCHAR(20) DEFAULT 'info',
    
    -- Actor
    user_id UUID,
    user_email TEXT,
    user_role TEXT,
    impersonated_by UUID,
    
    -- Action
    action VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id TEXT,
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,
    request_body JSONB,
    response_status INTEGER,
    
    -- GDPR categorization
    gdpr_category VARCHAR(50),
    personal_data_involved BOOLEAN DEFAULT FALSE,
    data_categories TEXT[],
    
    -- Integrity (WORM)
    log_hash TEXT,
    previous_log_hash TEXT,
    chain_verified BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    session_id UUID,
    correlation_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------
-- 2.3 GDPR CONSENT MANAGEMENT
-- -----------------------------------------

CREATE TABLE IF NOT EXISTS gdpr_consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL, -- Can be auth.users or customers
    subject_type VARCHAR(20) DEFAULT 'user',
    organization_id UUID,
    
    -- Consent details
    purpose VARCHAR(100) NOT NULL,
    purpose_description TEXT,
    granted BOOLEAN DEFAULT FALSE,
    
    -- Granular consent
    consent_marketing_email BOOLEAN DEFAULT FALSE,
    consent_marketing_sms BOOLEAN DEFAULT FALSE,
    consent_marketing_phone BOOLEAN DEFAULT FALSE,
    consent_analytics BOOLEAN DEFAULT FALSE,
    consent_profiling BOOLEAN DEFAULT FALSE,
    consent_third_party BOOLEAN DEFAULT FALSE,
    consent_geolocation BOOLEAN DEFAULT FALSE,
    consent_iot_telematics BOOLEAN DEFAULT FALSE,
    consent_cross_border BOOLEAN DEFAULT FALSE,
    
    -- Proof
    ip_address INET,
    user_agent TEXT,
    privacy_policy_version VARCHAR(50),
    
    -- Timestamps
    granted_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GDPR export requests
CREATE TABLE IF NOT EXISTS gdpr_export_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL,
    organization_id UUID,
    
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Export details
    export_format VARCHAR(20) DEFAULT 'json',
    file_url TEXT,
    file_size_bytes INTEGER,
    
    -- Verification
    download_code_hash TEXT,
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMPTZ,
    
    processed_by UUID,
    notes TEXT
);

-- GDPR deletion requests
CREATE TABLE IF NOT EXISTS gdpr_deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL,
    organization_id UUID,
    
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    grace_period_ends_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Reason
    request_reason TEXT,
    legal_basis_override TEXT,
    
    -- Processing
    anonymized BOOLEAN DEFAULT FALSE,
    deleted_tables TEXT[],
    retained_tables TEXT[],
    retention_reason TEXT,
    
    processed_by UUID,
    verification_hash TEXT
);

-- -----------------------------------------
-- 2.4 DATA RETENTION POLICIES
-- -----------------------------------------

CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID,
    
    table_name VARCHAR(100) NOT NULL,
    data_category VARCHAR(50),
    
    retention_period_value INTEGER,
    retention_period_unit VARCHAR(20), -- days, months, years
    
    -- Actions after retention
    action_after_retention VARCHAR(20) DEFAULT 'delete', -- delete, anonymize, archive
    archive_location TEXT,
    
    -- Legal basis
    legal_basis TEXT,
    legal_reference TEXT,
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default retention policies
INSERT INTO data_retention_policies (table_name, data_category, retention_period_value, retention_period_unit, action_after_retention, legal_basis, legal_reference)
VALUES 
    ('invoices', 'fiscal', 10, 'years', 'archive', 'legal_obligation', 'Art. 2220 c.c.'),
    ('work_orders', 'operational', 5, 'years', 'anonymize', 'contract', 'Art. 2946 c.c.'),
    ('audit_logs', 'security', 2, 'years', 'delete', 'legal_obligation', 'GDPR Art. 32'),
    ('gdpr_consent_records', 'privacy', 2, 'years', 'archive', 'legal_obligation', 'GDPR Art. 7'),
    ('session_logs', 'security', 1, 'years', 'delete', 'legitimate_interest', 'GDPR Art. 6.1.f')
ON CONFLICT DO NOTHING;

-- -----------------------------------------
-- 2.5 DPIA REGISTRY
-- -----------------------------------------

CREATE TABLE IF NOT EXISTS dpia_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID,
    
    project_name VARCHAR(255),
    project_description TEXT,
    
    -- DPIA details
    high_risk_factors TEXT[],
    data_categories TEXT[],
    data_subjects_count_estimate VARCHAR(50),
    
    -- Assessment
    risk_score INTEGER, -- 1-10
    risk_level VARCHAR(20), -- low, medium, high, critical
    
    -- Mitigation
    mitigation_measures TEXT[],
    residual_risk VARCHAR(20),
    
    -- Approval
    dpi_status VARCHAR(20) DEFAULT 'draft', -- draft, review, approved, rejected
    requested_by UUID,
    reviewed_by UUID,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    
    -- Review cycle
    review_frequency_months INTEGER DEFAULT 12,
    next_review_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 3: TABLES - FATTURAZIONE ELETTRONICA SDI
-- ============================================================

-- -----------------------------------------
-- 3.1 SDI CONFIGURATION
-- -----------------------------------------

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

-- -----------------------------------------
-- 3.2 ELECTRONIC INVOICES
-- -----------------------------------------

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

-- -----------------------------------------
-- 3.3 INVOICE LINE ITEMS (for XML generation)
-- -----------------------------------------

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

-- -----------------------------------------
-- 3.4 TRANSMISSION QUEUE
-- -----------------------------------------

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

-- -----------------------------------------
-- 3.5 CONSERVAZIONE SOSTITUTIVA
-- -----------------------------------------

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

-- -----------------------------------------
-- 3.6 VAT SUMMARY (for periodic declarations)
-- -----------------------------------------

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

-- ============================================================
-- SECTION 4: TABLES - ADVANCED FEATURES 2026
-- ============================================================

-- -----------------------------------------
-- 4.1 VEHICLE KEY MANAGEMENT (Gestione Chiavi Veicolo)
-- -----------------------------------------

CREATE TABLE IF NOT EXISTS vehicle_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL ,
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

-- -----------------------------------------
-- 4.2 TECHNICAL STOPS (Fermo Tecnico)
-- -----------------------------------------

CREATE TABLE IF NOT EXISTS technical_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL ,
    work_order_id UUID ,
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

-- -----------------------------------------
-- 4.3 PENDING DECISIONS (In Attesa di Decisione)
-- -----------------------------------------

CREATE TABLE IF NOT EXISTS pending_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    odl_id UUID NOT NULL ,
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

-- -----------------------------------------
-- 4.4 QUALITY CHECKS (Workflow Qualità)
-- -----------------------------------------

CREATE TABLE IF NOT EXISTS quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    odl_id UUID NOT NULL ,
    tester_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Checklist items (15-20 punti)
    checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    
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

-- Tabella template checklist qualità
CREATE TABLE IF NOT EXISTS quality_check_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_default BOOLEAN DEFAULT false,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- -----------------------------------------
-- 4.5 CONSUMABLES TRACKING (Gestione Consumabili)
-- -----------------------------------------

CREATE TABLE IF NOT EXISTS consumables_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    odl_id UUID NOT NULL ,
    items_used JSONB NOT NULL DEFAULT '[]'::jsonb,
    technician_id UUID NOT NULL REFERENCES profiles(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    notes TEXT,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella kit consumabili predefiniti
CREATE TABLE IF NOT EXISTS consumable_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    service_type VARCHAR(100) NOT NULL, -- 'oil_change', 'brake_service', 'inspection', etc.
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_cost DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

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

-- -----------------------------------------
-- 4.6 TIME TRACKING (Time Tracking Automatico)
-- -----------------------------------------

CREATE TABLE IF NOT EXISTS time_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    odl_id UUID NOT NULL ,
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
    
    -- Metadati
    work_type VARCHAR(100) DEFAULT 'repair', -- 'repair', 'diagnostic', 'maintenance', 'warranty'
    notes TEXT,
    auto_started BOOLEAN DEFAULT false, -- True se iniziato automaticamente (presa chiavi)
    
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- -----------------------------------------
-- 4.7 NOTIFICATION QUEUE (Per job di notifica)
-- -----------------------------------------

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

-- ============================================================
-- SECTION 5: INDEXES
-- ============================================================

-- -----------------------------------------
-- 5.1 Security & Compliance Indexes
-- -----------------------------------------

CREATE INDEX idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_event ON audit_logs(event_type, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

CREATE INDEX idx_user_mfa_config_user ON user_mfa_config(user_id);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id, revoked_at);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address, attempted_at DESC);
CREATE INDEX idx_mfa_attempts_user ON mfa_attempts(user_id, attempted_at DESC);
CREATE INDEX idx_gdpr_consent_subject ON gdpr_consent_records(subject_id, purpose);
CREATE INDEX idx_gdpr_export_subject ON gdpr_export_requests(subject_id, status);
CREATE INDEX idx_gdpr_deletion_subject ON gdpr_deletion_requests(subject_id, status);

-- -----------------------------------------
-- 5.2 Fatturazione Elettronica Indexes
-- -----------------------------------------

CREATE INDEX idx_einvoices_org ON electronic_invoices(organization_id, created_at DESC);
CREATE INDEX idx_einvoices_status ON electronic_invoices(sdi_status);
CREATE INDEX idx_einvoices_customer ON electronic_invoices(customer_id);
CREATE INDEX idx_einvoices_number ON electronic_invoices(invoice_number);
CREATE INDEX idx_sdi_history_invoice ON sdi_status_history(invoice_id, created_at DESC);
CREATE INDEX idx_invoice_queue_status ON electronic_invoice_queue(status, next_attempt_at);
CREATE INDEX idx_vat_summary_period ON vat_periodic_summary(organization_id, period_year, period_number);

-- -----------------------------------------
-- 5.3 Advanced Features Indexes
-- -----------------------------------------

-- Vehicle Keys
CREATE INDEX idx_vehicle_keys_vehicle ON vehicle_keys(vehicle_id);
CREATE INDEX idx_vehicle_keys_status ON vehicle_keys(status);
CREATE INDEX idx_vehicle_keys_assigned ON vehicle_keys(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_vehicle_keys_odl ON vehicle_keys(odl_id);
CREATE INDEX idx_vehicle_keys_org ON vehicle_keys(org_id);

CREATE INDEX idx_key_logs_key ON vehicle_key_logs(key_id);
CREATE INDEX idx_key_logs_action ON vehicle_key_logs(action);
CREATE INDEX idx_key_logs_performed ON vehicle_key_logs(performed_at);

-- Technical Stops
CREATE INDEX idx_technical_stops_vehicle ON technical_stops(vehicle_id);
CREATE INDEX idx_technical_stops_status ON technical_stops(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_technical_stops_severity ON technical_stops(severity);
CREATE INDEX idx_technical_stops_org ON technical_stops(org_id);
CREATE INDEX idx_technical_stops_immobilized ON technical_stops(vehicle_immobilized) WHERE vehicle_immobilized = true;

-- Pending Decisions
CREATE INDEX idx_pending_decisions_odl ON pending_decisions(odl_id);
CREATE INDEX idx_pending_decisions_status ON pending_decisions(status);
CREATE INDEX idx_pending_decisions_customer ON pending_decisions(customer_id);
CREATE INDEX idx_pending_decisions_sent ON pending_decisions(sent_at);
CREATE INDEX idx_pending_decisions_org ON pending_decisions(org_id);
CREATE INDEX idx_pending_decisions_waiting ON pending_decisions(status, sent_at) WHERE status = 'waiting';

-- Quality Checks
CREATE INDEX idx_quality_checks_odl ON quality_checks(odl_id);
CREATE INDEX idx_quality_checks_tester ON quality_checks(tester_id);
CREATE INDEX idx_quality_checks_passed ON quality_checks(passed);
CREATE INDEX idx_quality_checks_org ON quality_checks(org_id);

CREATE INDEX idx_quality_templates_org ON quality_check_templates(org_id);
CREATE INDEX idx_quality_templates_default ON quality_check_templates(is_default) WHERE is_default = true;

-- Consumables
CREATE INDEX idx_consumables_odl ON consumables_tracking(odl_id);
CREATE INDEX idx_consumables_technician ON consumables_tracking(technician_id);
CREATE INDEX idx_consumables_timestamp ON consumables_tracking(timestamp);
CREATE INDEX idx_consumables_org ON consumables_tracking(org_id);

CREATE INDEX idx_consumable_kits_service ON consumable_kits(service_type);
CREATE INDEX idx_consumable_kits_org ON consumable_kits(org_id);

CREATE INDEX idx_consumables_inventory_sku ON consumables_inventory(sku);
CREATE INDEX idx_consumables_inventory_category ON consumables_inventory(category);
CREATE INDEX idx_consumables_inventory_low ON consumables_inventory(current_quantity, min_threshold) 
    WHERE current_quantity <= min_threshold;
CREATE INDEX idx_consumables_inventory_org ON consumables_inventory(org_id);

-- Time Tracking
CREATE INDEX idx_time_tracking_odl ON time_tracking(odl_id);
CREATE INDEX idx_time_tracking_technician ON time_tracking(technician_id);
CREATE INDEX idx_time_tracking_active ON time_tracking(technician_id, completed_at) WHERE completed_at IS NULL;
CREATE INDEX idx_time_tracking_date ON time_tracking(started_at);
CREATE INDEX idx_time_tracking_org ON time_tracking(org_id);

-- Notification Queue
CREATE INDEX idx_notification_queue_status ON notification_queue(status, priority, created_at);
CREATE INDEX idx_notification_queue_org ON notification_queue(org_id);

-- ============================================================
-- SECTION 6: RLS POLICIES
-- ============================================================

-- -----------------------------------------
-- 6.1 Enable RLS on all tables
-- -----------------------------------------

-- Security & Compliance
ALTER TABLE user_mfa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpia_registry ENABLE ROW LEVEL SECURITY;

-- Fatturazione Elettronica
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

-- Advanced Features
ALTER TABLE vehicle_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_key_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_check_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumables_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumable_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumables_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------
-- 6.2 Security & Compliance Policies
-- -----------------------------------------

-- User MFA Config policies
CREATE POLICY "Users can view own MFA config"
    ON user_mfa_config FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own MFA config"
    ON user_mfa_config FOR UPDATE
    USING (user_id = auth.uid());

-- Audit logs policies (admin only for write, users can view own)
CREATE POLICY "Users can view own audit logs"
    ON audit_logs FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'admin')
        )
    );

-- GDPR consent policies
CREATE POLICY "Users can view own consent"
    ON gdpr_consent_records FOR SELECT
    USING (subject_id = auth.uid());

CREATE POLICY "Users can update own consent"
    ON gdpr_consent_records FOR UPDATE
    USING (subject_id = auth.uid());

-- -----------------------------------------
-- 6.3 Fatturazione Elettronica Policies
-- -----------------------------------------

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

-- -----------------------------------------
-- 6.4 Advanced Features Policies
-- -----------------------------------------

-- Vehicle Keys
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
CREATE POLICY technical_stops_org_isolation ON technical_stops
    FOR ALL
    TO authenticated
    USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

-- Pending Decisions
CREATE POLICY pending_decisions_org_isolation ON pending_decisions
    FOR ALL
    TO authenticated
    USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

-- Quality Checks
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
CREATE POLICY time_tracking_org_isolation ON time_tracking
    FOR ALL
    TO authenticated
    USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

-- Notification Queue (solo admin)
CREATE POLICY notification_queue_admin ON notification_queue
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

-- ============================================================
-- SECTION 7: FUNCTIONS & TRIGGERS
-- ============================================================

-- -----------------------------------------
-- 7.1 Security & Compliance Functions
-- -----------------------------------------

-- Function to hash audit log for WORM
CREATE OR REPLACE FUNCTION calculate_audit_hash()
RETURNS TRIGGER AS $$
DECLARE
    previous_hash TEXT;
    data_to_hash TEXT;
BEGIN
    -- Get previous log hash
    SELECT log_hash INTO previous_hash
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Calculate hash of current data + previous hash
    data_to_hash := NEW.event_type || NEW.user_id::TEXT || NEW.created_at::TEXT || COALESCE(previous_hash, '');
    NEW.log_hash := encode(digest(data_to_hash, 'sha256'), 'hex');
    NEW.previous_log_hash := previous_hash;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for audit hash
CREATE TRIGGER audit_hash_trigger
    BEFORE INSERT ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_audit_hash();

-- Function to check retention and cleanup
CREATE OR REPLACE FUNCTION apply_data_retention()
RETURNS void AS $$
DECLARE
    policy RECORD;
    cutoff_date TIMESTAMPTZ;
BEGIN
    FOR policy IN SELECT * FROM data_retention_policies WHERE active = true
    LOOP
        cutoff_date := NOW() - (policy.retention_period_value || ' ' || policy.retention_period_unit)::INTERVAL;
        
        IF policy.action_after_retention = 'delete' THEN
            EXECUTE format('DELETE FROM %I WHERE created_at < $1', policy.table_name)
            USING cutoff_date;
        ELSIF policy.action_after_retention = 'anonymize' THEN
            -- Custom anonymization logic per table
            NULL;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Field-level encryption functions
-- Note: In production, use proper key management (KMS, Vault)
-- These are simplified examples

CREATE OR REPLACE FUNCTION encrypt_field(plaintext TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        pgp_sym_encrypt(
            plaintext, 
            key, 
            'cipher-algo=aes256'
        )::BYTEA,
        'base64'
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrypt_field(ciphertext TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(ciphertext, 'base64'),
        key
    );
END;
$$ LANGUAGE plpgsql;

-- Data masking functions
CREATE OR REPLACE FUNCTION mask_codice_fiscale(cf TEXT)
RETURNS TEXT AS $$
BEGIN
    IF cf IS NULL OR LENGTH(cf) < 8 THEN
        RETURN '*************';
    END IF;
    RETURN LEFT(cf, 3) || '*****' || RIGHT(cf, 2);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mask_partita_iva(piva TEXT)
RETURNS TEXT AS $$
BEGIN
    IF piva IS NULL OR LENGTH(piva) < 6 THEN
        RETURN '***********';
    END IF;
    RETURN LEFT(piva, 3) || '*****' || RIGHT(piva, 2);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mask_phone(phone TEXT)
RETURNS TEXT AS $$
BEGIN
    IF phone IS NULL OR LENGTH(phone) < 6 THEN
        RETURN '(***) ***-****';
    END IF;
    RETURN '(***) ***-' || RIGHT(phone, 4);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mask_email(email TEXT)
RETURNS TEXT AS $$
DECLARE
    at_pos INTEGER;
    local_part TEXT;
    domain TEXT;
BEGIN
    IF email IS NULL OR POSITION('@' IN email) = 0 THEN
        RETURN '***@***.com';
    END IF;
    at_pos := POSITION('@' IN email);
    local_part := LEFT(email, at_pos - 1);
    domain := SUBSTRING(email FROM at_pos);
    RETURN LEFT(local_part, 2) || '***' || domain;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------
-- 7.2 Fatturazione Elettronica Functions
-- -----------------------------------------

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

-- -----------------------------------------
-- 7.3 Advanced Features Functions
-- -----------------------------------------

-- Vehicle Keys: Trigger per aggiornare updated_at
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

-- Vehicle Keys: Funzione per loggare movimenti chiavi automaticamente
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

-- Technical Stops: Trigger per notifiche immediate su fermo tecnico critico
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

-- Pending Decisions: Funzione per verificare solleciti da inviare
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

-- Consumables: Funzione per verificare soglie minime
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

-- Consumables: Trigger per decrementare magazzino quando si usa consumabile
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

-- Time Tracking: Funzione per calcolare tempo totale
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

-- Time Tracking: Vista per riepilogo ore tecniche
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

-- ============================================================
-- SECTION 8: DEFAULT DATA
-- ============================================================

-- Quality Check Template di default
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
-- MIGRATION COMPLETE
-- ============================================================

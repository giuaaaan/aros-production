-- ============================================
-- AROS SECURITY & COMPLIANCE SCHEMA
-- GDPR, MFA, Audit Logging, Data Retention
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. MFA CONFIGURATION
-- ============================================

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

-- ============================================
-- 2. AUDIT LOGGING (WORM - Write Once Read Many)
-- ============================================

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

-- Index for audit log queries
CREATE INDEX idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_event ON audit_logs(event_type, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ============================================
-- 3. GDPR CONSENT MANAGEMENT
-- ============================================

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

-- ============================================
-- 4. DATA RETENTION POLICIES
-- ============================================

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

-- ============================================
-- 5. DPIA REGISTRY
-- ============================================

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

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_mfa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpia_registry ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- 7. FUNCTIONS & TRIGGERS
-- ============================================

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

-- ============================================
-- 8. FIELD-LEVEL ENCRYPTION FUNCTIONS
-- ============================================

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

-- ============================================
-- 9. DATA MASKING FUNCTIONS
-- ============================================

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

-- ============================================
-- 10. INDEXES
-- ============================================

CREATE INDEX idx_user_mfa_config_user ON user_mfa_config(user_id);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id, revoked_at);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address, attempted_at DESC);
CREATE INDEX idx_mfa_attempts_user ON mfa_attempts(user_id, attempted_at DESC);
CREATE INDEX idx_gdpr_consent_subject ON gdpr_consent_records(subject_id, purpose);
CREATE INDEX idx_gdpr_export_subject ON gdpr_export_requests(subject_id, status);
CREATE INDEX idx_gdpr_deletion_subject ON gdpr_deletion_requests(subject_id, status);

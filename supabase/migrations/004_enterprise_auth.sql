-- ============================================================
-- AROS ENTERPRISE AUTH SYSTEM 2026
-- Best Practices: JWT Invites, Audit Logs, RBAC, Rate Limiting
-- ============================================================

-- 1. INVITES SYSTEM (Token JWT con scadenza)
CREATE TABLE IF NOT EXISTS auth_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE, -- Hash del token JWT
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    invited_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index per lookup veloce token
CREATE INDEX idx_auth_invites_token ON auth_invites(token_hash);
CREATE INDEX idx_auth_invites_email ON auth_invites(email);
CREATE INDEX idx_auth_invites_expires ON auth_invites(expires_at);

-- 2. AUDIT LOG (Chi ha fatto cosa e quando)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL, -- 'user.created', 'invite.sent', etc
    resource_type VARCHAR(100), -- 'user', 'invite', 'organization'
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index per query audit
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- 3. RATE LIMITING (Previene brute force)
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- IP o user_id
    action VARCHAR(100) NOT NULL, -- 'login', 'invite', 'signup'
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(identifier, action, window_start)
);

CREATE INDEX idx_rate_limits_lookup ON rate_limits(identifier, action, window_start);

-- 4. SESSIONS TRACING (Sicurezza avanzata)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location JSONB, -- {country, city} da IP geolocation
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;

-- 5. PERMISSIONS SYSTEM (RBAC Granulare)
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL, -- 'users', 'organizations', 'settings'
    action VARCHAR(100) NOT NULL, -- 'read', 'write', 'delete', 'admin'
    conditions JSONB DEFAULT '{}'::jsonb, -- {organization_id: 'abc'}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(role, resource, action)
);

-- Permessi di default
INSERT INTO permissions (role, resource, action) VALUES
    ('super_admin', '*', '*'), -- Tutto permesso
    ('admin', 'users', 'read'),
    ('admin', 'users', 'write'),
    ('admin', 'organizations', 'read'),
    ('admin', 'organizations', 'write'),
    ('admin', 'analytics', 'read'),
    ('manager', 'analytics', 'read'),
    ('manager', 'users', 'read'),
    ('viewer', 'analytics', 'read')
ON CONFLICT DO NOTHING;

-- 6. SECURITY SETTINGS per organizzazione
CREATE TABLE IF NOT EXISTS security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    require_2fa BOOLEAN DEFAULT false,
    password_min_length INTEGER DEFAULT 8,
    password_require_uppercase BOOLEAN DEFAULT true,
    password_require_numbers BOOLEAN DEFAULT true,
    password_require_symbols BOOLEAN DEFAULT false,
    session_timeout_minutes INTEGER DEFAULT 480, -- 8 ore
    max_login_attempts INTEGER DEFAULT 5,
    lockout_duration_minutes INTEGER DEFAULT 30,
    allowed_domains TEXT[], -- ['@company.com']
    ip_whitelist INET[],
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- 7. PASSWORD HISTORY (Previene reuse)
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_password_history_user ON password_history(user_id, changed_at DESC);

-- ============================================================
-- FUNCTIONS ENTERPRISE
-- ============================================================

-- Funzione: Log audit automatico
CREATE OR REPLACE FUNCTION log_audit(
    p_user_id UUID,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id UUID,
    p_ip_address INET,
    p_user_agent TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_severity VARCHAR DEFAULT 'info'
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, metadata, severity)
    VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_ip_address, p_user_agent, p_metadata, p_severity)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione: Verifica rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier VARCHAR,
    p_action VARCHAR,
    p_max_requests INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
    v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    v_window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Conta richieste nella finestra
    SELECT COALESCE(SUM(count), 0) INTO v_count
    FROM rate_limits
    WHERE identifier = p_identifier
      AND action = p_action
      AND window_start > v_window_start;
    
    -- Se supera il limite, rifiuta
    IF v_count >= p_max_requests THEN
        RETURN false;
    END IF;
    
    -- Altrimenti incrementa contatore
    INSERT INTO rate_limits (identifier, action, count, window_start)
    VALUES (p_identifier, p_action, 1, date_trunc('hour', now()))
    ON CONFLICT (identifier, action, window_start)
    DO UPDATE SET count = rate_limits.count + 1;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione: Verifica permesso RBAC
CREATE OR REPLACE FUNCTION has_permission(
    p_user_id UUID,
    p_resource VARCHAR,
    p_action VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
    v_has_permission BOOLEAN;
BEGIN
    -- Prendi ruolo utente
    SELECT role INTO v_role
    FROM profiles
    WHERE id = p_user_id;
    
    -- Verifica super_admin (tutto permesso)
    IF v_role = 'super_admin' THEN
        RETURN true;
    END IF;
    
    -- Verifica permesso specifico
    SELECT EXISTS(
        SELECT 1 FROM permissions
        WHERE role = v_role
          AND (resource = p_resource OR resource = '*')
          AND (action = p_action OR action = '*')
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione: Pulizia sessioni vecchie
CREATE OR REPLACE FUNCTION cleanup_old_sessions() RETURNS void AS $$
BEGIN
    UPDATE user_sessions
    SET is_active = false, ended_at = now()
    WHERE is_active = true
      AND last_seen < now() - INTERVAL '8 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Aggiorna last_seen su sessione
CREATE OR REPLACE FUNCTION update_session_last_seen() RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_sessions
    SET last_seen = now()
    WHERE user_id = NEW.user_id
      AND is_active = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS POLICIES (Row Level Security)
-- ============================================================

ALTER TABLE auth_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Solo super_admin può vedere tutti gli inviti
CREATE POLICY auth_invites_super_admin ON auth_invites
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    ));

-- Utenti possono vedere solo i propri audit logs
CREATE POLICY audit_logs_own ON audit_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Super_admin vede tutti i log
CREATE POLICY audit_logs_super_admin ON audit_logs
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    ));

-- Sessions: utente vede solo le proprie
CREATE POLICY user_sessions_own ON user_sessions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

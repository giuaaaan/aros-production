import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Questo endpoint esegue la migration 004_enterprise_auth.sql
// Richiede super_admin per sicurezza

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verifica autenticazione
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verifica super_admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null };
      
    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden - Super Admin only" }, { status: 403 });
    }
    
    // SQL Migration
    const migrationSQL = `
-- AROS ENTERPRISE AUTH SYSTEM 2026

-- 1. INVITES SYSTEM
CREATE TABLE IF NOT EXISTS auth_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    invited_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_auth_invites_token ON auth_invites(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_invites_email ON auth_invites(email);

-- 2. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    severity VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- 3. RATE LIMITS
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(identifier, action, window_start)
);

-- 4. PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    conditions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(role, resource, action)
);

-- Permessi default
INSERT INTO permissions (role, resource, action) VALUES
    ('super_admin', '*', '*'),
    ('admin', 'users', 'read'),
    ('admin', 'users', 'write'),
    ('admin', 'organizations', 'read'),
    ('admin', 'organizations', 'write'),
    ('admin', 'analytics', 'read'),
    ('manager', 'analytics', 'read'),
    ('manager', 'users', 'read'),
    ('viewer', 'analytics', 'read')
ON CONFLICT DO NOTHING;

-- 5. FUNCTIONS
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

-- Enable RLS
ALTER TABLE auth_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS auth_invites_super_admin ON auth_invites
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY IF NOT EXISTS audit_logs_super_admin ON audit_logs
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
`;

    // Esegui migration tramite RPC raw SQL
    const { error } = await (supabase.rpc as any)("exec_sql", { sql: migrationSQL });
    
    if (error) {
      // Se exec_sql non esiste, proviamo con metodo alternativo
      console.log("Migration error (exec_sql may not exist):", error);
      
      return NextResponse.json({
        success: false,
        error: "Migration failed. Please run SQL manually in Supabase SQL Editor.",
        sql: migrationSQL,
      }, { status: 500 });
    }
    
    // Log audit
    await (supabase.rpc as any)("log_audit", {
      p_user_id: user.id,
      p_action: "migration.executed",
      p_resource_type: "system",
      p_resource_id: null,
      p_ip_address: request.headers.get("x-forwarded-for") || null,
      p_user_agent: request.headers.get("user-agent") || null,
      p_metadata: { migration: "004_enterprise_auth" },
      p_severity: "info",
    });
    
    return NextResponse.json({
      success: true,
      message: "Migration 004_enterprise_auth applied successfully",
    });
    
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed" },
      { status: 500 }
    );
  }
}

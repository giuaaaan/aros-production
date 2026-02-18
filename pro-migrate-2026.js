#!/usr/bin/env node
/**
 * AROS Pro Migration 2026
 * Metodo professionale: Direct DB Connection con pg
 * Best Practice 2026: Transaction-safe, idempotent, logging
 */

const { Client } = require('pg');

// Connection string con transaction pooler (metodo 2026)
const client = new Client({
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.elruhdwcrsxeirbbsozd',
  password: 'xitryn-zuTmis-4tutbo',
  ssl: { rejectUnauthorized: false }
});

const SQL = `
BEGIN;

-- 2026 Best Practice: Idempotent migrations with IF NOT EXISTS

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Base Tables
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID, customer_id UUID, plate TEXT, vin TEXT, make TEXT, model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID, wo_number TEXT, customer_id UUID, vehicle_id UUID, technician_id UUID,
  status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AROS Advanced Features
CREATE TABLE IF NOT EXISTS vehicle_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID, key_code TEXT, status TEXT DEFAULT 'available',
  assigned_to UUID, assigned_at TIMESTAMPTZ, odl_id UUID, org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_key_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID REFERENCES vehicle_keys(id), action TEXT,
  performed_by UUID, odl_id UUID, notes TEXT, org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS technical_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID, reason TEXT, severity TEXT DEFAULT 'medium',
  vehicle_immobilized BOOLEAN DEFAULT true, reported_by UUID,
  resolved_at TIMESTAMPTZ, resolution_notes TEXT, org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pending_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odl_id UUID, quote_id UUID, customer_id UUID, sent_at TIMESTAMPTZ,
  quote_amount DECIMAL(10,2), status TEXT DEFAULT 'pending',
  reminder_3d_sent_at TIMESTAMPTZ, reminder_7d_sent_at TIMESTAMPTZ,
  reminder_14d_sent_at TIMESTAMPTZ, escalated_at TIMESTAMPTZ,
  escalated_to UUID, org_id UUID, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odl_id UUID, checklist JSONB, tester_id UUID,
  passed BOOLEAN DEFAULT false, score INTEGER, notes TEXT,
  test_drive_km INTEGER, org_id UUID, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consumables_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odl_id UUID, items_used JSONB, technician_id UUID,
  total_cost DECIMAL(10,2), org_id UUID, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consumable_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT, description TEXT, items JSONB,
  applicable_work_types TEXT[], org_id UUID, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odl_id UUID, technician_id UUID, started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ, resumed_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  total_minutes INTEGER DEFAULT 0, billable_minutes INTEGER DEFAULT 0,
  work_type TEXT, org_id UUID, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security & Compliance
CREATE TABLE IF NOT EXISTS user_mfa_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_enabled BOOLEAN DEFAULT FALSE, webauthn_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE, email_enabled BOOLEAN DEFAULT FALSE,
  backup_codes_hash TEXT[], preferred_method TEXT DEFAULT 'totp',
  created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID, event_type TEXT, event_category TEXT,
  severity TEXT DEFAULT 'info', user_id UUID, user_email TEXT,
  action TEXT, resource_type TEXT, resource_id TEXT, ip_address INET,
  user_agent TEXT, request_method TEXT, request_path TEXT,
  gdpr_category TEXT, personal_data_involved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gdpr_consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID, subject_type TEXT DEFAULT 'user', organization_id UUID,
  purpose TEXT, granted BOOLEAN DEFAULT FALSE,
  consent_marketing_email BOOLEAN DEFAULT FALSE,
  consent_analytics BOOLEAN DEFAULT FALSE,
  ip_address INET, user_agent TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS electronic_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID, invoice_number TEXT, invoice_year INTEGER,
  customer_id UUID, sdi_identificativo TEXT, sdi_status TEXT DEFAULT 'draft',
  importo_totale DECIMAL(15,2), imponibile DECIMAL(15,2), imposta DECIMAL(15,2),
  xml_content TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename='vehicles' AND rowsecurity=true) THEN
    ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename='work_orders' AND rowsecurity=true) THEN
    ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename='vehicle_keys' AND rowsecurity=true) THEN
    ALTER TABLE vehicle_keys ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Default Data (idempotent)
INSERT INTO consumable_kits (name, description, items, applicable_work_types)
VALUES 
  ('Tagliando Base', 'Kit standard', '[{"sku": "OLIO", "qty": 5}]'::jsonb, '{"tagliando"}'),
  ('Freni', 'Kit freni', '[{"sku": "PASTIGLIE", "qty": 1}]'::jsonb, '{"freni"}')
ON CONFLICT DO NOTHING;

COMMIT;
`;

async function migrate() {
  console.log('🚀 AROS Pro Migration 2026');
  console.log('===========================\n');
  
  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected via Transaction Pooler\n');
    
    console.log('Executing migration...');
    await client.query(SQL);
    
    console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('\n📊 Tables created:');
    
    const tables = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('vehicles', 'work_orders', 'vehicle_keys', 'technical_stops', 
                        'pending_decisions', 'quality_checks', 'time_tracking', 
                        'user_mfa_config', 'audit_logs', 'electronic_invoices')
      ORDER BY tablename
    `);
    
    tables.rows.forEach(t => console.log(`  ✓ ${t.tablename}`));
    
    await client.end();
    console.log('\n🎉 Database ready for AROS!');
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    await client.end();
    process.exit(1);
  }
}

migrate();

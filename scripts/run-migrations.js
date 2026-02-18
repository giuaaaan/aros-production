#!/usr/bin/env node
/**
 * AROS Database Migration Runner
 * Usage: node run-migrations.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://elruhdwcrsxeirbbsozd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscnVoZHdjcnN4ZWlyYmJzb3pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQyNzMyNiwiZXhwIjoyMDg3MDAzMzI2fQ.aeFn5B3TZNMnfjxQwZ5kQNn-i38l0erIPAs71Vk3vl8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const SQL = `
-- Base extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Base tables
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

-- Advanced features
CREATE TABLE IF NOT EXISTS vehicle_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID,
  key_code TEXT,
  status TEXT DEFAULT 'available',
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  odl_id UUID,
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS technical_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID,
  reason TEXT,
  severity TEXT DEFAULT 'medium',
  vehicle_immobilized BOOLEAN DEFAULT true,
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pending_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  odl_id UUID,
  sent_at TIMESTAMPTZ,
  quote_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  odl_id UUID,
  checklist JSONB,
  passed BOOLEAN DEFAULT false,
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consumables_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  odl_id UUID,
  items_used JSONB,
  technician_id UUID,
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  odl_id UUID,
  technician_id UUID,
  started_at TIMESTAMPTZ,
  total_minutes INTEGER DEFAULT 0,
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MFA & Security
CREATE TABLE IF NOT EXISTS user_mfa_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_enabled BOOLEAN DEFAULT FALSE,
  webauthn_enabled BOOLEAN DEFAULT FALSE,
  backup_codes_hash TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT,
  user_id UUID,
  action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gdpr_consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID,
  purpose TEXT,
  granted BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Electronic invoices
CREATE TABLE IF NOT EXISTS electronic_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID,
  invoice_number TEXT,
  invoice_year INTEGER,
  sdi_status TEXT DEFAULT 'draft',
  importo_totale DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumables_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking ENABLE ROW LEVEL SECURITY;
`;

async function main() {
  console.log('🚀 AROS Database Setup\n');
  
  const statements = SQL.split(';').filter(s => s.trim());
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim() + ';';
    const preview = stmt.substring(0, 40).replace(/\s+/g, ' ') + '...';
    
    process.stdout.write(`[${i+1}/${statements.length}] ${preview}`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt });
      if (error) {
        if (error.message.includes('already exists')) {
          process.stdout.write(' (exists)\n');
          success++;
        } else {
          process.stdout.write(` ERROR: ${error.message.substring(0, 50)}\n`);
          failed++;
        }
      } else {
        process.stdout.write(' OK\n');
        success++;
      }
    } catch (err) {
      process.stdout.write(` ERROR\n`);
      failed++;
    }
  }
  
  console.log(`\n✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(failed === 0 ? '\n🎉 Database ready!' : '\n⚠️ Some errors occurred');
}

main().catch(console.error);

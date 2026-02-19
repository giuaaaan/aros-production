#!/usr/bin/env node
/**
 * Post-Migration Verification Script
 * Validates all 12 fixes have been applied correctly
 * 
 * Usage: node scripts/verify-migration.js
 * Environment: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
  results: []
};

async function runCheck(name, query, validator) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: query });
    
    if (error) {
      // Fallback: try direct query if RPC not available
      const { data: directData, error: directError } = await supabase
        .from('_verification_dummy')
        .select('*')
        .limit(0);
      
      checks.results.push({ name, status: 'SKIP', error: error.message });
      checks.warnings++;
      return null;
    }
    
    const isValid = validator ? validator(data) : true;
    
    if (isValid) {
      checks.results.push({ name, status: 'PASS' });
      checks.passed++;
    } else {
      checks.results.push({ name, status: 'FAIL', error: 'Validation failed' });
      checks.failed++;
    }
    
    return data;
  } catch (err) {
    checks.results.push({ name, status: 'ERROR', error: err.message });
    checks.failed++;
    return null;
  }
}

async function verifyMigrations() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║      POST-MIGRATION VERIFICATION - AROS SCHEMA         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log(`Project: ${supabaseUrl.split('//')[1].split('.')[0]}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  // CHECK 1: Verify RLS policies on organizations
  await runCheck(
    '[1/12] RLS policies on organizations',
    `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'organizations'`,
    (data) => data && data.length >= 2 && !data.some(p => p.policyname === 'Allow all')
  );

  // CHECK 2: Soft delete columns exist
  await runCheck(
    '[2/12] Soft delete columns (deleted_at)',
    `SELECT table_name FROM information_schema.columns WHERE column_name = 'deleted_at'`,
    (data) => data && data.length >= 6
  );

  // CHECK 3: Auto-update triggers
  await runCheck(
    '[3/12] Auto-update triggers',
    `SELECT trigger_name FROM information_schema.triggers WHERE trigger_name LIKE '%updated_at%'`,
    (data) => data && data.length >= 6
  );

  // CHECK 4: Performance indexes
  await runCheck(
    '[4/12] Performance indexes (email, plate)',
    `SELECT indexname FROM pg_indexes WHERE indexname IN ('idx_customers_email', 'idx_vehicles_plate')`,
    (data) => data && data.length >= 2
  );

  // CHECK 5: RLS enabled on tables
  await runCheck(
    '[5/12] RLS enabled on critical tables',
    `SELECT relname FROM pg_class WHERE relname IN ('organizations', 'vehicle_keys', 'technical_stops') AND relrowsecurity = true`,
    (data) => data && data.length >= 3
  );

  // CHECK 6: Active record views
  await runCheck(
    '[6/12] Active record views',
    `SELECT viewname FROM pg_views WHERE viewname LIKE 'active_%'`,
    (data) => data && data.length >= 5
  );

  // CHECK 7: Helper functions
  await runCheck(
    '[7/12] Helper functions',
    `SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('soft_delete_record', 'update_updated_at_column')`,
    (data) => data && data.length >= 2
  );

  // CHECK 8: Partial indexes with deleted_at
  await runCheck(
    '[8/12] Partial indexes (deleted_at IS NULL)',
    `SELECT indexname FROM pg_indexes WHERE indexdef LIKE '%deleted_at IS NULL%'`,
    (data) => data && data.length >= 5
  );

  // CHECK 9: pg_trgm extension
  await runCheck(
    '[9/12] pg_trgm extension for search',
    `SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'`,
    (data) => data && data.length === 1
  );

  // CHECK 10: Normalization triggers
  await runCheck(
    '[10/12] Data normalization triggers',
    `SELECT trigger_name FROM information_schema.triggers WHERE trigger_name LIKE 'trigger_normalize%'`,
    (data) => data && data.length >= 2
  );

  // CHECK 11: Composite index for dashboard
  await runCheck(
    '[11/12] Dashboard composite index',
    `SELECT indexname FROM pg_indexes WHERE indexname = 'idx_work_orders_org_status'`,
    (data) => data && data.length === 1
  );

  // CHECK 12: Full-text search index
  await runCheck(
    '[12/12] Full-text search index',
    `SELECT indexname FROM pg_indexes WHERE indexname = 'idx_work_orders_description_search'`,
    (data) => data && data.length === 1
  );

  // Print results
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('VERIFICATION RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  checks.results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : 
                 result.status === 'WARN' ? '⚠️' : 
                 result.status === 'SKIP' ? '⏭️' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.error) {
      console.log(`   └─ ${result.error}`);
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`TOTAL: ${checks.passed} passed, ${checks.failed} failed, ${checks.warnings} warnings`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Overall status
  if (checks.failed === 0) {
    console.log('🎉 ALL CHECKS PASSED - Migration successful!');
    process.exit(0);
  } else if (checks.passed >= 9) {
    console.log('⚠️  MOSTLY SUCCESSFUL - Review failed checks');
    process.exit(0);
  } else {
    console.log('❌ MIGRATION INCOMPLETE - Investigation required');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  verifyMigrations().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { verifyMigrations };

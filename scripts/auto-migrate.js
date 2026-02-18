#!/usr/bin/env node
/**
 * AROS Auto-Migration Script
 * Esegue tutte le migration SQL automaticamente
 * 
 * Usage: SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node auto-migrate.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurazione
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://elruhdwcrsxeirbbsozd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERRORE: Serve SUPABASE_SERVICE_ROLE_KEY');
  console.log('\n📋 Come ottenerla:');
  console.log('1. Vai su https://supabase.com/dashboard/project/elruhdwcrsxeirbbsozd/settings/api');
  console.log('2. Copia la chiave "service_role" (inizia con eyJ...)');
  console.log('3. Incollala qui sotto:\n');
  process.exit(1);
}

// File migration da eseguire (in ordine)
const MIGRATIONS = [
  '000_base_tables.sql',           // Tabelle base (vehicles, customers, etc.)
  '999_complete_migration.sql'     // Tabelle avanzate (chiavi, time tracking, etc.)
];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testConnection() {
  console.log('🔌 Testing connection to Supabase...');
  const { data, error } = await supabase.from('organizations').select('count').limit(1);
  if (error && error.code !== '42P01') { // 42P01 = table doesn't exist (ok for first run)
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
  console.log('✅ Connected to Supabase!\n');
}

function splitSQL(sql) {
  // Split statements mantenendo $$...$$ blocks
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextTwo = sql.slice(i, i + 2);
    
    // Check for dollar quote start
    if (!inDollarQuote && char === '$' && /\$\w*\$/.test(sql.slice(i, i + 10))) {
      const match = sql.slice(i).match(/^(\$\w*\$)/);
      if (match) {
        inDollarQuote = true;
        dollarTag = match[1];
        current += match[1];
        i += match[1].length - 1;
        continue;
      }
    }
    
    // Check for dollar quote end
    if (inDollarQuote && sql.slice(i, i + dollarTag.length) === dollarTag) {
      inDollarQuote = false;
      current += dollarTag;
      i += dollarTag.length - 1;
      dollarTag = '';
      continue;
    }
    
    // Statement separator
    if (!inDollarQuote && char === ';') {
      current += char;
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = '';
      continue;
    }
    
    current += char;
  }
  
  // Add last statement if exists
  if (current.trim()) {
    statements.push(current.trim());
  }
  
  return statements.filter(s => s.length > 0);
}

async function executeMigration(fileName) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fileName}, skipping...`);
    return { success: true, skipped: true };
  }
  
  console.log(`\n📄 Executing: ${fileName}`);
  console.log('=' .repeat(60));
  
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = splitSQL(sql);
  
  console.log(`Found ${statements.length} SQL statements`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\s+/g, ' ').substring(0, 80) + '...';
    
    process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt });
      
      if (error) {
        // Try without RPC (direct REST API)
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({ query: stmt })
        });
        
        if (!response.ok) {
          const errText = await response.text();
          // Check if it's a "function not found" error
          if (errText.includes('Could not find the public.exec_sql') || errText.includes('404')) {
            console.log('\n\n❌ La funzione exec_sql non esiste!');
            console.log('📋 Devi crearla prima:');
            console.log('1. Vai su Supabase SQL Editor');
            console.log('2. Esegui questo:');
            console.log(`
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
            `);
            process.exit(1);
          }
          throw new Error(errText);
        }
      }
      
      console.log(' ✅');
      successCount++;
    } catch (err) {
      console.log(` ❌ ${err.message}`);
      errorCount++;
      
      // Continue on error but track it
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log('      (ignoring - object already exists)');
        errorCount--; // Don't count as error if it already exists
      }
    }
  }
  
  console.log('=' .repeat(60));
  console.log(`✅ Success: ${successCount} | ❌ Errors: ${errorCount}`);
  
  return { success: errorCount === 0, successCount, errorCount };
}

async function main() {
  console.log('🚀 AROS Database Auto-Migration');
  console.log('================================\n');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...\n`);
  
  await testConnection();
  
  // Check if exec_sql function exists
  console.log('🔍 Checking exec_sql function...');
  const { data: funcCheck, error: funcError } = await supabase
    .from('pg_proc')
    .select('proname')
    .eq('proname', 'exec_sql')
    .single();
  
  if (funcError || !funcCheck) {
    console.log('⚠️  Function exec_sql not found. Creating it first...\n');
    
    const createFuncSQL = `
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
    `.trim();
    
    // Try to create via REST API directly
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Prefer': 'tx=commit'
        },
        body: JSON.stringify({ query: createFuncSQL })
      });
      
      if (!response.ok) {
        console.log('⚠️  Could not auto-create function.');
        console.log('📋 Please create it manually in SQL Editor:\n');
        console.log(createFuncSQL);
        console.log('\nThen run this script again.');
        process.exit(1);
      }
    } catch (e) {
      // Fallback: execute statements one by one via REST
    }
  }
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  for (const migration of MIGRATIONS) {
    const result = await executeMigration(migration);
    if (!result.skipped) {
      totalSuccess += result.successCount || 0;
      totalErrors += result.errorCount || 0;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Statements: ${totalSuccess + totalErrors}`);
  console.log(`✅ Successful: ${totalSuccess}`);
  console.log(`❌ Errors: ${totalErrors}`);
  
  if (totalErrors === 0) {
    console.log('\n🎉 All migrations completed successfully!');
    console.log('AROS database is ready! 🚀\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some migrations had errors.');
    console.log('Check the logs above for details.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});

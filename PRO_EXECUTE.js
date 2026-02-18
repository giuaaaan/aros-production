#!/usr/bin/env node
/**
 * AROS - PROFESSIONAL DATABASE SETUP
 * Connessione diretta PostgreSQL a Supabase
 */

const { Client } = require('pg');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(q) {
  return new Promise(resolve => rl.question(q, resolve));
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     AROS - PROFESSIONAL DATABASE SETUP                      ║');
  console.log('║     Connessione PostgreSQL Diretta                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Richiedi connection string
  console.log('📋 Ottieni la Connection String da Supabase:');
  console.log('   1. Vai su https://supabase.com/dashboard/project/elruhdwcrsxeirbbsozd/settings/database');
  console.log('   2. Sezione "Connection String"');
  console.log('   3. Scegli "URI" o "PSQL"');
  console.log('   4. Copia la stringa (inizia con postgresql://...)\n');
  
  let connString = await ask('🔐 Incolla la Connection String: ');
  
  if (!connString.includes('postgresql://')) {
    console.log('❌ Connection string non valida!');
    rl.close();
    return;
  }
  
  // Controlla se ha il placeholder
  if (connString.includes('[YOUR-PASSWORD]')) {
    console.log('⚠️  Trovato placeholder [YOUR-PASSWORD]');
    const password = await ask('🔑 Inserisci la password reale del database: ');
    connString = connString.replace('[YOUR-PASSWORD]', password);
  }

  console.log('\n🔄 Connessione al database...');
  
  const client = new Client({
    connectionString: connString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connessione riuscita!\n');

    // Test semplice
    const testResult = await client.query('SELECT NOW() as time');
    console.log('🕐 Server time:', testResult.rows[0].time);

    // Leggi file SQL
    const sqlFile = 'COMPLETE_SETUP.sql';
    console.log(`\n📄 Lettura ${sqlFile}...`);
    const sql = fs.readFileSync(sqlFile, 'utf-8');
    
    // Dividi in statement
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    console.log(`📝 Trovati ${statements.length} statement SQL\n`);

    // Esegui
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim() + ';';
      process.stdout.write(`   [${i + 1}/${statements.length}] Esecuzione...\r`);
      
      try {
        await client.query(stmt);
        success++;
      } catch (err) {
        failed++;
        // Ignora errori tipo "already exists"
        if (!err.message.includes('already exists')) {
          console.log(`\n   ⚠️  Statement ${i + 1} fallito: ${err.message.substring(0, 80)}`);
        }
      }
    }

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ SETUP COMPLETATO!                                        ║');
    console.log(`║     Success: ${success} | Failed: ${failed}                          ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');

    await client.end();

  } catch (error) {
    console.error('\n❌ Errore connessione:', error.message);
    console.log('\nPossibili cause:');
    console.log('   - Connection string errata');
    console.log('   - Password errata');
    console.log('   - Database non accessibile da questo IP (controlla Network Restrictions)');
  }

  rl.close();
}

main();

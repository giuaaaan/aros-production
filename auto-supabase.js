#!/usr/bin/env node
/**
 * AROS - Automazione Supabase SQL Editor
 * Usa Playwright per automatizzare il browser
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  supabaseProject: 'elruhdwcrsxeirbbsozd',
  sqlFile: 'COMPLETE_SETUP.sql',
  email: process.env.SUPABASE_EMAIL || '',
  password: process.env.SUPABASE_PASSWORD || ''
};

async function main() {
  console.log('🚀 Avvio automazione Supabase...');
  
  const sql = fs.readFileSync(path.join(__dirname, CONFIG.sqlFile), 'utf-8');
  console.log(`📄 SQL caricato: ${sql.length} caratteri`);
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Vai al SQL Editor
  const url = `https://supabase.com/dashboard/project/${CONFIG.supabaseProject}/sql/new`;
  console.log(`🔗 Apertura: ${url}`);
  
  await page.goto(url);
  
  // Attendi login manuale
  console.log('');
  console.log('⚠️  LOGIN MANUALE RICHIESTO');
  console.log('   1. Inserisci email e password su Supabase');
  console.log('   2. Clicca "Sign in"');
  console.log('   3. Aspetta che lo script continui automaticamente...');
  console.log('');
  
  // Attendi che l'utente faccia login (massimo 2 minuti)
  await page.waitForSelector('.monaco-editor', { timeout: 120000 });
  
  console.log('✅ Login rilevato! Inserimento SQL...');
  
  // Clicca nell'editor
  await page.click('.monaco-editor');
  
  // Seleziona tutto e cancella
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  
  // Inserisci SQL a blocchi (per evitare crash)
  const chunks = sql.match(/[\s\S]{1,50000}/g) || [sql];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`   Inserimento chunk ${i + 1}/${chunks.length}...`);
    await page.keyboard.type(chunks[i], { delay: 1 });
  }
  
  console.log('✅ SQL inserito!');
  console.log('');
  console.log('🎯 Prossimi passi MANUALI:');
  console.log('   1. Clicca il pulsante "Run" (play) in alto a destra');
  console.log('   2. Attendi il completamento');
  console.log('   3. Verifica il messaggio "Success"');
  console.log('');
  console.log('⏳ Il browser rimane aperto per 5 minuti...');
  
  await page.waitForTimeout(300000);
  await browser.close();
}

main().catch(err => {
  console.error('❌ Errore:', err.message);
  process.exit(1);
});

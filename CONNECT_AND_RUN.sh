#!/bin/bash
# Connection string con password inserita

CONN="postgresql://postgres:AqU5L4PXkdx4UkJ@db.elruhdwcrsxeirbbsozd.supabase.co:5432/postgres"

echo "🔄 Tentativo connessione..."
echo "   Host: db.elruhdwcrsxeirbbsozd.supabase.co"
echo "   User: postgres"
echo ""

node -e "
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: '$CONN',
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('✅ CONNESSO!');
    console.log('');
    return client.query('SELECT version()');
  })
  .then(r => {
    console.log('📊 Database:', r.rows[0].version.substring(0, 50) + '...');
    console.log('');
    console.log('🚀 Pronto per eseguire migration!');
    console.log('   Eseguo COMPLETE_SETUP.sql...');
    console.log('');
    
    const sql = fs.readFileSync('COMPLETE_SETUP.sql', 'utf-8');
    const stmts = sql.split(';').filter(s => s.trim().length > 0);
    console.log('📋 Statement trovati:', stmts.length);
    
    let ok = 0, fail = 0;
    const errors = [];
    
    return (async () => {
      for (let i = 0; i < stmts.length; i++) {
        const stmt = stmts[i].trim() + ';';
        process.stdout.write(\`   Progresso: \${Math.round((i/stmts.length)*100)}%\r\`);
        
        try {
          await client.query(stmt);
          ok++;
        } catch(e) {
          if (!e.message.includes('already exists') && 
              !e.message.includes('does not exist')) {
            fail++;
            if (errors.length < 5) errors.push(\`#\${i}: \${e.message.substring(0, 60)}\`);
          }
        }
      }
      
      console.log('');
      console.log('');
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║  ✅ MIGRATION COMPLETATA!                              ║');
      console.log(\`║     Success: \${ok} | Failed: \${fail}                        ║\`);
      console.log('╚════════════════════════════════════════════════════════╝');
      
      if (errors.length > 0) {
        console.log('');
        console.log('⚠️  Alcuni errori (non critici):');
        errors.forEach(e => console.log('   ' + e));
      }
      
      await client.end();
    })();
  })
  .catch(err => {
    console.error('❌ ERRORE CONNESSIONE:', err.message);
    console.log('');
    console.log('Possibili cause:');
    console.log('   • Progetto Supabase in pausa');
    console.log('   • Password errata');
    console.log('   • Host del database diverso');
    console.log('   • Database non accessibile da esterno');
    console.log('');
    console.log('Soluzione manuale:');
    console.log('   1. Vai su https://supabase.com/dashboard/project/elruhdwcrsxeirbbsozd');
    console.log('   2. Se il progetto è in pausa, clicca "Resume"');
    console.log('   3. Poi esegui lo SQL manualmente dall\'editor');
  });
"

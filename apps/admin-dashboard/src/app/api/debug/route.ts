import { NextResponse } from "next/server";

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV,
    },
    supabase_config: {
      url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      service_key_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url_preview: process.env.NEXT_PUBLIC_SUPABASE_URL 
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...'
        : 'NOT SET',
    }
  };
  
  try {
    // Test 1: Import Supabase
    const { createClient } = await import('@supabase/supabase-js');
    diagnostics.tests = { import: 'success' };
    
    // Test 2: Create client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    diagnostics.tests.client_creation = 'success';
    
    // Test 3: Query organizations
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);
    
    if (error) {
      diagnostics.tests.query = { status: 'error', message: error.message, code: error.code };
    } else {
      diagnostics.tests.query = { status: 'success', data };
    }
    
    // Test 4: List tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', { sql: "SELECT tablename FROM pg_tables WHERE schemaname='public' LIMIT 10" })
      .catch(() => ({ data: null, error: 'rpc not available' }));
    
    diagnostics.tables = tables || tablesError;
    
  } catch (e) {
    diagnostics.tests = { ...diagnostics.tests, exception: String(e) };
  }
  
  return NextResponse.json(diagnostics);
}

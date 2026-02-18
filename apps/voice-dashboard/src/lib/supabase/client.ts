'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client
 * Best practice 2026: Cookie-based auth, NEVER localStorage for tokens
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error(
      'Configurazione Supabase mancante. ' +
      'Verifica che NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY siano configurati.'
    );
  }
  
  return createBrowserClient(url, key);
}

// Singleton per performance
let browserClient: ReturnType<typeof createClient> | null = null;

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}

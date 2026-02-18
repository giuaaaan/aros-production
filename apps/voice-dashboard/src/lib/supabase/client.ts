'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client
 * Best practice 2026: Cookie-based auth, NEVER localStorage for tokens
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton per performance
let browserClient: ReturnType<typeof createClient> | null = null;

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}

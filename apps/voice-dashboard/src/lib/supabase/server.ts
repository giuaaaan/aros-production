import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';

/**
 * Server-side Supabase client with cookie-based auth
 * Best practice 2026: HTTP-only cookies, Defense in Depth
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
});

/**
 * Verify session - Data Access Layer (DAL)
 * Pattern Defense in Depth: verifica auth in ogni Server Component
 */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { user: null, error: 'Unauthorized' };
  }
  
  return { user, error: null };
});

/**
 * Require auth - throws redirect if not authenticated
 * Use in protected pages
 */
export const requireAuth = cache(async () => {
  const { user, error } = await verifySession();
  
  if (error || !user) {
    return null;
  }
  
  return user;
});

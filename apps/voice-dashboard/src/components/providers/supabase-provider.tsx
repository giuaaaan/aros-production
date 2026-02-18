'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

type SupabaseContext = {
  supabase: SupabaseClient<Database> | null;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
};

const Context = createContext<SupabaseContext>({
  supabase: null,
  user: null,
  isLoading: true,
  error: null,
});

// Create a dummy client for build time when env vars are not available
function createSafeClient(): SupabaseClient<Database> | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn('Supabase environment variables not configured');
    return null;
  }
  
  try {
    return createBrowserClient<Database>(url, key);
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);

  useEffect(() => {
    const client = createSafeClient();
    setSupabase(client);
    
    if (!client) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: { subscription } } = client.auth.onAuthStateChange(
        (event, session) => {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      );

      client.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      return () => subscription.unsubscribe();
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  return (
    <Context.Provider value={{ supabase, user, isLoading, error }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }
  return context;
};

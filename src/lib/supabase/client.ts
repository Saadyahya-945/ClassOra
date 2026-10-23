import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return null or fallback dummy client to avoid throwing on client-side renders before env setup
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

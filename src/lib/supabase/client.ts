import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const isBrowser = typeof window !== "undefined";

  browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: isBrowser,
      flowType: 'pkce',
    },
  });
  return browserClient;
}

export async function clearAuthSession() {
  if (typeof window === "undefined") return;
  
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
  
  // Clear any stored session data
  localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
  sessionStorage.clear();
}

// Make clearAuthSession available globally for debugging
if (typeof window !== "undefined") {
  (window as any).clearAuthSession = clearAuthSession;
}



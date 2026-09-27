import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const environment = (import.meta.env ?? {}) as Record<string, string | undefined>;
const url = environment.VITE_SUPABASE_URL;
const anonKey = environment.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(
  url?.trim() && anonKey?.trim() && !url.includes("your-project"),
);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured || !url || !anonKey) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

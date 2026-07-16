import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function hasYmSupabase(): boolean {
  return Boolean(
    process.env.YM_SUPABASE_URL && process.env.YM_SUPABASE_SERVICE_ROLE_KEY,
  );
}

/** Server-only Supabase client for Yellow Metal private data. Never import in client components. */
export function getYmSupabase(): SupabaseClient {
  const url = process.env.YM_SUPABASE_URL;
  const key = process.env.YM_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("YM_SUPABASE_URL / YM_SUPABASE_SERVICE_ROLE_KEY are not configured");
  }
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

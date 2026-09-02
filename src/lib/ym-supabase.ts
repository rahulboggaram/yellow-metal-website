import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function hasYmSupabase(): boolean {
  return Boolean(
    process.env.YM_SUPABASE_URL && process.env.YM_SUPABASE_SERVICE_ROLE_KEY,
  );
}

/** True on Vercel (Production / Preview / Development deployments). */
export function isHostedRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}

/**
 * Local `npm run dev` may use data/*.json.
 * Vercel must use Yellow Metal Supabase — never silent local fallback there.
 */
export function assertStoreBackend(): "supabase" | "local" {
  if (hasYmSupabase()) return "supabase";
  if (isHostedRuntime()) {
    throw new Error(
      "YM_SUPABASE_URL and YM_SUPABASE_SERVICE_ROLE_KEY are required on Vercel",
    );
  }
  return "local";
}

/** PostgREST returns at most 1,000 rows per request, even when `.limit()` is higher. */
export const SUPABASE_PAGE_SIZE = 1000;

/**
 * Load every matching row by paging past the 1,000-row cap.
 * Without this, admin views silently stop at the oldest thousand events.
 */
export async function fetchAllPaged<T>(
  loadPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  maxRows: number,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  while (rows.length < maxRows) {
    const to = Math.min(from + SUPABASE_PAGE_SIZE - 1, maxRows - 1);
    const { data, error } = await loadPage(from, to);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < SUPABASE_PAGE_SIZE) break;
    from += SUPABASE_PAGE_SIZE;
  }
  return rows.slice(0, maxRows);
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

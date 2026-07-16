import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  assertStoreBackend,
  getYmSupabase,
  hasYmSupabase,
  isHostedRuntime,
} from "@/lib/ym-supabase";

type Bucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, Bucket>();
const LOCAL_PATH = path.join(process.cwd(), "data", "rate-limits.json");

type RateLimitFile = { buckets: Record<string, Bucket> };
const EMPTY: RateLimitFile = { buckets: {} };

/** Prefer Vercel’s trusted client IP header when present. */
export function preferredClientIp(request: Request): string {
  const vercel = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

/** @deprecated Prefer preferredClientIp */
export function clientIpFromRequest(request: Request): string {
  return preferredClientIp(request);
}

/** Best-effort in-memory rate limit (per serverless instance). */
export function rateLimitAllow(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

function parseFile(raw: string): RateLimitFile {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY;
    const buckets = (parsed as RateLimitFile).buckets;
    if (!buckets || typeof buckets !== "object") return EMPTY;
    return { buckets };
  } catch {
    return EMPTY;
  }
}

function prune(file: RateLimitFile): RateLimitFile {
  const now = Date.now();
  const buckets: Record<string, Bucket> = {};
  for (const [key, bucket] of Object.entries(file.buckets)) {
    if (bucket.resetAt > now) buckets[key] = bucket;
  }
  return { buckets };
}

function readLocal(): RateLimitFile {
  if (!existsSync(LOCAL_PATH)) return EMPTY;
  return prune(parseFile(readFileSync(LOCAL_PATH, "utf8")));
}

function writeLocal(file: RateLimitFile): void {
  const dir = path.dirname(LOCAL_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(LOCAL_PATH, `${JSON.stringify(prune(file))}\n`, "utf8");
}

let localChain: Promise<void> = Promise.resolve();

/**
 * Shared durable rate limit via Supabase (or local file).
 * Always applies in-memory first; durable store enforces across instances.
 */
export async function durableRateLimitAllow(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  if (!rateLimitAllow(key, limit, windowMs)) return false;

  // Hosted without Supabase: deny (fail closed) rather than unlimited traffic.
  if (isHostedRuntime() && !hasYmSupabase()) return false;

  if (hasYmSupabase()) {
    try {
      assertStoreBackend();
      const now = Date.now();
      const { data, error } = await getYmSupabase()
        .from("rate_limit_buckets")
        .select("key, count, reset_at")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;

      if (!data || new Date(String(data.reset_at)).getTime() <= now) {
        const { error: upsertError } = await getYmSupabase()
          .from("rate_limit_buckets")
          .upsert({
            key,
            count: 1,
            reset_at: new Date(now + windowMs).toISOString(),
          });
        if (upsertError) throw upsertError;
        return true;
      }

      if (Number(data.count) >= limit) return false;

      const { error: updateError } = await getYmSupabase()
        .from("rate_limit_buckets")
        .update({ count: Number(data.count) + 1 })
        .eq("key", key)
        .eq("reset_at", data.reset_at);
      if (updateError) throw updateError;
      return true;
    } catch {
      // Fail closed: store errors must not open unlimited traffic.
      return false;
    }
  }

  let allowed = true;
  const run = localChain.then(() => {
    const file = readLocal();
    const now = Date.now();
    const existing = file.buckets[key];
    if (!existing || existing.resetAt <= now) {
      file.buckets[key] = { count: 1, resetAt: now + windowMs };
      writeLocal(file);
      return;
    }
    if (existing.count >= limit) {
      allowed = false;
      return;
    }
    existing.count += 1;
    writeLocal(file);
  });
  localChain = run.catch(() => undefined);
  await run;
  return allowed;
}

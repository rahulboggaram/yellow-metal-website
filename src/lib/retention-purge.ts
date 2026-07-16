import "server-only";

import { getYmSupabase, hasYmSupabase } from "@/lib/ym-supabase";

export const RETENTION_DAYS = 90;

export type RetentionPurgeResult = {
  analyticsDeleted: number;
  engagementDeleted: number;
  sessionsDeleted: number;
  rateLimitsDeleted: number;
};

/**
 * Deletes telemetry and expired control-plane rows older than the retention window.
 * Idempotent — safe to run daily from Vercel Cron.
 */
export async function purgeExpiredStoreData(): Promise<RetentionPurgeResult> {
  if (!hasYmSupabase()) {
    return {
      analyticsDeleted: 0,
      engagementDeleted: 0,
      sessionsDeleted: 0,
      rateLimitsDeleted: 0,
    };
  }

  const cutoff = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const nowIso = new Date().toISOString();
  const db = getYmSupabase();

  const [analytics, engagement, sessions, rateLimits] = await Promise.all([
    db.from("analytics_events").delete().lt("timestamp", cutoff).select("id"),
    db.from("engagement_events").delete().lt("timestamp", cutoff).select("id"),
    db.from("admin_sessions").delete().lt("exp", nowIso).select("jti"),
    db.from("rate_limit_buckets").delete().lt("reset_at", nowIso).select("key"),
  ]);

  for (const result of [analytics, engagement, sessions, rateLimits]) {
    if (result.error) throw result.error;
  }

  return {
    analyticsDeleted: analytics.data?.length ?? 0,
    engagementDeleted: engagement.data?.length ?? 0,
    sessionsDeleted: sessions.data?.length ?? 0,
    rateLimitsDeleted: rateLimits.data?.length ?? 0,
  };
}

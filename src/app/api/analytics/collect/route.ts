import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { hashSessionIdForStorage } from "@/lib/admin-auth";
import { appendAnalyticsEvent } from "@/lib/analytics-store";
import type { AnalyticsCollectInput } from "@/lib/analytics-types";
import { geoFromHeaders } from "@/lib/analytics-geo";
import { isLikelyBot, parseUserAgent } from "@/lib/analytics-ua";
import { durableRateLimitAllow, preferredClientIp } from "@/lib/rate-limit";
import {
  ALLOWED_TELEMETRY_PATHS,
  normalizeTelemetryPath,
  readJsonBody,
  sanitizeReferrer,
} from "@/lib/site-paths";

export const dynamic = "force-dynamic";

const MAX_PATH = 200;
const MAX_SESSION_ID = 80;
const MAX_REFERRER = 500;
const MAX_BODY_BYTES = 8_192;

function isValidInput(body: unknown): body is AnalyticsCollectInput {
  if (!body || typeof body !== "object") return false;
  const value = body as AnalyticsCollectInput;
  return (
    typeof value.path === "string" &&
    value.path.length > 0 &&
    value.path.length <= MAX_PATH &&
    typeof value.sessionId === "string" &&
    value.sessionId.length > 0 &&
    value.sessionId.length <= MAX_SESSION_ID &&
    (value.referrer === undefined ||
      value.referrer === null ||
      (typeof value.referrer === "string" && value.referrer.length <= MAX_REFERRER))
  );
}

export async function POST(request: Request) {
  const ip = preferredClientIp(request);
  if (!(await durableRateLimitAllow(`analytics-collect:${ip}`, 60, 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const bodyRead = await readJsonBody(request, MAX_BODY_BYTES);
    if (!bodyRead.ok) {
      return NextResponse.json({ error: bodyRead.error }, { status: bodyRead.status });
    }
    const body: unknown = bodyRead.raw ? JSON.parse(bodyRead.raw) : null;
    if (!isValidInput(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (body.path.startsWith("/admin")) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const pathOnly = normalizeTelemetryPath(body.path);
    if (!ALLOWED_TELEMETRY_PATHS.has(pathOnly)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const userAgent = request.headers.get("user-agent");
    if (isLikelyBot(userAgent)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const ua = parseUserAgent(userAgent);
    const geo = geoFromHeaders(request.headers);

    await appendAnalyticsEvent({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      path: pathOnly.slice(0, MAX_PATH),
      sessionId: hashSessionIdForStorage(body.sessionId),
      referrer: sanitizeReferrer(body.referrer, MAX_REFERRER),
      ...ua,
      country: geo.country,
      region: geo.region,
      // City not retained for website analytics (privacy minimizing).
      city: null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not record visit" }, { status: 500 });
  }
}

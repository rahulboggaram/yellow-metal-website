import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { appendAnalyticsEvent } from "@/lib/analytics-store";
import type { AnalyticsCollectInput } from "@/lib/analytics-types";
import { geoFromHeaders } from "@/lib/analytics-geo";
import { isLikelyBot, parseUserAgent } from "@/lib/analytics-ua";
import { clientIpFromRequest, rateLimitAllow } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_PATH = 200;
const MAX_SESSION_ID = 80;
const MAX_REFERRER = 500;

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
  const ip = clientIpFromRequest(request);
  if (!rateLimitAllow(`analytics-collect:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const raw = await request.text();
    const body: unknown = raw ? JSON.parse(raw) : null;
    if (!isValidInput(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (body.path.startsWith("/admin")) {
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
      path: body.path.slice(0, MAX_PATH),
      sessionId: body.sessionId.slice(0, MAX_SESSION_ID),
      referrer: body.referrer ? body.referrer.slice(0, MAX_REFERRER) : null,
      ...ua,
      ...geo,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not record visit" }, { status: 500 });
  }
}

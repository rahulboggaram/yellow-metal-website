import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { appendAnalyticsEvent } from "@/lib/analytics-store";
import type { AnalyticsCollectInput } from "@/lib/analytics-types";
import { geoFromHeaders } from "@/lib/analytics-geo";
import { isLikelyBot, parseUserAgent } from "@/lib/analytics-ua";

export const dynamic = "force-dynamic";

function isValidInput(body: unknown): body is AnalyticsCollectInput {
  if (!body || typeof body !== "object") return false;
  const value = body as AnalyticsCollectInput;
  return (
    typeof value.path === "string" &&
    value.path.length > 0 &&
    typeof value.sessionId === "string" &&
    value.sessionId.length > 0
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
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
      path: body.path,
      sessionId: body.sessionId,
      referrer: body.referrer ?? null,
      ...ua,
      ...geo,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not record visit" }, { status: 500 });
  }
}

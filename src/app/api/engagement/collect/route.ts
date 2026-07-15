import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { geoFromHeaders } from "@/lib/analytics-geo";
import { appendEngagementEvent } from "@/lib/engagement-store";
import type { EngagementCollectInput } from "@/lib/engagement-types";
import { GOLD_KARAT_OPTIONS } from "@/lib/gold-price-format";
import { isLikelyBot } from "@/lib/analytics-ua";
import { clientIpFromRequest, rateLimitAllow } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const VALID_KARATS = new Set<string>(GOLD_KARAT_OPTIONS);
const MAX_PATH = 200;
const MAX_SESSION_ID = 80;

function isValidInput(body: unknown): body is EngagementCollectInput {
  if (!body || typeof body !== "object") return false;
  const value = body as EngagementCollectInput;
  if (
    typeof value.sessionId !== "string" ||
    value.sessionId.length === 0 ||
    value.sessionId.length > MAX_SESSION_ID ||
    typeof value.path !== "string" ||
    value.path.length === 0 ||
    value.path.length > MAX_PATH
  ) {
    return false;
  }

  if (value.type === "lending_rate_stop") {
    return (
      typeof value.durationMs === "number" &&
      Number.isFinite(value.durationMs) &&
      value.durationMs >= 1000 &&
      value.durationMs <= 30 * 60 * 1000
    );
  }

  if (value.type === "calculator_entry") {
    return (
      typeof value.weightEntered === "string" &&
      value.weightEntered.trim().length > 0 &&
      value.weightEntered.length <= 32 &&
      typeof value.weightGrams === "number" &&
      Number.isFinite(value.weightGrams) &&
      value.weightGrams > 0 &&
      value.weightGrams <= 10_000 &&
      typeof value.karat === "string" &&
      VALID_KARATS.has(value.karat) &&
      (value.loanAmountInr === null ||
        (typeof value.loanAmountInr === "number" &&
          Number.isFinite(value.loanAmountInr) &&
          value.loanAmountInr >= 0 &&
          value.loanAmountInr <= 1_000_000_000))
    );
  }

  return false;
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  if (!rateLimitAllow(`engagement-collect:${ip}`, 60, 60_000)) {
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

    const timestamp = new Date().toISOString();
    const id = randomUUID();
    const sessionId = body.sessionId.slice(0, MAX_SESSION_ID);
    const path = body.path.slice(0, MAX_PATH);

    if (body.type === "lending_rate_stop") {
      await appendEngagementEvent({
        id,
        type: "lending_rate_stop",
        timestamp,
        sessionId,
        path,
        durationMs: Math.round(body.durationMs),
      });
    } else {
      const geo = geoFromHeaders(request.headers);
      await appendEngagementEvent({
        id,
        type: "calculator_entry",
        timestamp,
        sessionId,
        path,
        weightEntered: body.weightEntered.trim(),
        weightGrams: body.weightGrams,
        karat: body.karat,
        loanAmountInr: body.loanAmountInr,
        country: geo.country,
        region: geo.region,
        city: geo.city,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not record engagement" }, { status: 500 });
  }
}

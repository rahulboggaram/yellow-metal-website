import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { appendEngagementEvent } from "@/lib/engagement-store";
import type { EngagementCollectInput } from "@/lib/engagement-types";
import { GOLD_KARAT_OPTIONS } from "@/lib/gold-price-format";
import { isLikelyBot } from "@/lib/analytics-ua";

export const dynamic = "force-dynamic";

const VALID_KARATS = new Set<string>(GOLD_KARAT_OPTIONS);

function isValidInput(body: unknown): body is EngagementCollectInput {
  if (!body || typeof body !== "object") return false;
  const value = body as EngagementCollectInput;
  if (
    typeof value.sessionId !== "string" ||
    value.sessionId.length === 0 ||
    typeof value.path !== "string" ||
    value.path.length === 0
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
          value.loanAmountInr >= 0))
    );
  }

  return false;
}

export async function POST(request: Request) {
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

    if (body.type === "lending_rate_stop") {
      await appendEngagementEvent({
        id,
        type: "lending_rate_stop",
        timestamp,
        sessionId: body.sessionId,
        path: body.path,
        durationMs: Math.round(body.durationMs),
      });
    } else {
      await appendEngagementEvent({
        id,
        type: "calculator_entry",
        timestamp,
        sessionId: body.sessionId,
        path: body.path,
        weightEntered: body.weightEntered.trim(),
        weightGrams: body.weightGrams,
        karat: body.karat,
        loanAmountInr: body.loanAmountInr,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not record engagement" }, { status: 500 });
  }
}

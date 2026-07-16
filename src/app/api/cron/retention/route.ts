import { NextResponse } from "next/server";
import { timingSafeEqualString } from "@/lib/admin-auth";
import { purgeExpiredStoreData } from "@/lib/retention-purge";

export const dynamic = "force-dynamic";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return timingSafeEqualString(header, expected);
}

/** Daily retention purge — secured with CRON_SECRET (Vercel Cron Authorization header). */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await purgeExpiredStoreData();
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }
}

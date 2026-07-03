import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/analytics-store";
import type { AnalyticsQuery } from "@/lib/analytics-types";
import { verifyAdminSecret } from "@/lib/loan-plans";

export const dynamic = "force-dynamic";

function queryFromUrl(url: URL): AnalyticsQuery {
  const month = url.searchParams.get("month") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  return { month, from, to };
}

export async function GET(request: Request) {
  if (!verifyAdminSecret(request.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getAnalyticsSummary(queryFromUrl(new URL(request.url)));
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: "Could not load analytics" }, { status: 500 });
  }
}

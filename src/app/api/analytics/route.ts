import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAnalyticsSummary } from "@/lib/analytics-store";
import type { AnalyticsQuery } from "@/lib/analytics-types";

export const dynamic = "force-dynamic";

function queryFromUrl(url: URL): AnalyticsQuery {
  const month = url.searchParams.get("month") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  return { month, from, to };
}

export async function GET(request: Request) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getAnalyticsSummary(queryFromUrl(new URL(request.url)));
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: "Could not load analytics" }, { status: 500 });
  }
}

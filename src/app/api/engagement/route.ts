import { NextResponse } from "next/server";
import {
  getCalculatorEntries,
  getEngagementSummary,
} from "@/lib/engagement-store";
import { engagementQueryFromUrl } from "@/lib/engagement-query";
import { verifyAdminSecret } from "@/lib/loan-plans";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!verifyAdminSecret(request.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const query = engagementQueryFromUrl(url);

    if (url.searchParams.get("detail") === "calculator") {
      const entries = await getCalculatorEntries(query);
      return NextResponse.json({ entries });
    }

    const summary = await getEngagementSummary(query);
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: "Could not load engagement data" }, { status: 500 });
  }
}

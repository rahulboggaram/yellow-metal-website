import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  getCalculatorEntries,
  getEngagementSummary,
} from "@/lib/engagement-store";
import { engagementQueryFromUrl } from "@/lib/engagement-query";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminAuthenticated(request)) {
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

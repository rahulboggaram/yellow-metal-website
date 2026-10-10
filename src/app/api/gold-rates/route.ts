import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  getSeenGoldRateHistory,
  goldRateQueryFromUrl,
} from "@/lib/gold-rate-history";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const history = await getSeenGoldRateHistory(goldRateQueryFromUrl(new URL(request.url)));
    return NextResponse.json(history);
  } catch (error) {
    console.error("gold-rates", error);
    const missingFeed =
      error instanceof Error && error.message.includes("not configured");
    return NextResponse.json(
      {
        error: missingFeed
          ? "The gold-rate feed is not connected in this environment."
          : "Could not load gold rates",
      },
      { status: 500 },
    );
  }
}

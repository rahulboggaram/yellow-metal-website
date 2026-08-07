import { NextResponse } from "next/server";
import { getGoldPriceSnapshot } from "@/lib/gold-price";
import { preferredClientIp, rateLimitAllow } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ip = preferredClientIp(request);
  // Gold prices come from the Spot feed, so this public read should not depend
  // on the private Yellow Metal store being healthy just to throttle requests.
  if (!rateLimitAllow(`gold-price:${ip}`, 120, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const snapshot = await getGoldPriceSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("gold-price", error);
    return NextResponse.json(
      { error: "Unable to fetch live gold rates right now." },
      { status: 503 },
    );
  }
}

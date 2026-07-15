import { NextResponse } from "next/server";
import { getGoldPriceSnapshot } from "@/lib/gold-price";
import { durableRateLimitAllow, preferredClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ip = preferredClientIp(request);
  if (!(await durableRateLimitAllow(`gold-price:${ip}`, 120, 60_000))) {
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

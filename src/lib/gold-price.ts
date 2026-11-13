import "server-only";

import { fetchSpotGoldRates } from "./spot-rates";
import {
  isGoldPriceSnapshot,
  type GoldPriceSnapshot,
} from "./gold-price-format";

/** Loan-to-value for gold and silver loans. */
export const GOLD_LTV = 0.75;
export const SILVER_LTV = 0.75;

export type { GoldPriceSnapshot } from "./gold-price-format";

const PUBLISHED_GOLD_PRICE_URL = "https://www.yellowmetal.co/api/gold-price";

/** Local preview has no spot key. Use the live site rate so the calculator can still fill gold weight. */
async function fetchPublishedGoldPrice(): Promise<GoldPriceSnapshot> {
  const res = await fetch(PUBLISHED_GOLD_PRICE_URL, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Published gold price HTTP ${res.status}`);
  }
  const data: unknown = await res.json();
  if (!isGoldPriceSnapshot(data)) {
    throw new Error("Published gold price payload was invalid");
  }
  return data;
}

export async function getGoldPriceSnapshot(): Promise<GoldPriceSnapshot> {
  const hasSpotFeed = Boolean(
    process.env.SPOT_SUPABASE_URL && process.env.SPOT_SUPABASE_ANON_KEY,
  );
  if (!hasSpotFeed) return fetchPublishedGoldPrice();
  return fetchSpotGoldRates();
}

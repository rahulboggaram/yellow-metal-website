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
const SPOT_CONFIG_ERROR =
  "SPOT_SUPABASE_URL / SPOT_SUPABASE_ANON_KEY are required in Vercel production";

function hasSpotFeed(): boolean {
  return Boolean(
    process.env.SPOT_SUPABASE_URL && process.env.SPOT_SUPABASE_ANON_KEY,
  );
}

function canUsePublishedFallback(): boolean {
  return process.env.VERCEL_ENV !== "production";
}

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
  if (!hasSpotFeed()) {
    if (!canUsePublishedFallback()) {
      throw new Error(
        `${SPOT_CONFIG_ERROR}; refusing to fetch ${PUBLISHED_GOLD_PRICE_URL} from itself`,
      );
    }
    return fetchPublishedGoldPrice();
  }
  return fetchSpotGoldRates();
}

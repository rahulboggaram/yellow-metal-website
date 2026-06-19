import "server-only";

import { fetchSpotGoldRates } from "./spot-rates";
import type { GoldPriceSnapshot } from "./gold-price-format";

/** Loan-to-value for gold and silver loans. */
export const GOLD_LTV = 0.75;
export const SILVER_LTV = 0.75;

export type { GoldPriceSnapshot } from "./gold-price-format";

export async function getGoldPriceSnapshot(): Promise<GoldPriceSnapshot> {
  return fetchSpotGoldRates();
}

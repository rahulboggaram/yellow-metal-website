import "server-only";

import type { GoldPriceSnapshot } from "./gold-price-format";
import {
  GOLD_LTV,
  gold999Per10gFromRaw,
  loanRatePer10gFromRaw,
  loanRatePerGramFromRaw,
  spotKaratRates,
} from "./gold-price-format";
import {
  getActivePmSessionYmd,
  getIstYmd,
  getSpotCacheRevalidateSeconds,
  isPmRateSlot,
  istDateDisplay,
  previousTradingDayYmd,
} from "./spot-schedule";

/** Public anon key from env — read-only market_prices access. */
const SPOT_SUPABASE_URL =
  process.env.SPOT_SUPABASE_URL ?? "https://jvnrafvsycvlqfmepqjv.supabase.co";
const SPOT_SUPABASE_ANON_KEY = process.env.SPOT_SUPABASE_ANON_KEY ?? "";

const SPOT_APP_URL = "https://spot-app-bice.vercel.app";

type MarketPriceRow = {
  id: number;
  gold_999_base: number;
  silver_base: number | null;
  updated_at: string;
};

async function fetchMarketPrices(): Promise<MarketPriceRow[]> {
  if (!SPOT_SUPABASE_ANON_KEY) {
    throw new Error("SPOT_SUPABASE_ANON_KEY is not configured");
  }

  const url = new URL(`${SPOT_SUPABASE_URL}/rest/v1/market_prices`);
  url.searchParams.set("select", "id,gold_999_base,silver_base,updated_at");
  url.searchParams.set("order", "updated_at.desc");
  url.searchParams.set("limit", "60");

  const res = await fetch(url, {
    headers: {
      apikey: SPOT_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SPOT_SUPABASE_ANON_KEY}`,
    },
    next: { revalidate: getSpotCacheRevalidateSeconds() },
  });

  if (!res.ok) {
    throw new Error(`Spot price feed HTTP ${res.status}`);
  }

  const rows: unknown = await res.json();
  if (!Array.isArray(rows)) {
    throw new Error("Spot price feed returned an unexpected payload");
  }

  return rows as MarketPriceRow[];
}

function pickPmRateForSession(
  rows: MarketPriceRow[],
  sessionYmd: string,
): MarketPriceRow | null {
  const matches = rows.filter(
    (row) => getIstYmd(new Date(row.updated_at)) === sessionYmd && isPmRateSlot(row.updated_at),
  );

  if (matches.length === 0) return null;

  return matches.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )[0];
}

function resolveActivePmRate(rows: MarketPriceRow[]): MarketPriceRow {
  let sessionYmd = getActivePmSessionYmd();

  for (let attempt = 0; attempt < 14; attempt += 1) {
    const row = pickPmRateForSession(rows, sessionYmd);
    if (row) return row;
    sessionYmd = previousTradingDayYmd(sessionYmd);
  }

  throw new Error("No 5:30 PM gold rate is available from the spot feed yet");
}

export async function fetchSpotGoldRates(): Promise<GoldPriceSnapshot> {
  const rows = await fetchMarketPrices();
  const active = resolveActivePmRate(rows);
  const gold999BaseRaw = active.gold_999_base;
  const { perGramInr: rate22kPerGramInr, per10gInr: rate22kPer10gInr } =
    spotKaratRates(gold999BaseRaw, "22K");
  const loanPerGramInr = loanRatePerGramFromRaw(gold999BaseRaw, "22K");
  const loanPer10gInr = loanRatePer10gFromRaw(gold999BaseRaw, "22K");

  const silver999PerKgInr = active.silver_base
    ? Math.round(active.silver_base * 1000)
    : null;
  const silver999PerGramInr = active.silver_base ?? null;
  const silverLoanPerGramInr = silver999PerGramInr
    ? Math.round(silver999PerGramInr * GOLD_LTV)
    : null;

  return {
    rate22kPerGramInr,
    rate22kPer10gInr,
    loanPerGramInr,
    loanPer10gInr,
    gold999BaseRaw,
    gold999Per10gInr: gold999Per10gFromRaw(gold999BaseRaw),
    silver999PerKgInr,
    silver999PerGramInr,
    silverLoanPerGramInr,
    silverSlot: "pm",
    slot: "pm",
    dateDisplay: istDateDisplay(new Date(active.updated_at)),
    updatedAt: active.updated_at,
    source: `spot-app (${SPOT_APP_URL})`,
    message: null,
  };
}

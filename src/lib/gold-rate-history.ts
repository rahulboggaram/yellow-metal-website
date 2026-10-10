import "server-only";

import {
  WEBSITE_INCEPTION_YMD,
  type GoldRateHistory,
  type GoldRateQuery,
  type SeenGoldRateDay,
} from "@/lib/gold-rate-history-types";
import {
  loanRatePerGramFromRaw,
  spotKaratRates,
} from "@/lib/gold-price-format";
import { fetchMarketPricesSince, type MarketPriceRow } from "@/lib/spot-rates";
import {
  getIstYmd,
  isPmRateSlot,
  previousTradingDayYmd,
} from "@/lib/spot-schedule";

const DAY_MS = 24 * 60 * 60 * 1000;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const YEAR_MONTH = /^(\d{4})-(\d{2})$/;

function addCalendarDaysYmd(ymd: string, days: number): string {
  const date = new Date(`${ymd}T12:00:00+05:30`);
  date.setTime(date.getTime() + days * DAY_MS);
  return getIstYmd(date);
}

function lastDayOfMonth(year: number, monthIndex: number): string {
  const last = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const month = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${month}-${String(last).padStart(2, "0")}`;
}

function clampRange(
  from: string,
  to: string,
  today: string,
): { from: string; to: string; empty: boolean } {
  const start = from < WEBSITE_INCEPTION_YMD ? WEBSITE_INCEPTION_YMD : from;
  const end = to > today ? today : to;
  if (start > end) return { from, to, empty: true };
  return { from: start, to: end, empty: false };
}

function resolveRange(
  query: GoldRateQuery,
  today: string,
): { from: string; to: string; empty: boolean } {
  const monthMatch = query.month ? YEAR_MONTH.exec(query.month) : null;
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const monthIndex = Number(monthMatch[2]) - 1;
    if (monthIndex >= 0 && monthIndex <= 11) {
      return clampRange(
        `${monthMatch[1]}-${monthMatch[2]}-01`,
        lastDayOfMonth(year, monthIndex),
        today,
      );
    }
  }

  const from = query.from && YMD.test(query.from) ? query.from : WEBSITE_INCEPTION_YMD;
  const to = query.to && YMD.test(query.to) ? query.to : today;
  return clampRange(from, to, today);
}

function eachDay(from: string, to: string): string[] {
  if (from > to) return [];
  const days: string[] = [];
  for (let ymd = from; ymd <= to; ymd = addCalendarDaysYmd(ymd, 1)) {
    days.push(ymd);
    if (days.length > 4000) break;
  }
  return days;
}

function indexPmRates(rows: MarketPriceRow[]): Map<string, MarketPriceRow> {
  const map = new Map<string, MarketPriceRow>();
  for (const row of rows) {
    if (!Number.isFinite(Number(row.gold_999_base))) continue;
    if (!isPmRateSlot(row.updated_at)) continue;
    const ymd = getIstYmd(new Date(row.updated_at));
    const current = map.get(ymd);
    if (
      !current ||
      new Date(row.updated_at).getTime() > new Date(current.updated_at).getTime()
    ) {
      map.set(ymd, row);
    }
  }
  return map;
}

function rateForShownDay(
  pmBySession: Map<string, MarketPriceRow>,
  shownOn: string,
): MarketPriceRow | null {
  let session: string;
  try {
    session = previousTradingDayYmd(shownOn);
  } catch {
    return null;
  }

  for (let attempt = 0; attempt < 14; attempt += 1) {
    const row = pmBySession.get(session);
    if (row) return row;
    try {
      session = previousTradingDayYmd(session);
    } catch {
      return null;
    }
  }

  return null;
}

function toSeenDay(shownOn: string, row: MarketPriceRow): Omit<SeenGoldRateDay, "changeInr"> {
  const gold999Base = Number(row.gold_999_base);
  return {
    shownOn,
    spotSession: getIstYmd(new Date(row.updated_at)),
    rate22kPerGramInr: spotKaratRates(gold999Base, "22K").perGramInr,
    loanPerGramInr: loanRatePerGramFromRaw(gold999Base, "22K"),
    updatedAt: row.updated_at,
  };
}

function withDayOverDayChange(
  days: Omit<SeenGoldRateDay, "changeInr">[],
): SeenGoldRateDay[] {
  return days.map((day, index) => {
    const previous = index > 0 ? days[index - 1] : null;
    return {
      ...day,
      changeInr: previous ? day.loanPerGramInr - previous.loanPerGramInr : null,
    };
  });
}

export function goldRateQueryFromUrl(url: URL): GoldRateQuery {
  const month = url.searchParams.get("month") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  return { month, from, to };
}

/** Build the on-site rate list from spot prints. `today` is an IST calendar day. */
export function buildSeenGoldRateHistory(
  prints: MarketPriceRow[],
  today: string,
  query: GoldRateQuery = {},
): GoldRateHistory {
  const range = resolveRange(query, today);
  const pmBySession = indexPmRates(prints);
  const all = withDayOverDayChange(
    eachDay(WEBSITE_INCEPTION_YMD, today).flatMap((shownOn) => {
      const row = rateForShownDay(pmBySession, shownOn);
      return row ? [toSeenDay(shownOn, row)] : [];
    }),
  );

  return {
    inception: WEBSITE_INCEPTION_YMD,
    from: range.from,
    to: range.to,
    firstShownOn: all[0]?.shownOn ?? null,
    rows: range.empty
      ? []
      : all.filter((day) => day.shownOn >= range.from && day.shownOn <= range.to),
  };
}

/**
 * Daily gold rate the website showed, from launch through today.
 * Uses the same rule as the homepage: the previous trading day's 5:30 PM close.
 */
export async function getSeenGoldRateHistory(
  query: GoldRateQuery = {},
): Promise<GoldRateHistory> {
  const today = getIstYmd();
  const fetchFrom = new Date(
    `${addCalendarDaysYmd(WEBSITE_INCEPTION_YMD, -21)}T00:00:00+05:30`,
  ).toISOString();
  const prints = await fetchMarketPricesSince(fetchFrom);
  return buildSeenGoldRateHistory(prints, today, query);
}

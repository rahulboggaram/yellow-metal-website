import "server-only";

const IBJA_URL = "https://ibjarates.com";

/** IBJA 916 purity ≈ 22K card gold. */
const PURITY_916_FACTOR = 916 / 999;

import type { GoldPriceSnapshot } from "./gold-price-format";
import {
  getIbjaCacheRevalidateSeconds,
  shouldUseIbjaPmRate,
} from "./ibja-schedule";

function readSpanInt(html: string, id: string): number | null {
  const match = html.match(new RegExp(`id="${id}"[^>]*>\\s*([\\d,\\s]*)\\s*<`, "i"));
  if (!match?.[1]) return null;
  const normalized = match[1].replace(/,/g, "").trim();
  if (!/^\d+$/.test(normalized)) return null;
  return Number(normalized);
}

function istDateDisplay(date = new Date()): string {
  const dd = date.toLocaleString("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit" });
  const mm = date.toLocaleString("en-GB", { timeZone: "Asia/Kolkata", month: "2-digit" });
  const yyyy = date.toLocaleString("en-GB", { timeZone: "Asia/Kolkata", year: "numeric" });
  return `${dd}/${mm}/${yyyy}`;
}

function parseIbjaHtml(html: string): {
  gold999Am10g: number | null;
  gold999Pm10g: number | null;
  gold916Compare10g: number | null;
  silver999AmKg: number | null;
  silver999PmKg: number | null;
  waitingMessage: string | null;
} {
  const waitingMatch = html.match(/id="lbl_Message"[^>]*>\s*([^<]+)\s*</i);
  return {
    gold999Am10g: readSpanInt(html, "lblGold999_AM"),
    gold999Pm10g: readSpanInt(html, "lblGold999_PM"),
    gold916Compare10g: readSpanInt(html, "GoldRatesCompare916"),
    silver999AmKg: readSpanInt(html, "lblSilver999_AM"),
    silver999PmKg: readSpanInt(html, "lblSilver999_PM"),
    waitingMessage: waitingMatch?.[1]?.trim() ?? null,
  };
}

export async function fetchIbjaGoldRates(): Promise<GoldPriceSnapshot> {
  const res = await fetch(IBJA_URL, {
    headers: {
      "user-agent": "YellowMetal-Website/1.0",
      accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: getIbjaCacheRevalidateSeconds() },
  });

  if (!res.ok) {
    throw new Error(`IBJA upstream HTTP ${res.status}`);
  }

  const html = await res.text();
  const parsed = parseIbjaHtml(html);
  const usePm = shouldUseIbjaPmRate();
  const gold999Per10g =
    (usePm && parsed.gold999Pm10g) ||
    parsed.gold999Am10g ||
    parsed.gold999Pm10g;

  let rate22kPer10g: number | null = null;
  let slot: GoldPriceSnapshot["slot"] = "compare";

  if (gold999Per10g) {
    rate22kPer10g = Math.round(gold999Per10g * PURITY_916_FACTOR);
    slot = usePm && parsed.gold999Pm10g ? "pm" : "am";
  } else if (parsed.gold916Compare10g) {
    rate22kPer10g = parsed.gold916Compare10g;
    slot = "compare";
  }

  if (!rate22kPer10g) {
    throw new Error(parsed.waitingMessage || "IBJA gold rates are not available yet");
  }

  const silver999PerKg =
    (usePm && parsed.silver999PmKg) ||
    parsed.silver999AmKg ||
    parsed.silver999PmKg ||
    null;

  const rate22kPerGramInr = rate22kPer10g / 10;
  const loanPerGramInr = Math.round(rate22kPerGramInr * 0.75);
  const silver999PerGramInr = silver999PerKg ? silver999PerKg / 1000 : null;
  const silverLoanPerGramInr = silver999PerGramInr
    ? silver999PerGramInr * 0.75
    : null;
  const silverSlot: GoldPriceSnapshot["silverSlot"] = silver999PerKg
    ? usePm && parsed.silver999PmKg
      ? "pm"
      : parsed.silver999AmKg
        ? "am"
        : "compare"
    : "compare";

  const loanPer10gInr = Math.round(rate22kPer10g * 0.75);

  return {
    rate22kPerGramInr,
    rate22kPer10gInr: rate22kPer10g,
    loanPerGramInr,
    loanPer10gInr,
    gold999BaseRaw: gold999Per10g,
    gold999Per10gInr: gold999Per10g,
    silver999PerKgInr: silver999PerKg,
    silver999PerGramInr,
    silverLoanPerGramInr,
    silverSlot,
    slot,
    dateDisplay: istDateDisplay(),
    updatedAt: new Date().toISOString(),
    source: "ibjarates.com (IBJA)",
    message: parsed.waitingMessage,
  };
}

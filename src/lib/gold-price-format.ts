export type GoldPriceSlot = "am" | "pm" | "compare";

export type GoldPriceSnapshot = {
  rate22kPerGramInr: number;
  rate22kPer10gInr: number;
  loanPerGramInr: number;
  loanPer10gInr: number;
  gold999BaseRaw: number | null;
  gold999Per10gInr: number | null;
  silver999PerKgInr: number | null;
  silver999PerGramInr: number | null;
  silverLoanPerGramInr: number | null;
  silverSlot: GoldPriceSlot;
  slot: GoldPriceSlot;
  dateDisplay: string;
  updatedAt: string;
  source: string;
  message: string | null;
};

export const GOLD_LTV = 0.75;

export const GOLD_KARAT_PURITIES = {
  "22K": 0.916,
  "21K": 0.875,
  "20K": 0.833,
  "19K": 19 / 24,
  "18K": 0.75,
} as const;

export type GoldKarat = keyof typeof GOLD_KARAT_PURITIES;

export const GOLD_KARAT_OPTIONS: GoldKarat[] = [
  "22K",
  "21K",
  "20K",
  "19K",
  "18K",
];

/** `gold_999_base` from Spot is 999 gold per gram (INR). */
export function gold999PerGramFromBase(baseField: number): number {
  return baseField;
}

/**
 * Spot app MetalPriceCard — 22K on the "1g" card is per gram:
 * round(round(gold_999_base) × purity)
 * `gold_999_base` is per gram.
 * @see GoldApp/components/metal-price-card.tsx
 */
export function spotKaratQuoteFromBase(
  gold999BaseField: number,
  karat: GoldKarat,
): number {
  return Math.round(
    Math.round(gold999BaseField) * GOLD_KARAT_PURITIES[karat],
  );
}

export function spotKaratRates(
  gold999BaseField: number,
  karat: GoldKarat,
): { perGramInr: number; per10gInr: number } {
  const perGramInr = spotKaratQuoteFromBase(
    gold999PerGramFromBase(gold999BaseField),
    karat,
  );
  return { perGramInr, per10gInr: perGramInr * 10 };
}

export function gold999Per10gFromRaw(baseField: number): number {
  return gold999PerGramFromBase(baseField) * 10;
}

export function spotRatePer10gFromRaw(
  baseField: number,
  karat: GoldKarat,
): number {
  return spotKaratRates(baseField, karat).per10gInr;
}

export function spotRatePerGramFromRaw(
  baseField: number,
  karat: GoldKarat,
): number {
  return spotKaratRates(baseField, karat).perGramInr;
}

export function loanRatePer10gFromRaw(
  baseField: number,
  karat: GoldKarat,
): number {
  return Math.round(spotRatePer10gFromRaw(baseField, karat) * GOLD_LTV);
}

export function loanRatePerGramFromRaw(
  baseField: number,
  karat: GoldKarat,
): number {
  return Math.round(spotRatePerGramFromRaw(baseField, karat) * GOLD_LTV);
}

function gold999BaseFieldFromPer10g(gold999Per10g: number): number {
  return gold999Per10g / 10;
}

export function spotRatePer10gFromGold999(
  gold999Per10g: number,
  karat: GoldKarat,
): number {
  return spotKaratRates(gold999BaseFieldFromPer10g(gold999Per10g), karat)
    .per10gInr;
}

export function spotRatePerGramFromGold999(
  gold999Per10g: number,
  karat: GoldKarat,
): number {
  return spotKaratRates(gold999BaseFieldFromPer10g(gold999Per10g), karat)
    .perGramInr;
}

export function loanAmountFromWeightGrams(
  weightGrams: number,
  karat: GoldKarat,
  gold999BaseRaw: number | null,
  rate22kPerGramInr: number,
): number {
  if (!Number.isFinite(weightGrams) || weightGrams <= 0) return 0;

  if (gold999BaseRaw != null) {
    return Math.round(
      loanRatePerGramFromRaw(gold999BaseRaw, karat) * weightGrams,
    );
  }

  const loanPerGram = Math.round(
    rate22kPerGramInr *
      GOLD_LTV *
      (GOLD_KARAT_PURITIES[karat] / GOLD_KARAT_PURITIES["22K"]),
  );
  return Math.round(loanPerGram * weightGrams);
}

export function loanRatePerGram(
  karat: GoldKarat,
  gold999BaseRaw: number | null,
  rate22kPerGramInr: number,
): number {
  if (gold999BaseRaw != null) {
    return loanRatePerGramFromRaw(gold999BaseRaw, karat);
  }

  return Math.round(
    rate22kPerGramInr *
      GOLD_LTV *
      (GOLD_KARAT_PURITIES[karat] / GOLD_KARAT_PURITIES["22K"]),
  );
}

export function loanRatePer10g(
  karat: GoldKarat,
  gold999BaseRaw: number | null,
  loanPer10gInr: number,
): number {
  if (gold999BaseRaw != null) {
    return loanRatePer10gFromRaw(gold999BaseRaw, karat);
  }

  if (karat === "22K") return loanPer10gInr;

  return Math.round(
    loanPer10gInr *
      (GOLD_KARAT_PURITIES[karat] / GOLD_KARAT_PURITIES["22K"]),
  );
}

export function lendingRateFrom22k(rate22kPerGramInr: number): number {
  return rate22kPerGramInr * GOLD_LTV;
}

export function formatInr(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function slotLabel(slot: GoldPriceSlot): string {
  if (slot === "am") return "Spot opening (12:30 PM)";
  if (slot === "pm") return "Spot closing (5:30 PM)";
  return "Spot 22K benchmark";
}

export function isGoldPriceSnapshot(value: unknown): value is GoldPriceSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as GoldPriceSnapshot;
  return (
    typeof v.rate22kPerGramInr === "number" &&
    typeof v.rate22kPer10gInr === "number" &&
    typeof v.loanPerGramInr === "number" &&
    typeof v.loanPer10gInr === "number" &&
    (v.silver999PerKgInr === null || typeof v.silver999PerKgInr === "number") &&
    (v.silver999PerGramInr === null || typeof v.silver999PerGramInr === "number") &&
    (v.silverLoanPerGramInr === null || typeof v.silverLoanPerGramInr === "number")
  );
}

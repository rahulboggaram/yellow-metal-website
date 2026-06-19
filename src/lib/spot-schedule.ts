/** Spot app posts rates at 12:30 PM and 5:30 PM IST (Mon–Fri). */
export const SPOT_AM_MINUTE_IST = 12 * 60 + 30;
export const SPOT_PM_MINUTE_IST = 17 * 60 + 30;

/** PM slot window: ~4:30 PM – 8:00 PM IST (covers the 5:30 PM posting). */
export const SPOT_PM_WINDOW_START_IST = 16 * 60 + 30;
export const SPOT_PM_WINDOW_END_IST = 20 * 60;

export function getIstYmd(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function getIstTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  return {
    hour: Number(parts.find((p) => p.type === "hour")?.value ?? 0),
    minute: Number(parts.find((p) => p.type === "minute")?.value ?? 0),
    second: Number(parts.find((p) => p.type === "second")?.value ?? 0),
  };
}

export function getIstMinutes(date = new Date()): number {
  const { hour, minute } = getIstTimeParts(date);
  return hour * 60 + minute;
}

export function isTradingDayYmd(ymd: string): boolean {
  const weekday = new Date(`${ymd}T12:00:00+05:30`).toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
  });
  return weekday !== "Sat" && weekday !== "Sun";
}

export function isPmRateSlot(updatedAt: string | Date): boolean {
  const mins = getIstMinutes(
    typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt,
  );
  return mins >= SPOT_PM_WINDOW_START_IST && mins < SPOT_PM_WINDOW_END_IST;
}

/** Previous Mon–Fri session before the given IST calendar day. */
export function previousTradingDayYmd(ymd: string): string {
  let cursor = ymd;
  for (let step = 0; step < 14; step += 1) {
    const date = new Date(`${cursor}T12:00:00+05:30`);
    date.setDate(date.getDate() - 1);
    cursor = getIstYmd(date);
    if (isTradingDayYmd(cursor)) return cursor;
  }
  throw new Error("No recent trading day found for gold rate lookup");
}

/**
 * PM rate posted on day D goes live at midnight IST on day D+1.
 * On calendar day N we therefore show the previous trading day's 5:30 PM rate.
 */
export function getActivePmSessionYmd(now = new Date()): string {
  return previousTradingDayYmd(getIstYmd(now));
}

export function istDateDisplay(date = new Date()): string {
  const dd = date.toLocaleString("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit" });
  const mm = date.toLocaleString("en-GB", { timeZone: "Asia/Kolkata", month: "2-digit" });
  const yyyy = date.toLocaleString("en-GB", { timeZone: "Asia/Kolkata", year: "numeric" });
  return `${dd}/${mm}/${yyyy}`;
}

/** e.g. "18 June 2026" — today's date in IST for UI labels. */
export function formatIstTodayLong(date = new Date()): string {
  return date.toLocaleDateString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Milliseconds until the next midnight IST (when the lending rate rolls over). */
export function getMsUntilNextMidnightIst(from = new Date()): number {
  const ymd = getIstYmd(from);
  const { hour, minute, second } = getIstTimeParts(from);
  const elapsedMs = ((hour * 3600 + minute * 60 + second) * 1000);
  const dayMs = 24 * 3600 * 1000;
  return dayMs - elapsedMs;
}

export function getSpotCacheRevalidateSeconds(from = new Date()): number {
  return Math.max(60, Math.ceil(getMsUntilNextMidnightIst(from) / 1000));
}

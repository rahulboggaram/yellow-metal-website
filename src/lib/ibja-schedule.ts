/** IBJA closing (PM) rates are published around 6 PM IST. */
export const IBJA_PM_RATE_HOUR_IST = 18;
export const IBJA_PM_RATE_MINUTE_IST = 0;

function getIstTimeParts(date = new Date()) {
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

/** Use IBJA PM slot after the daily 6 PM IST update. */
export function shouldUseIbjaPmRate(date = new Date()): boolean {
  const { hour, minute } = getIstTimeParts(date);
  if (hour > IBJA_PM_RATE_HOUR_IST) return true;
  if (hour === IBJA_PM_RATE_HOUR_IST && minute >= IBJA_PM_RATE_MINUTE_IST) return true;
  return false;
}

/** Milliseconds until the next 6 PM IST refresh. */
export function getMsUntilNextIbjaRefresh(from = new Date()): number {
  const { hour, minute, second } = getIstTimeParts(from);
  const nowSeconds = hour * 3600 + minute * 60 + second;
  const refreshSeconds =
    IBJA_PM_RATE_HOUR_IST * 3600 + IBJA_PM_RATE_MINUTE_IST * 60;

  let deltaSeconds = refreshSeconds - nowSeconds;
  if (deltaSeconds <= 0) {
    deltaSeconds += 24 * 3600;
  }

  return deltaSeconds * 1000;
}

export function getIbjaCacheRevalidateSeconds(from = new Date()): number {
  return Math.max(60, Math.ceil(getMsUntilNextIbjaRefresh(from) / 1000));
}

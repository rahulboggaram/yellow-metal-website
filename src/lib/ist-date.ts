const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const IST_TIME_ZONE = "Asia/Kolkata";

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function parseYmd(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function formatParts({ year, month, day }: DateParts): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function datePartsInIst(date: Date): DateParts | null {
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return { year, month, day };
}

export function istDateKey(value: string | Date): string | null {
  const date = value instanceof Date ? value : new Date(value);
  const parts = datePartsInIst(date);
  return parts ? formatParts(parts) : null;
}

export function todayIstDateKey(date = new Date()): string {
  return istDateKey(date) ?? formatParts({ year: 1970, month: 1, day: 1 });
}

export function shiftDateKey(ymd: string, days: number): string | null {
  const parts = parseYmd(ymd);
  if (!parts) return null;
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12));
  return formatParts({
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  });
}

export function parseIstDateBoundary(
  ymd: string,
  boundary: "start" | "end",
): Date | null {
  const parts = parseYmd(ymd);
  if (!parts) return null;
  const nextDay = boundary === "end" ? 1 : 0;
  const endOffset = boundary === "end" ? -1 : 0;
  return new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + nextDay) -
      IST_OFFSET_MS +
      endOffset,
  );
}

export function parseIstMonthRange(
  monthValue: string,
): { from: Date; to: Date } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthValue);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const from = new Date(Date.UTC(year, monthIndex, 1) - IST_OFFSET_MS);
  const to = new Date(Date.UTC(year, monthIndex + 1, 1) - IST_OFFSET_MS - 1);
  return { from, to };
}

export function currentIstMonthParts(date = new Date()): {
  year: number;
  monthIndex: number;
} {
  const parts = datePartsInIst(date) ?? { year: 1970, month: 1, day: 1 };
  return { year: parts.year, monthIndex: parts.month - 1 };
}

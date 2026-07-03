import type { EngagementQuery } from "@/lib/engagement-types";

function parseMonth(month: string): { from: Date; to: Date } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const from = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
  return { from, to };
}

export function engagementInRange(timestamp: string, query: EngagementQuery): boolean {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;

  if (query.month) {
    const monthRange = parseMonth(query.month);
    if (!monthRange) return false;
    return date >= monthRange.from && date <= monthRange.to;
  }

  if (query.from) {
    const from = new Date(`${query.from}T00:00:00.000Z`);
    if (date < from) return false;
  }
  if (query.to) {
    const to = new Date(`${query.to}T23:59:59.999Z`);
    if (date > to) return false;
  }
  return true;
}

export function engagementQueryFromUrl(url: URL): EngagementQuery {
  const month = url.searchParams.get("month") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  return { month, from, to };
}

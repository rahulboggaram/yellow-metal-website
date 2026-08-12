import type { EngagementQuery } from "@/lib/engagement-types";
import {
  parseIstDateBoundary,
  parseIstMonthRange,
} from "@/lib/ist-date";

function parseMonth(month: string): { from: Date; to: Date } | null {
  return parseIstMonthRange(month);
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
    const from = parseIstDateBoundary(query.from, "start");
    if (!from) return false;
    if (date < from) return false;
  }
  if (query.to) {
    const to = parseIstDateBoundary(query.to, "end");
    if (!to) return false;
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

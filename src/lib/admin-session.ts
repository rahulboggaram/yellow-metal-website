export type AdminTab = "loan-plans" | "analytics" | "engagement";

export function parseAdminTab(value: string | null): AdminTab {
  if (value === "loan-plans") return "loan-plans";
  if (value === "engagement") return "engagement";
  return "analytics";
}

export function last30DaysRange(): { from: string; to: string } {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setUTCDate(fromDate.getUTCDate() - 30);
  return {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
  };
}

export function monthFilterOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [
    { value: "last30", label: "Last 30 days" },
    { value: "all", label: "All time" },
    { value: "custom", label: "Custom range" },
  ];
  const now = new Date();
  for (let i = 0; i < 12; i += 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    options.push({ value, label });
  }
  return options;
}

export function buildAdminDateQuery(
  month: string,
  from: string,
  to: string,
): URLSearchParams {
  const params = new URLSearchParams();
  if (month === "last30") {
    const range = last30DaysRange();
    params.set("from", range.from);
    params.set("to", range.to);
  } else if (month && month !== "all" && month !== "custom") {
    params.set("month", month);
  } else if (from) {
    params.set("from", from);
    if (to) params.set("to", to);
  }
  return params;
}

const ADMIN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const ADMIN_TIME_ZONE = "Asia/Kolkata";

/** Display dates as `03 July 2026` across the admin panel (IST). */
export function formatAdminDate(value: string | Date): string {
  const parts = parseAdminDateParts(value);
  if (!parts) return typeof value === "string" ? value : "";
  const day = String(parts.day).padStart(2, "0");
  return `${day} ${ADMIN_MONTHS[parts.month]} ${parts.year}`;
}

/** Date + time for timestamps in IST, e.g. `03 July 2026, 3:45 pm`. */
export function formatAdminDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }
  const datePart = formatAdminDate(date);
  const timePart = date
    .toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: ADMIN_TIME_ZONE,
    })
    .toLowerCase();
  return `${datePart}, ${timePart}`;
}

function parseAdminDateParts(
  value: string | Date,
): { year: number; month: number; day: number } | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return istPartsFromDate(value);
  }

  const ymd = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    return {
      year: Number(ymd[1]),
      month: Number(ymd[2]) - 1,
      day: Number(ymd[3]),
    };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return istPartsFromDate(parsed);
}

function istPartsFromDate(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ADMIN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value) - 1;
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return { year, month, day };
}

export async function loginAdmin(
  password: string,
  totp?: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, totp: totp || undefined }),
  });
  if (res.status === 429) {
    return { ok: false, error: "Too many attempts. Try again later." };
  }
  if (res.status === 503) {
    return {
      ok: false,
      error: "Admin is not configured. Set ADMIN_SESSION_SECRET.",
    };
  }
  if (!res.ok) {
    const data: { error?: string } = await res.json().catch(() => ({}));
    return { ok: false, error: data.error ?? "Wrong password. Try again." };
  }
  return { ok: true };
}

export async function getAdminLoginConfig(): Promise<{
  totpRequired: boolean;
}> {
  try {
    const res = await fetch("/api/admin/login");
    if (!res.ok) return { totpRequired: false };
    const data: { totpRequired?: boolean } = await res.json();
    return { totpRequired: Boolean(data.totpRequired) };
  } catch {
    return { totpRequired: false };
  }
}

export async function checkAdminSession(): Promise<boolean> {
  const res = await fetch("/api/admin/session");
  return res.ok;
}

export async function logoutAdmin(): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/admin/logout", { method: "POST" });
  if (!res.ok) {
    const data: { error?: string } = await res.json().catch(() => ({}));
    return {
      ok: false,
      error: data.error ?? "Could not sign out. Please try again.",
    };
  }
  return { ok: true };
}

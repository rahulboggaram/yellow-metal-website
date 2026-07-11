export const ADMIN_SESSION_KEY = "ym-admin-secret";

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

export async function verifyAdminSecret(secret: string): Promise<boolean> {
  const { from, to } = last30DaysRange();
  const params = new URLSearchParams({ from, to });
  const res = await fetch(`/api/analytics?${params}`, {
    headers: { "x-admin-secret": secret },
  });
  return res.ok;
}

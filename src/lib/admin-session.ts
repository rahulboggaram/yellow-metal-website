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

export async function verifyAdminSecret(secret: string): Promise<boolean> {
  const { from, to } = last30DaysRange();
  const params = new URLSearchParams({ from, to });
  const res = await fetch(`/api/analytics?${params}`, {
    headers: { "x-admin-secret": secret },
  });
  return res.ok;
}

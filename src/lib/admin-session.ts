export const ADMIN_SESSION_KEY = "ym-admin-secret";

export type AdminTab = "loan-plans" | "analytics";

export function parseAdminTab(value: string | null): AdminTab {
  return value === "analytics" ? "analytics" : "loan-plans";
}

export const WEBSITE_CONSENT_STORAGE_KEY = "ym-website-consent";
export const WEBSITE_CONSENT_NOTICE_VERSION = 1;

export type WebsiteConsentRecord = {
  version: number;
  analytics: boolean;
  decidedAt: string;
};

function isRecord(value: unknown): value is WebsiteConsentRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as WebsiteConsentRecord;
  return (
    record.version === WEBSITE_CONSENT_NOTICE_VERSION &&
    typeof record.analytics === "boolean" &&
    typeof record.decidedAt === "string"
  );
}

export function readWebsiteConsent(): WebsiteConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WEBSITE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Records that the notice was agreed. Does not start or stop website telemetry. */
export function writeWebsiteConsent(agreed: boolean): WebsiteConsentRecord {
  const record: WebsiteConsentRecord = {
    version: WEBSITE_CONSENT_NOTICE_VERSION,
    analytics: agreed,
    decidedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(
    WEBSITE_CONSENT_STORAGE_KEY,
    JSON.stringify(record),
  );
  return record;
}

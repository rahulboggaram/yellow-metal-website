/** Public marketing paths allowed for website telemetry beacons. */
export const ALLOWED_TELEMETRY_PATHS = new Set([
  "/",
  "/about",
  "/blog",
  "/contact",
  "/faq",
  "/fair-practices",
  "/fair-practices/kannada",
  "/policies",
  "/policies/grievance-redressal",
  "/policies/interest-rate",
  "/policies/refund-and-cancellation",
  "/privacy",
  "/terms",
]);

export function normalizeTelemetryPath(path: string): string {
  return path.split("?")[0] ?? path;
}

/** Strip query strings from referrers so tracking params are not stored. */
export function sanitizeReferrer(
  raw: string | null | undefined,
  maxLength: number,
): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname}`.slice(0, maxLength);
  } catch {
    return raw.split("?")[0]?.slice(0, maxLength) ?? null;
  }
}

/** Reject oversized collect bodies before JSON parse. */
export function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<{ ok: true; raw: string } | { ok: false; status: number; error: string }> {
  const declared = request.headers.get("content-length");
  if (declared) {
    const size = Number(declared);
    if (Number.isFinite(size) && size > maxBytes) {
      return Promise.resolve({ ok: false, status: 413, error: "Payload too large" });
    }
  }
  return request.text().then((raw) => {
    if (raw.length > maxBytes) {
      return { ok: false, status: 413, error: "Payload too large" };
    }
    return { ok: true, raw };
  });
}

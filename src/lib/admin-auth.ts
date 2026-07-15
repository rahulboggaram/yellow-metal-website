import "server-only";

import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  durableRateLimitAllow,
  preferredClientIp,
} from "@/lib/rate-limit";
import {
  createSessionRecord,
  revokeSession,
  sessionExists,
} from "@/lib/admin-session-store";
import { verifyTotpCode } from "@/lib/totp";

/** Production uses __Host- (Secure + Path=/ + no Domain). */
export function adminSessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Host-ym_admin_session"
    : "ym_admin_session";
}

const SESSION_MAX_AGE_SEC = 60 * 60 * 4; // 4 hours (shorter for rate editors)
const LOGIN_LIMIT = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function adminPasswordPlain(): string | null {
  const secret = process.env.ADMIN_SECRET;
  return secret && secret.length > 0 ? secret : null;
}

/** Dedicated signing key — never falls back to the login password. */
export function signingKey(): string | null {
  const key = process.env.ADMIN_SESSION_SECRET;
  return key && key.length >= 32 ? key : null;
}

export function isTotpRequired(): boolean {
  return Boolean(process.env.ADMIN_TOTP_SECRET?.trim());
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

function passwordDigest(password: string, key: string): Buffer {
  const salt = createHmac("sha256", key)
    .update("ym-admin-password-v1")
    .digest();
  return scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
}

/**
 * Verifies password against ADMIN_PASSWORD_HASH (scrypt$…) when set,
 * otherwise against ADMIN_SECRET using a fixed-length scrypt digest compare.
 */
export function verifyAdminPassword(password: string): boolean {
  const key = signingKey();
  if (!key) return false;

  const storedHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (storedHash?.startsWith("scrypt$")) {
    return verifyScryptHash(password, storedHash);
  }

  const expected = adminPasswordPlain();
  if (!expected) return false;
  try {
    const a = passwordDigest(password, key);
    const b = passwordDigest(expected, key);
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function verifyScryptHash(password: string, encoded: string): boolean {
  const parts = encoded.split("$");
  // scrypt$N$r$p$saltB64$hashB64
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4]!, "base64url");
  const expected = Buffer.from(parts[5]!, "base64url");
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;
  try {
    const actual = scryptSync(password, salt, expected.length, { N, r, p });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Helper for ops: encode a password hash for ADMIN_PASSWORD_HASH. */
export function hashAdminPassword(password: string): string {
  const salt = randomBytes(16);
  const N = 16384;
  const r = 8;
  const p = 1;
  const hash = scryptSync(password, salt, 32, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function verifyAdminTotp(code: string | undefined | null): boolean {
  const secret = process.env.ADMIN_TOTP_SECRET?.trim();
  if (!secret) return true;
  if (!code || typeof code !== "string") return false;
  return verifyTotpCode(secret, code.trim());
}

function signPayload(payload: string): string {
  const key = signingKey();
  if (!key) return "";
  return createHmac("sha256", key).update(payload).digest("base64url");
}

type SessionPayload = { jti: string; exp: number };

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(payloadB64: string): SessionPayload | null {
  try {
    const raw = Buffer.from(payloadB64, "base64url").toString("utf8");
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as SessionPayload).jti !== "string" ||
      typeof (parsed as SessionPayload).exp !== "number"
    ) {
      return null;
    }
    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

export async function createAdminSessionToken(): Promise<string | null> {
  if (!signingKey() || (!adminPasswordPlain() && !process.env.ADMIN_PASSWORD_HASH)) {
    return null;
  }
  const jti = randomBytes(16).toString("base64url");
  const exp = Date.now() + SESSION_MAX_AGE_SEC * 1000;
  await createSessionRecord(jti, exp);
  const payload = encodePayload({ jti, exp });
  const sig = signPayload(payload);
  if (!sig) return null;
  return `${payload}.${sig}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token || !signingKey()) return false;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;
  const expectedSig = signPayload(payloadB64);
  if (!expectedSig || !timingSafeEqualString(sig, expectedSig)) return false;
  const payload = decodePayload(payloadB64);
  if (!payload) return false;
  if (!Number.isFinite(payload.exp) || Date.now() > payload.exp) return false;
  return sessionExists(payload.jti, payload.exp);
}

export async function revokeAdminSessionToken(
  token: string | undefined | null,
): Promise<void> {
  if (!token) return;
  const [payloadB64] = token.split(".");
  if (!payloadB64) return;
  const payload = decodePayload(payloadB64);
  if (!payload) return;
  await revokeSession(payload.jti);
}

export function adminSessionCookieOptions(token: string) {
  const secure = process.env.NODE_ENV === "production";
  return {
    name: adminSessionCookieName(),
    value: token,
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export function clearAdminSessionCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    name: adminSessionCookieName(),
    value: "",
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

function readSessionCookieValue(cookieHeader: string): string | null {
  const name = adminSessionCookieName();
  const legacy = "ym_admin_session";
  for (const candidate of [name, legacy]) {
    const match = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${candidate}=`));
    if (!match) continue;
    try {
      return decodeURIComponent(match.slice(candidate.length + 1));
    } catch {
      return null;
    }
  }
  return null;
}

/** Cookie session only — legacy x-admin-secret removed. */
export async function isAdminAuthenticated(request: Request): Promise<boolean> {
  const token = readSessionCookieValue(request.headers.get("cookie") ?? "");
  return verifyAdminSessionToken(token);
}

export async function isAdminAuthenticatedFromCookies(): Promise<boolean> {
  const jar = await cookies();
  const name = adminSessionCookieName();
  const token =
    jar.get(name)?.value ?? jar.get("ym_admin_session")?.value ?? null;
  return verifyAdminSessionToken(token);
}

export async function allowAdminLoginAttempt(request: Request): Promise<boolean> {
  const ip = preferredClientIp(request);
  return durableRateLimitAllow(`admin-login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
}

/** Reject cross-site Origin on cookie-authenticated mutations. */
export function assertSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const url = new URL(request.url);
    const originUrl = new URL(origin);
    return originUrl.host === url.host;
  } catch {
    return false;
  }
}

export function hashSessionIdForStorage(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("base64url").slice(0, 24);
}

export function weightBucketGrams(grams: number): string {
  if (!Number.isFinite(grams) || grams <= 0) return "unknown";
  if (grams < 10) return "0-10g";
  if (grams < 20) return "10-20g";
  if (grams < 50) return "20-50g";
  if (grams < 100) return "50-100g";
  return "100g+";
}

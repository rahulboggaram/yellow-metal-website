import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  clientIpFromRequest,
  rateLimitAllow,
} from "@/lib/rate-limit";

export const ADMIN_SESSION_COOKIE = "ym_admin_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 12; // 12 hours
const LOGIN_LIMIT = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function adminPassword(): string | null {
  const secret = process.env.ADMIN_SECRET;
  return secret && secret.length > 0 ? secret : null;
}

function signingKey(): string | null {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_SECRET ||
    null
  );
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    // Compare against self to keep work roughly constant on length mismatch.
    timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export function verifyAdminPassword(password: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  return timingSafeEqualString(password, expected);
}

function signPayload(payload: string): string {
  const key = signingKey();
  if (!key) return "";
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function createAdminSessionToken(): string | null {
  if (!signingKey() || !adminPassword()) return null;
  const exp = Date.now() + SESSION_MAX_AGE_SEC * 1000;
  const payload = String(exp);
  const sig = signPayload(payload);
  if (!sig) return null;
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token || !signingKey()) return false;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const expectedSig = signPayload(payload);
  if (!expectedSig || !timingSafeEqualString(sig, expectedSig)) return false;
  const exp = Number(payload);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return true;
}

export function adminSessionCookieOptions(token: string) {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export function clearAdminSessionCookieOptions() {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

/** Cookie session (preferred) or legacy x-admin-secret header (timing-safe). */
export function isAdminAuthenticated(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  if (match) {
    const token = decodeURIComponent(match.slice(ADMIN_SESSION_COOKIE.length + 1));
    if (verifyAdminSessionToken(token)) return true;
  }

  const header = request.headers.get("x-admin-secret");
  if (header) {
    const expected = adminPassword();
    if (expected && timingSafeEqualString(header, expected)) return true;
  }
  return false;
}

export async function isAdminAuthenticatedFromCookies(): Promise<boolean> {
  const jar = await cookies();
  return verifyAdminSessionToken(jar.get(ADMIN_SESSION_COOKIE)?.value);
}

export function allowAdminLoginAttempt(request: Request): boolean {
  const ip = clientIpFromRequest(request);
  return rateLimitAllow(`admin-login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
}

import { NextRequest, NextResponse } from "next/server";

const COOKIE_PROD = "__Host-ym_admin_session";
const COOKIE_DEV = "ym_admin_session";

const PROTECTED_PREFIXES = [
  "/api/analytics",
  "/api/engagement",
];

function isProtectedMutation(pathname: string, method: string): boolean {
  if (pathname === "/api/loan-plans" && method !== "GET") return true;
  if (pathname.startsWith("/api/loan-plans/") && method !== "GET") return true;
  if (
    PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}?`),
    ) &&
    method === "GET"
  ) {
    return true;
  }
  if (pathname === "/api/analytics" || pathname === "/api/engagement") {
    return method === "GET";
  }
  return false;
}

function isCollectPath(pathname: string): boolean {
  return (
    pathname === "/api/analytics/collect" ||
    pathname === "/api/engagement/collect"
  );
}

async function hmacSign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const bytes = new Uint8Array(sig);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

function decodeBase64UrlJson(payloadB64: string): { exp?: number; jti?: string } | null {
  try {
    const padded = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    return JSON.parse(atob(padded + pad)) as { exp?: number; jti?: string };
  } catch {
    return null;
  }
}

async function cookieLooksSigned(request: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return false;
  const token =
    request.cookies.get(COOKIE_PROD)?.value ??
    request.cookies.get(COOKIE_DEV)?.value;
  if (!token) return false;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;
  const expected = await hmacSign(secret, payloadB64);
  if (!timingSafeEqual(expected, sig)) return false;
  const json = decodeBase64UrlJson(payloadB64);
  if (!json || typeof json.exp !== "number" || Date.now() > json.exp) return false;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  if (isCollectPath(pathname)) {
    return NextResponse.next();
  }

  if (!isProtectedMutation(pathname, method)) {
    return NextResponse.next();
  }

  if (!(await cookieLooksSigned(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/analytics",
    "/api/engagement",
    "/api/loan-plans",
    "/api/loan-plans/:path*",
  ],
};

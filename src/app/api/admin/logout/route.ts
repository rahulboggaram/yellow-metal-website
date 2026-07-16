import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  clearAdminSessionCookieOptions,
  revokeAdminSessionToken,
  adminSessionCookieName,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const name = adminSessionCookieName();
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find(
      (part) =>
        part.startsWith(`${name}=`) || part.startsWith("ym_admin_session="),
    );
  if (match) {
    const eq = match.indexOf("=");
    const raw = match.slice(eq + 1);
    try {
      await revokeAdminSessionToken(decodeURIComponent(raw));
    } catch {
      /* ignore */
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearAdminSessionCookieOptions());
  response.cookies.set({
    ...clearAdminSessionCookieOptions(),
    name: "ym_admin_session",
  });
  return response;
}

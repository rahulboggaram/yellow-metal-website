import { NextResponse } from "next/server";
import { clearAdminSessionCookieOptions } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearAdminSessionCookieOptions());
  return response;
}

import { NextResponse } from "next/server";
import {
  allowAdminLoginAttempt,
  adminSessionCookieOptions,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!allowAdminLoginAttempt(request)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  let password = "";
  try {
    const body: unknown = await request.json();
    if (
      body &&
      typeof body === "object" &&
      typeof (body as { password?: unknown }).password === "string"
    ) {
      password = (body as { password: string }).password;
    }
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const token = createAdminSessionToken();
  if (!token) {
    return NextResponse.json(
      { error: "Admin access is not configured." },
      { status: 503 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookieOptions(token));
  return response;
}

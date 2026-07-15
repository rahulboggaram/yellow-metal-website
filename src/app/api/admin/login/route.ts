import { NextResponse } from "next/server";
import {
  allowAdminLoginAttempt,
  adminSessionCookieOptions,
  createAdminSessionToken,
  isTotpRequired,
  signingKey,
  verifyAdminPassword,
  verifyAdminTotp,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    totpRequired: isTotpRequired(),
    sessionConfigured: Boolean(signingKey()),
  });
}

export async function POST(request: Request) {
  if (!(await allowAdminLoginAttempt(request))) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  let password = "";
  let totp: string | undefined;
  try {
    const body: unknown = await request.json();
    if (
      body &&
      typeof body === "object" &&
      typeof (body as { password?: unknown }).password === "string"
    ) {
      password = (body as { password: string }).password;
    }
    if (
      body &&
      typeof body === "object" &&
      typeof (body as { totp?: unknown }).totp === "string"
    ) {
      totp = (body as { totp: string }).totp;
    }
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!signingKey()) {
    return NextResponse.json(
      { error: "Admin session secret is not configured." },
      { status: 503 },
    );
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  if (!verifyAdminTotp(totp)) {
    return NextResponse.json(
      { error: "Invalid authenticator code." },
      { status: 401 },
    );
  }

  const token = await createAdminSessionToken();
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

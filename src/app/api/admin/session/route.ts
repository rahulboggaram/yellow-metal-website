import { NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/loan-plans";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!verifyAdminSecret(request.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}

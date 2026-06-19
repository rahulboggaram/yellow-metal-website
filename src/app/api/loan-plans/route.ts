import { NextResponse } from "next/server";
import {
  createLoanPlan,
  getLoanPlans,
  isLoanPlanInput,
  verifyAdminSecret,
} from "@/lib/loan-plans";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll =
      searchParams.get("all") === "1" &&
      verifyAdminSecret(request.headers.get("x-admin-secret"));
    const plans = getLoanPlans(!showAll);
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("loan-plans GET", error);
    return NextResponse.json(
      { error: "Unable to load loan plans." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!verifyAdminSecret(request.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    if (!isLoanPlanInput(body)) {
      return NextResponse.json({ error: "Invalid loan plan payload." }, { status: 400 });
    }

    const plan = createLoanPlan(body);
    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("loan-plans POST", error);
    const message =
      error instanceof Error ? error.message : "Unable to create loan plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

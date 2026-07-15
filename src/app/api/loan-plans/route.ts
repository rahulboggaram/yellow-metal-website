import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  isAdminAuthenticated,
} from "@/lib/admin-auth";
import {
  createLoanPlan,
  getLoanPlans,
  isLoanPlanInput,
} from "@/lib/loan-plans";
import { getLoanPlanAudit } from "@/lib/loan-plans-audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = await isAdminAuthenticated(request);

    if (searchParams.get("audit") === "1") {
      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const entries = await getLoanPlanAudit(40);
      return NextResponse.json({ entries });
    }

    const showAll = searchParams.get("all") === "1" && isAdmin;
    const plans = await getLoanPlans(!showAll);
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
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    if (!isLoanPlanInput(body)) {
      return NextResponse.json(
        { error: "Invalid loan plan payload." },
        { status: 400 },
      );
    }

    const plan = await createLoanPlan(body);
    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("loan-plans POST", error);
    const message =
      error instanceof Error && error.message.includes("already exists")
        ? error.message
        : "Unable to create loan plan.";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

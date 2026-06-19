import { NextResponse } from "next/server";
import {
  deleteLoanPlan,
  getLoanPlanById,
  isLoanPlanInput,
  updateLoanPlan,
  verifyAdminSecret,
} from "@/lib/loan-plans";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const plan = getLoanPlanById(id);
    if (!plan) {
      return NextResponse.json({ error: "Loan plan not found." }, { status: 404 });
    }
    return NextResponse.json({ plan });
  } catch (error) {
    console.error("loan-plans/[id] GET", error);
    return NextResponse.json(
      { error: "Unable to load loan plan." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!verifyAdminSecret(request.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    if (!isLoanPlanInput(body)) {
      return NextResponse.json({ error: "Invalid loan plan payload." }, { status: 400 });
    }

    const plan = updateLoanPlan(id, body);
    return NextResponse.json({ plan });
  } catch (error) {
    console.error("loan-plans/[id] PUT", error);
    const message =
      error instanceof Error ? error.message : "Unable to update loan plan.";
    const status = message === "Loan plan not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!verifyAdminSecret(request.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    deleteLoanPlan(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("loan-plans/[id] DELETE", error);
    const message =
      error instanceof Error ? error.message : "Unable to delete loan plan.";
    const status = message === "Loan plan not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

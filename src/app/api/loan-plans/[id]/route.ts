import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  deleteLoanPlan,
  getLoanPlanById,
  isLoanPlanInput,
  updateLoanPlan,
} from "@/lib/loan-plans";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const plan = await getLoanPlanById(id);
    if (!plan) {
      return NextResponse.json({ error: "Loan plan not found." }, { status: 404 });
    }
    if (!plan.active && !isAdminAuthenticated(request)) {
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
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    if (!isLoanPlanInput(body)) {
      return NextResponse.json(
        { error: "Invalid loan plan payload." },
        { status: 400 },
      );
    }

    const plan = await updateLoanPlan(id, body);
    return NextResponse.json({ plan });
  } catch (error) {
    console.error("loan-plans/[id] PUT", error);
    const notFound =
      error instanceof Error && error.message === "Loan plan not found";
    return NextResponse.json(
      { error: notFound ? "Loan plan not found." : "Unable to update loan plan." },
      { status: notFound ? 404 : 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteLoanPlan(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("loan-plans/[id] DELETE", error);
    const notFound =
      error instanceof Error && error.message === "Loan plan not found";
    return NextResponse.json(
      { error: notFound ? "Loan plan not found." : "Unable to delete loan plan." },
      { status: notFound ? 404 : 500 },
    );
  }
}

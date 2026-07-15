import type { LoanPlan } from "@/lib/loan-plans-shared";

export type LoanPlanAuditAction = "create" | "update" | "delete";

export type LoanPlanAuditEntry = {
  id: string;
  at: string;
  action: LoanPlanAuditAction;
  planId: string;
  before: LoanPlan | null;
  after: LoanPlan | null;
};

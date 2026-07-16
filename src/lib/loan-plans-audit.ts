import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { assertStoreBackend, getYmSupabase } from "@/lib/ym-supabase";

export type {
  LoanPlanAuditAction,
  LoanPlanAuditEntry,
} from "@/lib/loan-plans-audit-types";
import type { LoanPlanAuditEntry } from "@/lib/loan-plans-audit-types";

type AuditFile = { entries: LoanPlanAuditEntry[] };

const LOCAL_PATH = path.join(process.cwd(), "data", "loan-plans-audit.json");
const MAX_ENTRIES = 2_000;
const EMPTY: AuditFile = { entries: [] };

let localChain: Promise<void> = Promise.resolve();

function parseFile(raw: string): AuditFile {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as AuditFile).entries)) {
      return EMPTY;
    }
    return parsed as AuditFile;
  } catch {
    return EMPTY;
  }
}

function readLocal(): AuditFile {
  if (!existsSync(LOCAL_PATH)) return EMPTY;
  return parseFile(readFileSync(LOCAL_PATH, "utf8"));
}

function writeLocal(file: AuditFile): void {
  const dir = path.dirname(LOCAL_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(LOCAL_PATH, `${JSON.stringify(file, null, 2)}\n`, "utf8");
}

export async function appendLoanPlanAudit(
  entry: Omit<LoanPlanAuditEntry, "id" | "at"> & { id?: string; at?: string },
): Promise<void> {
  const full: LoanPlanAuditEntry = {
    id: entry.id ?? `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: entry.at ?? new Date().toISOString(),
    action: entry.action,
    planId: entry.planId,
    before: entry.before,
    after: entry.after,
  };

  if (assertStoreBackend() === "supabase") {
    const { error } = await getYmSupabase().from("loan_plan_audit").insert({
      id: full.id,
      at: full.at,
      action: full.action,
      plan_id: full.planId,
      before: full.before,
      after: full.after,
    });
    if (error) throw error;
    return;
  }

  const run = localChain.then(() => {
    const current = readLocal();
    writeLocal({ entries: [...current.entries, full].slice(-MAX_ENTRIES) });
  });
  localChain = run.catch(() => undefined);
  await run;
}

export async function getLoanPlanAudit(limit = 50): Promise<LoanPlanAuditEntry[]> {
  if (assertStoreBackend() === "supabase") {
    const { data, error } = await getYmSupabase()
      .from("loan_plan_audit")
      .select("*")
      .order("at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: String(row.id),
      at: String(row.at),
      action: row.action as LoanPlanAuditEntry["action"],
      planId: String(row.plan_id),
      before: (row.before as LoanPlanAuditEntry["before"]) ?? null,
      after: (row.after as LoanPlanAuditEntry["after"]) ?? null,
    }));
  }
  return [...readLocal().entries].reverse().slice(0, limit);
}

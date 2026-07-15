import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  hasBlobStorage,
  mutatePrivateJsonBlob,
  readPrivateJsonBlob,
} from "@/lib/blob-json-store";

export type { LoanPlanAuditAction, LoanPlanAuditEntry } from "@/lib/loan-plans-audit-types";
import type { LoanPlanAuditEntry } from "@/lib/loan-plans-audit-types";

type AuditFile = {
  entries: LoanPlanAuditEntry[];
};

const LOCAL_PATH = path.join(process.cwd(), "data", "loan-plans-audit.json");
const BLOB_PATHNAME = "loan-plans/audit.json";
const MAX_ENTRIES = 2_000;
const EMPTY: AuditFile = { entries: [] };

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

let localChain: Promise<void> = Promise.resolve();

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

  if (hasBlobStorage()) {
    await mutatePrivateJsonBlob(BLOB_PATHNAME, EMPTY, parseFile, (current) => ({
      entries: [...current.entries, full].slice(-MAX_ENTRIES),
    }));
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
  if (hasBlobStorage()) {
    const snapshot = await readPrivateJsonBlob(BLOB_PATHNAME, EMPTY, parseFile);
    return [...snapshot.data.entries].reverse().slice(0, limit);
  }
  return [...readLocal().entries].reverse().slice(0, limit);
}

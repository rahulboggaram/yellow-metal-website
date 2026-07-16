import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getYmSupabase, hasYmSupabase } from "@/lib/ym-supabase";

const LOCAL_PATH = path.join(process.cwd(), "data", "admin-sessions.json");

type SessionFile = {
  sessions: Record<string, { exp: number }>;
};

const EMPTY: SessionFile = { sessions: {} };

function parseFile(raw: string): SessionFile {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") return EMPTY;
  const sessions = (parsed as SessionFile).sessions;
  if (!sessions || typeof sessions !== "object") return EMPTY;
  return { sessions };
}

function prune(file: SessionFile): SessionFile {
  const now = Date.now();
  const sessions: Record<string, { exp: number }> = {};
  for (const [jti, meta] of Object.entries(file.sessions)) {
    if (meta.exp > now) sessions[jti] = meta;
  }
  return { sessions };
}

function readLocal(): SessionFile {
  if (!existsSync(LOCAL_PATH)) return EMPTY;
  return prune(parseFile(readFileSync(LOCAL_PATH, "utf8")));
}

function writeLocal(file: SessionFile): void {
  const dir = path.dirname(LOCAL_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(LOCAL_PATH, `${JSON.stringify(prune(file), null, 2)}\n`, "utf8");
}

let localChain: Promise<void> = Promise.resolve();

export async function createSessionRecord(jti: string, exp: number): Promise<void> {
  if (hasYmSupabase()) {
    const { error } = await getYmSupabase().from("admin_sessions").upsert({
      jti,
      exp: new Date(exp).toISOString(),
    });
    if (error) throw error;
    return;
  }
  const run = localChain.then(() => {
    const current = readLocal();
    current.sessions[jti] = { exp };
    writeLocal(current);
  });
  localChain = run.catch(() => undefined);
  await run;
}

export async function revokeSession(jti: string): Promise<void> {
  if (hasYmSupabase()) {
    const { error } = await getYmSupabase().from("admin_sessions").delete().eq("jti", jti);
    if (error) throw error;
    return;
  }
  const run = localChain.then(() => {
    const current = readLocal();
    delete current.sessions[jti];
    writeLocal(current);
  });
  localChain = run.catch(() => undefined);
  await run;
}

export async function sessionExists(jti: string, exp: number): Promise<boolean> {
  if (Date.now() > exp) return false;
  if (hasYmSupabase()) {
    const { data, error } = await getYmSupabase()
      .from("admin_sessions")
      .select("jti, exp")
      .eq("jti", jti)
      .maybeSingle();
    if (error) throw error;
    if (!data) return false;
    return new Date(String(data.exp)).getTime() === exp;
  }
  const meta = readLocal().sessions[jti];
  return Boolean(meta && meta.exp === exp && meta.exp > Date.now());
}

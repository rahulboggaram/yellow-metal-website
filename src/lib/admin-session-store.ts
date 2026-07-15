import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  hasBlobStorage,
  mutatePrivateJsonBlob,
  readPrivateJsonBlob,
} from "@/lib/blob-json-store";

const LOCAL_PATH = path.join(process.cwd(), "data", "admin-sessions.json");
const BLOB_PATHNAME = "admin/sessions.json";

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

async function mutateStore(
  mutate: (current: SessionFile) => SessionFile,
): Promise<SessionFile> {
  if (hasBlobStorage()) {
    return mutatePrivateJsonBlob(BLOB_PATHNAME, EMPTY, parseFile, (current) =>
      prune(mutate(current)),
    );
  }
  let result = EMPTY;
  const run = localChain.then(() => {
    result = prune(mutate(readLocal()));
    writeLocal(result);
  });
  localChain = run.catch(() => undefined);
  await run;
  return result;
}

export async function createSessionRecord(jti: string, exp: number): Promise<void> {
  await mutateStore((current) => ({
    sessions: { ...current.sessions, [jti]: { exp } },
  }));
}

export async function revokeSession(jti: string): Promise<void> {
  await mutateStore((current) => {
    const sessions = { ...current.sessions };
    delete sessions[jti];
    return { sessions };
  });
}

export async function sessionExists(jti: string, exp: number): Promise<boolean> {
  if (Date.now() > exp) return false;
  if (hasBlobStorage()) {
    const snapshot = await readPrivateJsonBlob(BLOB_PATHNAME, EMPTY, parseFile);
    const meta = snapshot.data.sessions[jti];
    return Boolean(meta && meta.exp === exp && meta.exp > Date.now());
  }
  const meta = readLocal().sessions[jti];
  return Boolean(meta && meta.exp === exp && meta.exp > Date.now());
}

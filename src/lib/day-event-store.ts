import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  hasBlobStorage,
  mutatePrivateJsonBlob,
  readPrivateJsonBlob,
} from "@/lib/blob-json-store";
import { list } from "@vercel/blob";

export type DayEventFile<T> = {
  events: T[];
};

const RETENTION_DAYS = 90;

function dayKey(timestamp: string): string {
  return timestamp.slice(0, 10);
}

function pruneOldEvents<T extends { timestamp: string }>(events: T[]): T[] {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return events.filter((event) => {
    const t = new Date(event.timestamp).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
}

function parseDayFile<T>(raw: string): DayEventFile<T> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as DayEventFile<T>).events)
    ) {
      return { events: [] };
    }
    return parsed as DayEventFile<T>;
  } catch {
    return { events: [] };
  }
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/**
 * Append-oriented day-sharded store with 90-day TTL and ETag-safe day writes.
 */
export function createDayShardedStore<T extends { timestamp: string; id: string }>(options: {
  localDir: string;
  blobPrefix: string;
  legacyLocalPath?: string;
  legacyBlobPath?: string;
  maxEventsPerDay?: number;
}) {
  const maxPerDay = options.maxEventsPerDay ?? 5_000;
  const writeChains = new Map<string, Promise<void>>();

  function localDayPath(day: string): string {
    return path.join(options.localDir, `${day}.json`);
  }

  function blobDayPath(day: string): string {
    return `${options.blobPrefix}/${day}.json`;
  }

  async function appendEvent(event: T): Promise<void> {
    const day = dayKey(event.timestamp);
    const empty: DayEventFile<T> = { events: [] };

    if (hasBlobStorage()) {
      await mutatePrivateJsonBlob(
        blobDayPath(day),
        empty,
        (raw) => parseDayFile<T>(raw),
        (current) => ({
          events: pruneOldEvents([...current.events, event]).slice(-maxPerDay),
        }),
      );
      return;
    }

    ensureDir(options.localDir);
    const prev = writeChains.get(day) ?? Promise.resolve();
    const run = prev.then(() => {
      const filePath = localDayPath(day);
      const current = existsSync(filePath)
        ? parseDayFile<T>(readFileSync(filePath, "utf8"))
        : empty;
      const next = {
        events: pruneOldEvents([...current.events, event]).slice(-maxPerDay),
      };
      writeFileSync(filePath, `${JSON.stringify(next)}\n`, "utf8");
    });
    writeChains.set(
      day,
      run.catch(() => undefined),
    );
    await run;
  }

  function dedupeEvents(events: T[]): T[] {
    const seen = new Set<string>();
    const unique: T[] = [];
    for (const event of events) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      unique.push(event);
    }
    return unique;
  }

  async function readLegacyBlobEvents(): Promise<T[]> {
    if (!options.legacyBlobPath) return [];
    const snapshot = await readPrivateJsonBlob(
      options.legacyBlobPath,
      { events: [] } as DayEventFile<T>,
      (raw) => parseDayFile<T>(raw),
    );
    return pruneOldEvents(snapshot.data.events);
  }

  function readLegacyLocalEvents(): T[] {
    if (!options.legacyLocalPath || !existsSync(options.legacyLocalPath)) {
      return [];
    }
    const legacy = parseDayFile<T>(readFileSync(options.legacyLocalPath, "utf8"));
    return pruneOldEvents(legacy.events);
  }

  async function readAllEvents(): Promise<T[]> {
    const cutoffDay = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    if (hasBlobStorage()) {
      const events: T[] = [];
      try {
        const listed = await list({
          prefix: `${options.blobPrefix}/`,
          limit: 200,
        });
        for (const blob of listed.blobs) {
          const name = blob.pathname.split("/").pop()?.replace(/\.json$/, "");
          if (!name || name < cutoffDay) continue;
          const snapshot = await readPrivateJsonBlob(
            blob.pathname,
            { events: [] } as DayEventFile<T>,
            (raw) => parseDayFile<T>(raw),
          );
          events.push(...pruneOldEvents(snapshot.data.events));
        }
      } catch {
        /* empty */
      }
      const legacyEvents = await readLegacyBlobEvents();
      return dedupeEvents([...events, ...legacyEvents]);
    }

    ensureDir(options.localDir);
    const events: T[] = [];
    for (const file of readdirSync(options.localDir)) {
      if (!file.endsWith(".json")) continue;
      const day = file.replace(/\.json$/, "");
      if (day < cutoffDay) continue;
      const raw = readFileSync(path.join(options.localDir, file), "utf8");
      events.push(...pruneOldEvents(parseDayFile<T>(raw).events));
    }
    return dedupeEvents([...events, ...readLegacyLocalEvents()]);
  }

  return { appendEvent, readAllEvents, retentionDays: RETENTION_DAYS };
}

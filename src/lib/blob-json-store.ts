import "server-only";

import {
  BlobPreconditionFailedError,
  get,
  put,
} from "@vercel/blob";

export function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export type BlobJsonSnapshot<T> = {
  data: T;
  /** Present when the blob already exists; used for conditional puts. */
  etag: string | null;
};

export async function readPrivateJsonBlob<T>(
  pathname: string,
  empty: T,
  parse: (raw: string) => T,
): Promise<BlobJsonSnapshot<T>> {
  try {
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return { data: empty, etag: null };
    }
    const raw = await new Response(result.stream).text();
    if (!raw.trim()) {
      return { data: empty, etag: result.blob.etag };
    }
    return { data: parse(raw), etag: result.blob.etag };
  } catch {
    return { data: empty, etag: null };
  }
}

/**
 * Read → mutate → write with ETag optimistic locking.
 * Retries on concurrent overwrite conflicts so appends are not lost.
 */
export async function mutatePrivateJsonBlob<T>(
  pathname: string,
  empty: T,
  parse: (raw: string) => T,
  mutate: (current: T) => T,
  options?: {
    serialize?: (data: T) => string;
    maxAttempts?: number;
  },
): Promise<T> {
  const serialize =
    options?.serialize ?? ((data: T) => JSON.stringify(data));
  const maxAttempts = options?.maxAttempts ?? 6;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const snapshot = await readPrivateJsonBlob(pathname, empty, parse);
    const next = mutate(snapshot.data);
    const body = serialize(next);

    try {
      if (snapshot.etag) {
        await put(pathname, body, {
          access: "private",
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: "application/json",
          ifMatch: snapshot.etag,
        });
      } else {
        // First create — no ETag yet. Concurrent first writes are rare;
        // subsequent updates use ifMatch.
        await put(pathname, body, {
          access: "private",
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: "application/json",
        });
      }
      return next;
    } catch (error) {
      lastError = error;
      if (error instanceof BlobPreconditionFailedError) {
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Could not update blob after ${maxAttempts} attempts: ${pathname}`);
}

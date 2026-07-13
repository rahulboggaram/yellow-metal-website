import "server-only";

import { get, list, put } from "@vercel/blob";

export function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    code?: unknown;
    message?: unknown;
    status?: unknown;
    statusCode?: unknown;
  };

  return (
    candidate.status === 404 ||
    candidate.statusCode === 404 ||
    candidate.code === "BLOB_NOT_FOUND" ||
    candidate.code === "not_found" ||
    (typeof candidate.message === "string" &&
      candidate.message.toLowerCase().includes("not found"))
  );
}

export async function readBlobJson<T>(
  pathname: string,
  parse: (raw: string) => T,
  notFoundValue: T,
): Promise<T> {
  let raw: string;

  try {
    const result = await get(pathname, { access: "private" });
    if (!result) return notFoundValue;
    const statusCode: number = result.statusCode;
    if (statusCode !== 200 || !result.stream) {
      throw new Error(`Blob ${pathname} returned status ${statusCode}`);
    }
    raw = await new Response(result.stream).text();
  } catch (error) {
    if (isNotFoundError(error)) return notFoundValue;
    throw error;
  }

  return parse(raw);
}

export async function writeBlobJson(
  pathname: string,
  data: unknown,
  allowOverwrite: boolean,
): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite,
    contentType: "application/json",
  });
}

export async function listBlobJson<T>(
  prefix: string,
  parse: (raw: string) => T | null,
): Promise<T[]> {
  const values: T[] = [];
  let cursor: string | undefined;

  do {
    const result = await list({ cursor, limit: 1000, prefix });
    await Promise.all(
      result.blobs.map(async (blob) => {
        const value = await readBlobJson<T | null>(blob.pathname, parse, null);
        if (value !== null) values.push(value);
      }),
    );
    cursor = result.cursor;
  } while (cursor);

  return values;
}

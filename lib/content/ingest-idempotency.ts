import { createHash } from 'node:crypto';
import { ingestKvGet, ingestKvSet } from '@/lib/content/ingest-kv';

export const INGEST_IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;
export const INGEST_IDEMPOTENCY_HEADER = 'idempotency-key';

export type IngestIdempotencyRecord = {
  key: string;
  method: string;
  path: string;
  bodyHash: string;
  status: number;
  body: unknown;
  createdAt: string;
  inProgress?: boolean;
};

export type IdempotencyKeyResult =
  | { ok: true; key: string }
  | { ok: false; status: 400; code: string; error: string };

export function readIdempotencyKey(request: Request): IdempotencyKeyResult {
  const raw = request.headers.get(INGEST_IDEMPOTENCY_HEADER)?.trim() ?? '';
  if (!raw) {
    return {
      ok: false,
      status: 400,
      code: 'idempotency_key_required',
      error: 'هدر Idempotency-Key برای نوشتن الزامی است',
    };
  }
  if (raw.length < 8 || raw.length > 200) {
    return {
      ok: false,
      status: 400,
      code: 'idempotency_key_required',
      error: 'Idempotency-Key باید بین ۸ تا ۲۰۰ کاراکتر باشد',
    };
  }
  return { ok: true, key: raw };
}

export function hashIngestBody(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
}

function storageKey(method: string, path: string, key: string): string {
  return `wibe:ingest:idem:${method}:${path}:${key}`;
}

export async function beginIdempotency(opts: {
  method: string;
  path: string;
  key: string;
  bodyHash: string;
}): Promise<
  | { ok: true; fresh: true }
  | { ok: true; fresh: false; record: IngestIdempotencyRecord }
  | { ok: false; status: 409 | 422; code: string; error: string }
> {
  const key = storageKey(opts.method, opts.path, opts.key);
  const existing = await ingestKvGet<IngestIdempotencyRecord>(key);
  if (existing?.inProgress) {
    return {
      ok: false,
      status: 409,
      code: 'idempotency_in_progress',
      error: 'همین درخواست هنوز در حال اجراست',
    };
  }
  if (existing) {
    if (existing.bodyHash !== opts.bodyHash) {
      return {
        ok: false,
        status: 422,
        code: 'idempotency_key_reused',
        error: 'این Idempotency-Key قبلاً با بدنهٔ دیگری استفاده شده است',
      };
    }
    return { ok: true, fresh: false, record: existing };
  }

  const placeholder: IngestIdempotencyRecord = {
    key: opts.key,
    method: opts.method,
    path: opts.path,
    bodyHash: opts.bodyHash,
    status: 0,
    body: null,
    createdAt: new Date().toISOString(),
    inProgress: true,
  };
  await ingestKvSet(key, placeholder, INGEST_IDEMPOTENCY_TTL_SECONDS);
  return { ok: true, fresh: true };
}

export async function completeIdempotency(opts: {
  method: string;
  path: string;
  key: string;
  bodyHash: string;
  status: number;
  body: unknown;
}): Promise<void> {
  const key = storageKey(opts.method, opts.path, opts.key);
  const record: IngestIdempotencyRecord = {
    key: opts.key,
    method: opts.method,
    path: opts.path,
    bodyHash: opts.bodyHash,
    status: opts.status,
    body: opts.body,
    createdAt: new Date().toISOString(),
    inProgress: false,
  };
  await ingestKvSet(key, record, INGEST_IDEMPOTENCY_TTL_SECONDS);
}

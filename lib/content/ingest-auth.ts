import { createHash, timingSafeEqual } from 'node:crypto';

const MIN_TOKEN_LENGTH = 24;

export type IngestAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

/** توکن را موقع درخواست می‌خواند. اگر خالی یا کوتاه باشد endpoint بسته می‌ماند. */
export function authorizeIngest(request: Request): IngestAuthResult {
  const expected = process.env.INGEST_TOKEN?.trim() ?? '';
  if (expected.length < MIN_TOKEN_LENGTH) {
    return { ok: false, status: 503, error: 'Ingest token not configured' };
  }

  const header = request.headers.get('authorization') ?? '';
  const secret = header.replace(/^Bearer\s+/i, '').trim();
  const matches = timingSafeEqual(digest(secret), digest(expected));
  if (!matches) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  return { ok: true };
}

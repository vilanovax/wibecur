import { afterEach, describe, expect, it } from 'vitest';
import { INGEST_EXAMPLES, parseIngestDocument } from '@/lib/content/ingest-models';
import { authorizeIngest } from '@/lib/content/ingest-auth';
import { publicIngestError, readIngestHttpBody } from '@/lib/content/ingest-http';

const TOKEN = 'ingest-test-token-with-32-chars';

function request(authorization?: string): Request {
  return new Request('https://example.com/api/ingest/lists', {
    headers: authorization ? { authorization } : {},
  });
}

describe('ingest http auth', () => {
  const previous = process.env.INGEST_TOKEN;

  afterEach(() => {
    if (previous === undefined) delete process.env.INGEST_TOKEN;
    else process.env.INGEST_TOKEN = previous;
  });

  it('stays closed when the token is missing', () => {
    delete process.env.INGEST_TOKEN;
    expect(authorizeIngest(request(`Bearer ${TOKEN}`))).toEqual({
      ok: false,
      status: 503,
      error: 'Ingest token not configured',
    });
  });

  it('rejects a wrong bearer token', () => {
    process.env.INGEST_TOKEN = TOKEN;
    expect(authorizeIngest(request('Bearer wrong-token-value-not-the-real')).ok).toBe(false);
    const missing = authorizeIngest(request());
    expect(missing.ok).toBe(false);
    if (missing.ok) return;
    expect(missing.status).toBe(401);
  });

  it('accepts the configured bearer token', () => {
    process.env.INGEST_TOKEN = TOKEN;
    expect(authorizeIngest(request(`Bearer ${TOKEN}`))).toEqual({ ok: true });
  });
});

describe('ingest http body', () => {
  it('requires a boolean dryRun and removes it before parsing', () => {
    const movie = INGEST_EXAMPLES.movie;
    if (!movie || typeof movie !== 'object' || Array.isArray(movie)) return;
    const split = readIngestHttpBody({ ...(movie as Record<string, unknown>), dryRun: true });
    expect(split.ok).toBe(true);
    if (!split.ok) return;
    expect(split.dryRun).toBe(true);
    expect(parseIngestDocument(split.document).ok).toBe(true);
  });

  it('rejects a missing dryRun', () => {
    const split = readIngestHttpBody(INGEST_EXAMPLES.cafe);
    expect(split.ok).toBe(false);
  });

  it('hides database errors from the bot', () => {
    expect(publicIngestError(new Error('Invalid prisma.lists.create()'))).toBe('خطا در ورود داده');
    expect(publicIngestError(new Error('تصویر لیست ذخیره نشد. آدرس را عوض کنید.'))).toContain('تصویر');
  });
});

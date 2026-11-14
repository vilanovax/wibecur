import { afterEach, describe, expect, it } from 'vitest';
import {
  beginIdempotency,
  completeIdempotency,
  hashIngestBody,
  readIdempotencyKey,
} from '@/lib/content/ingest-idempotency';
import { resetIngestKvMemoryForTests } from '@/lib/content/ingest-kv';

describe('ingest idempotency', () => {
  afterEach(() => {
    resetIngestKvMemoryForTests();
  });

  it('requires a key between 8 and 200 chars', () => {
    expect(readIdempotencyKey(new Request('https://x', { headers: {} })).ok).toBe(false);
    expect(
      readIdempotencyKey(
        new Request('https://x', { headers: { 'Idempotency-Key': 'short' } })
      ).ok
    ).toBe(false);
    expect(
      readIdempotencyKey(
        new Request('https://x', { headers: { 'Idempotency-Key': 'long-enough-key' } })
      )
    ).toEqual({ ok: true, key: 'long-enough-key' });
  });

  it('replays the first response for the same key and body', async () => {
    const begun = await beginIdempotency({
      method: 'POST',
      path: '/api/ingest/lists/commit',
      key: 'elenor-commit-1',
      bodyHash: hashIngestBody({ previewId: 'prev_a' }),
    });
    expect(begun).toMatchObject({ ok: true, fresh: true });

    await completeIdempotency({
      method: 'POST',
      path: '/api/ingest/lists/commit',
      key: 'elenor-commit-1',
      bodyHash: hashIngestBody({ previewId: 'prev_a' }),
      status: 200,
      body: { ok: true, previewId: 'prev_a' },
    });

    const again = await beginIdempotency({
      method: 'POST',
      path: '/api/ingest/lists/commit',
      key: 'elenor-commit-1',
      bodyHash: hashIngestBody({ previewId: 'prev_a' }),
    });
    expect(again.ok).toBe(true);
    if (!again.ok || again.fresh) return;
    expect(again.record.body).toEqual({ ok: true, previewId: 'prev_a' });
    expect(again.record.status).toBe(200);
  });

  it('rejects the same key with a different body', async () => {
    await beginIdempotency({
      method: 'POST',
      path: '/api/ingest/lists/commit',
      key: 'elenor-commit-2',
      bodyHash: hashIngestBody({ previewId: 'prev_a' }),
    });
    await completeIdempotency({
      method: 'POST',
      path: '/api/ingest/lists/commit',
      key: 'elenor-commit-2',
      bodyHash: hashIngestBody({ previewId: 'prev_a' }),
      status: 200,
      body: { ok: true },
    });

    const conflict = await beginIdempotency({
      method: 'POST',
      path: '/api/ingest/lists/commit',
      key: 'elenor-commit-2',
      bodyHash: hashIngestBody({ previewId: 'prev_b' }),
    });
    expect(conflict).toMatchObject({ ok: false, status: 422, code: 'idempotency_key_reused' });
  });

  it('blocks concurrent use while in progress', async () => {
    const first = await beginIdempotency({
      method: 'POST',
      path: '/api/ingest/lists',
      key: 'elenor-write-1',
      bodyHash: hashIngestBody({ dryRun: false }),
    });
    expect(first).toMatchObject({ ok: true, fresh: true });

    const second = await beginIdempotency({
      method: 'POST',
      path: '/api/ingest/lists',
      key: 'elenor-write-1',
      bodyHash: hashIngestBody({ dryRun: false }),
    });
    expect(second).toMatchObject({ ok: false, status: 409, code: 'idempotency_in_progress' });
  });
});

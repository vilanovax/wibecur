import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { runBatchedJsonImport } from '@/lib/admin/bulk-json-import-client';

describe('runBatchedJsonImport', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)) as { items: { id: string }[] };
        return new Response(
          JSON.stringify({
            success: true,
            data: { updated: body.items.length, skipped: 0, failed: 0, errors: [] },
          }),
          { status: 200 }
        );
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports progress per batch', async () => {
    const snapshots: number[] = [];
    const result = await runBatchedJsonImport({
      items: Array.from({ length: 31 }, (_, index) => ({ id: `id-${index}`, tip: 'x' })),
      batchSize: 15,
      endpoint: '/api/admin/items/import-tips',
      buildBody: (batch) => ({ items: batch }),
      onProgress: (progress) => snapshots.push(progress.processed),
    });

    expect(result.processed).toBe(31);
    expect(result.updated).toBe(31);
    expect(snapshots).toEqual([0, 15, 30, 31, 31]);
  });
});

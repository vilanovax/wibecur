import { describe, expect, it } from 'vitest';
import {
  DISCOVERY_CRON_DEFAULT_LIMIT,
  parseDiscoveryCronParams,
  sliceDiscoveryBatch,
} from './discovery-cron';

describe('sliceDiscoveryBatch', () => {
  const ids = ['a', 'b', 'c', 'd', 'e'];

  it('returns the first page without a cursor', () => {
    expect(sliceDiscoveryBatch(ids, { limit: 2 })).toEqual({
      batch: ['a', 'b'],
      nextCursor: 'b',
      hasMore: true,
    });
  });

  it('continues after the cursor', () => {
    expect(sliceDiscoveryBatch(ids, { cursor: 'b', limit: 2 })).toEqual({
      batch: ['c', 'd'],
      nextCursor: 'd',
      hasMore: true,
    });
  });

  it('marks the last page', () => {
    expect(sliceDiscoveryBatch(ids, { cursor: 'd', limit: 2 })).toEqual({
      batch: ['e'],
      nextCursor: 'e',
      hasMore: false,
    });
  });
});

describe('parseDiscoveryCronParams', () => {
  it('applies defaults', () => {
    const params = parseDiscoveryCronParams(
      new Request('http://localhost/api/cron/discovery', { method: 'POST' })
    );
    expect(params.limit).toBe(DISCOVERY_CRON_DEFAULT_LIMIT);
    expect(params.cursor).toBeNull();
    expect(params.concurrency).toBe(5);
  });

  it('reads query overrides', () => {
    const params = parseDiscoveryCronParams(
      new Request(
        'http://localhost/api/cron/discovery?limit=25&cursor=user-1&concurrency=3',
        { method: 'POST' }
      )
    );
    expect(params).toEqual({
      limit: 25,
      cursor: 'user-1',
      concurrency: 3,
    });
  });
});

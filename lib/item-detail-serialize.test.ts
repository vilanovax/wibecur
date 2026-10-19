import { describe, expect, it } from 'vitest';
import {
  slimItemDetailMetadata,
  trimItemDescription,
} from '@/lib/item-detail-serialize';

describe('item-detail-serialize', () => {
  it('keeps display keys and drops heavy blobs', () => {
    const result = slimItemDetailMetadata({
      director: 'Vince Gilligan',
      year: 2008,
      tip: 'انتخاب اصلی لیست',
      entryKind: 'catalog_ref',
      heavyBlob: { nested: true },
      searchIndex: 'xxx',
    });

    expect(result).toEqual({
      director: 'Vince Gilligan',
      year: 2008,
      tip: 'انتخاب اصلی لیست',
      entryKind: 'catalog_ref',
    });
  });

  it('trims long descriptions', () => {
    const long = 'الف'.repeat(1300);
    const trimmed = trimItemDescription(long);
    expect(trimmed?.endsWith('…')).toBe(true);
    expect(trimmed!.length).toBeLessThanOrEqual(1201);
  });
});

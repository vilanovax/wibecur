import { describe, expect, it } from 'vitest';
import {
  parseBulkImportJson,
  resolveBulkImportLiveItemId,
} from '@/lib/admin/bulk-import';
import { validateMetadata } from '@/lib/schemas/item-metadata';

describe('resolveBulkImportLiveItemId', () => {
  it('prefers liveItemId over itemId', () => {
    expect(
      resolveBulkImportLiveItemId({ liveItemId: 'live-1', itemId: 'item-2' })
    ).toBe('live-1');
  });

  it('falls back to itemId', () => {
    expect(resolveBulkImportLiveItemId({ itemId: 'item-2' })).toBe('item-2');
  });

  it('returns undefined when empty', () => {
    expect(resolveBulkImportLiveItemId({})).toBeUndefined();
  });
});

describe('parseBulkImportJson liveItemId', () => {
  it('keeps liveItemId on tip rows', () => {
    const { rows, parseError } = parseBulkImportJson(
      JSON.stringify({
        items: [
          {
            title: 'نکته یک',
            entryKind: 'tip',
            liveItemId: 'abc123XYZ',
            imageUrl: 'https://example.com/a.webp',
          },
        ],
      }),
      'lifestyle'
    );
    expect(parseError).toBeUndefined();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.liveItemId).toBe('abc123XYZ');
    expect(rows[0]?.valid).toBe(true);
  });

  it('accepts tip rows without liveItemId (title match at execute)', () => {
    const { rows, parseError } = parseBulkImportJson(
      JSON.stringify({
        items: [
          {
            title: 'خانه‌بازی بالونیا',
            entryKind: 'tip',
            imageUrl: 'https://example.com/balloon.webp',
          },
        ],
      }),
      'kids-and-teens'
    );
    expect(parseError).toBeUndefined();
    expect(rows[0]?.valid).toBe(true);
    expect(rows[0]?.liveItemId).toBeUndefined();
  });
});

describe('cafe priceRange optional', () => {
  it('accepts cafe metadata without priceRange', () => {
    const result = validateMetadata('cafe', {
      address: 'تهران، ولیعصر',
    });
    expect(result.success).toBe(true);
  });

  it('still rejects invalid priceRange values', () => {
    const result = validateMetadata('cafe', {
      address: 'تهران',
      priceRange: 'گران',
    });
    expect(result.success).toBe(false);
  });
});

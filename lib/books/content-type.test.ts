import { describe, expect, it } from 'vitest';
import {
  inferFidiboContentType,
  inferKetabrahContentType,
  inferTaaghcheContentType,
  matchesContentFilter,
} from '@/lib/books/content-type';
import { buildCatalogExternalKey } from '@/lib/catalog-items';

describe('content-type', () => {
  it('infers fidibo audiobook and ebook', () => {
    expect(inferFidiboContentType({ content_type: 'audiobook' })).toBe('audiobook');
    expect(inferFidiboContentType({ format: 'epub' })).toBe('ebook');
  });

  it('infers taaghche content type from type ids', () => {
    expect(inferTaaghcheContentType([{ id: 2, name: 'صوتی' }])).toBe('audiobook');
    expect(inferTaaghcheContentType([{ id: 1, name: 'الکترونیکی' }])).toBe('ebook');
  });

  it('infers ketabrah from url', () => {
    expect(
      inferKetabrahContentType('https://ketabrah.com/audiobook/123', 'عنوان')
    ).toBe('audiobook');
    expect(inferKetabrahContentType('https://ketabrah.com/book/123', 'عنوان')).toBe('ebook');
  });

  it('filters by content type', () => {
    expect(matchesContentFilter('ebook', 'all')).toBe(true);
    expect(matchesContentFilter('ebook', 'ebook')).toBe(true);
    expect(matchesContentFilter(null, 'ebook')).toBe(false);
  });
});

describe('buildCatalogExternalKey book sources', () => {
  it('uses source:id when isbn is absent', () => {
    expect(
      buildCatalogExternalKey('books', 'کیمیاگر', {
        source: 'fidibo',
        sourceId: '5287',
      })
    ).toBe('fidibo:5287');
  });

  it('prefers isbn over source id', () => {
    expect(
      buildCatalogExternalKey('books', 'کیمیاگر', {
        source: 'fidibo',
        sourceId: '5287',
        isbn: '978-964-448-123-4',
      })
    ).toBe('isbn:978-964-448-123-4');
  });
});

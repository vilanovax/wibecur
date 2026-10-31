import { describe, expect, it } from 'vitest';
import { isBulkImportLightweightRow, validateBulkImportRow } from '@/lib/admin/bulk-import';
import {
  INGEST_EXAMPLES,
  ingestKindForSlug,
  parseIngestDocument,
} from '@/lib/content/ingest-models';
import { chunkItems } from '@/lib/content/ingest-list';

describe('ingest models', () => {
  it('maps seed slugs to the right kind', () => {
    expect(ingestKindForSlug('movies')).toBe('movie');
    expect(ingestKindForSlug('bookspodcast')).toBe('book');
    expect(ingestKindForSlug('cafe')).toBe('cafe');
    expect(ingestKindForSlug('lifestyle')).toBe('mixed');
    expect(ingestKindForSlug('car')).toBe('mixed');
    expect(ingestKindForSlug('khanoadgi')).toBe('mixed');
  });

  it('accepts one example per kind', () => {
    for (const example of Object.values(INGEST_EXAMPLES)) {
      const parsed = parseIngestDocument(example);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) continue;
      parsed.document.items.forEach((item, index) => {
        const row = validateBulkImportRow(item, index, parsed.document.categorySlug);
        expect(row.valid).toBe(true);
      });
    }
  });

  it('rejects a movie without an IMDb id', () => {
    const parsed = parseIngestDocument({
      categorySlug: 'movie',
      list: { title: 'لیست', slug: 'movie-list' },
      items: [{ title: 'فیلم بدون شناسه' }],
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues.some((issue) => issue.message.includes('IMDb'))).toBe(true);
  });

  it('rejects a book without an author', () => {
    const parsed = parseIngestDocument({
      categorySlug: 'book',
      list: { title: 'لیست', slug: 'book-list' },
      items: [{ title: 'کتاب', metadata: {} }],
    });
    expect(parsed.ok).toBe(false);
  });

  it('rejects a cafe without a price range', () => {
    const parsed = parseIngestDocument({
      categorySlug: 'cafe',
      list: { title: 'لیست', slug: 'cafe-list' },
      items: [{ title: 'کافه', metadata: { address: 'تهران' } }],
    });
    expect(parsed.ok).toBe(false);
  });

  it('does not turn a lifestyle row without entryKind into a tip', () => {
    const row = validateBulkImportRow(
      {
        title: 'بازی رومیزی',
        description: 'برای شروع دورهمی',
        imageUrl: 'https://example.com/board.jpg',
      },
      0,
      'lifestyle'
    );
    expect(row.valid).toBe(true);
    expect(row.metadata.entryKind).toBeUndefined();
    expect(isBulkImportLightweightRow('lifestyle', { metadata: row.metadata })).toBe(false);
  });

  it('keeps an explicit lifestyle tip as a lightweight row', () => {
    const row = validateBulkImportRow(
      { title: 'نکته', entryKind: 'tip', tip: 'متن نکته' },
      0,
      'lifestyle'
    );
    expect(row.valid).toBe(true);
    expect(row.metadata.entryKind).toBe('tip');
    expect(
      isBulkImportLightweightRow('lifestyle', {
        metadata: row.metadata,
        entryKind: 'tip',
      })
    ).toBe(true);
  });

  it('rejects a lifestyle fact without factType', () => {
    const parsed = parseIngestDocument({
      categorySlug: 'lifestyle',
      list: { title: 'لیست', slug: 'habit-list' },
      items: [{ title: 'فکت', entryKind: 'fact', tip: 'متن فکت' }],
    });
    expect(parsed.ok).toBe(false);
  });

  it('rejects a persian list slug', () => {
    const parsed = parseIngestDocument({
      categorySlug: 'movie',
      list: { title: 'لیست', slug: 'فیلم‌ها' },
      items: [],
    });
    expect(parsed.ok).toBe(false);
  });

  it('allows creating a list with no items yet', () => {
    const parsed = parseIngestDocument({
      categorySlug: 'podcast',
      list: { title: 'پادکست‌های شب', slug: 'night-podcasts' },
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.document.kind).toBe('mixed');
    expect(parsed.document.items).toEqual([]);
  });

  it('chunks imports at 100', () => {
    expect(chunkItems(Array.from({ length: 101 }, (_, i) => i)).map((chunk) => chunk.length)).toEqual([
      100, 1,
    ]);
  });
});

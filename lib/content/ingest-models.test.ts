import { describe, expect, it } from 'vitest';
import { isBulkImportLightweightRow, validateBulkImportRow } from '@/lib/admin/bulk-import';
import {
  INGEST_EXAMPLES,
  ingestKindForSlug,
  looksLikeFilmTitleFormat,
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

  it('allows podcast without author when mediaType is podcast', () => {
    const parsed = parseIngestDocument({
      categorySlug: 'bookspodcast',
      list: { title: 'لیست', slug: 'pod-list' },
      items: [{ title: 'پادکست نمونه', metadata: { mediaType: 'podcast' } }],
    });
    expect(parsed.ok).toBe(true);
  });

  it('accepts a cafe without price range and warns', () => {
    const parsed = parseIngestDocument({
      categorySlug: 'cafe',
      list: { title: 'لیست', slug: 'cafe-list' },
      items: [{ title: 'کافه', metadata: { address: 'تهران' } }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(
      parsed.document.warnings.some((w) => w.code === 'content_rule.cafe_price_range_missing')
    ).toBe(true);
  });

  it('allows publish defaults and explicit deactivate', () => {
    const published = parseIngestDocument({
      categorySlug: 'movies',
      list: { title: 'لیست', slug: 'pub-list', isPublic: true, isActive: true },
      items: [],
    });
    expect(published.ok).toBe(true);

    const offline = parseIngestDocument({
      categorySlug: 'movies',
      list: { title: 'لیست', slug: 'off-list', isActive: false, isPublic: false },
      items: [],
    });
    expect(offline.ok).toBe(true);
    if (!offline.ok) return;
    expect(offline.document.list.isActive).toBe(false);
  });

  it('warns when movie description embeds a rating', () => {
    const parsed = parseIngestDocument({
      categorySlug: 'movies',
      list: { title: 'لیست', slug: 'rating-in-copy' },
      items: [
        {
          title: 'Oldboy - اولدبوی',
          externalUrl: 'https://www.imdb.com/title/tt0364569',
          description: 'امتیاز IMDb این فیلم ۸٫۴ از ۱۰ است.',
          metadata: { imdbRating: '8.4' },
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(
      parsed.document.warnings.some((w) => w.code === 'content_rule.rating_in_description')
    ).toBe(true);
  });

  it('rejects bot setting isFeatured, badge, or tags', () => {
    expect(
      parseIngestDocument({
        categorySlug: 'movies',
        list: { title: 'لیست', slug: 'feat', isFeatured: true },
        items: [],
      }).ok
    ).toBe(false);
    expect(
      parseIngestDocument({
        categorySlug: 'movies',
        list: { title: 'لیست', slug: 'badge', badge: 'NEW' },
        items: [],
      }).ok
    ).toBe(false);
    expect(
      parseIngestDocument({
        categorySlug: 'movies',
        list: { title: 'لیست', slug: 'tags', tags: ['اکشن'] },
        items: [],
      }).ok
    ).toBe(false);
  });

  it('rejects fact and link entryKinds in mixed v1', () => {
    const fact = parseIngestDocument({
      categorySlug: 'lifestyle',
      list: { title: 'لیست', slug: 'habit-list' },
      items: [{ title: 'فکت', entryKind: 'fact', tip: 'متن فکت' }],
    });
    expect(fact.ok).toBe(false);

    const link = parseIngestDocument({
      categorySlug: 'lifestyle',
      list: { title: 'لیست', slug: 'link-list' },
      items: [{ title: 'لینک', entryKind: 'link', externalUrl: 'https://example.com' }],
    });
    expect(link.ok).toBe(false);
  });

  it('requires catalogItemId for catalog_ref', () => {
    const missing = parseIngestDocument({
      categorySlug: 'lifestyle',
      list: { title: 'لیست', slug: 'ref-list' },
      items: [
        {
          title: 'کافه',
          entryKind: 'catalog_ref',
          imageUrl: 'https://example.com/cafe.jpg',
        },
      ],
    });
    expect(missing.ok).toBe(false);

    const ok = parseIngestDocument({
      categorySlug: 'lifestyle',
      list: { title: 'لیست', slug: 'ref-ok' },
      items: [
        {
          title: 'کافه',
          entryKind: 'catalog_ref',
          catalogItemId: 'existing-cafe-1',
        },
      ],
    });
    expect(ok.ok).toBe(true);
  });

  it('accepts entryKind new as catalog create on ingest', () => {
    const parsed = parseIngestDocument({
      categorySlug: 'lifestyle',
      list: { title: 'لیست', slug: 'new-place-list' },
      items: [
        {
          title: 'شادبوم',
          entryKind: 'new',
          imageUrl: 'https://example.com/shadboom.jpg',
          metadata: { website: 'https://shadboom.ir', mapsUrl: 'https://balad.ir/p/z' },
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.document.items[0]?.entryKind).toBeUndefined();
  });

  it('warns on film title format and long description', () => {
    expect(looksLikeFilmTitleFormat('Oldboy - اولدبوی')).toBe(true);
    expect(looksLikeFilmTitleFormat('اولدبوی')).toBe(false);

    const parsed = parseIngestDocument({
      categorySlug: 'movies',
      list: { title: 'لیست', slug: 'warn-list' },
      items: [
        {
          title: 'فقط فارسی',
          externalUrl: 'https://www.imdb.com/title/tt15239678',
          description: 'x'.repeat(321),
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(
      parsed.document.warnings.some((w) => w.code === 'content_rule.film_title_format')
    ).toBe(true);
    expect(
      parsed.document.warnings.some((w) => w.code === 'description_will_be_truncated_publicly')
    ).toBe(true);
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

  it('treats entryKind new as catalog create, not invalid', () => {
    const row = validateBulkImportRow(
      {
        title: 'عمارت روشنان',
        entryKind: 'new',
        imageUrl: 'https://example.com/place.jpg',
        metadata: {
          mapsUrl: 'https://balad.ir/p/x',
          website: 'https://example.ir',
        },
      },
      0,
      'lifestyle'
    );
    expect(row.valid).toBe(true);
    expect(row.entryKind).toBeUndefined();
    expect(row.metadata.entryKind).toBeUndefined();
    expect(isBulkImportLightweightRow('lifestyle', { metadata: row.metadata })).toBe(
      false
    );
  });

  it('maps entryKind catalog to catalog create (not lightweight)', () => {
    const row = validateBulkImportRow(
      { title: 'مکان', entryKind: 'catalog', imageUrl: 'https://example.com/a.jpg' },
      0,
      'lifestyle'
    );
    expect(row.valid).toBe(true);
    expect(isBulkImportLightweightRow('lifestyle', { entryKind: row.entryKind, metadata: row.metadata })).toBe(
      false
    );
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

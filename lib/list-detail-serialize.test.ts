import { describe, expect, it } from 'vitest';
import { prepareListDetailForClient } from '@/lib/list-detail-serialize';

describe('prepareListDetailForClient', () => {
  it('trims metadata to client-facing keys only', () => {
    const result = prepareListDetailForClient({
      id: 'l1',
      items: [
        {
          title: 'Film',
          description: 'x'.repeat(400),
          metadata: {
            director: 'Nolan',
            year: 2010,
            heavyBlob: { nested: true },
            actors: ['Leo'],
          },
        },
      ],
    });

    expect(result.items[0].metadata).toEqual({
      director: 'Nolan',
      year: 2010,
      actors: ['Leo'],
    });
  });

  it('keeps category filter keys for user-list chips', () => {
    const result = prepareListDetailForClient({
      items: [
        {
          title: 'X',
          metadata: {
            sourceCategorySlug: 'movie',
            categorySlug: 'movie',
            heavyBlob: true,
          },
        },
      ],
    });

    expect(result.items[0].metadata).toEqual({
      sourceCategorySlug: 'movie',
      categorySlug: 'movie',
    });
  });

  it('collapses searchProfile to the text the in-list search needs', () => {
    const result = prepareListDetailForClient({
      items: [
        {
          title: 'نیمه شب',
          metadata: {
            author: 'ریلی سیجر',
            searchProfile: {
              genres: ['تریلر'],
              keywords: ['خانه'],
              searchText: 'تریلر روان‌شناختی خانه',
              enrichedAt: '2026-01-01T00:00:00.000Z',
              model: 'gpt',
            },
          },
        },
      ],
    });

    expect(result.items[0].metadata).toEqual({
      author: 'ریلی سیجر',
      searchProfile: { searchText: 'تریلر روان‌شناختی خانه' },
    });
  });

  it('keeps preview-modal keys (tip / imdb / entryKind)', () => {
    const result = prepareListDetailForClient({
      items: [
        {
          title: 'Raid',
          metadata: {
            tip: 'انتخاب اصلی',
            imdbRating: 7.6,
            entryKind: 'catalog_ref',
            factType: 'stat',
            heavyBlob: true,
          },
        },
      ],
    });

    expect(result.items[0].metadata).toEqual({
      tip: 'انتخاب اصلی',
      imdbRating: 7.6,
      entryKind: 'catalog_ref',
      factType: 'stat',
    });
  });
});

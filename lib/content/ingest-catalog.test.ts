import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resolveIngestCatalogType,
  searchIngestCatalog,
} from '@/lib/content/ingest-catalog';

vi.mock('@/lib/catalog-items', () => ({
  findCatalogByExternalKey: vi.fn(),
  searchCatalogItems: vi.fn(),
}));

import { findCatalogByExternalKey, searchCatalogItems } from '@/lib/catalog-items';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolveIngestCatalogType', () => {
  it('treats movies category without series signals as movie', () => {
    expect(resolveIngestCatalogType('movies', { imdbId: 'tt1375666' })).toBe('movie');
  });

  it('infers series from episodes or creator', () => {
    expect(resolveIngestCatalogType('movies', { episodes: 62 })).toBe('series');
    expect(resolveIngestCatalogType('movies', { creator: 'Vince Gilligan' })).toBe(
      'series'
    );
  });

  it('honors explicit mediaType series and tv aliases', () => {
    expect(resolveIngestCatalogType('movies', { mediaType: 'series' })).toBe('series');
    expect(resolveIngestCatalogType('movies', { type: 'tv' })).toBe('series');
  });
});

describe('searchIngestCatalog', () => {
  it('requires q or imdbId', async () => {
    const result = await searchIngestCatalog({} as never, {});
    expect(result).toMatchObject({ ok: false, status: 400, code: 'bad_request' });
  });

  it('rejects unknown mediaType filter like foo', async () => {
    const result = await searchIngestCatalog({} as never, {
      q: 'Inception',
      mediaType: 'foo',
    });
    expect(result).toMatchObject({ ok: false, status: 400, code: 'bad_request' });
    if (result.ok) return;
    expect(result.error).toContain('movie');
  });

  it('finds by imdbId with live listCount and mediaType movie', async () => {
    vi.mocked(findCatalogByExternalKey).mockResolvedValue({
      id: 'cat1',
      title: 'Dune: Part Two - تلماسه',
      imageUrl: null,
      categorySlug: 'movies',
      metadata: { imdbId: 'tt15239678' },
      externalUrl: 'https://www.imdb.com/title/tt15239678',
      externalKey: 'imdb:tt15239678',
    } as never);

    const prisma = {
      items: {
        groupBy: vi.fn().mockResolvedValue([{ catalogItemId: 'cat1', _count: { _all: 2 } }]),
      },
      catalog_items: { findMany: vi.fn() },
    };

    const result = await searchIngestCatalog(prisma as never, {
      imdbId: 'tt15239678',
      mediaType: 'movie',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toEqual([
      expect.objectContaining({
        catalogItemId: 'cat1',
        type: 'movie',
        mediaType: 'movie',
        imdbId: 'tt15239678',
        listCount: 2,
      }),
    ]);
    expect(result.mediaTypeFilters).toContain('tv');
    expect(findCatalogByExternalKey).toHaveBeenCalledWith(prisma, 'imdb:tt15239678');
  });

  it('uses live listCount for title search not searchCatalogItems count', async () => {
    vi.mocked(searchCatalogItems).mockResolvedValue([
      {
        id: 'cat-inception',
        title: 'Inception',
        description: null,
        imageUrl: null,
        categorySlug: 'movies',
        externalKey: 'imdb:tt1375666',
        listCount: 5,
        sampleListTitles: [],
        alreadyInList: false,
      },
    ]);

    const prisma = {
      items: {
        groupBy: vi
          .fn()
          .mockResolvedValue([{ catalogItemId: 'cat-inception', _count: { _all: 2 } }]),
      },
      catalog_items: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'cat-inception',
            title: 'Inception',
            imageUrl: null,
            categorySlug: 'movies',
            metadata: { imdbId: 'tt1375666' },
            externalUrl: null,
            externalKey: 'imdb:tt1375666',
          },
        ]),
      },
    };

    const result = await searchIngestCatalog(prisma as never, { q: 'Inception' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items[0]?.listCount).toBe(2);
  });

  it('filters series with mediaType=tv and fills mediaType', async () => {
    vi.mocked(searchCatalogItems).mockResolvedValue([
      {
        id: 'bb',
        title: 'Breaking Bad',
        description: null,
        imageUrl: null,
        categorySlug: 'movies',
        externalKey: null,
        listCount: 9,
        sampleListTitles: [],
        alreadyInList: false,
      },
    ]);

    const prisma = {
      items: {
        groupBy: vi.fn().mockResolvedValue([{ catalogItemId: 'bb', _count: { _all: 4 } }]),
      },
      catalog_items: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'bb',
            title: 'Breaking Bad',
            imageUrl: null,
            categorySlug: 'movies',
            metadata: { episodes: 62, creator: 'Vince Gilligan' },
            externalUrl: null,
            externalKey: null,
          },
        ]),
      },
    };

    const result = await searchIngestCatalog(prisma as never, {
      q: 'Breaking',
      mediaType: 'tv',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      type: 'series',
      mediaType: 'series',
      listCount: 4,
    });
  });

  it('searches by title q and maps podcast mediaType', async () => {
    vi.mocked(searchCatalogItems).mockResolvedValue([
      {
        id: 'pod1',
        title: 'پادکست شب',
        description: null,
        imageUrl: null,
        categorySlug: 'bookspodcast',
        externalKey: null,
        listCount: 1,
        sampleListTitles: [],
        alreadyInList: false,
      },
    ]);

    const prisma = {
      items: {
        groupBy: vi.fn().mockResolvedValue([{ catalogItemId: 'pod1', _count: { _all: 1 } }]),
      },
      catalog_items: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'pod1',
            title: 'پادکست شب',
            imageUrl: null,
            categorySlug: 'bookspodcast',
            metadata: { mediaType: 'podcast' },
            externalUrl: null,
            externalKey: null,
          },
        ]),
      },
    };

    const result = await searchIngestCatalog(prisma as never, {
      q: 'شب',
      mediaType: 'podcast',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items[0]).toMatchObject({
      catalogItemId: 'pod1',
      type: 'podcast',
      mediaType: 'podcast',
    });
  });
});

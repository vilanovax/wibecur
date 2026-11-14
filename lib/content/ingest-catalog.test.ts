import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchIngestCatalog } from '@/lib/content/ingest-catalog';

vi.mock('@/lib/catalog-items', () => ({
  findCatalogByExternalKey: vi.fn(),
  searchCatalogItems: vi.fn(),
}));

import { findCatalogByExternalKey, searchCatalogItems } from '@/lib/catalog-items';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('searchIngestCatalog', () => {
  it('requires q or imdbId', async () => {
    const result = await searchIngestCatalog({} as never, {});
    expect(result).toMatchObject({ ok: false, status: 400, code: 'bad_request' });
  });

  it('finds by imdbId and returns type movie', async () => {
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
      items: { count: vi.fn().mockResolvedValue(3) },
      catalog_items: { findUnique: vi.fn() },
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
        title: 'Dune: Part Two - تلماسه',
        type: 'movie',
        imdbId: 'tt15239678',
        listCount: 3,
      }),
    ]);
    expect(findCatalogByExternalKey).toHaveBeenCalledWith(prisma, 'imdb:tt15239678');
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
      items: { count: vi.fn() },
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
    expect(searchCatalogItems).toHaveBeenCalledWith(prisma, 'شب', {
      limit: 40,
      categorySlug: 'bookspodcast',
    });
  });
});

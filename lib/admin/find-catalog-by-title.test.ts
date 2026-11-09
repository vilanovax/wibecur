import { describe, expect, it, vi } from 'vitest';
import { findCatalogByTitleMatch } from '@/lib/catalog-items';

describe('findCatalogByTitleMatch', () => {
  it('matches catalog_items directly without needing a list placement', async () => {
    const catalog = {
      id: 'c1',
      title: 'Inception',
      description: null,
      imageUrl: null,
      externalUrl: null,
      categorySlug: 'movie',
      metadata: {},
      externalKey: 'imdb:tt1375666',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const prisma = {
      catalog_items: {
        findMany: vi.fn(async () => [catalog]),
      },
      items: {
        findMany: vi.fn(async () => []),
      },
    };

    const found = await findCatalogByTitleMatch(prisma as never, 'movie', 'Inception');
    expect(found?.id).toBe('c1');
    expect(prisma.catalog_items.findMany).toHaveBeenCalled();
    expect(prisma.items.findMany).not.toHaveBeenCalled();
  });
});

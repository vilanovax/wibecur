import { describe, expect, it, vi } from 'vitest';
import { getIngestList } from '@/lib/content/ingest-list-read';

describe('getIngestList', () => {
  it('returns inactive private list with full placement fields', async () => {
    const prisma = {
      lists: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'L1',
          slug: 'quiet-cafes',
          title: 'کافه‌های آرام',
          description: 'توضیح',
          coverImage: 'https://cdn.example/cover.webp',
          horizontalImage: 'https://cdn.example/banner.webp',
          isActive: false,
          isPublic: false,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-11-14T00:00:00.000Z'),
          categories: { id: 'c1', slug: 'lifestyle', name: 'سبک زندگی' },
        }),
      },
      items: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'p1',
            listId: 'L1',
            catalogItemId: 'cat1',
            order: 0,
            title: 'کافه نادری',
            description: null,
            imageUrl: null,
            externalUrl: null,
            listNote: null,
            metadata: {
              entryKind: 'catalog_ref',
              tip: 'صبح‌ها خلوت است',
              author: 'ندارد',
              mapsUrl: 'https://balad.ir/p/x',
              website: 'https://example.ir',
            },
            updatedAt: new Date('2026-11-14T00:00:00.000Z'),
          },
        ]),
      },
    };

    const result = await getIngestList(prisma as never, 'quiet-cafes');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.list.isActive).toBe(false);
    expect(result.list.isPublic).toBe(false);
    expect(result.list.itemCount).toBe(1);
    expect(result.placements[0]).toMatchObject({
      placementId: 'p1',
      catalogItemId: 'cat1',
      entryKind: 'catalog_ref',
      tip: 'صبح‌ها خلوت است',
      metadata: {
        author: 'ندارد',
        mapsUrl: 'https://balad.ir/p/x',
        website: 'https://example.ir',
      },
    });
  });

  it('returns not_found for missing list', async () => {
    const prisma = {
      lists: { findFirst: vi.fn().mockResolvedValue(null) },
      items: { findMany: vi.fn() },
    };
    const result = await getIngestList(prisma as never, 'missing');
    expect(result).toMatchObject({ ok: false, status: 404, code: 'not_found' });
    expect(prisma.items.findMany).not.toHaveBeenCalled();
  });
});

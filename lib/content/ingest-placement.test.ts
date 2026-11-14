import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  patchIngestPlacement,
  removeIngestPlacement,
} from '@/lib/content/ingest-placement';

vi.mock('@/lib/admin/remove-item-from-list', () => ({
  removeItemFromList: vi.fn(),
  RemoveFromListError: class RemoveFromListError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
      this.name = 'RemoveFromListError';
    }
  },
}));

import { removeItemFromList } from '@/lib/admin/remove-item-from-list';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('patchIngestPlacement guards', () => {
  it('rejects catalog_and_all scope', async () => {
    const prisma = {
      items: { findFirst: vi.fn() },
    };
    const result = await patchIngestPlacement(prisma as never, 'p1', {
      scope: 'catalog_and_all',
      title: 'x',
    });
    expect(result).toMatchObject({
      ok: false,
      status: 403,
      code: 'forbidden_scope',
    });
    expect(prisma.items.findFirst).not.toHaveBeenCalled();
  });

  it('rejects tip conflict between tip and metadata.tip', async () => {
    const prisma = {
      items: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'p1',
          listId: 'L1',
          catalogItemId: null,
          title: 'نکته',
          description: null,
          imageUrl: null,
          externalUrl: null,
          listNote: null,
          order: 0,
          metadata: { entryKind: 'tip', tip: 'قدیمی' },
          lists: { id: 'L1', slug: 's', categoryId: 'c', deletedAt: null },
        }),
        update: vi.fn(),
      },
    };
    const result = await patchIngestPlacement(prisma as never, 'p1', {
      tip: 'جدید',
      metadata: { tip: 'متفاوت' },
    });
    expect(result).toMatchObject({ ok: false, status: 422, code: 'tip_conflict' });
    expect(prisma.items.update).not.toHaveBeenCalled();
  });

  it('patches tip on placement only and reports zero other placements', async () => {
    const prisma = {
      items: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'p1',
          listId: 'L1',
          catalogItemId: 'cat1',
          title: 'فیلم',
          description: 'توضیح',
          imageUrl: null,
          externalUrl: null,
          listNote: null,
          order: 2,
          metadata: { tip: 'قدیمی' },
          lists: { id: 'L1', slug: 's', categoryId: 'c', deletedAt: null },
        }),
        update: vi.fn().mockResolvedValue({
          id: 'p1',
          listId: 'L1',
          catalogItemId: 'cat1',
          title: 'فیلم',
          description: 'توضیح',
          imageUrl: null,
          externalUrl: null,
          listNote: null,
          order: 2,
          metadata: { tip: 'جدید', listOverrides: { tip: true } },
          updatedAt: new Date('2026-11-14T00:00:00.000Z'),
        }),
      },
    };

    const result = await patchIngestPlacement(prisma as never, 'p1', { tip: 'جدید' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.otherPlacementsAffected).toBe(0);
    expect(result.placement.metadata).toMatchObject({ tip: 'جدید' });
    expect(prisma.items.update).toHaveBeenCalledOnce();
    const updateArg = prisma.items.update.mock.calls[0]?.[0];
    expect(updateArg?.data?.metadata).toMatchObject({
      tip: 'جدید',
      listOverrides: { tip: true },
    });
  });
});

describe('removeIngestPlacement', () => {
  it('removes only from this list and leaves catalog untouched', async () => {
    vi.mocked(removeItemFromList).mockResolvedValue({
      removedId: 'p1',
      listId: 'L1',
      catalogItemId: 'cat1',
      itemCount: 4,
    });

    const prisma = {
      items: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'p1',
          listId: 'L1',
          catalogItemId: 'cat1',
          lists: { deletedAt: null },
        }),
      },
    };

    const result = await removeIngestPlacement(prisma as never, 'p1');
    expect(result).toEqual({
      ok: true,
      removed: true,
      catalogUntouched: true,
      placementId: 'p1',
      listId: 'L1',
      catalogItemId: 'cat1',
      itemCount: 4,
    });
    expect(removeItemFromList).toHaveBeenCalledWith(prisma, 'L1', 'p1');
  });

  it('returns not_found when placement is missing', async () => {
    const prisma = {
      items: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const result = await removeIngestPlacement(prisma as never, 'missing');
    expect(result).toMatchObject({ ok: false, status: 404, code: 'not_found' });
    expect(removeItemFromList).not.toHaveBeenCalled();
  });
});

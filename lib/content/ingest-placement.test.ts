import { describe, expect, it, vi } from 'vitest';
import { patchIngestPlacement } from '@/lib/content/ingest-placement';

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

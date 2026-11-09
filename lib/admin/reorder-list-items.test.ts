import { describe, expect, it, vi } from 'vitest';
import { ReorderListItemsError, reorderListItems } from './reorder-list-items';

vi.mock('@/lib/public-cache', () => ({
  revalidateListDetailCache: vi.fn(),
  revalidateCategoryCache: vi.fn(),
}));

function makePrisma(opts: {
  list: { id: string; slug: string; categoryId: string | null; deletedAt: Date | null } | null;
  liveIds: string[];
}) {
  return {
    lists: {
      findUnique: vi.fn(async () => opts.list),
    },
    items: {
      findMany: vi.fn(async () => opts.liveIds.map((id) => ({ id }))),
    },
    $executeRaw: vi.fn(async () => opts.liveIds.length),
  };
}

describe('reorderListItems', () => {
  it('rejects mismatched id sets', async () => {
    const prisma = makePrisma({
      list: { id: 'L1', slug: 's', categoryId: null, deletedAt: null },
      liveIds: ['a', 'b', 'c'],
    });
    await expect(
      reorderListItems(prisma as never, 'L1', ['a', 'b'])
    ).rejects.toBeInstanceOf(ReorderListItemsError);
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('writes final order via a single batch UPDATE', async () => {
    const prisma = makePrisma({
      list: { id: 'L1', slug: 's', categoryId: 'c1', deletedAt: null },
      liveIds: ['a', 'b', 'c'],
    });
    const result = await reorderListItems(prisma as never, 'L1', ['c', 'a', 'b']);
    expect(result.orderedIds).toEqual(['c', 'a', 'b']);
    expect(result.itemCount).toBe(3);
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });
});

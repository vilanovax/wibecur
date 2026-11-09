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
  const updates: { id: string; order: number }[] = [];
  return {
    lists: {
      findUnique: vi.fn(async () => opts.list),
    },
    items: {
      findMany: vi.fn(async () => opts.liveIds.map((id) => ({ id }))),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: { order: number } }) => {
        updates.push({ id: where.id, order: data.order });
        return {};
      }),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        items: {
          update: async ({
            where,
            data,
          }: {
            where: { id: string };
            data: { order: number };
          }) => {
            updates.push({ id: where.id, order: data.order });
            return {};
          },
        },
      };
      return fn(tx);
    }),
    __updates: updates,
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
  });

  it('writes final 0..n-1 order in a transaction', async () => {
    const prisma = makePrisma({
      list: { id: 'L1', slug: 's', categoryId: 'c1', deletedAt: null },
      liveIds: ['a', 'b', 'c'],
    });
    const result = await reorderListItems(prisma as never, 'L1', ['c', 'a', 'b']);
    expect(result.orderedIds).toEqual(['c', 'a', 'b']);
    const finalOrders = prisma.__updates.filter((u) => u.order >= 0);
    expect(finalOrders).toEqual([
      { id: 'c', order: 0 },
      { id: 'a', order: 1 },
      { id: 'b', order: 2 },
    ]);
  });
});

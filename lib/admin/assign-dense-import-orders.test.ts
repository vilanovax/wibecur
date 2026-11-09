import { describe, expect, it } from 'vitest';
import { assignDenseImportOrders } from '@/lib/admin/bulk-import-execute';
import { resolveInsertOrder } from '@/lib/catalog-items';

describe('assignDenseImportOrders', () => {
  it('assigns unique dense orders from current max', () => {
    const orders = assignDenseImportOrders(
      [{ title: 'a' }, { title: 'b' }, { title: 'c' }],
      9
    );
    expect(orders).toEqual([10, 11, 12]);
    expect(new Set(orders).size).toBe(3);
  });

  it('uses JSON order only as relative sort, still unique', () => {
    const orders = assignDenseImportOrders(
      [
        { title: 'second', order: 5 },
        { title: 'first', order: 1 },
        { title: 'third', order: 5 },
      ],
      -1
    );
    // first (order 1) → 0, then two with order 5 keep input relative index
    expect(orders[1]).toBe(0);
    expect(orders[0]).toBe(1);
    expect(orders[2]).toBe(2);
    expect(new Set(orders).size).toBe(3);
  });

  it('ignores duplicate JSON orders for uniqueness', () => {
    const orders = assignDenseImportOrders(
      [
        { title: 'a', order: 0 },
        { title: 'b', order: 0 },
        { title: 'c', order: 0 },
      ],
      -1
    );
    expect(orders).toEqual([0, 1, 2]);
  });
});

describe('resolveInsertOrder', () => {
  it('absolute mode trusts requested order even past end', async () => {
    const prisma = {
      items: {
        aggregate: async () => ({ _max: { order: 0 } }),
        updateMany: async () => ({ count: 0 }),
      },
    };
    const order = await resolveInsertOrder(prisma as never, 'L1', 5, 'absolute');
    expect(order).toBe(5);
  });

  it('insert mode clamps past-end to nextAppend', async () => {
    const prisma = {
      items: {
        aggregate: async () => ({ _max: { order: 0 } }),
        updateMany: async () => ({ count: 0 }),
      },
    };
    const order = await resolveInsertOrder(prisma as never, 'L1', 5, 'insert');
    expect(order).toBe(1);
  });
});

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

export type SuggestionsStats = {
  listPending: number;
  listApproved: number;
  listTotal: number;
  itemFormPending: number;
  itemFormApproved: number;
  itemFormTotal: number;
  itemMenuPending: number;
  itemMenuApproved: number;
  itemMenuTotal: number;
  itemPending: number;
  itemApproved: number;
  itemTotal: number;
  totalPending: number;
  totalApproved: number;
};

/** آمار یکپارچه پیشنهادها — شامل پیشنهاد منوی سه‌نقطه (list_comments) */
export async function getSuggestionsStats(): Promise<SuggestionsStats> {
  const [
    listStats,
    itemFormStats,
    itemMenuPending,
    itemMenuApproved,
    itemMenuTotal,
  ] = await dbQuery(() =>
    Promise.all([
      prisma.suggested_lists.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.suggested_items.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.list_comments.count({
        where: {
          type: 'suggestion',
          deletedAt: null,
          suggestionStatus: 'pending',
        },
      }),
      prisma.list_comments.count({
        where: {
          type: 'suggestion',
          deletedAt: null,
          suggestionStatus: 'approved',
        },
      }),
      prisma.list_comments.count({
        where: {
          type: 'suggestion',
          deletedAt: null,
          suggestionStatus: { in: ['pending', 'approved', 'rejected'] },
        },
      }),
    ])
  );

  const listPending = listStats.find((s) => s.status === 'pending')?._count.status ?? 0;
  const listApproved = listStats.find((s) => s.status === 'approved')?._count.status ?? 0;
  const listTotal = listStats.reduce((sum, s) => sum + s._count.status, 0);

  const itemFormPending = itemFormStats.find((s) => s.status === 'pending')?._count.status ?? 0;
  const itemFormApproved = itemFormStats.find((s) => s.status === 'approved')?._count.status ?? 0;
  const itemFormTotal = itemFormStats.reduce((sum, s) => sum + s._count.status, 0);

  const itemPending = itemFormPending + itemMenuPending;
  const itemApproved = itemFormApproved + itemMenuApproved;
  const itemTotal = itemFormTotal + itemMenuTotal;

  return {
    listPending,
    listApproved,
    listTotal,
    itemFormPending,
    itemFormApproved,
    itemFormTotal,
    itemMenuPending,
    itemMenuApproved,
    itemMenuTotal,
    itemPending,
    itemApproved,
    itemTotal,
    totalPending: listPending + itemPending,
    totalApproved: listApproved + itemApproved,
  };
}

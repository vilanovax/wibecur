/**
 * Admin Home Featured management payload.
 *
 * Perf (vercel-react-best-practices):
 * - Parallel slot/report/fallback queries (async-parallel)
 * - No 300-list payload on first paint — lists load on wizard open
 * - Admin current-slot lookup without notification side effects
 * - Event groupBy scoped to relevant slot ids only
 * - Performance derived from slot row (no second round-trip)
 */

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import {
  getFeaturedRecommendations,
  getWeeklyFeaturedReport,
  type FeaturedPerformanceResult,
} from '@/lib/featured-performance';
import type {
  FeaturedListOption,
  FeaturedManagementData,
  FeaturedSlotItem,
  FeaturedSlotPerformance,
} from '@/lib/admin/featured-management-types';

const listSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  coverImage: true,
  saveCount: true,
  itemCount: true,
  badge: true,
  categories: { select: { name: true, slug: true } },
} as const;

const slotSelect = {
  id: true,
  listId: true,
  startAt: true,
  endAt: true,
  orderIndex: true,
  impressions: true,
  clicks: true,
  baselineSaves: true,
  savesDuring: true,
  baselineScore: true,
  peakScore: true,
  lists: { select: listSelect },
} as const;

type ListRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  saveCount: number;
  itemCount: number;
  badge: string | null;
  categories: { name: string; slug: string } | null;
};

type SlotRow = {
  id: string;
  listId: string;
  startAt: Date;
  endAt: Date | null;
  orderIndex: number;
  impressions: number | null;
  clicks: number | null;
  baselineSaves: number | null;
  savesDuring: number | null;
  baselineScore: number | null;
  peakScore: number | null;
  lists: ListRow | null;
};

function toListOption(l: ListRow): FeaturedListOption {
  return {
    id: l.id,
    title: l.title,
    slug: l.slug,
    description: l.description,
    coverImage: l.coverImage,
    saveCount: l.saveCount,
    itemCount: l.itemCount,
    badge: l.badge,
    categories: l.categories,
  };
}

function mondayOf(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function performanceFromSlot(slot: SlotRow): FeaturedSlotPerformance {
  const impressions = slot.impressions ?? 0;
  const clicks = slot.clicks ?? 0;
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const baselineSaves = slot.baselineSaves ?? null;
  const savesDuring = slot.savesDuring ?? 0;
  const saveLiftPercent =
    baselineSaves != null && baselineSaves > 0
      ? (savesDuring / baselineSaves) * 100
      : null;
  const baselineScore = slot.baselineScore ?? null;
  const peakScore = slot.peakScore ?? null;
  const scoreLiftPercent =
    baselineScore != null && baselineScore > 0 && peakScore != null
      ? ((peakScore - baselineScore) / baselineScore) * 100
      : null;
  return {
    impressions,
    clicks,
    ctr,
    savesDuring,
    baselineSaves,
    saveLiftPercent,
    baselineScore,
    peakScore,
    scoreLiftPercent,
  };
}

function mapSlot(
  s: SlotRow,
  counts: { viewList: number; quickSave: number }
): FeaturedSlotItem | null {
  if (!s.lists) return null;
  return {
    id: s.id,
    listId: s.listId,
    list: toListOption(s.lists),
    startAt: s.startAt.toISOString(),
    endAt: s.endAt ? s.endAt.toISOString() : null,
    orderIndex: s.orderIndex,
    viewListCount: counts.viewList,
    quickSaveCount: counts.quickSave,
  };
}

export async function getFeaturedListsForPicker(): Promise<FeaturedListOption[]> {
  const rows = await dbQuery(() =>
    prisma.lists.findMany({
      where: { deletedAt: null },
      select: {
        ...listSelect,
        isPublic: true,
        isActive: true,
        deletedAt: true,
        isFeatured: true,
      },
      orderBy: [{ isFeatured: 'desc' }, { saveCount: 'desc' }],
      take: 300,
    })
  );
  return rows.map((l) => ({
    ...toListOption(l),
    isPublic: l.isPublic,
    isActive: l.isActive,
    deletedAt: l.deletedAt?.toISOString() ?? null,
    isFeatured: l.isFeatured,
  }));
}

export async function getFeaturedManagementData(options?: {
  includeLists?: boolean;
}): Promise<FeaturedManagementData> {
  const includeLists = options?.includeLists === true;
  const now = new Date();
  const weekStart = mondayOf(now);

  const [
    activeSlot,
    upcomingSlots,
    pastSlots,
    weeklyReport,
    fallbackRow,
    lists,
  ] = await Promise.all([
    dbQuery(() =>
      prisma.home_featured_slot.findFirst({
        where: {
          startAt: { lte: now },
          OR: [{ endAt: null }, { endAt: { gt: now } }],
        },
        orderBy: { startAt: 'desc' },
        select: slotSelect,
      })
    ) as Promise<SlotRow | null>,
    dbQuery(() =>
      prisma.home_featured_slot.findMany({
        where: { startAt: { gt: now } },
        orderBy: { startAt: 'asc' },
        select: slotSelect,
      })
    ) as Promise<SlotRow[]>,
    dbQuery(() =>
      prisma.home_featured_slot.findMany({
        where: { endAt: { lt: now } },
        orderBy: { endAt: 'desc' },
        take: 50,
        select: slotSelect,
      })
    ) as Promise<SlotRow[]>,
    dbQuery(() => getWeeklyFeaturedReport(prisma, weekStart)),
    dbQuery(() =>
      prisma.lists.findFirst({
        where: {
          deletedAt: null,
          isFeatured: true,
          isActive: true,
        },
        select: listSelect,
        orderBy: { saveCount: 'desc' },
      })
    ),
    includeLists
      ? getFeaturedListsForPicker()
      : Promise.resolve([] as FeaturedListOption[]),
  ]);

  // Expired-as-current only when no live slot (mirrors home, without admin notification)
  let currentRow = activeSlot;
  if (!currentRow) {
    currentRow =
      pastSlots.length > 0
        ? pastSlots[0]
        : ((await dbQuery(() =>
            prisma.home_featured_slot.findFirst({
              where: { endAt: { lt: now } },
              orderBy: { endAt: 'desc' },
              select: slotSelect,
            })
          )) as SlotRow | null);
  }

  const relevantSlotIds = [
    currentRow?.id,
    ...upcomingSlots.map((s) => s.id),
    ...pastSlots.map((s) => s.id),
  ].filter((id): id is string => Boolean(id));

  const uniqueIds = [...new Set(relevantSlotIds)];

  const eventCounts =
    uniqueIds.length > 0
      ? await dbQuery(() =>
          prisma.home_featured_event.groupBy({
            by: ['slotId', 'action'],
            where: { slotId: { in: uniqueIds } },
            _count: { id: true },
          })
        )
      : [];

  const countMap = new Map<string, { viewList: number; quickSave: number }>();
  for (const g of eventCounts) {
    if (!countMap.has(g.slotId)) {
      countMap.set(g.slotId, { viewList: 0, quickSave: 0 });
    }
    const c = countMap.get(g.slotId)!;
    const n = g._count.id;
    if (g.action === 'VIEW_LIST') c.viewList = n;
    else c.quickSave = n;
  }

  const emptyCounts = { viewList: 0, quickSave: 0 };
  const current = currentRow
    ? mapSlot(currentRow, countMap.get(currentRow.id) ?? emptyCounts)
    : null;

  const upcoming = upcomingSlots
    .map((s) => mapSlot(s, countMap.get(s.id) ?? emptyCounts))
    .filter((s): s is FeaturedSlotItem => s != null);

  const past = pastSlots
    .map((s) => mapSlot(s, countMap.get(s.id) ?? emptyCounts))
    .filter((s): s is FeaturedSlotItem => s != null);

  const fallbackListDetail =
    !current && fallbackRow ? toListOption(fallbackRow) : null;
  const fallbackList = fallbackListDetail
    ? {
        id: fallbackListDetail.id,
        title: fallbackListDetail.title,
        slug: fallbackListDetail.slug,
      }
    : null;

  let currentPerformance: FeaturedSlotPerformance | null = null;
  let currentRecommendations: string[] = [];
  if (currentRow) {
    currentPerformance = performanceFromSlot(currentRow);
    currentRecommendations = getFeaturedRecommendations(
      currentPerformance as FeaturedPerformanceResult
    );
  }

  return {
    current,
    fallbackList,
    fallbackListDetail,
    upcoming,
    past,
    lists,
    weeklyReport,
    currentPerformance,
    currentRecommendations,
  };
}

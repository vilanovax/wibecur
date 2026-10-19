/**
 * List Intelligence – server data fetcher for admin lists panel.
 *
 * Perf (vercel-react-best-practices):
 * - Page 1 reuses pulse sample (no duplicate findMany)
 * - Bookmark windows in one SQL (no 3× groupBy waterfall)
 * - Types live in lists-types.ts for client-safe imports
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { computeSaveGrowthPercent } from '@/lib/admin/category-intelligence-shared';
import { computeScore, getStatus } from '@/lib/admin/trending-status';
import {
  LISTS_PAGE_SIZE,
  LISTS_PULSE_SAMPLE,
  type ListCategoryOption,
  type ListIntelligenceRow,
  type ListPulse,
  type ListsIntelligenceData,
  type RiskLevel,
} from '@/lib/admin/lists-types';

export type {
  ListPulse,
  ListIntelligenceRow,
  ListsIntelligencePagination,
  ListsIntelligenceData,
  ListCategoryOption,
  RiskLevel,
} from '@/lib/admin/lists-types';

export {
  LISTS_PULSE_SAMPLE,
  LISTS_PAGE_SIZE,
  LISTS_INTELLIGENCE_CAP,
} from '@/lib/admin/lists-types';

const LOW_ENGAGEMENT_SAVES_MAX = 5;
const LOW_ENGAGEMENT_RATIO_MAX = 0.5; // %

function riskLevel(
  saveSpike: boolean,
  engagementRatio: number,
  saveCount: number
): RiskLevel {
  if (saveSpike) return 'medium';
  if (engagementRatio > 10 && saveCount > 100) return 'low';
  if (saveCount === 0 && engagementRatio === 0) return 'none';
  return 'low';
}

export function buildListInsightLine(
  pulse: Omit<ListPulse, 'insightLine'>
): string {
  const parts: string[] = [];
  if (pulse.lowEngagementLists > 0) {
    parts.push(
      `${pulse.lowEngagementLists.toLocaleString('fa-IR')} لیست کم‌تعامل`
    );
  }
  if (pulse.risingLists > 0) {
    parts.push(`${pulse.risingLists.toLocaleString('fa-IR')} در حال رشد`);
  }
  if (pulse.flaggedLists > 0) {
    parts.push(
      `${pulse.flaggedLists.toLocaleString('fa-IR')} نیازمند بررسی ریسک`
    );
  }
  if (pulse.featuredLists > 0) {
    parts.push(`${pulse.featuredLists.toLocaleString('fa-IR')} Featured`);
  }
  if (parts.length === 0) {
    return 'همه لیست‌ها در وضعیت پایدار به نظر می‌رسند.';
  }
  return parts.join(' · ');
}

const listSelectCore = {
  id: true,
  title: true,
  slug: true,
  coverImage: true,
  horizontalImage: true,
  categoryId: true,
  isFeatured: true,
  isActive: true,
  saveCount: true,
  viewCount: true,
  likeCount: true,
  itemCount: true,
  createdAt: true,
  categories: {
    select: { id: true, name: true, slug: true, icon: true, color: true },
  },
  users: { select: { id: true, name: true, email: true, username: true } },
} as const;

const listSelectTrashExtra = {
  description: true,
  deletedAt: true,
  deleteReason: true,
  deletedBy: { select: { id: true, name: true, email: true } },
} as const;

function listSelectFor(trash: boolean) {
  return trash ? { ...listSelectCore, ...listSelectTrashExtra } : listSelectCore;
}

type ListRowActive = Awaited<
  ReturnType<typeof prisma.lists.findMany<{ select: typeof listSelectCore }>>
>[number];

type ListRowTrash = ListRowActive & {
  description: string | null;
  deletedAt: Date | null;
  deleteReason: string | null;
  deletedBy: { id: string; name: string | null; email: string | null } | null;
};

/** یک کوئری برای پنجره‌های ۲۴h / ۷d / prev۷d — حذف waterfall سه groupBy */
async function fetchBookmarkCountsByListIds(
  listIds: string[],
  last24h: Date,
  last7d: Date,
  last14d: Date
) {
  const empty = {
    count24h: new Map<string, number>(),
    count7d: new Map<string, number>(),
    countPrev7d: new Map<string, number>(),
  };
  if (listIds.length === 0) return empty;

  const rows = await dbQuery(() =>
    prisma.$queryRaw<{ listId: string; h24: number; d7: number; prev7: number }[]>(
      Prisma.sql`
        SELECT b."listId" AS "listId",
               COUNT(*) FILTER (WHERE b."createdAt" >= ${last24h})::int AS h24,
               COUNT(*) FILTER (WHERE b."createdAt" >= ${last7d})::int AS d7,
               COUNT(*) FILTER (
                 WHERE b."createdAt" >= ${last14d} AND b."createdAt" < ${last7d}
               )::int AS prev7
        FROM bookmarks b
        WHERE b."listId" IN (${Prisma.join(listIds)})
          AND b."createdAt" >= ${last14d}
        GROUP BY b."listId"
      `
    )
  );

  const count24h = new Map<string, number>();
  const count7d = new Map<string, number>();
  const countPrev7d = new Map<string, number>();
  for (const row of rows) {
    count24h.set(row.listId, row.h24);
    count7d.set(row.listId, row.d7);
    countPrev7d.set(row.listId, row.prev7);
  }
  return { count24h, count7d, countPrev7d };
}

function buildIntelligenceRows(
  lists: ListRowActive[] | ListRowTrash[],
  count24h: Map<string, number>,
  count7d: Map<string, number>,
  countPrev7d: Map<string, number>,
  trash: boolean
): ListIntelligenceRow[] {
  const rows: ListIntelligenceRow[] = [];

  for (const l of lists) {
    const saves24h = count24h.get(l.id) ?? 0;
    const saves7d = count7d.get(l.id) ?? 0;
    const growth7dPrevious = countPrev7d.get(l.id) ?? 0;
    const growth7dRecent = saves7d;
    const growth7dPercent = computeSaveGrowthPercent(
      growth7dRecent,
      growth7dPrevious
    );
    const status = getStatus(saves24h, saves7d);
    const { finalScore } = computeScore(l.saveCount, saves24h, l.createdAt);
    const engagementRatio =
      l.viewCount > 0 ? (l.saveCount / l.viewCount) * 100 : 0;
    const saveSpike = saves7d > 0 && saves24h > saves7d / 2;
    const rLevel = riskLevel(saveSpike, engagementRatio, l.saveCount);
    const lowEngagement =
      l.saveCount <= LOW_ENGAGEMENT_SAVES_MAX ||
      engagementRatio < LOW_ENGAGEMENT_RATIO_MAX;
    const needsReview = l.saveCount === 0 || lowEngagement || !l.isActive;

    rows.push({
      id: l.id,
      title: l.title,
      slug: l.slug,
      description: trash ? ((l as ListRowTrash).description ?? null) : null,
      coverImage: l.coverImage ?? null,
      horizontalImage: l.horizontalImage ?? null,
      categoryId: l.categoryId,
      categoryName: l.categories?.name ?? '—',
      categorySlug: l.categories?.slug ?? null,
      categoryIcon: l.categories?.icon ?? '📋',
      isFeatured: l.isFeatured ?? false,
      isActive: l.isActive ?? true,
      saveCount: l.saveCount ?? 0,
      viewCount: l.viewCount ?? 0,
      likeCount: l.likeCount ?? 0,
      itemCount: l.itemCount ?? 0,
      createdAt: l.createdAt.toISOString(),
      rank: 0,
      trendingScore: finalScore,
      saves24h,
      saves7d,
      growth7dRecent,
      growth7dPrevious,
      status,
      engagementRatio: Math.round(engagementRatio * 100) / 100,
      riskLevel: rLevel,
      growth7dPercent,
      needsReview,
      lowEngagement,
      ownerId: l.users.id,
      ownerName: l.users.name || l.users.email || '—',
      ownerUsername: l.users.username ?? null,
      deletedAt:
        trash && (l as ListRowTrash).deletedAt
          ? (l as ListRowTrash).deletedAt!.toISOString()
          : null,
      deletedBy: trash ? ((l as ListRowTrash).deletedBy ?? null) : null,
      deleteReason: trash ? ((l as ListRowTrash).deleteReason ?? null) : null,
    });
  }

  return rows;
}

export async function getListsIntelligenceData(
  trash: boolean = false,
  options?: {
    page?: number;
    pageSize?: number;
    categoryId?: string;
    q?: string;
  }
): Promise<ListsIntelligenceData> {
  const now = Date.now();
  const last24h = new Date(now - 24 * 60 * 60 * 1000);
  const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const last14d = new Date(now - 14 * 24 * 60 * 60 * 1000);

  const page = Math.max(1, options?.page ?? 1);
  const pageSize = options?.pageSize ?? LISTS_PAGE_SIZE;
  const skip = (page - 1) * pageSize;
  const categoryId =
    options?.categoryId && options.categoryId !== 'all'
      ? options.categoryId
      : undefined;
  const q = options?.q?.trim() || undefined;

  const listWhere = {
    ...(trash ? { deletedAt: { not: null } } : { deletedAt: null }),
    ...(categoryId ? { categoryId } : {}),
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
  };

  const select = listSelectFor(trash);
  const orderBy = trash
    ? ({ deletedAt: 'desc' } as const)
    : ({ saveCount: 'desc' } as const);

  // Page 1 is always a prefix of the pulse sample (same order) — skip duplicate query
  const reusePulseForPage = page === 1 && pageSize <= LISTS_PULSE_SAMPLE;

  const [totalCount, pulseLists, pageListsMaybe, categoriesRaw] =
    await Promise.all([
      dbQuery(() => prisma.lists.count({ where: listWhere })),
      dbQuery(() =>
        prisma.lists.findMany({
          where: listWhere,
          orderBy,
          take: LISTS_PULSE_SAMPLE,
          select,
        })
      ),
      reusePulseForPage
        ? Promise.resolve(null)
        : dbQuery(() =>
            prisma.lists.findMany({
              where: listWhere,
              orderBy,
              skip,
              take: pageSize,
              select,
            })
          ),
      dbQuery(() =>
        prisma.categories.findMany({
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            _count: {
              select: {
                lists: {
                  where: { deletedAt: trash ? { not: null } : null },
                },
              },
            },
          },
        })
      ),
    ]);

  const pageLists = reusePulseForPage
    ? pulseLists.slice(0, pageSize)
    : (pageListsMaybe as typeof pulseLists);

  const statsListIds = [
    ...new Set([
      ...pulseLists.map((l) => l.id),
      ...pageLists.map((l) => l.id),
    ]),
  ];
  const { count24h, count7d, countPrev7d } = await fetchBookmarkCountsByListIds(
    statsListIds,
    last24h,
    last7d,
    last14d
  );

  const pulseRows = buildIntelligenceRows(
    pulseLists,
    count24h,
    count7d,
    countPrev7d,
    trash
  );
  let risingCount = 0;
  let lowEngagementCount = 0;
  let flaggedCount = 0;
  let featuredCount = 0;

  for (const r of pulseRows) {
    if (r.status === 'rising') risingCount++;
    if (r.lowEngagement) lowEngagementCount++;
    if (r.riskLevel === 'medium' || r.riskLevel === 'high') flaggedCount++;
    if (r.isFeatured) featuredCount++;
  }

  const rows = buildIntelligenceRows(
    pageLists,
    count24h,
    count7d,
    countPrev7d,
    trash
  );

  if (!trash) {
    rows.sort((a, b) => b.trendingScore - a.trendingScore);
    rows.forEach((r, i) => {
      r.rank = skip + i + 1;
    });
  }

  const pulseBase = {
    totalLists: totalCount,
    risingLists: risingCount,
    lowEngagementLists: lowEngagementCount,
    flaggedLists: flaggedCount,
    featuredLists: featuredCount,
  };

  const pulse: ListPulse = {
    ...pulseBase,
    insightLine: buildListInsightLine(pulseBase),
  };

  const categories: ListCategoryOption[] = categoriesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    listCount: c._count.lists,
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    pulse,
    lists: rows,
    pulseFromSample: totalCount > pulseLists.length,
    categories,
    pagination: {
      currentPage: page,
      pageSize,
      totalPages,
    },
  };
}

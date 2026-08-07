/**
 * List Intelligence – داده برای پنل لیست‌ها (پالس، رتبه، امتیاز، فیلترها)
 */

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { computeSaveGrowthPercent } from '@/lib/admin/category-intelligence';
import { computeScore, getStatus, type TrendingStatus } from './trending-debug';

/** نمونه برای محاسبه پالس KPI (نه محدودیت نمایش) */
export const LISTS_PULSE_SAMPLE = 500;
export const LISTS_PAGE_SIZE = 50;
/** @deprecated use LISTS_PULSE_SAMPLE */
export const LISTS_INTELLIGENCE_CAP = LISTS_PULSE_SAMPLE;
const LOW_ENGAGEMENT_SAVES_MAX = 5;
const LOW_ENGAGEMENT_RATIO_MAX = 0.5; // %

export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

export interface ListPulse {
  totalLists: number;
  risingLists: number;
  lowEngagementLists: number;
  /** لیست‌های با ریسک متوسط/بالا یا spike */
  flaggedLists: number;
  /** isFeatured */
  featuredLists: number;
  /** جمله یک‌خطی زیر KPI */
  insightLine: string;
}

export interface ListIntelligenceRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  horizontalImage: string | null;
  categoryId: string | null;
  categoryName: string;
  categorySlug: string | null;
  categoryIcon: string;
  isFeatured: boolean;
  isActive: boolean;
  saveCount: number;
  viewCount: number;
  likeCount: number;
  itemCount: number;
  createdAt: string;
  rank: number;
  trendingScore: number;
  saves24h: number;
  saves7d: number;
  growth7dRecent: number;
  growth7dPrevious: number;
  status: TrendingStatus;
  engagementRatio: number;
  riskLevel: RiskLevel;
  growth7dPercent: number;
  needsReview: boolean;
  lowEngagement: boolean;
  ownerId: string;
  ownerName: string;
  ownerUsername: string | null;
  deletedAt?: string | null;
  deletedBy?: { id: string; name: string | null; email: string | null } | null;
  deleteReason?: string | null;
}

export interface ListsIntelligencePagination {
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface ListsIntelligenceData {
  pulse: ListPulse;
  lists: ListIntelligenceRow[];
  /** پالس از نمونهٔ برتر است، نه کل دیتاست */
  pulseFromSample: boolean;
  categories: ListCategoryOption[];
  pagination: ListsIntelligencePagination;
}

export interface ListCategoryOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  listCount: number;
}

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

export function buildListInsightLine(pulse: Omit<ListPulse, 'insightLine'>): string {
  const parts: string[] = [];
  if (pulse.lowEngagementLists > 0) {
    parts.push(`${pulse.lowEngagementLists.toLocaleString('fa-IR')} لیست کم‌تعامل`);
  }
  if (pulse.risingLists > 0) {
    parts.push(`${pulse.risingLists.toLocaleString('fa-IR')} در حال رشد`);
  }
  if (pulse.flaggedLists > 0) {
    parts.push(`${pulse.flaggedLists.toLocaleString('fa-IR')} نیازمند بررسی ریسک`);
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
  categories: { select: { id: true, name: true, slug: true, icon: true, color: true } },
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

async function fetchBookmarkCountsByListIds(
  listIds: string[],
  last24h: Date,
  last7d: Date,
  last14d: Date
) {
  if (listIds.length === 0) {
    return {
      count24h: new Map<string, number>(),
      count7d: new Map<string, number>(),
      countPrev7d: new Map<string, number>(),
    };
  }

  const [bookmarks24hByList, bookmarks7dByList, bookmarksPrev7dByList] = await Promise.all([
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['listId'],
        where: { listId: { in: listIds }, createdAt: { gte: last24h } },
        _count: true,
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['listId'],
        where: { listId: { in: listIds }, createdAt: { gte: last7d } },
        _count: true,
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['listId'],
        where: {
          listId: { in: listIds },
          createdAt: { gte: last14d, lt: last7d },
        },
        _count: true,
      })
    ),
  ]);

  return {
    count24h: new Map(bookmarks24hByList.map((b) => [b.listId, b._count])),
    count7d: new Map(bookmarks7dByList.map((b) => [b.listId, b._count])),
    countPrev7d: new Map(bookmarksPrev7dByList.map((b) => [b.listId, b._count])),
  };
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
    const growth7dPercent = computeSaveGrowthPercent(growth7dRecent, growth7dPrevious);
    const status = getStatus(saves24h, saves7d);
    const { finalScore } = computeScore(l.saveCount, saves24h, l.createdAt);
    const engagementRatio = l.viewCount > 0 ? (l.saveCount / l.viewCount) * 100 : 0;
    const saveSpike = saves7d > 0 && saves24h > saves7d / 2;
    const rLevel = riskLevel(saveSpike, engagementRatio, l.saveCount);
    const lowEngagement =
      l.saveCount <= LOW_ENGAGEMENT_SAVES_MAX || engagementRatio < LOW_ENGAGEMENT_RATIO_MAX;
    const needsReview = l.saveCount === 0 || lowEngagement || !l.isActive;

    rows.push({
      id: l.id,
      title: l.title,
      slug: l.slug,
      description: trash ? (l as ListRowTrash).description ?? null : null,
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
      deletedBy: trash ? (l as ListRowTrash).deletedBy ?? null : null,
      deleteReason: trash ? (l as ListRowTrash).deleteReason ?? null : null,
    });
  }

  return rows;
}

export async function getListsIntelligenceData(
  trash: boolean = false,
  options?: { page?: number; pageSize?: number; categoryId?: string; q?: string }
): Promise<ListsIntelligenceData> {
  const now = Date.now();
  const last24h = new Date(now - 24 * 60 * 60 * 1000);
  const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const last14d = new Date(now - 14 * 24 * 60 * 60 * 1000);

  const page = Math.max(1, options?.page ?? 1);
  const pageSize = options?.pageSize ?? LISTS_PAGE_SIZE;
  const skip = (page - 1) * pageSize;
  const categoryId =
    options?.categoryId && options.categoryId !== 'all' ? options.categoryId : undefined;
  const q = options?.q?.trim() || undefined;

  const listWhere = {
    ...(trash ? { deletedAt: { not: null } } : { deletedAt: null }),
    ...(categoryId ? { categoryId } : {}),
    // جستجوی سرور-ساید روی عنوان (در همهٔ صفحات، نه فقط صفحهٔ جاری)
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
  };

  const select = listSelectFor(trash);

  const [totalCount, pulseLists, pageLists, categoriesRaw] = await Promise.all([
    dbQuery(() => prisma.lists.count({ where: listWhere })),
    dbQuery(() =>
      prisma.lists.findMany({
        where: listWhere,
        orderBy: trash ? { deletedAt: 'desc' } : { saveCount: 'desc' },
        take: LISTS_PULSE_SAMPLE,
        select,
      })
    ),
    dbQuery(() =>
      prisma.lists.findMany({
        where: listWhere,
        orderBy: trash ? { deletedAt: 'desc' } : { saveCount: 'desc' },
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
          _count: { select: { lists: { where: { deletedAt: trash ? { not: null } : null } } } },
        },
      })
    ),
  ]);

  const statsListIds = [
    ...new Set([...pulseLists.map((l) => l.id), ...pageLists.map((l) => l.id)]),
  ];
  const { count24h, count7d, countPrev7d } = await fetchBookmarkCountsByListIds(
    statsListIds,
    last24h,
    last7d,
    last14d
  );

  const pulseRows = buildIntelligenceRows(pulseLists, count24h, count7d, countPrev7d, trash);
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

  const rows = buildIntelligenceRows(pageLists, count24h, count7d, countPrev7d, trash);

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


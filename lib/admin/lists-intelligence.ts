/**
 * List Intelligence – داده برای پنل لیست‌ها (پالس، رتبه، امتیاز، فیلترها)
 */

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { computeScore, getStatus, type TrendingStatus } from './trending-debug';

const LISTS_CAP = 500;
const LOW_ENGAGEMENT_SAVES_MAX = 5;
const LOW_ENGAGEMENT_RATIO_MAX = 0.5; // %

export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

export interface ListPulse {
  totalLists: number;
  risingLists: number;
  lowEngagementLists: number;
  flaggedLists: number;
}

export interface ListIntelligenceRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  categoryId: string | null;
  categoryName: string;
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
  status: TrendingStatus;
  engagementRatio: number;
  riskLevel: RiskLevel;
  growth7dPercent: number;
  needsReview: boolean;
  lowEngagement: boolean;
  deletedAt?: string | null;
  deletedBy?: { id: string; name: string | null; email: string | null } | null;
  deleteReason?: string | null;
}

export interface ListsIntelligenceData {
  pulse: ListPulse;
  lists: ListIntelligenceRow[];
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

export async function getListsIntelligenceData(trash: boolean = false): Promise<ListsIntelligenceData> {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Avoid deletedAt filter/select when column does not exist in DB
  const listWhere = trash ? { id: '' } : {};

  const [totalCount, lists, bookmarks24hByList, bookmarks7dByList] = await Promise.all([
    dbQuery(() => prisma.lists.count({ where: listWhere })),
    dbQuery(() =>
      prisma.lists.findMany({
        where: listWhere,
        orderBy: trash ? { createdAt: 'desc' } : { saveCount: 'desc' },
        take: LISTS_CAP,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          categoryId: true,
          isFeatured: true,
          isActive: true,
          saveCount: true,
          viewCount: true,
          likeCount: true,
          itemCount: true,
          createdAt: true,
          categories: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        },
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['listId'],
        where: { createdAt: { gte: last24h } },
        _count: true,
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['listId'],
        where: { createdAt: { gte: last7d } },
        _count: true,
      })
    ),
  ]);

  const count24h = new Map(bookmarks24hByList.map((b) => [b.listId, b._count]));
  const count7d = new Map(bookmarks7dByList.map((b) => [b.listId, b._count]));

  const rows: ListIntelligenceRow[] = [];
  let risingCount = 0;
  let lowEngagementCount = 0;
  let flaggedCount = 0;

  for (const l of lists) {
    const saves24h = count24h.get(l.id) ?? 0;
    const saves7d = count7d.get(l.id) ?? 0;
    const status = getStatus(saves24h, saves7d);
    const { finalScore } = computeScore(l.saveCount, saves24h, l.createdAt);
    const engagementRatio =
      l.viewCount > 0 ? (l.saveCount / l.viewCount) * 100 : 0;
    const prev7d = Math.max(0, l.saveCount - saves7d);
    const growth7dPercent =
      prev7d > 0 ? Math.round(((saves7d - prev7d) / prev7d) * 100) : saves7d > 0 ? 100 : 0;
    const saveSpike = saves7d > 0 && saves24h > saves7d / 2;
    const rLevel = riskLevel(saveSpike, engagementRatio, l.saveCount);
    const lowEngagement =
      l.saveCount <= LOW_ENGAGEMENT_SAVES_MAX ||
      engagementRatio < LOW_ENGAGEMENT_RATIO_MAX;
    const needsReview =
      l.saveCount === 0 || lowEngagement || !l.isActive;

    if (status === 'rising') risingCount++;
    if (lowEngagement) lowEngagementCount++;
    if (rLevel === 'medium' || rLevel === 'high' || saveSpike) flaggedCount++;

    rows.push({
      id: l.id,
      title: l.title,
      slug: l.slug,
      description: l.description ?? null,
      coverImage: l.coverImage ?? null,
      categoryId: l.categoryId,
      categoryName: l.categories?.name ?? '—',
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
      status,
      engagementRatio: Math.round(engagementRatio * 100) / 100,
      riskLevel: rLevel,
      growth7dPercent,
      needsReview,
      lowEngagement,
      deletedAt: null,
      deletedBy: null,
      deleteReason: null,
    });
  }

  rows.sort((a, b) => b.trendingScore - a.trendingScore);
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });

  const pulse: ListPulse = {
    totalLists: totalCount,
    risingLists: risingCount,
    lowEngagementLists: lowEngagementCount,
    flaggedLists: flaggedCount,
  };

  return { pulse, lists: rows };
}

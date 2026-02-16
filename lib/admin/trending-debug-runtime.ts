/**
 * Admin Trending Debug — مطابق معماری واقعی runtime
 * فرمول: lib/trending/score.ts → calculateTrendingScore(metrics)
 * رتبه ذخیره نشده؛ موقعیت از آرایهٔ سورت‌شده محاسبه می‌شود.
 */

import type { PrismaClient } from '@prisma/client';
import {
  calculateTrendingScoreWithDebug,
  calculateSaveVelocity,
  getTrendingBadge,
  type ListMetrics7d,
  type TrendScoreDebugResult,
} from '@/lib/trending/score';
import { getFullGlobalTrendingSorted } from '@/lib/trending/service';
import { dbQuery } from '@/lib/db';

const ms = (days: number) => days * 24 * 60 * 60 * 1000;

export interface RuntimeDebugRawMetrics {
  saveCount: number;
  likeCount: number;
  bookmarks24h: number;
  bookmarks7d: number;
  likes7d: number;
  comments7d: number;
  createdAt: string;
  lastSaveAt: string | null;
  daysSinceLastSave: number;
  AgeDays: number;
  categoryWeight: number | null;
}

export interface ListRuntimeDebugData {
  listId: string;
  listTitle: string;
  categoryName: string | null;
  score: number;
  scoreRounded: number;
  badge: 'none' | 'hot' | 'viral';
  calculatedAt: string;
  cacheStatus: 'LIVE' | 'BYPASS';
  rawMetrics: RuntimeDebugRawMetrics;
  breakdown: TrendScoreDebugResult['breakdown'] & { numerator: number; denominator: number };
  warnings: string[];
  positionInGlobalTrending: number | null;
  totalRanked: number;
}

export async function getListRuntimeDebugData(
  prisma: PrismaClient,
  listId: string,
  options: { bypassCache?: boolean } = {}
): Promise<ListRuntimeDebugData | null> {
  const now = Date.now();
  const cutoff24h = new Date(now - ms(1));
  const cutoff7d = new Date(now - ms(7));

  const list = await dbQuery(() =>
    prisma.lists.findUnique({
      where: { id: listId },
      select: {
        id: true,
        title: true,
        saveCount: true,
        likeCount: true,
        viewCount: true,
        createdAt: true,
        categoryId: true,
        categories: { select: { name: true } },
      },
    })
  );

  if (!list) return null;

  const [
    bookmarks24h,
    bookmarks7dGroup,
    likes7dGroup,
    comments7dGroup,
    lastSaveDateGroup,
  ] = await Promise.all([
    dbQuery(() =>
      prisma.bookmarks.count({
        where: { listId, createdAt: { gte: cutoff24h } },
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['listId'],
        where: { listId, createdAt: { gte: cutoff7d } },
        _count: true,
        _max: { createdAt: true },
      })
    ),
    dbQuery(() =>
      prisma.list_likes.groupBy({
        by: ['listId'],
        where: { listId, createdAt: { gte: cutoff7d } },
        _count: true,
      })
    ),
    dbQuery(() =>
      prisma.list_comments.groupBy({
        by: ['listId'],
        where: {
          listId,
          createdAt: { gte: cutoff7d },
          status: 'active',
          isApproved: true,
        },
        _count: true,
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['listId'],
        where: { listId, createdAt: { gte: cutoff7d } },
        _max: { createdAt: true },
      })
    ),
  ]);

  const S7 = bookmarks7dGroup[0]?._count ?? 0;
  const L7 = likes7dGroup[0]?._count ?? 0;
  const C7 = comments7dGroup[0]?._count ?? 0;
  const V7 = 0; // viewCount 7d در سرویس فعلی استفاده نمی‌شود
  const lastSaveAt = lastSaveDateGroup[0]?._max?.createdAt ?? bookmarks7dGroup[0]?._max?.createdAt ?? null;
  const daysSinceLastSave = lastSaveAt
    ? (now - lastSaveAt.getTime()) / ms(1)
    : 8;
  const AgeDays = (now - list.createdAt.getTime()) / ms(1);
  const SaveVelocity = calculateSaveVelocity(S7, daysSinceLastSave);
  const rawVelocity = S7 === 0 ? 0 : S7 / Math.max(1, daysSinceLastSave);

  const metrics: ListMetrics7d = {
    S7,
    L7,
    C7,
    V7,
    AgeDays,
    SaveVelocity,
  };

  const debugResult = calculateTrendingScoreWithDebug(metrics, { rawVelocity });
  const { score, numerator, denominator, breakdown: debugBreakdown, warnings } = debugResult;
  const badge = getTrendingBadge(score);

  const breakdown = {
    ...debugBreakdown,
    numerator,
    denominator,
  };

  const fullSorted = await getFullGlobalTrendingSorted(prisma, 500);
  const index = fullSorted.findIndex((r) => r.listId === listId);
  const positionInGlobalTrending = index >= 0 ? index + 1 : null;

  const rawMetrics: RuntimeDebugRawMetrics = {
    saveCount: list.saveCount ?? 0,
    likeCount: list.likeCount ?? 0,
    bookmarks24h,
    bookmarks7d: S7,
    likes7d: L7,
    comments7d: C7,
    createdAt: list.createdAt.toISOString(),
    lastSaveAt: lastSaveAt?.toISOString() ?? null,
    daysSinceLastSave: Math.round(daysSinceLastSave * 10) / 10,
    AgeDays: Math.round(AgeDays * 10) / 10,
    categoryWeight: null,
  };

  return {
    listId: list.id,
    listTitle: list.title,
    categoryName: list.categories?.name ?? null,
    score,
    scoreRounded: Math.round(score * 10) / 10,
    badge,
    calculatedAt: new Date().toISOString(),
    cacheStatus: options.bypassCache ? 'BYPASS' : 'LIVE',
    rawMetrics,
    breakdown,
    warnings,
    positionInGlobalTrending,
    totalRanked: fullSorted.length,
  };
}

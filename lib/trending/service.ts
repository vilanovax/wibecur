/**
 * Trending Service — کسب متریک‌ها و محاسبه امتیاز
 */
import type { PrismaClient } from '@prisma/client';
import { dbQuery } from '@/lib/db';
import {
  calculateTrendingScore,
  calculateSaveVelocity,
  applyFastRisingBoost,
  getTrendingBadge,
  type ListMetrics7d,
} from './score';
import { TIME_WINDOWS } from './constants';

export interface TrendingListResult {
  listId: string;
  title: string;
  slug: string;
  score: number;
  badge: 'none' | 'hot' | 'viral';
  isFastRising?: boolean;
  categoryId?: string | null;
  categorySlug?: string | null;
  creatorId?: string;
  creator?: { id: string; name: string | null; username: string | null; image: string | null; curatorLevel?: string };
  coverImage?: string | null;
  description?: string | null;
  saveCount: number;
  likeCount: number;
  itemCount: number;
}

function ms(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

export async function getListMetrics7d(
  prisma: PrismaClient,
  listIds: string[],
  days: number = TIME_WINDOWS.WEEKLY
): Promise<Map<string, ListMetrics7d>> {
  if (listIds.length === 0) return new Map();
  const cutoff = new Date(Date.now() - ms(days));

  const [saves, likes, comments, lists, lastSaveDates] = await Promise.all([
    prisma.bookmarks.groupBy({
      by: ['listId'],
      where: { listId: { in: listIds }, createdAt: { gte: cutoff } },
      _count: { listId: true },
    }),
    prisma.list_likes.groupBy({
      by: ['listId'],
      where: { listId: { in: listIds }, createdAt: { gte: cutoff } },
      _count: { listId: true },
    }),
    prisma.list_comments.groupBy({
      by: ['listId'],
      where: {
        listId: { in: listIds },
        createdAt: { gte: cutoff },
        status: 'active',
        isApproved: true,
      },
      _count: { listId: true },
    }),
    prisma.lists.findMany({
      where: { id: { in: listIds } },
      select: { id: true, createdAt: true },
    }),
    prisma.bookmarks.groupBy({
      by: ['listId'],
      where: { listId: { in: listIds }, createdAt: { gte: cutoff } },
      _max: { createdAt: true },
    }),
  ]);

  const S7Map = new Map<string, number>();
  const L7Map = new Map<string, number>();
  const C7Map = new Map<string, number>();
  const lastSaveMap = new Map<string, Date>();
  const createdAtMap = new Map<string, Date>();

  saves.forEach((r) => S7Map.set(r.listId, r._count.listId));
  likes.forEach((r) => L7Map.set(r.listId, r._count.listId));
  comments.forEach((r) => C7Map.set(r.listId, r._count.listId));
  lastSaveDates.forEach((r) => {
    if (r._max.createdAt) lastSaveMap.set(r.listId, r._max.createdAt);
  });
  lists.forEach((l) => createdAtMap.set(l.id, l.createdAt));

  const result = new Map<string, ListMetrics7d>();
  for (const id of listIds) {
    const S7 = S7Map.get(id) ?? 0;
    const lastSave = lastSaveMap.get(id);
    const createdAt = createdAtMap.get(id);
    const now = Date.now();
    const daysSinceLastSave = lastSave
      ? (now - lastSave.getTime()) / ms(1)
      : days + 1;
    const AgeDays = createdAt
      ? (now - createdAt.getTime()) / ms(1)
      : 0;

    result.set(id, {
      S7,
      L7: L7Map.get(id) ?? 0,
      C7: C7Map.get(id) ?? 0,
      V7: 0,
      AgeDays,
      SaveVelocity: calculateSaveVelocity(S7, daysSinceLastSave),
    });
  }
  return result;
}

/**
 * امتیاز ترند فعلی یک لیست (برای Featured baseline/peak).
 */
export async function getTrendingScoreForList(
  prisma: PrismaClient,
  listId: string
): Promise<number> {
  const map = await getListMetrics7d(prisma, [listId]);
  const metrics = map.get(listId);
  if (!metrics) return 0;
  return calculateTrendingScore(metrics);
}

async function getListMetrics1d(
  prisma: PrismaClient,
  listIds: string[]
): Promise<Map<string, number>> {
  if (listIds.length === 0) return new Map();
  const cutoff = new Date(Date.now() - ms(1));

  const saves = await prisma.bookmarks.groupBy({
    by: ['listId'],
    where: { listId: { in: listIds }, createdAt: { gte: cutoff } },
    _count: { listId: true },
  });

  const map = new Map<string, number>();
  saves.forEach((r) => map.set(r.listId, r._count.listId));
  return map;
}

const LIST_WHERE = {
  isActive: true,
  isPublic: true,
  users: { role: { not: 'USER' } },
} as const;

/**
 * Trending per Category
 */
export async function getTrendingByCategory(
  prisma: PrismaClient,
  categoryId: string,
  limit: number = 10
): Promise<TrendingListResult[]> {
  return dbQuery(async () => {
    const lists = await prisma.lists.findMany({
      where: { ...LIST_WHERE, categoryId },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        saveCount: true,
        likeCount: true,
        itemCount: true,
        userId: true,
        categoryId: true,
        categories: { select: { slug: true } },
        users: { select: { id: true, name: true, username: true, image: true, curatorLevel: true } },
      },
      take: 100,
    });

    if (lists.length === 0) return [];
    const listIds = lists.map((l) => l.id);
    const metricsMap = await getListMetrics7d(prisma, listIds);

    const withScore: TrendingListResult[] = [];
    for (const l of lists) {
      const metrics = metricsMap.get(l.id);
      if (!metrics) continue;
      const score = calculateTrendingScore(metrics);
      const badge = getTrendingBadge(score);
      withScore.push({
        listId: l.id,
        title: l.title,
        slug: l.slug,
        description: l.description,
        score,
        badge,
        categoryId: l.categoryId,
        categorySlug: l.categories?.slug ?? null,
        creatorId: l.userId,
        creator: l.users ? { id: l.users.id, name: l.users.name, username: l.users.username, image: l.users.image, curatorLevel: l.users.curatorLevel } : undefined,
        coverImage: l.coverImage,
        saveCount: l.saveCount ?? 0,
        likeCount: l.likeCount ?? 0,
        itemCount: l.itemCount ?? 0,
      });
    }

    return withScore
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  });
}

/**
 * لیست کامل رتبه‌بندی شده برای Debug (موقعیت در آرایه)
 * بدون محدودیت «حداکثر ۳ از هر دسته»؛ فقط ادغام و sort.
 */
export async function getFullGlobalTrendingSorted(
  prisma: PrismaClient,
  maxItems: number = 500
): Promise<TrendingListResult[]> {
  return dbQuery(async () => {
    const categories = await prisma.categories.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    const allResults: TrendingListResult[] = [];
    for (const cat of categories) {
      const top = await getTrendingByCategory(prisma, cat.id, 20);
      allResults.push(...top);
    }
    allResults.sort((a, b) => b.score - a.score);
    return allResults.slice(0, maxItems);
  });
}

/**
 * Global Trending — Top 10 از هر دسته، ادغام، حداکثر ۳ از هر دسته، مرتب‌سازی
 */
export async function getGlobalTrending(
  prisma: PrismaClient,
  limit: number = 6
): Promise<TrendingListResult[]> {
  return dbQuery(async () => {
    const categories = await prisma.categories.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const allResults: TrendingListResult[] = [];
    for (const cat of categories) {
      const top10 = await getTrendingByCategory(prisma, cat.id, 10);
      allResults.push(...top10);
    }

    allResults.sort((a, b) => b.score - a.score);

    const perCategory = new Map<string, number>();
    const filtered: TrendingListResult[] = [];
    for (const item of allResults) {
      const key = item.categoryId ?? 'none';
      const count = perCategory.get(key) ?? 0;
      if (count < 3) {
        filtered.push(item);
        perCategory.set(key, count + 1);
      }
      if (filtered.length >= limit) break;
    }
    return filtered;
  });
}

/**
 * Fast Rising — ۲۴ ساعته + بوست
 */
export async function getFastRising(
  prisma: PrismaClient,
  limit: number = 6
): Promise<TrendingListResult[]> {
  return dbQuery(async () => {
    const cutoff = new Date(Date.now() - ms(1));
    const recentLists = await prisma.lists.findMany({
      where: {
        ...LIST_WHERE,
        bookmarks: { some: { createdAt: { gte: cutoff } } },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        saveCount: true,
        likeCount: true,
        itemCount: true,
        userId: true,
        categoryId: true,
        categories: { select: { slug: true } },
      },
      take: 80,
    });

    if (recentLists.length === 0) return [];
    const listIds = recentLists.map((l) => l.id);
    const [metrics7d, s1Map] = await Promise.all([
      getListMetrics7d(prisma, listIds, 1),
      getListMetrics1d(prisma, listIds),
    ]);

    const withScore: TrendingListResult[] = [];
    for (const l of recentLists) {
      const metrics = metrics7d.get(l.id);
      if (!metrics) continue;
      let score = calculateTrendingScore(metrics);
      const S1 = s1Map.get(l.id) ?? 0;
      score = applyFastRisingBoost(score, S1);
      withScore.push({
        listId: l.id,
        title: l.title,
        slug: l.slug,
        score,
        badge: getTrendingBadge(score),
        isFastRising: S1 >= 5,
        categoryId: l.categoryId,
        categorySlug: l.categories?.slug ?? null,
        creatorId: l.userId,
        coverImage: l.coverImage,
        saveCount: l.saveCount ?? 0,
        likeCount: l.likeCount ?? 0,
        itemCount: l.itemCount ?? 0,
      });
    }

    return withScore
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  });
}

/**
 * Monthly Popular — ۳۰ روزه
 */
export async function getMonthlyPopular(
  prisma: PrismaClient,
  limit: number = 6
): Promise<TrendingListResult[]> {
  return dbQuery(async () => {
    const lists = await prisma.lists.findMany({
      where: LIST_WHERE,
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        saveCount: true,
        likeCount: true,
        itemCount: true,
        userId: true,
        categoryId: true,
        categories: { select: { slug: true } },
      },
      orderBy: { saveCount: 'desc' },
      take: 100,
    });

    if (lists.length === 0) return [];
    const listIds = lists.map((l) => l.id);
    const metricsMap = await getListMetrics7d(
      prisma,
      listIds,
      TIME_WINDOWS.MONTHLY
    );

    const withScore: TrendingListResult[] = [];
    for (const l of lists) {
      const metrics = metricsMap.get(l.id);
      if (!metrics) continue;
      const score = calculateTrendingScore(metrics);
      withScore.push({
        listId: l.id,
        title: l.title,
        slug: l.slug,
        score,
        badge: getTrendingBadge(score),
        categoryId: l.categoryId,
        categorySlug: l.categories?.slug ?? null,
        creatorId: l.userId,
        coverImage: l.coverImage,
        saveCount: l.saveCount ?? 0,
        likeCount: l.likeCount ?? 0,
        itemCount: l.itemCount ?? 0,
      });
    }

    return withScore
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  });
}

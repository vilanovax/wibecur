/**
 * MVP Trending Debug – محاسبه امتیاز و رتبه برای شفافیت الگوریتم
 * فرمول: baseScore + velocityScore + recencyBoost - decay
 */

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// ضرایب الگوریتم (قابل تنظیم بعداً)
const CATEGORY_WEIGHT = 1.2;
const VELOCITY_FACTOR = 2;
const RECENCY_BONUS = 10;
const RECENCY_DAYS_THRESHOLD = 7;
const DECAY_PER_DAY = 1;

export type TrendingStatus = 'rising' | 'stable' | 'declining';

export interface ScoreBreakdown {
  baseScore: number;
  velocityScore: number;
  recencyBoost: number;
  decay: number;
  finalScore: number;
  formula: {
    base: string;
    velocity: string;
    recency: string;
    decay: string;
  };
}

export interface RawMetrics {
  totalSaves: number;
  saves24h: number;
  saves7d: number;
  ageDays: number;
  categoryWeight: number;
  engagementRatio: number; // saveCount / viewCount
}

export interface RankNeighbor {
  rank: number;
  title: string;
  slug: string;
  id: string;
  finalScore: number;
}

export interface Flags {
  boostActive: boolean;
  saveSpikeDetected: boolean;
  manualOverride: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'none';
}

export interface ListTrendingDebugData {
  list: {
    id: string;
    title: string;
    slug: string;
    saveCount: number;
    viewCount: number;
    createdAt: Date;
    categoryId: string | null;
  };
  categoryName: string;
  currentRank: number | null; // null = خارج از تاپ
  totalRanked: number;
  status: TrendingStatus;
  scoreBreakdown: ScoreBreakdown;
  rawMetrics: RawMetrics;
  prevRank: RankNeighbor | null;
  nextRank: RankNeighbor | null;
  flags: Flags;
}

export function computeScore(
  saveCount: number,
  saves24h: number,
  createdAt: Date,
  categoryWeight: number = CATEGORY_WEIGHT
): { finalScore: number; baseScore: number; velocityScore: number; recencyBoost: number; decay: number } {
  const now = new Date();
  const ageMs = now.getTime() - createdAt.getTime();
  const ageInDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

  const baseScore = Math.round(saveCount * categoryWeight);
  const velocityScore = saves24h * VELOCITY_FACTOR;
  const recencyBoost = ageInDays < RECENCY_DAYS_THRESHOLD ? RECENCY_BONUS : 0;
  const decay = ageInDays * DECAY_PER_DAY;
  const finalScore = Math.round(baseScore + velocityScore + recencyBoost - decay);

  return { finalScore, baseScore, velocityScore, recencyBoost, decay };
}

export function getStatus(saves24h: number, saves7d: number): TrendingStatus {
  if (saves7d === 0) return 'stable';
  const avgPerDay = saves7d / 7;
  if (saves24h > avgPerDay * 1.2) return 'rising';
  if (saves24h < avgPerDay * 0.8) return 'declining';
  return 'stable';
}

export async function getListTrendingDebug(listId: string): Promise<ListTrendingDebugData | null> {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const list = await dbQuery(() =>
    prisma.lists.findUnique({
      where: { id: listId, isActive: true },
      select: {
        id: true,
        title: true,
        slug: true,
        saveCount: true,
        viewCount: true,
        createdAt: true,
        categoryId: true,
        isFeatured: true,
        categories: { select: { name: true } },
      },
    })
  );

  if (!list) return null;

  const [saves24h, saves7d, bookmarks24hByList, bookmarks7dByList, topLists] = await Promise.all([
    dbQuery(() =>
      prisma.bookmarks.count({
        where: { listId, createdAt: { gte: last24h } },
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.count({
        where: { listId, createdAt: { gte: last7d } },
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
    dbQuery(() =>
      prisma.lists.findMany({
        where: { isActive: true, isPublic: true },
        orderBy: { saveCount: 'desc' },
        take: 500,
        select: {
          id: true,
          title: true,
          slug: true,
          saveCount: true,
          createdAt: true,
          categoryId: true,
        },
      })
    ),
  ]);

  const count24h = new Map(bookmarks24hByList.map((b) => [b.listId, b._count]));
  const count7d = new Map(bookmarks7dByList.map((b) => [b.listId, b._count]));

  const listIds = new Set(topLists.map((l) => l.id));
  if (!listIds.has(list.id)) listIds.add(list.id);

  const rows: Array<{
    id: string;
    title: string;
    slug: string;
    saveCount: number;
    createdAt: Date;
    categoryId: string | null;
    saves24h: number;
    finalScore: number;
  }> = [];

  for (const l of topLists) {
    const s24 = count24h.get(l.id) ?? 0;
    const { finalScore } = computeScore(l.saveCount, s24, l.createdAt);
    rows.push({
      id: l.id,
      title: l.title,
      slug: l.slug,
      saveCount: l.saveCount,
      createdAt: l.createdAt,
      categoryId: l.categoryId,
      saves24h: s24,
      finalScore,
    });
  }

  const currentS24 = listIds.has(list.id) ? saves24h : saves24h;
  const currentScoreResult = computeScore(list.saveCount, currentS24, list.createdAt);

  if (!listIds.has(list.id)) {
    rows.push({
      id: list.id,
      title: list.title,
      slug: list.slug,
      saveCount: list.saveCount,
      createdAt: list.createdAt,
      categoryId: list.categoryId,
      saves24h: currentS24,
      finalScore: currentScoreResult.finalScore,
    });
  }

  rows.sort((a, b) => b.finalScore - a.finalScore);
  const rankIndex = rows.findIndex((r) => r.id === listId);
  const currentRank = rankIndex >= 0 ? rankIndex + 1 : null;
  const totalRanked = rows.length;

  const prevRank: RankNeighbor | null =
    rankIndex > 0
      ? {
          rank: rankIndex,
          title: rows[rankIndex - 1].title,
          slug: rows[rankIndex - 1].slug,
          id: rows[rankIndex - 1].id,
          finalScore: rows[rankIndex - 1].finalScore,
        }
      : null;
  const nextRank: RankNeighbor | null =
    rankIndex >= 0 && rankIndex < rows.length - 1
      ? {
          rank: rankIndex + 2,
          title: rows[rankIndex + 1].title,
          slug: rows[rankIndex + 1].slug,
          id: rows[rankIndex + 1].id,
          finalScore: rows[rankIndex + 1].finalScore,
        }
      : null;

  const ageMs = Date.now() - list.createdAt.getTime();
  const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
  const engagementRatio =
    list.viewCount > 0 ? (list.saveCount / list.viewCount) * 100 : 0;

  const status = getStatus(saves24h, saves7d);

  const scoreBreakdown: ScoreBreakdown = {
    ...currentScoreResult,
    formula: {
      base: `${list.saveCount} × ${CATEGORY_WEIGHT}`,
      velocity: `${saves24h} × ${VELOCITY_FACTOR}`,
      recency:
        ageDays < RECENCY_DAYS_THRESHOLD
          ? `سن < ${RECENCY_DAYS_THRESHOLD} روز → +${RECENCY_BONUS}`
          : `سن ≥ ${RECENCY_DAYS_THRESHOLD} روز → ۰`,
      decay: `${ageDays} روز × ${DECAY_PER_DAY}`,
    },
  };

  const rawMetrics: RawMetrics = {
    totalSaves: list.saveCount,
    saves24h,
    saves7d,
    ageDays,
    categoryWeight: CATEGORY_WEIGHT,
    engagementRatio: Math.round(engagementRatio * 100) / 100,
  };

  const saveSpikeDetected = saves24h > 0 && saves7d > 0 && saves24h > saves7d / 2;
  const flags: Flags = {
    boostActive: list.isFeatured ?? false,
    saveSpikeDetected,
    manualOverride: false,
    riskLevel: saveSpikeDetected ? 'medium' : 'low',
  };

  return {
    list: {
      id: list.id,
      title: list.title,
      slug: list.slug,
      saveCount: list.saveCount,
      viewCount: list.viewCount,
      createdAt: list.createdAt,
      categoryId: list.categoryId,
    },
    categoryName: list.categories?.name ?? '—',
    currentRank,
    totalRanked,
    status,
    scoreBreakdown,
    rawMetrics,
    prevRank,
    nextRank,
    flags,
  };
}

/** برای صفحه ویرایش لیست — همیشه داده برمی‌گرداند حتی اگر لیست غیرفعال باشد */
export async function getListIntelligenceForEdit(
  listId: string
): Promise<Omit<ListTrendingDebugData, 'prevRank' | 'nextRank'> & { prevRank: RankNeighbor | null; nextRank: RankNeighbor | null } | null> {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const list = await dbQuery(() =>
    prisma.lists.findUnique({
      where: { id: listId },
      select: {
        id: true,
        title: true,
        slug: true,
        saveCount: true,
        viewCount: true,
        createdAt: true,
        categoryId: true,
        isFeatured: true,
        categories: { select: { name: true } },
      },
    })
  );

  if (!list) return null;

  const [saves24h, saves7d, bookmarks24hByList, bookmarks7dByList, topLists] = await Promise.all([
    dbQuery(() => prisma.bookmarks.count({ where: { listId, createdAt: { gte: last24h } } })),
    dbQuery(() => prisma.bookmarks.count({ where: { listId, createdAt: { gte: last7d } } })),
    dbQuery(() => prisma.bookmarks.groupBy({ by: ['listId'], where: { createdAt: { gte: last24h } }, _count: true })),
    dbQuery(() => prisma.bookmarks.groupBy({ by: ['listId'], where: { createdAt: { gte: last7d } }, _count: true })),
    dbQuery(() =>
      prisma.lists.findMany({
        where: { isActive: true, isPublic: true },
        orderBy: { saveCount: 'desc' },
        take: 500,
        select: { id: true, title: true, slug: true, saveCount: true, createdAt: true, categoryId: true },
      })
    ),
  ]);

  const count24h = new Map(bookmarks24hByList.map((b) => [b.listId, b._count]));
  const count7d = new Map(bookmarks7dByList.map((b) => [b.listId, b._count]));
  const listIds = new Set(topLists.map((l) => l.id));
  if (!listIds.has(list.id)) listIds.add(list.id);

  const rows: Array<{ id: string; title: string; slug: string; saveCount: number; createdAt: Date; categoryId: string | null; saves24h: number; finalScore: number }> = [];
  for (const l of topLists) {
    const s24 = count24h.get(l.id) ?? 0;
    const { finalScore } = computeScore(l.saveCount, s24, l.createdAt);
    rows.push({ id: l.id, title: l.title, slug: l.slug, saveCount: l.saveCount, createdAt: l.createdAt, categoryId: l.categoryId, saves24h: s24, finalScore });
  }
  const currentS24 = saves24h;
  const currentScoreResult = computeScore(list.saveCount, currentS24, list.createdAt);
  if (!listIds.has(list.id)) {
    rows.push({
      id: list.id,
      title: list.title,
      slug: list.slug,
      saveCount: list.saveCount,
      createdAt: list.createdAt,
      categoryId: list.categoryId,
      saves24h: currentS24,
      finalScore: currentScoreResult.finalScore,
    });
  }
  rows.sort((a, b) => b.finalScore - a.finalScore);
  const rankIndex = rows.findIndex((r) => r.id === listId);
  const currentRank = rankIndex >= 0 ? rankIndex + 1 : null;
  const totalRanked = rows.length;
  const prevRank: RankNeighbor | null =
    rankIndex > 0
      ? { rank: rankIndex, title: rows[rankIndex - 1].title, slug: rows[rankIndex - 1].slug, id: rows[rankIndex - 1].id, finalScore: rows[rankIndex - 1].finalScore }
      : null;
  const nextRank: RankNeighbor | null =
    rankIndex >= 0 && rankIndex < rows.length - 1
      ? { rank: rankIndex + 2, title: rows[rankIndex + 1].title, slug: rows[rankIndex + 1].slug, id: rows[rankIndex + 1].id, finalScore: rows[rankIndex + 1].finalScore }
      : null;

  const ageMs = Date.now() - list.createdAt.getTime();
  const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
  const engagementRatio = list.viewCount > 0 ? (list.saveCount / list.viewCount) * 100 : 0;
  const status = getStatus(saves24h, saves7d);
  const scoreBreakdown: ScoreBreakdown = {
    ...currentScoreResult,
    formula: {
      base: `${list.saveCount} × ${CATEGORY_WEIGHT}`,
      velocity: `${saves24h} × ${VELOCITY_FACTOR}`,
      recency: ageDays < RECENCY_DAYS_THRESHOLD ? `+${RECENCY_BONUS}` : '۰',
      decay: `${ageDays} × ${DECAY_PER_DAY}`,
    },
  };
  const rawMetrics: RawMetrics = {
    totalSaves: list.saveCount,
    saves24h,
    saves7d,
    ageDays,
    categoryWeight: CATEGORY_WEIGHT,
    engagementRatio: Math.round(engagementRatio * 100) / 100,
  };
  const saveSpikeDetected = saves7d > 0 && saves24h > saves7d / 2;
  const flags: Flags = {
    boostActive: list.isFeatured ?? false,
    saveSpikeDetected,
    manualOverride: false,
    riskLevel: saveSpikeDetected ? 'medium' : 'low',
  };

  return {
    list: { id: list.id, title: list.title, slug: list.slug, saveCount: list.saveCount, viewCount: list.viewCount, createdAt: list.createdAt, categoryId: list.categoryId },
    categoryName: list.categories?.name ?? '—',
    currentRank,
    totalRanked,
    status,
    scoreBreakdown,
    rawMetrics,
    prevRank,
    nextRank,
    flags,
  };
}

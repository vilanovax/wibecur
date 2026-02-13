/**
 * Creator Ranking System — کیفیت‌محور، ضد سوءاستفاده.
 * ترکیب: CuratorScore (پایه) + InfluenceScore (اثرگذاری) + MomentumScore (رشد).
 */

import type { PrismaClient } from '@prisma/client';
import { calculateCuratorScore, type CuratorStats } from '@/lib/curator';

const VIRAL_LIKE_THRESHOLD = 50;
const INACTIVITY_DAYS_DECAY = 60;
const DECAY_FACTOR = 0.85; // هر 30 روز غیرفعال بعد از 60 روز

export interface RankingScores {
  curatorScore: number;
  influenceScore: number;
  momentumScore: number;
  rankingScore: number;
  lastActivityAt: Date | null;
}

/** Curator Score (همان فرمول Level): لیست×10 + میانگین لایک×5 + آیتم تایید×3 + ذخیره×2 + وایرال×30 */
async function getCuratorScoreForUser(prisma: PrismaClient, userId: string): Promise<number> {
  const [listsCount, lists, approvedCount] = await Promise.all([
    prisma.lists.count({ where: { userId, isActive: true, isPublic: true } }),
    prisma.lists.findMany({
      where: { userId, isActive: true, isPublic: true },
      select: { likeCount: true, saveCount: true },
    }),
    prisma.suggested_items.count({ where: { userId, status: 'approved' } }),
  ]);
  const totalLikes = lists.reduce((s, l) => s + (l.likeCount ?? 0), 0);
  const savedCount = lists.reduce((s, l) => s + (l.saveCount ?? 0), 0);
  const viralCount = lists.filter((l) => (l.likeCount ?? 0) >= VIRAL_LIKE_THRESHOLD).length;
  const avgLikes = listsCount > 0 ? totalLikes / listsCount : 0;
  const stats: CuratorStats = {
    listsCount,
    avgLikesPerList: avgLikes,
    approvedItemsCount: approvedCount,
    savedCount,
    viralListsCount: viralCount,
  };
  return Math.max(0, calculateCuratorScore(stats));
}

/** Influence: uniqueSaves×3 + followers×2 + helpfulVotes×5 */
async function getInfluenceScore(prisma: PrismaClient, userId: string): Promise<number> {
  const [uniqueSaves, followers, helpfulResult] = await Promise.all([
    prisma.bookmarks.count({
      where: {
        lists: { userId, isActive: true, isPublic: true },
        userId: { not: userId },
      },
    }),
    prisma.follows.count({ where: { followingId: userId } }),
    prisma.list_comments.aggregate({
      where: { userId, deletedAt: null },
      _sum: { helpfulUp: true },
    }),
  ]);
  const helpful = helpfulResult._sum?.helpfulUp ?? 0;
  return uniqueSaves * 3 + followers * 2 + helpful * 5;
}

/** آخرین فعالیت: ماکس از به‌روزرسانی لیست، بوکمارک روی لیست‌ها، کامنت */
async function getLastActivityAt(prisma: PrismaClient, userId: string): Promise<Date | null> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [latestList, latestBookmark, latestComment] = await Promise.all([
    prisma.lists.findFirst({
      where: { userId, isPublic: true },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
    prisma.bookmarks.findFirst({
      where: { lists: { userId } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    prisma.list_comments.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);

  const dates: Date[] = [];
  if (latestList?.updatedAt) dates.push(latestList.updatedAt);
  if (latestBookmark?.createdAt) dates.push(latestBookmark.createdAt);
  if (latestComment?.createdAt) dates.push(latestComment.createdAt);
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

/** Momentum (۳۰ روز اخیر): newFollowers×2 + newSaves×3 + viralEvents×10 */
async function getMomentumScore(prisma: PrismaClient, userId: string): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [newFollowers, newSavesOnMyLists, viralListsUpdatedRecently] = await Promise.all([
    prisma.follows.count({
      where: { followingId: userId, createdAt: { gte: since } },
    }),
    prisma.bookmarks.count({
      where: {
        lists: { userId, isPublic: true },
        createdAt: { gte: since },
        userId: { not: userId },
      },
    }),
    prisma.lists.count({
      where: {
        userId,
        isPublic: true,
        likeCount: { gte: VIRAL_LIKE_THRESHOLD },
        updatedAt: { gte: since },
      },
    }),
  ]);

  return newFollowers * 2 + newSavesOnMyLists * 3 + viralListsUpdatedRecently * 10;
}

/** Decay: اگر بیش از INACTIVITY_DAYS_DECAY روز غیرفعال، امتیاز را کاهش بده */
export function applyDecay(rankingScore: number, lastActivityAt: Date | null): number {
  if (!lastActivityAt || rankingScore <= 0) return rankingScore;
  const now = new Date();
  const inactiveDays = (now.getTime() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24);
  if (inactiveDays <= INACTIVITY_DAYS_DECAY) return rankingScore;
  const periods = Math.floor((inactiveDays - INACTIVITY_DAYS_DECAY) / 30);
  const factor = Math.pow(DECAY_FACTOR, periods);
  return Math.max(0, rankingScore * factor);
}

/** ترکیب نهایی: ۰.۴ Curator + ۰.۴ Influence + ۰.۲ Momentum */
export function combineRankingScore(
  curator: number,
  influence: number,
  momentum: number
): number {
  return curator * 0.4 + influence * 0.4 + momentum * 0.2;
}

/** محاسبه همه امتیازها برای یک کاربر */
export async function computeUserRankingScores(
  prisma: PrismaClient,
  userId: string
): Promise<RankingScores> {
  const [curatorScore, influenceScore, momentumScore, lastActivityAt] = await Promise.all([
    getCuratorScoreForUser(prisma, userId),
    getInfluenceScore(prisma, userId),
    getMomentumScore(prisma, userId),
    getLastActivityAt(prisma, userId),
  ]);

  let rawRanking = combineRankingScore(curatorScore, influenceScore, momentumScore);
  rawRanking = applyDecay(rawRanking, lastActivityAt);

  return {
    curatorScore,
    influenceScore,
    momentumScore,
    rankingScore: Math.round(rawRanking * 100) / 100,
    lastActivityAt,
  };
}

/** لیست userIdهایی که حداقل یک لیست عمومی دارند (کریتور) */
async function getCreatorUserIds(prisma: PrismaClient): Promise<string[]> {
  const rows = await prisma.lists.findMany({
    where: { isPublic: true, isActive: true },
    select: { userId: true },
    distinct: ['userId'],
  });
  return rows.map((r) => r.userId);
}

/** به‌روزرسانی رتبه‌های سراسری و هر دسته؛ بعد از محاسبه همه امتیازها صدا بزن. */
export async function updateAllRanks(prisma: PrismaClient): Promise<void> {
  const creators = await getCreatorUserIds(prisma);
  if (creators.length === 0) return;

  const scoresList: { userId: string; scores: RankingScores }[] = [];
  for (const userId of creators) {
    const scores = await computeUserRankingScores(prisma, userId);
    scoresList.push({ userId, scores });
  }

  scoresList.sort((a, b) => b.scores.rankingScore - a.scores.rankingScore);

  const categories = await prisma.categories.findMany({
    where: { isActive: true },
    select: { id: true, slug: true },
  });

  const categoryRankByUser = new Map<string, Record<string, number>>();
  for (const cat of categories) {
    const userIdsWithListsInCategory = await prisma.lists.findMany({
      where: { categoryId: cat.id, isPublic: true, isActive: true },
      select: { userId: true },
      distinct: ['userId'],
    });
    const uIds = new Set(userIdsWithListsInCategory.map((r) => r.userId));
    const inCategory = scoresList.filter((s) => uIds.has(s.userId));
    inCategory.sort((a, b) => b.scores.rankingScore - a.scores.rankingScore);
    inCategory.forEach((s, r) => {
      const existing = categoryRankByUser.get(s.userId) ?? {};
      categoryRankByUser.set(s.userId, { ...existing, [cat.slug]: r + 1 });
    });
  }

  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const existingRanks = await prisma.creator_rankings.findMany({
    where: { userId: { in: scoresList.map((s) => s.userId) } },
    select: { userId: true, globalRank: true },
  });
  const previousByUser = new Map(existingRanks.map((r) => [r.userId, r.globalRank]));

  for (let i = 0; i < scoresList.length; i++) {
    const { userId, scores } = scoresList[i];
    const categoryRank = categoryRankByUser.get(userId) ?? undefined;
    const previousGlobalRank = previousByUser.get(userId) ?? null;
    await prisma.creator_rankings.upsert({
      where: { userId },
      create: {
        userId,
        curatorScore: scores.curatorScore,
        influenceScore: scores.influenceScore,
        momentumScore: scores.momentumScore,
        rankingScore: scores.rankingScore,
        globalRank: i + 1,
        previousGlobalRank,
        monthlyRank: i + 1,
        monthYear,
        categoryRank: categoryRank ?? undefined,
        lastActivityAt: scores.lastActivityAt,
      },
      update: {
        curatorScore: scores.curatorScore,
        influenceScore: scores.influenceScore,
        momentumScore: scores.momentumScore,
        rankingScore: scores.rankingScore,
        globalRank: i + 1,
        previousGlobalRank,
        monthlyRank: i + 1,
        monthYear,
        categoryRank: categoryRank ?? undefined,
        lastActivityAt: scores.lastActivityAt,
      },
    });
  }
}


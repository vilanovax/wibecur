/**
 * Creator Spotlight — نمایش ویژه کیوریتور در Home.
 * انواع: weekly, rising, category, editor.
 */

import type { PrismaClient } from '@prisma/client';

const SPOTLIGHT_DAYS = 7;
const MIN_ACTIVITY_DAYS = 7;
const COOLDOWN_DAYS = 60;
const SPOTLIGHT_SCORE = {
  rankingWeight: 0.6,
  momentumWeight: 0.3,
  qualityWeight: 0.1,
};

export type SpotlightType = 'weekly' | 'rising' | 'category' | 'editor';

export interface CurrentSpotlightResult {
  id: string;
  userId: string;
  type: SpotlightType;
  categorySlug: string | null;
  endDate: Date;
  creator: {
    userId: string;
    name: string | null;
    username: string | null;
    image: string | null;
    bio: string | null;
    avatarType: string | null;
    avatarId: string | null;
    curatorLevel: string;
    viralCount: number;
    totalLikes: number;
    listCount: number;
  };
  lists: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
    likeCount: number;
    saveCount: number;
    itemCount: number;
    categoryName: string | null;
    categoryIcon: string | null;
  }[];
}

/** واکشی اسپاتلایت فعال فعلی (بدون پر کردن خودکار) */
export async function getActiveSpotlight(
  prisma: PrismaClient
): Promise<{ id: string; userId: string; type: string; categorySlug: string | null; endDate: Date } | null> {
  const now = new Date();
  const row = await prisma.creator_spotlights.findFirst({
    where: {
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { startDate: 'desc' },
    select: { id: true, userId: true, type: true, categorySlug: true, endDate: true },
  });
  return row;
}

/** آیا کاربر در ۶۰ روز گذشته اسپاتلایت شده؟ */
async function wasRecentlySpotlighted(prisma: PrismaClient, userId: string): Promise<boolean> {
  const since = new Date();
  since.setDate(since.getDate() - COOLDOWN_DAYS);
  const count = await prisma.creator_spotlights.count({
    where: { userId, endDate: { gte: since } },
  });
  return count > 0;
}

/** فعالیت کیوریتور در ۷ روز اخیر (به‌روزرسانی لیست یا گذاشتن کامنت) */
async function isActiveLast7Days(prisma: PrismaClient, userId: string): Promise<boolean> {
  const since = new Date();
  since.setDate(since.getDate() - MIN_ACTIVITY_DAYS);
  const [list, comment] = await Promise.all([
    prisma.lists.findFirst({
      where: { userId, isPublic: true, updatedAt: { gte: since } },
      select: { id: true },
    }),
    prisma.list_comments.findFirst({
      where: { userId, createdAt: { gte: since } },
      select: { id: true },
    }),
  ]);
  return !!(list || comment);
}

/** انتخاب و ایجاد اسپاتلایت هفتگی (برای وقتی هیچ اسپاتلایت فعالی نیست) */
export async function selectAndCreateWeeklySpotlight(prisma: PrismaClient): Promise<boolean> {
  const creatorIds = await prisma.lists.findMany({
    where: { isPublic: true, isActive: true },
    select: { userId: true },
    distinct: ['userId'],
  }).then((r) => [...new Set(r.map((x) => x.userId))]);

  const activeAndEligible: string[] = [];
  for (const uid of creatorIds) {
    const [recent, active] = await Promise.all([
      wasRecentlySpotlighted(prisma, uid),
      isActiveLast7Days(prisma, uid),
    ]);
    if (!recent && active) activeAndEligible.push(uid);
  }

  if (activeAndEligible.length === 0) return false;

  const rankings = await prisma.creator_rankings.findMany({
    where: { userId: { in: activeAndEligible } },
    select: {
      userId: true,
      rankingScore: true,
      momentumScore: true,
      curatorScore: true,
      influenceScore: true,
    },
  });

  const listStats = await prisma.lists.groupBy({
    by: ['userId'],
    where: { userId: { in: activeAndEligible }, isPublic: true, isActive: true },
    _sum: { likeCount: true, saveCount: true },
    _count: { id: true },
  });

  const maxRank = Math.max(1, ...rankings.map((r) => r.rankingScore));
  const maxMom = Math.max(1, ...rankings.map((r) => r.momentumScore));
  const qualityByUser = new Map(
    listStats.map((r) => {
      const avg = r._count.id > 0 ? ((r._sum.likeCount ?? 0) + (r._sum.saveCount ?? 0)) / r._count.id : 0;
      return [r.userId, avg];
    })
  );
  const maxQuality = Math.max(1, ...qualityByUser.values());

  type S = { userId: string; score: number };
  const scored: S[] = rankings.map((r) => {
    const quality = qualityByUser.get(r.userId) ?? 0;
    const score =
      SPOTLIGHT_SCORE.rankingWeight * (r.rankingScore / maxRank) +
      SPOTLIGHT_SCORE.momentumWeight * (r.momentumScore / maxMom) +
      SPOTLIGHT_SCORE.qualityWeight * (quality / maxQuality);
    return { userId: r.userId, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const chosen = scored[0]?.userId;
  if (!chosen) return false;

  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + SPOTLIGHT_DAYS);

  await prisma.creator_spotlights.create({
    data: {
      userId: chosen,
      type: 'weekly',
      startDate: start,
      endDate: end,
    },
  });
  return true;
}

/** واکشی اسپاتلایت فعلی به‌همراه اطلاعات کیوریتور و ۲–۳ لیست برتر */
export async function getCurrentSpotlightWithDetails(
  prisma: PrismaClient
): Promise<CurrentSpotlightResult | null> {
  let row = await getActiveSpotlight(prisma);
  if (!row) {
    const created = await selectAndCreateWeeklySpotlight(prisma);
    if (created) row = await getActiveSpotlight(prisma);
  }
  if (!row) return null;

  const [user, lists, viralCount, listCount, totalLikesAgg] = await Promise.all([
    prisma.users.findUnique({
      where: { id: row.userId },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        avatarType: true,
        avatarId: true,
        curatorLevel: true,
      },
    }),
    prisma.lists.findMany({
      where: { userId: row.userId, isPublic: true, isActive: true },
      orderBy: [{ likeCount: 'desc' }, { saveCount: 'desc' }],
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        likeCount: true,
        saveCount: true,
        itemCount: true,
        categories: { select: { name: true, icon: true } },
      },
    }),
    prisma.lists.count({
      where: { userId: row.userId, isPublic: true, likeCount: { gte: 50 } },
    }),
    prisma.lists.count({ where: { userId: row.userId, isPublic: true, isActive: true } }),
    prisma.lists.aggregate({
      where: { userId: row.userId, isPublic: true },
      _sum: { likeCount: true },
    }),
  ]);

  if (!user) return null;

  const totalLikes = totalLikesAgg._sum.likeCount ?? 0;

  return {
    id: row.id,
    userId: row.userId,
    type: row.type as SpotlightType,
    categorySlug: row.categorySlug,
    endDate: row.endDate,
    creator: {
      userId: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      bio: user.bio,
      avatarType: user.avatarType,
      avatarId: user.avatarId,
      curatorLevel: user.curatorLevel ?? 'EXPLORER',
      viralCount,
      totalLikes,
      listCount: listCount ?? 0,
    },
    lists: lists.map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      coverImage: l.coverImage,
      likeCount: l.likeCount ?? 0,
      saveCount: l.saveCount ?? 0,
      itemCount: l.itemCount ?? 0,
      categoryName: l.categories?.name ?? null,
      categoryIcon: l.categories?.icon ?? null,
    })),
  };
}

/** آیا این کاربر الان اسپاتلایت فعال دارد؟ (برای بج پروفایل) */
export async function getActiveSpotlightForUser(
  prisma: PrismaClient,
  userId: string
): Promise<{ type: string; endDate: Date } | null> {
  const now = new Date();
  const row = await prisma.creator_spotlights.findFirst({
    where: {
      userId,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    select: { type: true, endDate: true },
  });
  return row;
}

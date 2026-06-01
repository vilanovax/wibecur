import { prisma } from '@/lib/prisma';

const VIRAL_LIKE = 50;
const GLOBAL_TOP = 100;
const RISING_TOP = 50;
const CATEGORY_TOP = 50;
const MONTHLY_TOP = 50;

export type LeaderboardType = 'global' | 'rising' | 'category' | 'monthly';

export type LeaderboardRow = {
  rank: number;
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  avatarType: string | null;
  avatarId: string | null;
  curatorLevel: string;
  viralCount: number;
  totalLikes: number;
  totalSaves: number;
  listCount: number;
  momentumScore: number;
  rankingScore: number;
  rankChange: number | null;
  growthPercent: number | null;
  monthlyRank: number | null;
  monthYear: string | null;
};

export async function fetchLeaderboard(
  type: LeaderboardType,
  categorySlug?: string | null
): Promise<LeaderboardRow[]> {
  if (type === 'category' && !categorySlug) {
    return [];
  }

  let userIds: string[] = [];

  if (type === 'global') {
    const rows = await prisma.creator_rankings.findMany({
      where: { globalRank: { gte: 1 } },
      orderBy: { globalRank: 'asc' },
      take: GLOBAL_TOP,
      select: { userId: true },
    });
    userIds = rows.map((r) => r.userId);
  } else if (type === 'monthly') {
    const rows = await prisma.creator_rankings.findMany({
      where: { monthlyRank: { gte: 1 } },
      orderBy: { monthlyRank: 'asc' },
      take: MONTHLY_TOP,
      select: { userId: true },
    });
    userIds = rows.map((r) => r.userId);
  } else if (type === 'rising') {
    const rows = await prisma.creator_rankings.findMany({
      where: { momentumScore: { gt: 0 } },
      orderBy: { momentumScore: 'desc' },
      take: RISING_TOP,
      select: { userId: true },
    });
    userIds = rows.map((r) => r.userId);
  } else {
    const cat = await prisma.categories.findFirst({
      where: { slug: categorySlug!, isActive: true },
      select: { id: true },
    });
    if (!cat) return [];

    const listUserIds = await prisma.lists.findMany({
      where: { categoryId: cat.id, isPublic: true, isActive: true },
      select: { userId: true },
      distinct: ['userId'],
    });
    const uSet = new Set(listUserIds.map((r) => r.userId));
    const rankings = await prisma.creator_rankings.findMany({
      where: { userId: { in: [...uSet] } },
      orderBy: { rankingScore: 'desc' },
      take: CATEGORY_TOP,
      select: { userId: true },
    });
    userIds = rankings.map((r) => r.userId);
  }

  if (userIds.length === 0) return [];

  const [rankings, users, listStats] = await Promise.all([
    prisma.creator_rankings.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        globalRank: true,
        previousGlobalRank: true,
        monthlyRank: true,
        monthYear: true,
        categoryRank: true,
        rankingScore: true,
        momentumScore: true,
        curatorScore: true,
        influenceScore: true,
      },
    }),
    prisma.users.findMany({
      where: { id: { in: userIds }, isActive: true },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        curatorLevel: true,
        avatarType: true,
        avatarId: true,
      },
    }),
    prisma.lists.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, isPublic: true, isActive: true },
      _sum: { likeCount: true, saveCount: true },
      _count: { id: true },
    }),
  ]);

  const viralByUser = await prisma.lists.groupBy({
    by: ['userId'],
    where: {
      userId: { in: userIds },
      isPublic: true,
      isActive: true,
      likeCount: { gte: VIRAL_LIKE },
    },
    _count: { id: true },
  });

  const viralMap = new Map(viralByUser.map((r) => [r.userId, r._count.id]));
  const statsMap = new Map(
    listStats.map((r) => [
      r.userId,
      { totalLikes: r._sum.likeCount ?? 0, totalSaves: r._sum.saveCount ?? 0, listCount: r._count.id },
    ])
  );
  const rankMap = new Map(rankings.map((r) => [r.userId, r]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  return userIds.map((userId, index) => {
    const r = rankMap.get(userId);
    const u = userMap.get(userId);
    const stats = statsMap.get(userId);
    const viralCount = viralMap.get(userId) ?? 0;
    const rank =
      type === 'global' && r?.globalRank
        ? r.globalRank
        : type === 'monthly' && r?.monthlyRank
          ? r.monthlyRank
          : index + 1;
    const categoryRank =
      type === 'category' && categorySlug && r?.categoryRank
        ? (r.categoryRank as Record<string, number>)[categorySlug]
        : undefined;
    const prevRank = r?.previousGlobalRank ?? null;
    const currentRank = type === 'global' ? (r?.globalRank ?? index + 1) : null;
    const rankChange =
      type === 'global' && prevRank != null && currentRank != null ? prevRank - currentRank : null;
    const baseScore = (r?.curatorScore ?? 0) + (r?.influenceScore ?? 0) || 1;
    const growthPercent =
      type === 'rising' && (r?.momentumScore ?? 0) > 0
        ? Math.min(100, Math.round(((r?.momentumScore ?? 0) / baseScore) * 100))
        : null;

    return {
      rank: type === 'category' ? (categoryRank ?? index + 1) : rank,
      userId,
      name: u?.name ?? null,
      username: u?.username ?? null,
      image: u?.image ?? null,
      avatarType: u?.avatarType ?? null,
      avatarId: u?.avatarId ?? null,
      curatorLevel: u?.curatorLevel ?? 'EXPLORER',
      viralCount,
      totalLikes: stats?.totalLikes ?? 0,
      totalSaves: stats?.totalSaves ?? 0,
      listCount: stats?.listCount ?? 0,
      momentumScore: r?.momentumScore ?? 0,
      rankingScore: r?.rankingScore ?? 0,
      rankChange,
      growthPercent:
        growthPercent ??
        (type === 'rising' && (r?.momentumScore ?? 0) > 0
          ? Math.min(100, Math.round((r?.momentumScore ?? 0) / 2))
          : null),
      monthlyRank: r?.monthlyRank ?? null,
      monthYear: r?.monthYear ?? null,
    };
  });
}

export type LeaderboardCategoryOption = { slug: string; name: string; icon: string };

export async function fetchLeaderboardCategories(): Promise<LeaderboardCategoryOption[]> {
  const categories = await prisma.categories.findMany({
    where: { isActive: true },
    select: { slug: true, name: true, icon: true },
    orderBy: { order: 'asc' },
    take: 10,
  });
  return categories;
}

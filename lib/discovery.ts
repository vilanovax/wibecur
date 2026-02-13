/**
 * Creator Discovery Engine — پیشنهاد هوشمند کیوریتور بر اساس سلیقه و رفتار.
 * سیگنال‌ها: Category Affinity, Behavioral Similarity, Influence, Momentum, Diversity.
 */

import type { PrismaClient } from '@prisma/client';

const WEIGHTS = {
  categoryAffinity: 0.35,
  behaviorSimilarity: 0.25,
  influenceScore: 0.2,
  momentumScore: 0.1,
  diversityWeight: 0.1,
};

const TOP_N = 10;
const DIVERSITY_MIN_OTHER_CATEGORIES = 2; // حداقل ۲ پیشنهاد از دسته‌های دیگر

export interface RecommendedCreator {
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  avatarType: string | null;
  avatarId: string | null;
  curatorLevel: string;
  topCategories: { slug: string; name: string; icon: string }[];
  totalLikes: number;
  listCount: number;
  viralCount: number;
  isFollowing?: boolean;
  explanation?: string;
}

/** محاسبه وزن دسته‌ای کاربر از ذخیره‌ها، لیست‌های ساخته‌شده و لایک‌ها */
export async function computeAndUpsertUserCategoryAffinity(
  prisma: PrismaClient,
  userId: string
): Promise<void> {
  const [bookmarkCategories, myListCategories, likedListCategories] = await Promise.all([
    prisma.bookmarks.findMany({
      where: { userId },
      select: { lists: { select: { categoryId: true, categories: { select: { slug: true } } } } },
    }),
    prisma.lists.findMany({
      where: { userId, isPublic: true },
      select: { categories: { select: { slug: true } } },
    }),
    prisma.list_likes.findMany({
      where: { userId },
      select: { lists: { select: { categories: { select: { slug: true } } } } },
    }),
  ]);

  const countBySlug = new Map<string, number>();
  const add = (slug: string | null, weight: number) => {
    if (!slug) return;
    countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + weight);
  };

  bookmarkCategories.forEach((b) => add(b.lists?.categories?.slug ?? null, 2));
  myListCategories.forEach((l) => add(l.categories?.slug ?? null, 3));
  likedListCategories.forEach((l) => add(l.lists?.categories?.slug ?? null, 1));

  const total = [...countBySlug.values()].reduce((a, b) => a + b, 0);
  await prisma.user_category_affinity.deleteMany({ where: { userId } });
  if (total === 0) return;

  for (const [slug, count] of countBySlug) {
    const weight = count / total;
    await prisma.user_category_affinity.create({
      data: { userId, categorySlug: slug, weight },
    });
  }
}

/** واکشی وزن دسته‌های کاربر از جدول */
async function getUserCategoryWeights(
  prisma: PrismaClient,
  userId: string
): Promise<Map<string, number>> {
  const rows = await prisma.user_category_affinity.findMany({
    where: { userId },
    select: { categorySlug: true, weight: true },
  });
  return new Map(rows.map((r) => [r.categorySlug, r.weight]));
}

/** واکشی خلاصه دسته‌های هر کریتور (لیست‌های عمومی به‌تفکیک دسته) */
async function getCreatorCategoryWeights(
  prisma: PrismaClient,
  creatorIds: string[]
): Promise<Map<string, Map<string, number>>> {
  const lists = await prisma.lists.findMany({
    where: { userId: { in: creatorIds }, isPublic: true, isActive: true },
    select: {
      userId: true,
      categoryId: true,
      categories: { select: { slug: true } },
    },
  });

  const byUser = new Map<string, Map<string, number>>();
  for (const l of lists) {
    const slug = l.categories?.slug ?? 'other';
    if (!byUser.has(l.userId)) byUser.set(l.userId, new Map());
    const m = byUser.get(l.userId)!;
    m.set(slug, (m.get(slug) ?? 0) + 1);
  }
  for (const m of byUser.values()) {
    const total = [...m.values()].reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const [k, v] of m) m.set(k, v / total);
    }
  }
  return byUser;
}

/** شباهت دسته‌ای: حاصل‌ضرب داخلی نرمال‌شده (۰ تا ۱) */
function categoryAffinityScore(
  userWeights: Map<string, number>,
  creatorWeights: Map<string, number>
): number {
  if (userWeights.size === 0 || creatorWeights.size === 0) return 0.5;
  let dot = 0;
  for (const [slug, w] of userWeights) {
    dot += w * (creatorWeights.get(slug) ?? 0);
  }
  return Math.min(1, dot * 1.5);
}

/** شباهت رفتاری: کریتورهایی که کاربر لیست‌هاشون رو ذخیره یا لایک کرده (overlap با سازندهٔ لیست) */
async function getBehaviorSimilarityScores(
  prisma: PrismaClient,
  userId: string
): Promise<Map<string, number>> {
  const [bookmarks, likes] = await Promise.all([
    prisma.bookmarks.findMany({
      where: { userId },
      select: { lists: { select: { userId: true } } },
    }),
    prisma.list_likes.findMany({
      where: { userId },
      select: { lists: { select: { userId: true } } },
    }),
  ]);
  const byCreator = new Map<string, number>();
  const add = (creatorId: string | undefined, w: number) => {
    if (!creatorId || creatorId === userId) return;
    byCreator.set(creatorId, (byCreator.get(creatorId) ?? 0) + w);
  };
  bookmarks.forEach((b) => add(b.lists?.userId, 2));
  likes.forEach((l) => add(l.lists?.userId, 1));
  if (byCreator.size === 0) return new Map();
  const max = Math.max(...byCreator.values());
  const normalized = new Map<string, number>();
  for (const [uid, count] of byCreator) normalized.set(uid, count / max);
  return normalized;
}

/** لیست کریتورها (کاربران با حداقل یک لیست عمومی)، بدون خود کاربر و بدون کسانی که فالو شده‌اند */
async function getEligibleCreatorIds(
  prisma: PrismaClient,
  userId: string
): Promise<string[]> {
  const [creatorIds, followingIds] = await Promise.all([
    prisma.lists.findMany({
      where: { isPublic: true, isActive: true },
      select: { userId: true },
      distinct: ['userId'],
    }).then((r) => [...new Set(r.map((x) => x.userId))].filter((id) => id !== userId)),
    prisma.follows.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }).then((r) => r.map((x) => x.followingId)),
  ]);
  const followingSet = new Set(followingIds);
  return creatorIds.filter((id) => !followingSet.has(id));
}

/** امتیاز نرمال ۰–۱ برای استفاده در فرمول */
function normalizeScore(value: number, max: number): number {
  if (max <= 0) return 0.5;
  return Math.min(1, value / max);
}

/** پیشنهاد تاپ N کریتور با امتیاز Discovery */
export async function getRecommendedCreators(
  prisma: PrismaClient,
  userId: string,
  limit: number = TOP_N
): Promise<RecommendedCreator[]> {
  const creatorIds = await getEligibleCreatorIds(prisma, userId);
  if (creatorIds.length === 0) return [];

  const [userCategoryWeights, creatorCategoryWeights, behaviorScores, rankings, users, listStats] =
    await Promise.all([
      getUserCategoryWeights(prisma, userId),
      getCreatorCategoryWeights(prisma, creatorIds),
      getBehaviorSimilarityScores(prisma, userId),
      prisma.creator_rankings.findMany({
        where: { userId: { in: creatorIds } },
        select: { userId: true, influenceScore: true, momentumScore: true },
      }),
      prisma.users.findMany({
        where: { id: { in: creatorIds }, isActive: true },
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
        where: { userId: { in: creatorIds }, isPublic: true, isActive: true },
        _sum: { likeCount: true },
        _count: { id: true },
      }),
    ]);

  const viralCounts = await prisma.lists.groupBy({
    by: ['userId'],
    where: { userId: { in: creatorIds }, isPublic: true, likeCount: { gte: 50 } },
    _count: { id: true },
  });

  const rankMap = new Map(rankings.map((r) => [r.userId, r]));
  const userMap = new Map(users.map((u) => [u.id, u]));
  const statsMap = new Map(
    listStats.map((r) => [
      r.userId,
      { totalLikes: r._sum.likeCount ?? 0, listCount: r._count.id },
    ])
  );
  const viralMap = new Map(viralCounts.map((r) => [r.userId, r._count.id]));

  const maxInfluence = Math.max(1, ...rankings.map((r) => r.influenceScore));
  const maxMomentum = Math.max(1, ...rankings.map((r) => r.momentumScore));

  type Scored = { userId: string; score: number; topCategorySlug: string | null };
  const scored: Scored[] = [];

  for (const cid of creatorIds) {
    const creatorCats = creatorCategoryWeights.get(cid) ?? new Map();
    const catAff = categoryAffinityScore(userCategoryWeights, creatorCats);
    const behSim = behaviorScores.get(cid) ?? 0;
    const r = rankMap.get(cid);
    const infNorm = normalizeScore(r?.influenceScore ?? 0, maxInfluence);
    const momNorm = normalizeScore(r?.momentumScore ?? 0, maxMomentum);
    const topSlug = creatorCats.size > 0
      ? [...creatorCats.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : null;
    const diversityBonus = 0.1;
    const score =
      WEIGHTS.categoryAffinity * catAff +
      WEIGHTS.behaviorSimilarity * (behSim > 0 ? behSim : 0.3) +
      WEIGHTS.influenceScore * infNorm +
      WEIGHTS.momentumScore * momNorm +
      WEIGHTS.diversityWeight * diversityBonus;
    scored.push({ userId: cid, score, topCategorySlug: topSlug });
  }

  scored.sort((a, b) => b.score - a.score);

  const withDiversity: Scored[] = [];
  const usedSlugs = new Set<string>();
  const otherCategory: Scored[] = [];
  for (const s of scored) {
    if (s.topCategorySlug && usedSlugs.has(s.topCategorySlug)) {
      otherCategory.push(s);
    } else {
      withDiversity.push(s);
      if (s.topCategorySlug) usedSlugs.add(s.topCategorySlug);
    }
  }
  let injectCount = Math.min(DIVERSITY_MIN_OTHER_CATEGORIES, otherCategory.length);
  for (const s of otherCategory) {
    if (injectCount <= 0) break;
    if (!withDiversity.some((x) => x.userId === s.userId)) {
      withDiversity.push(s);
      injectCount--;
    }
  }
  withDiversity.sort((a, b) => b.score - a.score);
  const topIds = withDiversity.slice(0, limit).map((s) => s.userId);

  const result: RecommendedCreator[] = [];
  for (const cid of topIds) {
    const u = userMap.get(cid);
    if (!u) continue;
    const stats = statsMap.get(cid);
    const lists = await prisma.lists.findMany({
      where: { userId: cid, isPublic: true, isActive: true },
      select: { categoryId: true, categories: { select: { slug: true, name: true, icon: true } } },
    });
    const catCount = new Map<string, { name: string; icon: string }>();
    for (const l of lists) {
      const c = l.categories;
      if (c && !catCount.has(c.slug)) catCount.set(c.slug, { name: c.name, icon: c.icon });
    }
    const topCategories = [...catCount.entries()]
      .slice(0, 3)
      .map(([slug, o]) => ({ slug, name: o.name, icon: o.icon }));

    result.push({
      userId: u.id,
      name: u.name,
      username: u.username,
      image: u.image,
      avatarType: u.avatarType,
      avatarId: u.avatarId,
      curatorLevel: u.curatorLevel ?? 'EXPLORER',
      topCategories,
      totalLikes: stats?.totalLikes ?? 0,
      listCount: stats?.listCount ?? 0,
      viralCount: viralMap.get(cid) ?? 0,
      isFollowing: false,
    });
  }

  return result;
}

// ─── Personalized Spotlight (یک کیوریتور ویژه برای هر کاربر) ─────────────────

const SPOTLIGHT_WEIGHTS = {
  affinity: 0.5,
  influenceScore: 0.2,
  momentumScore: 0.2,
  diversityWeight: 0.1,
};

const SPOTLIGHT_CACHE_HOURS = 24;

export interface SpotlightResult {
  creator: RecommendedCreator;
  explanation: string | null;
  isRisingFallback?: boolean;
}

/** ساخت جمله توضیح برای اعتماد: «چون X ذخیره کردی / لیست ساختی» */
async function buildSpotlightExplanation(
  prisma: PrismaClient,
  userId: string,
  creatorId: string,
  categorySlug: string,
  categoryName: string
): Promise<string> {
  const [savedInCategory, listsInCategory] = await Promise.all([
    prisma.bookmarks.count({
      where: {
        userId,
        lists: { categories: { slug: categorySlug } },
      },
    }),
    prisma.lists.count({
      where: { userId, isPublic: true, categories: { slug: categorySlug } },
    }),
  ]);

  const parts: string[] = [];
  if (savedInCategory > 0) {
    parts.push(`${savedInCategory.toLocaleString('fa-IR')} ${categoryName} ذخیره کردی`);
  }
  if (listsInCategory > 0) {
    parts.push(`${listsInCategory.toLocaleString('fa-IR')} لیست ${categoryName} ساختی`);
  }
  if (parts.length === 0) {
    return `چون در ${categoryName} فعالیت داری`;
  }
  return `چون ${parts.join(' و ')}`;
}

/** یک کیوریتور Spotlight با امتیاز شخصی‌سازی‌شده و توضیح */
export async function getSpotlightCreator(
  prisma: PrismaClient,
  userId: string
): Promise<SpotlightResult | null> {
  const creatorIds = await getEligibleCreatorIds(prisma, userId);
  if (creatorIds.length === 0) return null;

  const userWeights = await getUserCategoryWeights(prisma, userId);
  const hasTasteProfile = userWeights.size > 0;

  if (!hasTasteProfile) {
    const rising = await prisma.creator_rankings.findFirst({
      where: { userId: { in: creatorIds }, momentumScore: { gt: 0 } },
      orderBy: { momentumScore: 'desc' },
      select: { userId: true },
    });
    if (!rising) return null;
    const [u, lists, stats, viral] = await Promise.all([
      prisma.users.findUnique({
        where: { id: rising.userId },
        select: { id: true, name: true, username: true, image: true, curatorLevel: true, avatarType: true, avatarId: true },
      }),
      prisma.lists.findMany({
        where: { userId: rising.userId, isPublic: true, isActive: true },
        select: { categories: { select: { slug: true, name: true, icon: true } } },
      }),
      prisma.lists.groupBy({
        by: ['userId'],
        where: { userId: rising.userId, isPublic: true },
        _sum: { likeCount: true },
        _count: { id: true },
      }),
      prisma.lists.count({
        where: { userId: rising.userId, isPublic: true, likeCount: { gte: 50 } },
      }),
    ]);
    if (!u) return null;
    const catMap = new Map<string, { name: string; icon: string }>();
    lists.forEach((l) => {
      const c = l.categories;
      if (c && !catMap.has(c.slug)) catMap.set(c.slug, { name: c.name, icon: c.icon });
    });
    const topCategories = [...catMap.entries()].slice(0, 3).map(([slug, o]) => ({ slug, name: o.name, icon: o.icon }));
    const s = stats[0];
    const fallbackCreator: RecommendedCreator = {
      userId: u.id,
      name: u.name,
      username: u.username,
      image: u.image,
      avatarType: u.avatarType,
      avatarId: u.avatarId,
      curatorLevel: u.curatorLevel ?? 'EXPLORER',
      topCategories,
      totalLikes: s?._sum.likeCount ?? 0,
      listCount: s?._count.id ?? 0,
      viralCount: viral,
    };
    return { creator: fallbackCreator, explanation: 'کیوریتور در حال رشد این هفته', isRisingFallback: true };
  }

  const [creatorCategoryWeights, behaviorScores, rankings, users, listStats] = await Promise.all([
    getCreatorCategoryWeights(prisma, creatorIds),
    getBehaviorSimilarityScores(prisma, userId),
    prisma.creator_rankings.findMany({
      where: { userId: { in: creatorIds } },
      select: { userId: true, influenceScore: true, momentumScore: true },
    }),
    prisma.users.findMany({
      where: { id: { in: creatorIds }, isActive: true },
      select: { id: true, name: true, username: true, image: true, curatorLevel: true, avatarType: true, avatarId: true },
    }),
    prisma.lists.groupBy({
      by: ['userId'],
      where: { userId: { in: creatorIds }, isPublic: true, isActive: true },
      _sum: { likeCount: true },
      _count: { id: true },
    }),
  ]);

  const viralCounts = await prisma.lists.groupBy({
    by: ['userId'],
    where: { userId: { in: creatorIds }, isPublic: true, likeCount: { gte: 50 } },
    _count: { id: true },
  });

  const rankMap = new Map(rankings.map((r) => [r.userId, r]));
  const userMap = new Map(users.map((u) => [u.id, u]));
  const statsMap = new Map(listStats.map((r) => [r.userId, { totalLikes: r._sum.likeCount ?? 0, listCount: r._count.id }]));
  const viralMap = new Map(viralCounts.map((r) => [r.userId, r._count.id]));
  const maxInfluence = Math.max(1, ...rankings.map((r) => r.influenceScore));
  const maxMomentum = Math.max(1, ...rankings.map((r) => r.momentumScore));

  type Scored = { userId: string; score: number; topCategorySlug: string | null };
  const scored: Scored[] = [];

  for (const cid of creatorIds) {
    const creatorCats = creatorCategoryWeights.get(cid) ?? new Map();
    const catAff = categoryAffinityScore(userWeights, creatorCats);
    const behSim = behaviorScores.get(cid) ?? 0;
    const r = rankMap.get(cid);
    const infNorm = normalizeScore(r?.influenceScore ?? 0, maxInfluence);
    const momNorm = normalizeScore(r?.momentumScore ?? 0, maxMomentum);
    const topSlug = creatorCats.size > 0 ? [...creatorCats.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;
    const score =
      SPOTLIGHT_WEIGHTS.affinity * catAff +
      SPOTLIGHT_WEIGHTS.influenceScore * infNorm +
      SPOTLIGHT_WEIGHTS.momentumScore * momNorm +
      SPOTLIGHT_WEIGHTS.diversityWeight * (behSim > 0 ? behSim : 0.1);
    scored.push({ userId: cid, score, topCategorySlug: topSlug });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  if (!top) return null;

  const u = userMap.get(top.userId);
  if (!u) return null;

  const lists = await prisma.lists.findMany({
    where: { userId: top.userId, isPublic: true, isActive: true },
    select: { categories: { select: { slug: true, name: true, icon: true } } },
  });
  const catMap = new Map<string, { name: string; icon: string }>();
  lists.forEach((l) => {
    const c = l.categories;
    if (c && !catMap.has(c.slug)) catMap.set(c.slug, { name: c.name, icon: c.icon });
  });
  const topCategories = [...catMap.entries()].slice(0, 3).map(([slug, o]) => ({ slug, name: o.name, icon: o.icon }));
  const stats = statsMap.get(top.userId);
  const categoryName = top.topCategorySlug ? catMap.get(top.topCategorySlug)?.name ?? top.topCategorySlug : null;
  const explanation = categoryName && top.topCategorySlug
    ? await buildSpotlightExplanation(prisma, userId, top.userId, top.topCategorySlug, categoryName)
    : null;

  const creator: RecommendedCreator = {
    userId: u.id,
    name: u.name,
    username: u.username,
    image: u.image,
    avatarType: u.avatarType,
    avatarId: u.avatarId,
    curatorLevel: u.curatorLevel ?? 'EXPLORER',
    topCategories,
    totalLikes: stats?.totalLikes ?? 0,
    listCount: stats?.listCount ?? 0,
    viralCount: viralMap.get(top.userId) ?? 0,
  };

  return { creator, explanation };
}

export { SPOTLIGHT_CACHE_HOURS };

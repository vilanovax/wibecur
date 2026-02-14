/**
 * منطق کسب داده‌های صفحه دسته‌بندی 2.0
 */
import type { PrismaClient } from '@prisma/client';
import type {
  CategoryInfo,
  CategoryMetrics,
  CategoryListCard,
  CategoryCuratorCard,
  CategoryPageData,
} from '@/types/category-page';
import { getTrendingByCategory } from '@/lib/trending/service';

const RECENT_DAYS = 7;
const VIRAL_LIKE_THRESHOLD = 50;
const TRENDING_LIMIT = 6;
const CURATORS_LIMIT = 4;
const NEW_LISTS_LIMIT = 4;

function toCategoryInfo(c: {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  accentColor?: string | null;
  description?: string | null;
  heroImage?: string | null;
  layoutType?: string | null;
}): CategoryInfo {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    color: c.color,
    accentColor: c.accentColor,
    description: c.description,
    heroImage: c.heroImage,
    layoutType: c.layoutType as CategoryInfo['layoutType'],
  };
}

async function getCategoryAndMetrics(
  prisma: PrismaClient,
  categoryId: string
): Promise<{ category: CategoryInfo; metrics: CategoryMetrics }> {
  const cutoff = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);

  const [category, listCount, itemCount, weeklySaves, viralCount] = await Promise.all([
    prisma.categories.findUniqueOrThrow({
      where: { id: categoryId, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,
        accentColor: true,
        description: true,
        heroImage: true,
        layoutType: true,
      },
    }),
    prisma.lists.count({
      where: { categoryId, isActive: true, isPublic: true },
    }),
    prisma.items.count({
      where: { lists: { categoryId, isActive: true, isPublic: true } },
    }),
    prisma.bookmarks.count({
      where: {
        createdAt: { gte: cutoff },
        lists: { categoryId, isActive: true, isPublic: true },
      },
    }),
    prisma.lists.count({
      where: {
        categoryId,
        isActive: true,
        isPublic: true,
        likeCount: { gte: VIRAL_LIKE_THRESHOLD },
      },
    }),
  ]);

  return {
    category: toCategoryInfo(category),
    metrics: {
      totalLists: listCount,
      totalItems: itemCount,
      weeklySaveCount: weeklySaves,
      viralCount,
    },
  };
}

async function getTrendingAndViralLists(
  prisma: PrismaClient,
  categoryId: string
): Promise<{ trending: CategoryListCard[]; viral: CategoryListCard | null }> {
  const results = await getTrendingByCategory(prisma, categoryId, TRENDING_LIMIT + 5);
  const toCard = (r: (typeof results)[0]): CategoryListCard => ({
    id: r.listId,
    title: r.title,
    slug: r.slug,
    description: r.description ?? null,
    coverImage: r.coverImage ?? null,
    saveCount: r.saveCount,
    likeCount: r.likeCount,
    itemCount: r.itemCount,
    badge: r.badge !== 'none' ? r.badge : null,
    creator: r.creator
      ? {
          id: r.creator.id,
          name: r.creator.name,
          username: r.creator.username,
          image: r.creator.image,
          curatorLevel: r.creator.curatorLevel ?? 'EXPLORER',
        }
      : { id: '', name: null, username: null, image: null, curatorLevel: 'EXPLORER' },
    trendScore: r.score,
    isViral: r.badge === 'viral',
  });
  const trending = results.slice(0, TRENDING_LIMIT).map(toCard);
  const viralSpotlight = results.find((r) => r.badge === 'viral');
  return {
    trending,
    viral: viralSpotlight ? toCard(viralSpotlight) : null,
  };
}

async function getTopCurators(
  prisma: PrismaClient,
  categoryId: string
): Promise<CategoryCuratorCard[]> {
  const creators = await prisma.lists.groupBy({
    by: ['userId'],
    where: { categoryId, isActive: true, isPublic: true },
    _count: { id: true },
    _sum: { saveCount: true, likeCount: true },
  });

  if (creators.length === 0) return [];

  const userIds = creators.map((c) => c.userId);
  const [users, followCounts] = await Promise.all([
    prisma.users.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        curatorLevel: true,
      },
    }),
    prisma.follows.groupBy({
      by: ['followingId'],
      where: { followingId: { in: userIds } },
      _count: { followingId: true },
    }),
  ]);

  const followMap: Record<string, number> = {};
  followCounts.forEach((f) => {
    followMap[f.followingId] = f._count.followingId;
  });

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const withScore = creators
    .map((c) => {
      const user = userMap[c.userId];
      if (!user) return null;
      const totalSaves = c._sum.saveCount ?? 0;
      const totalLikes = c._sum.likeCount ?? 0;
      const score = totalSaves * 3 + totalLikes * 2 + (c._count.id * 10);
      return {
        ...user,
        listCount: c._count.id,
        totalSaves,
        totalLikes,
        followersCount: followMap[c.userId] ?? 0,
        score,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return withScore
    .sort((a, b) => b.score - a.score)
    .slice(0, CURATORS_LIMIT)
    .map((c) => ({
      id: c.id,
      name: c.name,
      username: c.username,
      image: c.image,
      curatorLevel: c.curatorLevel,
      listCount: c.listCount,
      totalSaves: c.totalSaves,
      totalLikes: c.totalLikes,
      followersCount: c.followersCount,
    }));
}

async function getNewLists(
  prisma: PrismaClient,
  categoryId: string
): Promise<CategoryListCard[]> {
  const lists = await prisma.lists.findMany({
    where: {
      categoryId,
      isActive: true,
      isPublic: true,
      users: { role: { not: 'USER' } },
    },
    orderBy: { createdAt: 'desc' },
    take: NEW_LISTS_LIMIT,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      saveCount: true,
      likeCount: true,
      itemCount: true,
      badge: true,
      users: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          curatorLevel: true,
        },
      },
    },
  });

  return lists.map((l) => ({
    id: l.id,
    title: l.title,
    slug: l.slug,
    description: l.description,
    coverImage: l.coverImage,
    saveCount: l.saveCount ?? 0,
    likeCount: l.likeCount ?? 0,
    itemCount: l.itemCount ?? 0,
    badge: l.badge,
    creator: l.users
      ? {
          id: l.users.id,
          name: l.users.name,
          username: l.users.username,
          image: l.users.image,
          curatorLevel: l.users.curatorLevel,
        }
      : { id: '', name: null, username: null, image: null, curatorLevel: 'EXPLORER' },
  }));
}

export async function getCategoryPageData(
  prisma: PrismaClient,
  categoryId: string
): Promise<CategoryPageData> {
  const [{ category, metrics }, { trending, viral }, topCurators, newLists] =
    await Promise.all([
      getCategoryAndMetrics(prisma, categoryId),
      getTrendingAndViralLists(prisma, categoryId),
      getTopCurators(prisma, categoryId),
      getNewLists(prisma, categoryId),
    ]);

  return {
    category,
    metrics,
    trendingLists: trending,
    viralSpotlight: viral,
    topCurators,
    newLists,
  };
}

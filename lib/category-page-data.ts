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
  CategoryItemCard,
  CityBreakdown,
} from '@/types/category-page';
import { getTrendingByCategory } from '@/lib/trending/service';
import { LOCATION_CITIES } from '@/types/category-page';

const RECENT_DAYS = 7;
const VIRAL_LIKE_THRESHOLD = 50;
const TRENDING_LIMIT = 6;
const CURATORS_LIMIT = 4;
const NEW_LISTS_LIMIT = 4;
const TOP_SAVED_LIMIT = 6;
const TRENDING_24H_LIMIT = 10;
const MOST_DEBATED_LIMIT = 6;
const MOST_SAVED_ITEMS_LIMIT = 5;

/** استخراج شهر از عنوان یا تگ‌ها */
function extractCity(title: string, tags: string[] = []): string | null {
  const text = `${title} ${tags.join(' ')}`;
  for (const city of LOCATION_CITIES) {
    if (text.includes(city)) return city;
  }
  return null;
}

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
  const lastWeekStart = new Date(Date.now() - RECENT_DAYS * 2 * 24 * 60 * 60 * 1000);
  const bookmarksWhere = {
    lists: { categoryId, isActive: true, isPublic: true },
  };

  const [category, listCount, itemCount, weeklySaves, viralCount, curatorCount, lastWeekSaves, uniqueTags] =
    await Promise.all([
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
    prisma.lists.groupBy({
      by: ['userId'],
      where: { categoryId, isActive: true, isPublic: true, users: { role: { not: 'USER' } } },
      _count: { userId: true },
    }).then((r) => r.length),
    prisma.bookmarks.count({
      where: {
        ...bookmarksWhere,
        createdAt: { gte: lastWeekStart, lt: cutoff },
      },
    }),
    prisma.lists.findMany({
      where: { categoryId, isActive: true, isPublic: true },
      select: { tags: true },
    }).then((lists) => {
      const allTags = new Set<string>();
      for (const l of lists) {
        for (const t of l.tags ?? []) {
          if (t && typeof t === 'string') allTags.add(t.trim());
        }
      }
      return allTags.size;
    }),
  ]);

  const weeklyGrowthPercent =
    lastWeekSaves > 0
      ? Math.round(((weeklySaves - lastWeekSaves) / lastWeekSaves) * 100)
      : weeklySaves > 0
        ? 100
        : 0;

  return {
    category: toCategoryInfo(category),
    metrics: {
      totalLists: listCount,
      totalItems: itemCount,
      weeklySaveCount: weeklySaves,
      viralCount,
      totalCuratorsCount: curatorCount,
      weeklyGrowthPercent,
      genreCount: uniqueTags > 0 ? uniqueTags : 14,
    },
  };
}

async function getTrendingAndViralLists(
  prisma: PrismaClient,
  categoryId: string
): Promise<{ trending: CategoryListCard[]; viral: CategoryListCard | null }> {
  const results = await getTrendingByCategory(prisma, categoryId, TRENDING_LIMIT + 5);
  const listIds = results.map((r) => r.listId);
  const [listsWithTags, commentCounts] = listIds.length > 0
    ? await Promise.all([
        prisma.lists.findMany({
          where: { id: { in: listIds } },
          select: { id: true, tags: true },
        }),
        prisma.list_comments.groupBy({
          by: ['listId'],
          where: { listId: { in: listIds } },
          _count: { listId: true },
        }),
      ])
    : [[], []];
  const tagsMap = Object.fromEntries(listsWithTags.map((l) => [l.id, l.tags ?? []]));
  const commentMap = Object.fromEntries(commentCounts.map((c) => [c.listId, c._count.listId]));
  const toCard = (r: (typeof results)[0]): CategoryListCard => {
    const tags = tagsMap[r.listId] ?? [];
    return {
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
      tags: tags.length > 0 ? tags : undefined,
      cityTag: extractCity(r.title, tags),
      commentCount: commentMap[r.listId],
    };
  };
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
    where: { categoryId, isActive: true, isPublic: true, users: { role: { not: 'USER' } } },
    _count: { id: true },
    _sum: { saveCount: true, likeCount: true },
  });

  if (creators.length === 0) return [];

  const listIds = await prisma.lists.findMany({
    where: { categoryId, userId: { in: creators.map((c) => c.userId) } },
    select: { id: true, userId: true },
  });
  const cutoff = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
  const weeklySavesByList = await prisma.bookmarks.groupBy({
    by: ['listId'],
    where: { listId: { in: listIds.map((l) => l.id) }, createdAt: { gte: cutoff } },
    _count: { listId: true },
  });
  const listToUser = Object.fromEntries(listIds.map((l) => [l.id, l.userId]));
  const savesByUser: Record<string, number> = {};
  weeklySavesByList.forEach((s) => {
    const uid = listToUser[s.listId];
    if (uid) savesByUser[uid] = (savesByUser[uid] ?? 0) + s._count.listId;
  });

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
      savesThisWeek: savesByUser[c.id] ?? 0,
    }));
}

async function getTrending24h(
  prisma: PrismaClient,
  categoryId: string
): Promise<CategoryListCard[]> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const saves = await prisma.bookmarks.groupBy({
    by: ['listId'],
    where: {
      createdAt: { gte: cutoff },
      lists: { categoryId, isActive: true, isPublic: true, users: { role: { not: 'USER' } } },
    },
    _count: { listId: true },
    orderBy: { _count: { listId: 'desc' } },
  });
  if (saves.length === 0) return [];
  const listIds = saves.slice(0, TRENDING_24H_LIMIT).map((s) => s.listId);
  const lists = await prisma.lists.findMany({
    where: { id: { in: listIds } },
    select: {
      id: true, title: true, slug: true, description: true, coverImage: true,
      saveCount: true, likeCount: true, itemCount: true, badge: true, tags: true,
      users: { select: { id: true, name: true, username: true, image: true, curatorLevel: true } },
    },
  });
  const saves24hMap = Object.fromEntries(saves.map((s) => [s.listId, s._count.listId]));
  return lists.map((l) => {
    const s24 = saves24hMap[l.id] ?? 0;
    const growthPercent = s24 > 0 ? Math.min(99, 8 + s24 * 4) : 0;
    return {
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
        ? { id: l.users.id, name: l.users.name, username: l.users.username, image: l.users.image, curatorLevel: l.users.curatorLevel ?? 'EXPLORER' }
        : { id: '', name: null, username: null, image: null, curatorLevel: 'EXPLORER' },
      tags: (l.tags ?? []).length > 0 ? l.tags ?? [] : undefined,
      cityTag: extractCity(l.title, l.tags ?? []),
      saves24h: s24,
      growthPercent,
    };
  });
}

async function getTopCuratorWithLists(
  prisma: PrismaClient,
  categoryId: string
): Promise<CategoryCuratorCard | null> {
  const curators = await getTopCurators(prisma, categoryId);
  if (curators.length === 0) return null;
  const top = curators[0];
  const topLists = await prisma.lists.findMany({
    where: { userId: top.id, categoryId, isActive: true, isPublic: true },
    orderBy: { saveCount: 'desc' },
    take: 3,
    select: {
      id: true, title: true, slug: true, description: true, coverImage: true,
      saveCount: true, likeCount: true, itemCount: true, badge: true, tags: true,
      users: { select: { id: true, name: true, username: true, image: true, curatorLevel: true } },
    },
  });
  return {
    ...top,
    topLists: topLists.map((l) => ({
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
        ? { id: l.users.id, name: l.users.name, username: l.users.username, image: l.users.image, curatorLevel: l.users.curatorLevel ?? 'EXPLORER' }
        : { id: '', name: null, username: null, image: null, curatorLevel: 'EXPLORER' },
      cityTag: extractCity(l.title, l.tags ?? []),
    })),
  };
}

async function getTopSavedThisWeek(
  prisma: PrismaClient,
  categoryId: string,
  limit: number = TOP_SAVED_LIMIT
): Promise<CategoryListCard[]> {
  const cutoff = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
  const saves = await prisma.bookmarks.groupBy({
    by: ['listId'],
    where: {
      createdAt: { gte: cutoff },
      lists: { categoryId, isActive: true, isPublic: true, users: { role: { not: 'USER' } } },
    },
    _count: { listId: true },
    orderBy: { _count: { listId: 'desc' } },
  });
  if (saves.length === 0) return [];
  const listIds = saves.slice(0, limit).map((s) => s.listId);
  const lists = await prisma.lists.findMany({
    where: { id: { in: listIds } },
    select: {
      id: true, title: true, slug: true, description: true, coverImage: true,
      saveCount: true, likeCount: true, itemCount: true, badge: true, tags: true,
      users: { select: { id: true, name: true, username: true, image: true, curatorLevel: true } },
    },
  });
  const orderMap = Object.fromEntries(listIds.map((id, i) => [id, i]));
  const savesMap = Object.fromEntries(saves.map((s) => [s.listId, s._count.listId]));
  return lists
    .sort((a, b) => (orderMap[a.id] ?? 99) - (orderMap[b.id] ?? 99))
    .map((l) => ({
      id: l.id, title: l.title, slug: l.slug, description: l.description, coverImage: l.coverImage,
      saveCount: l.saveCount ?? 0, likeCount: l.likeCount ?? 0, itemCount: l.itemCount ?? 0,
      badge: l.badge,
      creator: l.users
        ? { id: l.users.id, name: l.users.name, username: l.users.username, image: l.users.image, curatorLevel: l.users.curatorLevel ?? 'EXPLORER' }
        : { id: '', name: null, username: null, image: null, curatorLevel: 'EXPLORER' },
      tags: (l.tags ?? []).length > 0 ? l.tags ?? [] : undefined,
      cityTag: extractCity(l.title, l.tags ?? []),
      saves24h: savesMap[l.id],
    }));
}

async function getCityBreakdown(
  prisma: PrismaClient,
  categoryId: string
): Promise<CityBreakdown[]> {
  const lists = await prisma.lists.findMany({
    where: { categoryId, isActive: true, isPublic: true, users: { role: { not: 'USER' } } },
    select: {
      id: true, title: true, slug: true, description: true, coverImage: true,
      saveCount: true, likeCount: true, itemCount: true, badge: true, tags: true,
      users: { select: { id: true, name: true, username: true, image: true, curatorLevel: true } },
    },
  });
  const byCity: Record<string, typeof lists> = {};
  for (const l of lists) {
    const city = extractCity(l.title, l.tags ?? []);
    const key = city ?? 'سایر';
    if (!byCity[key]) byCity[key] = [];
    byCity[key].push(l);
  }
  const result: CityBreakdown[] = [];
  for (const city of LOCATION_CITIES) {
    const cityLists = byCity[city];
    if (!cityLists || cityLists.length === 0) continue;
    const sorted = [...cityLists].sort((a, b) => (b.saveCount ?? 0) - (a.saveCount ?? 0));
    result.push({
      city,
      listCount: cityLists.length,
      sampleLists: sorted.slice(0, 3).map((l) => ({
        id: l.id, title: l.title, slug: l.slug, description: l.description, coverImage: l.coverImage,
        saveCount: l.saveCount ?? 0, likeCount: l.likeCount ?? 0, itemCount: l.itemCount ?? 0,
        badge: l.badge,
        creator: l.users
          ? { id: l.users.id, name: l.users.name, username: l.users.username, image: l.users.image, curatorLevel: l.users.curatorLevel ?? 'EXPLORER' }
          : { id: '', name: null, username: null, image: null, curatorLevel: 'EXPLORER' },
        tags: (l.tags ?? []).length > 0 ? l.tags ?? [] : undefined,
        cityTag: city,
      })),
    });
  }
  return result;
}

async function getPopularAllTime(
  prisma: PrismaClient,
  categoryId: string,
  limit: number = 6
): Promise<CategoryListCard[]> {
  const lists = await prisma.lists.findMany({
    where: {
      categoryId,
      isActive: true,
      isPublic: true,
      users: { role: { not: 'USER' } },
    },
    orderBy: { saveCount: 'desc' },
    take: limit,
    select: {
      id: true, title: true, slug: true, description: true, coverImage: true,
      saveCount: true, likeCount: true, itemCount: true, badge: true, tags: true,
      users: { select: { id: true, name: true, username: true, image: true, curatorLevel: true } },
    },
  });
  return lists.map((l) => ({
    id: l.id, title: l.title, slug: l.slug, description: l.description, coverImage: l.coverImage,
    saveCount: l.saveCount ?? 0, likeCount: l.likeCount ?? 0, itemCount: l.itemCount ?? 0,
    badge: l.badge,
    creator: l.users
      ? { id: l.users.id, name: l.users.name, username: l.users.username, image: l.users.image, curatorLevel: l.users.curatorLevel ?? 'EXPLORER' }
      : { id: '', name: null, username: null, image: null, curatorLevel: 'EXPLORER' },
    tags: (l.tags ?? []).length > 0 ? l.tags ?? [] : undefined,
    cityTag: extractCity(l.title, l.tags ?? []),
  }));
}

async function getMostDebatedLists(
  prisma: PrismaClient,
  categoryId: string
): Promise<CategoryListCard[]> {
  const cutoff = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
  const commented = await prisma.list_comments.groupBy({
    by: ['listId'],
    where: {
      createdAt: { gte: cutoff },
      lists: { categoryId, isActive: true, isPublic: true, users: { role: { not: 'USER' } } },
    },
    _count: { listId: true },
  });
  const sorted = commented.sort((a, b) => b._count.listId - a._count.listId);
  if (sorted.length === 0) return [];
  const listIds = sorted.slice(0, MOST_DEBATED_LIMIT).map((c) => c.listId);
  const lists = await prisma.lists.findMany({
    where: { id: { in: listIds } },
    select: {
      id: true, title: true, slug: true, description: true, coverImage: true,
      saveCount: true, likeCount: true, itemCount: true, badge: true, tags: true,
      users: { select: { id: true, name: true, username: true, image: true, curatorLevel: true } },
    },
  });
  const commentCountMap = Object.fromEntries(sorted.map((c) => [c.listId, c._count.listId]));
  const orderMap = Object.fromEntries(listIds.map((id, i) => [id, i]));
  return lists
    .sort((a, b) => (orderMap[a.id] ?? 99) - (orderMap[b.id] ?? 99))
    .map((l) => ({
      id: l.id, title: l.title, slug: l.slug, description: l.description, coverImage: l.coverImage,
      saveCount: l.saveCount ?? 0, likeCount: l.likeCount ?? 0, itemCount: l.itemCount ?? 0,
      badge: l.badge,
      creator: l.users
        ? { id: l.users.id, name: l.users.name, username: l.users.username, image: l.users.image, curatorLevel: l.users.curatorLevel ?? 'EXPLORER' }
        : { id: '', name: null, username: null, image: null, curatorLevel: 'EXPLORER' },
      tags: (l.tags ?? []).length > 0 ? l.tags ?? [] : undefined,
      cityTag: extractCity(l.title, l.tags ?? []),
      commentCount: commentCountMap[l.id] ?? 0,
    }));
}

async function getMostSavedItems(
  prisma: PrismaClient,
  categoryId: string
): Promise<CategoryItemCard[]> {
  const topLists = await prisma.lists.findMany({
    where: {
      categoryId,
      isActive: true,
      isPublic: true,
      items: { some: {} },
    },
    orderBy: { saveCount: 'desc' },
    take: 6,
    select: {
      slug: true,
      title: true,
      items: {
        orderBy: { order: 'asc' },
        take: 1,
        select: { id: true, title: true, imageUrl: true },
      },
    },
  });
  const result: CategoryItemCard[] = [];
  for (const list of topLists) {
    const item = list.items[0];
    if (item && result.length < MOST_SAVED_ITEMS_LIMIT) {
      result.push({
        id: item.id,
        title: item.title,
        imageUrl: item.imageUrl,
        listSlug: list.slug,
        listTitle: list.title,
      });
    }
  }
  return result;
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
      tags: true,
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
          curatorLevel: l.users.curatorLevel ?? 'EXPLORER',
        }
      : { id: '', name: null, username: null, image: null, curatorLevel: 'EXPLORER' },
    tags: (l.tags ?? []).length > 0 ? l.tags ?? [] : undefined,
    cityTag: extractCity(l.title, l.tags ?? []),
  }));
}

export async function getCategoryPageData(
  prisma: PrismaClient,
  categoryId: string
): Promise<CategoryPageData> {
  const [
    { category, metrics },
    { trending, viral },
    topCurators,
    newLists,
    trending24h,
    topCuratorSpotlight,
    popularAllTime,
    topSavedThisWeek,
    cityBreakdown,
    mostDebatedLists,
    mostSavedItems,
  ] = await Promise.all([
    getCategoryAndMetrics(prisma, categoryId),
    getTrendingAndViralLists(prisma, categoryId),
    getTopCurators(prisma, categoryId),
    getNewLists(prisma, categoryId),
    getTrending24h(prisma, categoryId),
    getTopCuratorWithLists(prisma, categoryId),
    getPopularAllTime(prisma, categoryId, 6),
    getTopSavedThisWeek(prisma, categoryId, TOP_SAVED_LIMIT),
    getCityBreakdown(prisma, categoryId),
    getMostDebatedLists(prisma, categoryId),
    getMostSavedItems(prisma, categoryId),
  ]);

  return {
    category,
    metrics,
    trendingLists: trending,
    trendingNow24h: trending24h,
    topSavedThisWeek,
    viralSpotlight: viral,
    topCurators,
    topCuratorSpotlight,
    newLists,
    popularAllTime,
    cityBreakdown,
    mostDebatedLists,
    mostSavedItems,
  };
}

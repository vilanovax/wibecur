import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getGlobalTrending, getFastRising, type TrendingListResult } from '@/lib/trending/service';
import { resolveListCover } from '@/lib/resolve-list-cover';
import { computeTrendScore } from './utils';
import type { CuratedCategory, CuratedList, CuratorBadge, ListBadge } from '@/types/curated';
import type { CuratorLevelKey } from '@/lib/curator';
import { getLevelConfig } from '@/lib/curator';

const EXPLORE_LIST_LIMIT = 50;

type DbListRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  categoryId: string | null;
  isFeatured: boolean;
  badge: string | null;
  saveCount: number;
  likeCount: number;
  itemCount: number;
  createdAt: Date;
  categories: {
    id: string;
    name: string;
    slug: string | null;
    icon: string | null;
  } | null;
  users: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    curatorLevel?: string | null;
  } | null;
  _count?: { items: number; list_likes: number };
};

export type ExplorePayload = {
  lists: CuratedList[];
  categories: CuratedCategory[];
  preferredCategoryIds: string[];
  bookmarkedListIds: string[];
};

function curatorLevelTitle(level?: string | null): string {
  if (!level) return 'اکسپلورر';
  return getLevelConfig(level as CuratorLevelKey).short;
}

function curatorBadges(level?: string | null): CuratorBadge[] {
  if (!level) return [];
  const badges: CuratorBadge[] = [];
  if (level === 'ELITE_CURATOR' || level === 'VIBE_LEGEND') badges.push('elite');
  if (
    level === 'INFLUENTIAL_CURATOR' ||
    level === 'TRUSTED_CURATOR' ||
    level === 'ELITE_CURATOR' ||
    level === 'VIBE_LEGEND'
  ) {
    badges.push('top');
  }
  return badges;
}

function listBadgesFromMeta(
  row: { isFeatured?: boolean; badge?: string | null },
  meta?: { trending?: boolean; rising?: boolean }
): ListBadge[] {
  const badges: ListBadge[] = [];
  if (meta?.trending) badges.push('trending');
  if (meta?.rising) badges.push('rising');
  if (row.isFeatured) badges.push('featured');
  const raw = row.badge?.toLowerCase();
  if (raw === 'trending' && !badges.includes('trending')) badges.push('trending');
  if (raw === 'rising' && !badges.includes('rising')) badges.push('rising');
  if (raw === 'featured' && !badges.includes('featured')) badges.push('featured');
  return badges;
}

function mapCategoryMeta(
  categories: DbListRow['categories']
): CuratedList['category'] {
  if (!categories) return null;
  return {
    name: categories.name,
    icon: categories.icon,
    slug: categories.slug,
  };
}

function mapDbListToCurated(
  row: DbListRow,
  meta?: { trending?: boolean; rising?: boolean; trendScore?: number; weeklyVelocity?: number }
): CuratedList {
  const itemsCount = row.itemCount ?? row._count?.items ?? 0;
  const savesCount = row.saveCount ?? 0;
  const likesCount = row.likeCount ?? row._count?.list_likes ?? 0;
  const createdAt = row.createdAt.toISOString();
  const creatorLevel = row.users?.curatorLevel;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.description,
    categoryId: row.categoryId ?? row.categories?.id ?? 'unknown',
    category: mapCategoryMeta(row.categories),
    coverUrl: resolveListCover({
      coverImage: row.coverImage,
      slug: row.slug,
      title: row.title,
      categories: row.categories,
    }),
    itemsCount,
    savesCount,
    likesCount,
    badges: listBadgesFromMeta(row, meta),
    creator: {
      id: row.users?.id ?? 'unknown',
      name: row.users?.name ?? 'کاربر',
      username: row.users?.username ?? 'user',
      avatarUrl: row.users?.image ?? null,
      levelTitle: curatorLevelTitle(creatorLevel),
      badges: curatorBadges(creatorLevel),
    },
    createdAt,
    trendScore: meta?.trendScore ?? computeTrendScore({ createdAt, savesLast7d: savesCount }),
    weeklyVelocity: meta?.weeklyVelocity ?? savesCount,
  };
}

function mapTrendingToCurated(t: TrendingListResult, rising = false): CuratedList {
  const createdAt = new Date().toISOString();
  const creatorLevel = t.creator?.curatorLevel;

  return {
    id: t.listId,
    slug: t.slug,
    title: t.title,
    subtitle: t.description ?? null,
    categoryId: t.categoryId ?? 'unknown',
    coverUrl: resolveListCover({
      coverImage: t.coverImage,
      slug: t.slug,
      title: t.title,
      categorySlug: t.categorySlug,
    }),
    itemsCount: t.itemCount ?? 0,
    savesCount: t.saveCount ?? 0,
    likesCount: t.likeCount ?? 0,
    badges: listBadgesFromMeta(
      { badge: rising ? 'rising' : 'trending' },
      { trending: !rising, rising }
    ),
    creator: {
      id: t.creator?.id ?? t.creatorId ?? 'unknown',
      name: t.creator?.name ?? 'کاربر',
      username: t.creator?.username ?? 'user',
      avatarUrl: t.creator?.image ?? null,
      levelTitle: curatorLevelTitle(creatorLevel),
      badges: curatorBadges(creatorLevel),
    },
    createdAt,
    trendScore: t.score ?? computeTrendScore({ createdAt, savesLast7d: t.saveCount }),
    weeklyVelocity: t.saveCount ?? 0,
  };
}

function mapCategories(
  rows: { id: string; name: string; slug: string | null; icon: string | null }[]
): CuratedCategory[] {
  return [
    { id: 'all', title: 'همه', icon: '📋' },
    ...rows.map((c) => ({
      id: c.id,
      slug: c.slug ?? undefined,
      title: c.name,
      icon: c.icon ?? '📁',
    })),
  ];
}

function enrichListCategory(
  list: CuratedList,
  categoriesRaw: { id: string; name: string; slug: string | null; icon: string | null }[]
): CuratedList {
  if (list.category?.name) return list;
  const cat = categoriesRaw.find((c) => c.id === list.categoryId);
  if (!cat) return list;
  return {
    ...list,
    category: { name: cat.name, icon: cat.icon, slug: cat.slug },
  };
}

async function fetchUserPreferences(userId: string) {
  const bookmarks = await dbQuery(() =>
    prisma.bookmarks.findMany({
      where: {
        userId,
        lists: {
          deletedAt: null,
          isActive: true,
        },
      },
      select: {
        listId: true,
        lists: { select: { categoryId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  );

  const categoryCount = new Map<string, number>();
  const bookmarkedListIds: string[] = [];

  for (const bookmark of bookmarks) {
    bookmarkedListIds.push(bookmark.listId);
    const categoryId = bookmark.lists?.categoryId;
    if (categoryId) {
      categoryCount.set(categoryId, (categoryCount.get(categoryId) ?? 0) + 1);
    }
  }

  const preferredCategoryIds = [...categoryCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  return { preferredCategoryIds, bookmarkedListIds };
}

async function fetchMissingLists(ids: string[]): Promise<DbListRow[]> {
  if (ids.length === 0) return [];

  return dbQuery(() =>
    prisma.lists.findMany({
      where: {
        id: { in: ids },
        isActive: true,
        isPublic: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        categoryId: true,
        badge: true,
        isFeatured: true,
        saveCount: true,
        likeCount: true,
        itemCount: true,
        createdAt: true,
        categories: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            curatorLevel: true,
          },
        },
        _count: { select: { items: true, list_likes: true } },
      },
    })
  );
}

/** دادهٔ اکسپلور از DB — برای API و SSR */
export async function fetchExploreData(userId?: string | null): Promise<ExplorePayload> {
  const [categoriesRaw, listsRaw, trendingRaw, risingRaw, userPrefs] = await Promise.all([
    dbQuery(() =>
      prisma.categories.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, icon: true },
        orderBy: { order: 'asc' },
      })
    ),
    dbQuery(() =>
      prisma.lists.findMany({
        where: {
          isActive: true,
          isPublic: true,
          users: { role: { not: 'USER' } },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          categoryId: true,
          badge: true,
          isFeatured: true,
          saveCount: true,
          likeCount: true,
          itemCount: true,
          createdAt: true,
          categories: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          users: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              curatorLevel: true,
            },
          },
          _count: { select: { items: true, list_likes: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { saveCount: 'desc' }],
        take: EXPLORE_LIST_LIMIT,
      })
    ),
    getGlobalTrending(prisma, 10),
    getFastRising(prisma, 10),
    userId ? fetchUserPreferences(userId) : Promise.resolve({ preferredCategoryIds: [], bookmarkedListIds: [] }),
  ]);

  const trendingIds = new Set(trendingRaw.map((t) => t.listId));
  const risingIds = new Set(risingRaw.map((r) => r.listId));
  const scoreById = new Map<string, number>();
  for (const t of trendingRaw) scoreById.set(t.listId, t.score);
  for (const r of risingRaw) {
    if (!scoreById.has(r.listId)) scoreById.set(r.listId, r.score);
  }

  const knownIds = new Set(listsRaw.map((l) => l.id));
  const extraIds = [...new Set([...trendingIds, ...risingIds])].filter((id) => !knownIds.has(id));
  const extraLists = await fetchMissingLists(extraIds);

  const byId = new Map<string, CuratedList>();

  for (const row of [...listsRaw, ...extraLists]) {
    byId.set(
      row.id,
      mapDbListToCurated(row, {
        trending: trendingIds.has(row.id),
        rising: risingIds.has(row.id),
        trendScore: scoreById.get(row.id),
        weeklyVelocity: row.saveCount,
      })
    );
  }

  for (const t of trendingRaw) {
    if (!byId.has(t.listId)) {
      byId.set(t.listId, mapTrendingToCurated(t, false));
    }
  }

  for (const r of risingRaw) {
    const existing = byId.get(r.listId);
    if (existing) {
      if (!existing.badges.includes('rising')) existing.badges.push('rising');
      existing.weeklyVelocity = Math.max(existing.weeklyVelocity ?? 0, r.saveCount);
    } else {
      byId.set(r.listId, mapTrendingToCurated(r, true));
    }
  }

  return {
    lists: [...byId.values()].map((list) => enrichListCategory(list, categoriesRaw)),
    categories: mapCategories(categoriesRaw),
    preferredCategoryIds: userPrefs.preferredCategoryIds,
    bookmarkedListIds: userPrefs.bookmarkedListIds,
  };
}

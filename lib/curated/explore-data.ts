import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  filterListsInActiveCategories,
  publicCuratedListWhere,
} from '@/lib/public-content-filters';
import { dbQuery } from '@/lib/db';
import type { TrendingListResult } from '@/lib/trending/service';
import {
  getCachedGlobalTrending,
  getCachedFastRising,
} from '@/lib/trending/cached';
import { fetchActiveCategoryIndex } from '@/lib/category-menu';
import { getPreferredCategoryIds, getPreferredKeywordIds } from '@/lib/user-interests';
import { resolveListCover } from '@/lib/resolve-list-cover';
import { computeTrendScore } from './utils';
import type { CuratedCategory, CuratedList, CuratorBadge, ListBadge } from '@/types/curated';
import type { CuratorLevelKey } from '@/lib/curator';
import { getLevelConfig } from '@/lib/curator';

const EXPLORE_LISTS_PER_CATEGORY = 8;
const EXPLORE_FEATURED_LIMIT = 12;

const exploreListSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  coverImage: true,
  horizontalImage: true,
  categoryId: true,
  badge: true,
  tags: true,
  isFeatured: true,
  saveCount: true,
  likeCount: true,
  itemCount: true,
  createdAt: true,
  categories: {
    select: { id: true, name: true, slug: true, icon: true, isActive: true },
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
} as const;

/**
 * Top-N lists per category + featured — 2 queries instead of N+1 findMany.
 * Window function picks ids; one findMany hydrates relations.
 */
async function fetchExploreListsPool(
  categoryIds: string[],
  extraListIds: string[] = []
): Promise<DbListRow[]> {
  const [rankedIds, featuredIds] = await Promise.all([
    categoryIds.length === 0
      ? Promise.resolve([] as { id: string }[])
      : dbQuery(() =>
          prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
            SELECT id FROM (
              SELECT
                l.id,
                ROW_NUMBER() OVER (
                  PARTITION BY l."categoryId"
                  ORDER BY l."isFeatured" DESC, l."saveCount" DESC, l."createdAt" DESC
                ) AS rn
              FROM lists l
              INNER JOIN users u ON u.id = l."userId"
              LEFT JOIN categories c ON c.id = l."categoryId"
              WHERE l."deletedAt" IS NULL
                AND l."isActive" = true
                AND l."isPublic" = true
                AND u.role::text <> 'USER'
                AND l."categoryId" IN (${Prisma.join(categoryIds)})
                AND (
                  l."categoryId" IS NULL
                  OR (c."isActive" = true AND c."deletedAt" IS NULL)
                )
            ) ranked
            WHERE rn <= ${EXPLORE_LISTS_PER_CATEGORY}
          `)
        ),
    dbQuery(() =>
      prisma.lists.findMany({
        where: { ...publicCuratedListWhere, isFeatured: true },
        select: { id: true },
        orderBy: { saveCount: 'desc' },
        take: EXPLORE_FEATURED_LIMIT,
      })
    ),
  ]);

  const allIds = [
    ...new Set([
      ...rankedIds.map((r) => r.id),
      ...featuredIds.map((f) => f.id),
      ...extraListIds,
    ]),
  ];
  if (allIds.length === 0) return [];

  const rows = await dbQuery(() =>
    prisma.lists.findMany({
      where: { id: { in: allIds }, ...publicCuratedListWhere },
      select: exploreListSelect,
    })
  );
  return rows as DbListRow[];
}

type DbListRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  horizontalImage: string | null;
  categoryId: string | null;
  isFeatured: boolean;
  badge: string | null;
  tags?: string[];
  saveCount: number;
  likeCount: number;
  itemCount: number;
  createdAt: Date;
  categories: {
    id: string;
    name: string;
    slug: string | null;
    icon: string | null;
    isActive: boolean;
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
  preferredKeywordIds: string[];
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
      horizontalImage: row.horizontalImage,
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
    tags: row.tags?.length ? row.tags : undefined,
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
      horizontalImage: t.horizontalImage,
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
  const [bookmarks, preferredKeywordIds, preferredCategoryIds] = await Promise.all([
    dbQuery(() =>
      prisma.bookmarks.findMany({
        where: {
          userId,
          lists: {
            deletedAt: null,
            isActive: true,
            OR: [
              { categoryId: null },
              { categories: { isActive: true, deletedAt: null } },
            ],
          },
        },
        select: { listId: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    ),
    getPreferredKeywordIds(userId),
    getPreferredCategoryIds(userId),
  ]);

  return {
    preferredKeywordIds,
    preferredCategoryIds,
    bookmarkedListIds: bookmarks.map((b) => b.listId),
  };
}

type ExploreBasePayload = Pick<ExplorePayload, 'lists' | 'categories'>;

/** Sync merge — missing trending/rising rows already included via pool extraListIds */
function mergeExploreLists(
  categoriesRaw: { id: string; name: string; slug: string | null; icon: string | null }[],
  listsRaw: DbListRow[],
  trendingRaw: TrendingListResult[],
  risingRaw: TrendingListResult[]
): ExploreBasePayload {
  const trendingIds = new Set(trendingRaw.map((t) => t.listId));
  const risingIds = new Set(risingRaw.map((r) => r.listId));
  const scoreById = new Map<string, number>();
  for (const t of trendingRaw) scoreById.set(t.listId, t.score);
  for (const r of risingRaw) {
    if (!scoreById.has(r.listId)) scoreById.set(r.listId, r.score);
  }

  const activeCategoryIdSet = new Set(categoriesRaw.map((c) => c.id));
  const visibleListRows = filterListsInActiveCategories(listsRaw);

  const byId = new Map<string, CuratedList>();

  for (const row of visibleListRows) {
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
    if (t.categoryId && !activeCategoryIdSet.has(t.categoryId)) continue;
    if (!byId.has(t.listId)) {
      byId.set(t.listId, mapTrendingToCurated(t, false));
    }
  }

  for (const r of risingRaw) {
    if (r.categoryId && !activeCategoryIdSet.has(r.categoryId)) continue;
    const existing = byId.get(r.listId);
    if (existing) {
      if (!existing.badges.includes('rising')) existing.badges.push('rising');
      existing.weeklyVelocity = Math.max(existing.weeklyVelocity ?? 0, r.saveCount);
    } else {
      byId.set(r.listId, mapTrendingToCurated(r, true));
    }
  }

  const lists = [...byId.values()]
    .filter((list) => {
      if (!list.categoryId || list.categoryId === 'unknown') return true;
      return activeCategoryIdSet.has(list.categoryId);
    })
    .map((list) => enrichListCategory(list, categoriesRaw));

  return {
    lists,
    categories: mapCategories(categoriesRaw),
  };
}

/** لیست‌ها + دسته‌ها — مستقل از کاربر؛ هر ۵ دقیقه یک‌بار */
async function fetchExploreBaseData(): Promise<ExploreBasePayload> {
  // دسته‌ها از کش مشترک + trending/rising موازی (async-parallel)
  const [categoryRows, trendingRaw, risingRaw] = await Promise.all([
    fetchActiveCategoryIndex(),
    getCachedGlobalTrending(10),
    getCachedFastRising(10),
  ]);

  const categoriesRaw = categoryRows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
  }));
  const categoryIds = categoriesRaw.map((c) => c.id);
  const extraListIds = [
    ...new Set([
      ...trendingRaw.map((t) => t.listId),
      ...risingRaw.map((r) => r.listId),
    ]),
  ];

  // Pool includes trending/rising ids → no second missing-lists waterfall
  const listsRaw = await fetchExploreListsPool(categoryIds, extraListIds);

  return mergeExploreLists(categoriesRaw, listsRaw, trendingRaw, risingRaw);
}

const getCachedExploreBase = unstable_cache(
  fetchExploreBaseData,
  ['explore-base-v27'],
  { revalidate: 300, tags: ['explore'] }
);

export type ExploreUserPreferences = Pick<
  ExplorePayload,
  'preferredKeywordIds' | 'preferredCategoryIds' | 'bookmarkedListIds'
>;

const EMPTY_EXPLORE_USER_PREFERENCES: ExploreUserPreferences = {
  preferredKeywordIds: [],
  preferredCategoryIds: [],
  bookmarkedListIds: [],
};

/** payload پایه (لیست‌ها + دسته‌ها) — per-request dedupe + کش بین‌درخواستی */
export const fetchExploreBasePayload: () => Promise<ExploreBasePayload> = cache(
  () => getCachedExploreBase()
);

/** ترجیحات کاربر — جدا از payload پایه برای lazy-load در کلاینت */
export async function fetchExploreUserPreferences(
  userId: string
): Promise<ExploreUserPreferences> {
  return fetchUserPreferences(userId);
}

export { EMPTY_EXPLORE_USER_PREFERENCES };

/** دادهٔ اکسپلور از DB — برای API و SSR */
export async function fetchExploreData(userId?: string | null): Promise<ExplorePayload> {
  const [base, userPrefs] = await Promise.all([
    getCachedExploreBase(),
    userId
      ? fetchUserPreferences(userId)
      : Promise.resolve({
          preferredKeywordIds: [] as string[],
          preferredCategoryIds: [] as string[],
          bookmarkedListIds: [] as string[],
        }),
  ]);

  return {
    ...base,
    preferredKeywordIds: userPrefs.preferredKeywordIds,
    preferredCategoryIds: userPrefs.preferredCategoryIds,
    bookmarkedListIds: userPrefs.bookmarkedListIds,
  };
}

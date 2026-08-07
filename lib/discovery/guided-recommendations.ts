/**
 * Orchestrator دستیار کشف — ترکیب trending، for-you، جستجو، tip لایف‌استایل
 */

import { Prisma, type PrismaClient } from '@prisma/client';
import { dbQuery } from '@/lib/db';
import { getHomeRecommendationsForUser } from '@/lib/home-recommendations';
import { getGlobalTrending } from '@/lib/trending/service';
import { getCachedGlobalTrending } from '@/lib/trending/cached';
import { buildPublicListSearchWhere } from '@/lib/public-list-search';
import { publicCuratedListWhere } from '@/lib/public-content-filters';
import { withResolvedListCovers } from '@/lib/resolve-list-cover';
import { resolveCoverImage } from '@/lib/resolve-cover-image';
import { normalizeSearchQuery, SEARCH_MIN_LENGTH } from '@/lib/list-search';
import { isLightweightListItem } from '@/lib/list-entry';
import { buildLightweightDisplayBody } from '@/lib/item-metadata-display';
import {
  buildGuidedHeadline,
  buildGuidedSearchPlan,
  rowTitleForQuery,
  type GuidedContext,
} from '@/lib/discovery/guided-intent';

export type GuidedListCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  saveCount: number;
  itemCount: number;
  category?: { name: string; icon?: string | null; slug?: string | null };
};

export type GuidedItemCard = {
  id: string;
  title: string;
  description: string | null;
  listSlug: string;
  listTitle: string;
};

export type GuidedResultRow = {
  id: string;
  title: string;
  type: 'lists' | 'items';
  lists?: GuidedListCard[];
  items?: GuidedItemCard[];
};

export type GuidedDiscoveryPayload = {
  headline: string;
  scenario: GuidedContext['scenario'];
  rows: GuidedResultRow[];
};

const LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  coverImage: true,
  saveCount: true,
  itemCount: true,
  categories: {
    select: { name: true, icon: true, slug: true },
  },
} as const;

function mapListRow(
  list: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    coverImage: string | null;
    saveCount: number | null;
    itemCount: number | null;
    categories: GuidedListCard['category'] | null;
  }
): GuidedListCard {
  return {
    id: list.id,
    slug: list.slug,
    title: list.title,
    description: list.description ?? '',
    coverImage: resolveCoverImage({
      coverImage: list.coverImage,
      categorySlug: list.categories?.slug,
      listSlug: list.slug,
      listTitle: list.title,
    }),
    saveCount: list.saveCount ?? 0,
    itemCount: list.itemCount ?? 0,
    category: list.categories ?? undefined,
  };
}

function listMatchesGuidedTopic(list: GuidedListCard, query: string): boolean {
  const title = list.title;
  const slug = list.slug.toLowerCase();

  switch (query) {
    case 'سریال':
      return (
        title.includes('سریال') ||
        slug.includes('series') ||
        slug.includes('serial') ||
        slug.includes('tv-')
      );
    case 'فیلم':
      return (
        (title.includes('فیلم') || slug.includes('film') || slug.includes('movie')) &&
        !title.includes('سریال') &&
        !slug.includes('series')
      );
    case 'کتاب':
      return (
        title.includes('کتاب') ||
        slug.includes('book') ||
        list.category?.slug === 'book' ||
        list.category?.slug === 'books'
      );
    case 'کافه':
      return title.includes('کافه') || slug.includes('cafe') || slug.includes('coffee');
    case 'رستوران':
      return title.includes('رستوران') || slug.includes('restaurant') || title.includes('غذا');
    default:
      return true;
  }
}

function refineListsForGuidedQuery(query: string, lists: GuidedListCard[]): GuidedListCard[] {
  return lists.filter((list) => listMatchesGuidedTopic(list, query));
}

const GUIDED_CATEGORY_SLUGS: Record<string, string[]> = {
  کتاب: ['book', 'books', 'podcast', 'podcasts'],
  کافه: ['cafe', 'coffee'],
  رستوران: ['restaurant', 'cafe'],
  فیلم: ['movie', 'movies', 'film', 'cinema', 'film-serial'],
  سریال: ['movie', 'movies', 'film', 'series', 'film-serial'],
};

async function fetchListsByCategorySlugs(
  prisma: PrismaClient,
  slugs: string[],
  limit: number,
  excludeIds: Set<string>,
  query: string
): Promise<GuidedListCard[]> {
  const lists = await dbQuery(() =>
    prisma.lists.findMany({
      where: {
        ...publicCuratedListWhere,
        categories: { slug: { in: slugs } },
        id: excludeIds.size > 0 ? { notIn: [...excludeIds] } : undefined,
      },
      select: LIST_SELECT,
      orderBy: [{ saveCount: 'desc' }, { createdAt: 'desc' }],
      take: limit * 3,
    })
  );

  return refineListsForGuidedQuery(
    query,
    withResolvedListCovers(lists).map(mapListRow)
  ).slice(0, limit);
}

async function searchListsByQuery(
  prisma: PrismaClient,
  query: string,
  limit: number,
  excludeIds: Set<string>
): Promise<GuidedListCard[]> {
  const q = normalizeSearchQuery(query);
  if (q.length < SEARCH_MIN_LENGTH) return [];

  const searchWhere: Prisma.listsWhereInput = {
    ...buildPublicListSearchWhere(q),
    id: excludeIds.size > 0 ? { notIn: [...excludeIds] } : undefined,
  };

  const lists = await dbQuery(() =>
    prisma.lists.findMany({
      where: searchWhere,
      select: LIST_SELECT,
      orderBy: [{ saveCount: 'desc' }, { createdAt: 'desc' }],
      take: limit * 3,
    })
  );

  const refined = refineListsForGuidedQuery(
    query,
    withResolvedListCovers(lists).map(mapListRow)
  );
  if (refined.length > 0) return refined.slice(0, limit);

  const slugs = GUIDED_CATEGORY_SLUGS[query];
  if (slugs?.length) {
    return fetchListsByCategorySlugs(prisma, slugs, limit, excludeIds, query);
  }

  return [];
}

async function fetchShortLists(
  prisma: PrismaClient,
  limit: number,
  maxItems: number,
  excludeIds: Set<string>
): Promise<GuidedListCard[]> {
  const lists = await dbQuery(() =>
    prisma.lists.findMany({
      where: {
        ...publicCuratedListWhere,
        itemCount: { lte: maxItems, gt: 0 },
        id: excludeIds.size > 0 ? { notIn: [...excludeIds] } : undefined,
      },
      select: LIST_SELECT,
      orderBy: [{ saveCount: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })
  );

  return withResolvedListCovers(lists).map(mapListRow);
}

async function fetchLifestyleTipItems(
  prisma: PrismaClient,
  limit: number
): Promise<GuidedItemCard[]> {
  const rows = await dbQuery(() =>
    prisma.items.findMany({
      where: {
        lists: {
          ...publicCuratedListWhere,
          categories: {
            isActive: true,
            deletedAt: null,
            OR: [
              { slug: { contains: 'lifestyle', mode: 'insensitive' } },
              { name: { contains: 'لایف', mode: 'insensitive' } },
            ],
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        metadata: true,
        listNote: true,
        lists: { select: { slug: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.max(limit * 4, 20),
    })
  );

  const picked: GuidedItemCard[] = [];
  for (const row of rows) {
    const item = {
      ...row,
      metadata:
        row.metadata != null && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : null,
    };
    if (!isLightweightListItem(item)) continue;
    const body = buildLightweightDisplayBody(item, { lifestyleMode: true });
    const title = row.title?.trim() || body.slice(0, 60);
    if (!title) continue;
    picked.push({
      id: row.id,
      title,
      description: body || row.description,
      listSlug: row.lists.slug,
      listTitle: row.lists.title,
    });
    if (picked.length >= limit) break;
  }

  return picked;
}

function trendingToListCards(
  trending: Awaited<ReturnType<typeof getGlobalTrending>>
): GuidedListCard[] {
  return trending.map((t) => ({
    id: t.listId,
    slug: t.slug,
    title: t.title,
    description: t.description ?? '',
    coverImage: resolveCoverImage({
      coverImage: t.coverImage,
      categorySlug: t.categorySlug,
      listSlug: t.slug,
      listTitle: t.title,
    }),
    saveCount: t.saveCount,
    itemCount: t.itemCount,
    category: t.categorySlug
      ? { name: t.categorySlug, slug: t.categorySlug, icon: null }
      : undefined,
  }));
}

export async function getGuidedDiscoveryResults(
  prisma: PrismaClient,
  ctx: GuidedContext,
  userId: string | null
): Promise<GuidedDiscoveryPayload> {
  const plan = buildGuidedSearchPlan(ctx);
  const usedListIds = new Set<string>();
  const rows: GuidedResultRow[] = [];

  const takeLists = (lists: GuidedListCard[], rowId: string, title: string) => {
    const fresh = lists.filter((l) => {
      if (usedListIds.has(l.id)) return false;
      usedListIds.add(l.id);
      return true;
    });
    if (fresh.length === 0) return;
    rows.push({ id: rowId, title, type: 'lists', lists: fresh });
  };

  if (plan.includeLifestyleTips && plan.lifestyleTipLimit > 0) {
    const tips = await fetchLifestyleTipItems(prisma, plan.lifestyleTipLimit);
    if (tips.length > 0) {
      rows.push({
        id: 'quick',
        title: ctx.scenario === 'bored' && ctx.timeBudget === '5' ? 'همین الان' : 'نکات سریع',
        type: 'items',
        items: tips,
      });
    }
  }

  for (const query of plan.listQueries) {
    const lists = await searchListsByQuery(prisma, query, 6, usedListIds);
    takeLists(lists, `search-${query}`, rowTitleForQuery(query));
  }

  if (plan.preferShortLists && plan.shortListMaxItems) {
    const shortLists = await fetchShortLists(prisma, 6, plan.shortListMaxItems, usedListIds);
    takeLists(shortLists, 'short', 'لیست‌های کوتاه');
  }

  if (plan.includeForYou) {
    const { lists, isPersonalized } = await getHomeRecommendationsForUser(prisma, userId, 6);
    const mapped = lists
      .filter((l) => !usedListIds.has(l.id))
      .slice(0, 6)
      .map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        description: l.description,
        coverImage: l.coverImage,
        saveCount: l.saveCount,
        itemCount: l.itemCount,
        category: l.categories
          ? {
              name: l.categories.name,
              icon: l.categories.icon,
              slug: l.categories.slug,
            }
          : undefined,
      }));
    for (const l of mapped) usedListIds.add(l.id);
    if (mapped.length > 0) {
      rows.push({
        id: 'foryou',
        title: isPersonalized ? 'برای تو' : 'محبوب در وایب',
        type: 'lists',
        lists: mapped,
      });
    }
  }

  if (plan.includeTrending) {
    // از نسخهٔ کش‌شده استفاده کن (۶۰۰ ثانیه) تا fan-out سنگین per-category تکرار نشود
    const trending = await getCachedGlobalTrending(6);
    const mapped = trendingToListCards(trending).filter((l) => !usedListIds.has(l.id));
    if (mapped.length > 0) {
      rows.push({
        id: 'trending',
        title: 'الان داغه',
        type: 'lists',
        lists: mapped.slice(0, 6),
      });
    }
  }

  return {
    headline: buildGuidedHeadline(ctx),
    scenario: ctx.scenario,
    rows,
  };
}

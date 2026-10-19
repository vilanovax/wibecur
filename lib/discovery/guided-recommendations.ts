/**
 * Orchestrator دستیار کشف — ترکیب trending، for-you، جستجو، tip لایف‌استایل
 */

import { unstable_cache } from 'next/cache';
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
  /** Kept empty — UI cards don't render list description (server-serialization) */
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
    description: '',
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

const FILM_CATEGORY_SLUGS = new Set([
  'movie',
  'movies',
  'film',
  'cinema',
  'film-serial',
  'series',
]);
const BOOK_CATEGORY_SLUGS = new Set(['book', 'books', 'podcast', 'podcasts']);
const CAFE_CATEGORY_SLUGS = new Set(['cafe', 'coffee', 'restaurant']);

/** Exported for unit tests — keep row-topic filtering in one place. */
export function listMatchesGuidedTopic(list: GuidedListCard, query: string): boolean {
  const title = list.title;
  const slug = list.slug.toLowerCase();
  const cat = list.category?.slug?.toLowerCase() ?? '';

  switch (query) {
    case 'سریال':
      if (BOOK_CATEGORY_SLUGS.has(cat) || CAFE_CATEGORY_SLUGS.has(cat)) return false;
      return (
        title.includes('سریال') ||
        slug.includes('series') ||
        slug.includes('serial') ||
        slug.includes('tv-')
      );
    case 'فیلم':
      if (BOOK_CATEGORY_SLUGS.has(cat) || CAFE_CATEGORY_SLUGS.has(cat)) return false;
      return (
        (title.includes('فیلم') || slug.includes('film') || slug.includes('movie')) &&
        !title.includes('سریال') &&
        !slug.includes('series')
      );
    case 'کتاب':
      // لیست فیلم/کافه حتی با کلمه «کتاب» در عنوان وارد ردیف کتاب نشود
      if (FILM_CATEGORY_SLUGS.has(cat) || CAFE_CATEGORY_SLUGS.has(cat)) return false;
      return (
        title.includes('کتاب') ||
        slug.includes('book') ||
        BOOK_CATEGORY_SLUGS.has(cat)
      );
    case 'کافه':
      if (BOOK_CATEGORY_SLUGS.has(cat) || FILM_CATEGORY_SLUGS.has(cat)) return false;
      return (
        title.includes('کافه') ||
        slug.includes('cafe') ||
        slug.includes('coffee') ||
        CAFE_CATEGORY_SLUGS.has(cat)
      );
    case 'رستوران':
      if (BOOK_CATEGORY_SLUGS.has(cat) || FILM_CATEGORY_SLUGS.has(cat)) return false;
      return (
        title.includes('رستوران') ||
        slug.includes('restaurant') ||
        title.includes('غذا') ||
        cat === 'restaurant' ||
        cat === 'cafe'
      );
    case 'سفر':
      if (FILM_CATEGORY_SLUGS.has(cat) || BOOK_CATEGORY_SLUGS.has(cat)) return false;
      return (
        title.includes('سفر') ||
        title.includes('گردش') ||
        slug.includes('travel') ||
        cat === 'travel' ||
        cat.includes('travel')
      );
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
  سفر: ['travel'],
};

/** Topics where indexed category lookup beats full-text search (going_out / with_friend). */
const CATEGORY_FIRST_QUERIES = new Set(Object.keys(GUIDED_CATEGORY_SLUGS));

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

async function searchListsByText(
  prisma: PrismaClient,
  query: string,
  limit: number,
  excludeIds: Set<string>
): Promise<GuidedListCard[]> {
  const q = normalizeSearchQuery(query);
  if (q.length < SEARCH_MIN_LENGTH || limit <= 0) return [];

  const searchWhere: Prisma.listsWhereInput = {
    ...buildPublicListSearchWhere(q),
    id: excludeIds.size > 0 ? { notIn: [...excludeIds] } : undefined,
  };

  const lists = await dbQuery(() =>
    prisma.lists.findMany({
      where: searchWhere,
      select: LIST_SELECT,
      orderBy: [{ saveCount: 'desc' }, { createdAt: 'desc' }],
      take: Math.max(limit * 3, 6),
    })
  );

  return refineListsForGuidedQuery(
    query,
    withResolvedListCovers(lists).map(mapListRow)
  ).slice(0, limit);
}

/**
 * Prefer category index for کافه/رستوران/فیلم/… (critical for «با دوستی؟» / going_out),
 * then top up with text search only if the category window is thin.
 */
async function searchListsByQuery(
  prisma: PrismaClient,
  query: string,
  limit: number,
  excludeIds: Set<string>
): Promise<GuidedListCard[]> {
  const slugs = GUIDED_CATEGORY_SLUGS[query];

  if (slugs?.length && CATEGORY_FIRST_QUERIES.has(query)) {
    const byCategory = await fetchListsByCategorySlugs(
      prisma,
      slugs,
      limit,
      excludeIds,
      query
    );
    if (byCategory.length >= limit) return byCategory;

    const used = new Set<string>([...excludeIds, ...byCategory.map((l) => l.id)]);
    const filler = await searchListsByText(
      prisma,
      query,
      limit - byCategory.length,
      used
    );
    return [...byCategory, ...filler].slice(0, limit);
  }

  const fromText = await searchListsByText(prisma, query, limit, excludeIds);
  if (fromText.length > 0) return fromText;

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
    const desc = (body || row.description || '').trim();
    picked.push({
      id: row.id,
      title,
      description: desc ? (desc.length > 160 ? `${desc.slice(0, 160)}…` : desc) : null,
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
    description: '',
    coverImage: resolveCoverImage({
      coverImage: t.coverImage,
      categorySlug: t.categorySlug,
      listSlug: t.slug,
      listTitle: t.title,
    }),
    saveCount: t.saveCount,
    itemCount: t.itemCount,
    category: t.categorySlug
      ? {
          // trending فقط slug دارد — name را خالی بگذار تا بج slug خام نشان ندهد
          name: '',
          slug: t.categorySlug,
          icon: null,
        }
      : undefined,
  }));
}

/**
 * Parallel fan-out (async-parallel) then assemble rows with dedupe.
 * Previously each query awaited sequentially → multi-second mood modal open.
 */
export async function getGuidedDiscoveryResults(
  prisma: PrismaClient,
  ctx: GuidedContext,
  userId: string | null
): Promise<GuidedDiscoveryPayload> {
  const plan = buildGuidedSearchPlan(ctx);

  const [tips, queryBuckets, shortLists, forYouResult, trending] = await Promise.all([
    plan.includeLifestyleTips && plan.lifestyleTipLimit > 0
      ? fetchLifestyleTipItems(prisma, plan.lifestyleTipLimit)
      : Promise.resolve([] as GuidedItemCard[]),
    Promise.all(
      plan.listQueries.map(async (query) => ({
        query,
        lists: await searchListsByQuery(prisma, query, 6, new Set()),
      }))
    ),
    plan.preferShortLists && plan.shortListMaxItems
      ? fetchShortLists(prisma, 6, plan.shortListMaxItems, new Set())
      : Promise.resolve([] as GuidedListCard[]),
    plan.includeForYou
      ? getHomeRecommendationsForUser(prisma, userId, 6)
      : Promise.resolve({ lists: [], isPersonalized: false }),
    plan.includeTrending
      ? getCachedGlobalTrending(6)
      : Promise.resolve([] as Awaited<ReturnType<typeof getCachedGlobalTrending>>),
  ]);

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

  if (tips.length > 0) {
    rows.push({
      id: 'quick',
      title: ctx.scenario === 'bored' && ctx.timeBudget === '5' ? 'همین الان' : 'نکات سریع',
      type: 'items',
      items: tips,
    });
  }

  for (const { query, lists } of queryBuckets) {
    takeLists(lists, `search-${query}`, rowTitleForQuery(query));
  }

  if (shortLists.length > 0) {
    takeLists(shortLists, 'short', 'لیست‌های کوتاه');
  }

  if (forYouResult.lists.length > 0) {
    const mapped = forYouResult.lists
      .filter((l) => !usedListIds.has(l.id))
      .slice(0, 6)
      .map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        description: '',
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
        title: forYouResult.isPersonalized ? 'برای تو' : 'محبوب در وایب',
        type: 'lists',
        lists: mapped,
      });
    }
  }

  if (trending.length > 0) {
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

/** Guest results — cross-request cache (personalized path stays uncached). */
export function getCachedGuidedDiscoveryResults(
  prisma: PrismaClient,
  ctx: GuidedContext,
  userId: string | null
): Promise<GuidedDiscoveryPayload> {
  if (userId) {
    return getGuidedDiscoveryResults(prisma, ctx, userId);
  }

  return unstable_cache(
    () => getGuidedDiscoveryResults(prisma, ctx, null),
    [
      'guided-discovery-v2',
      ctx.scenario,
      ctx.location ?? '',
      ctx.timeBudget ?? '',
    ],
    { revalidate: 120, tags: ['guided-discovery'] }
  )();
}

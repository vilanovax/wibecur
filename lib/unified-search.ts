import type { Prisma, PrismaClient } from '@prisma/client';
import { dbQuery } from '@/lib/db';
import { normalizeSearchQuery, SEARCH_MIN_LENGTH } from '@/lib/list-search';
import { buildPublicListSearchWhere } from '@/lib/public-list-search';
import { publicListWhere } from '@/lib/public-content-filters';
import { withResolvedListCovers } from '@/lib/resolve-list-cover';
import { resolveItemDisplayImage } from '@/lib/resolve-item-image';
import {
  buildItemSearchHaystack,
  buildItemSearchWhere,
  buildItemTitleSearchWhere,
  detectBroadQuery,
  expandSearchTerms,
  scoreItemForSearch,
  type SearchableItemFields,
  type SearchMatchTier,
  type SearchQueryIntent,
} from '@/lib/search-keywords';

export type UnifiedSearchItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryIcon: string | null;
  listSlug: string | null;
  listTitle: string | null;
  matchHint?: string | null;
  matchTier?: SearchMatchTier;
  relevanceScore?: number;
};

export type UnifiedSearchList = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  saveCount: number;
  itemCount: number;
  badge: string | null;
  categories: { name: string; icon: string | null; slug: string | null } | null;
  matchedItemTitle?: string | null;
  matchHint?: string | null;
  matchTier?: SearchMatchTier;
};

export type UnifiedSearchHasMore = {
  directItems: boolean;
  indirectItems: boolean;
  lists: boolean;
};

export type UnifiedSearchResult = {
  query: string;
  queryIntent: SearchQueryIntent;
  /** همه آیتم‌ها: مستقیم اول، بعد غیرمستقیم (سازگاری با کلاینت‌های قدیمی) */
  items: UnifiedSearchItem[];
  directItems: UnifiedSearchItem[];
  indirectItems: UnifiedSearchItem[];
  /** در حالت broad: بهترین پیشنهادها (حداکثر ۱۲) */
  topPicks: UnifiedSearchItem[];
  subThemes: string[];
  lists: UnifiedSearchList[];
  directLists: UnifiedSearchList[];
  indirectLists: UnifiedSearchList[];
  /** پیشنهادات مرتبط — ژانر/مشابه */
  relatedItems: UnifiedSearchItem[];
  /** alias برای سازگاری */
  similarItems: UnifiedSearchItem[];
  totals: { items: number; lists: number };
  hasMore: UnifiedSearchHasMore;
};

const itemListWhere: Prisma.listsWhereInput = {
  ...publicListWhere,
  isActive: true,
};

const itemModerationWhere: Prisma.itemsWhereInput = {
  OR: [{ item_moderation: null }, { item_moderation: { status: { notIn: ['HIDDEN', 'UNDER_REVIEW'] } } }],
};

type ItemRow = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  catalogItemId: string | null;
  metadata: unknown;
  rating: number | null;
  voteCount: number | null;
  lists: {
    title: string;
    description: string | null;
    slug: string;
    tags: string[];
    categories: { name: string; slug: string | null; icon: string | null } | null;
  } | null;
  catalog_items: {
    title: string;
    description: string | null;
    metadata: unknown;
  } | null;
};

const itemSelect = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  catalogItemId: true,
  metadata: true,
  rating: true,
  voteCount: true,
  lists: {
    select: {
      title: true,
      description: true,
      slug: true,
      tags: true,
      categories: { select: { name: true, slug: true, icon: true } },
    },
  },
  catalog_items: {
    select: {
      title: true,
      description: true,
      metadata: true,
    },
  },
} as const;

function toSearchableFields(row: ItemRow): SearchableItemFields {
  return {
    title: row.title,
    description: row.description,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    catalogTitle: row.catalog_items?.title ?? null,
    catalogDescription: row.catalog_items?.description ?? null,
    catalogMetadata: (row.catalog_items?.metadata as Record<string, unknown> | null) ?? null,
    listTitle: row.lists?.title ?? null,
    listDescription: row.lists?.description ?? null,
    listTags: row.lists?.tags ?? [],
    categoryName: row.lists?.categories?.name ?? null,
  };
}

function mapItemRow(
  row: ItemRow,
  scored?: { matchHint: string | null; matchTier: SearchMatchTier; score: number }
): UnifiedSearchItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: resolveItemDisplayImage({
      id: row.id,
      imageUrl: row.imageUrl,
      title: row.title,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      categorySlug: row.lists?.categories?.slug ?? null,
    }),
    categoryName: row.lists?.categories?.name ?? null,
    categorySlug: row.lists?.categories?.slug ?? null,
    categoryIcon: row.lists?.categories?.icon ?? null,
    listSlug: row.lists?.slug ?? null,
    listTitle: row.lists?.title ?? null,
    matchHint: scored?.matchHint ?? null,
    matchTier: scored?.matchTier,
    relevanceScore: scored?.score,
  };
}

function dedupeSearchItems<
  T extends { id: string; title: string; catalogItemId?: string | null; rating?: number | null },
>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const key = row.catalogItemId?.trim() || row.title.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function scoreAndRankRows(rows: ItemRow[], rawQuery: string) {
  const terms = expandSearchTerms(rawQuery);
  return dedupeSearchItems(rows)
    .map((row) => {
      const scored = scoreItemForSearch(toSearchableFields(row), rawQuery, terms);
      return { row, scored };
    })
    .filter((entry) => entry.scored.score > 0)
    .sort((a, b) => {
      if (b.scored.score !== a.scored.score) return b.scored.score - a.scored.score;
      if (a.scored.matchTier !== b.scored.matchTier) {
        return a.scored.matchTier === 'direct' ? -1 : 1;
      }
      return (b.row.rating ?? 0) - (a.row.rating ?? 0);
    });
}

function splitScoredItems(
  scored: ReturnType<typeof scoreAndRankRows>,
  directLimit: number,
  indirectLimit: number,
  directOffset = 0,
  indirectOffset = 0
) {
  const directScored = scored.filter((e) => e.scored.matchTier === 'direct');
  const indirectScored = scored.filter((e) => e.scored.matchTier === 'indirect');
  const direct = directScored.slice(directOffset, directOffset + directLimit);
  const indirect = indirectScored.slice(indirectOffset, indirectOffset + indirectLimit);
  const toItem = (e: (typeof scored)[number]) =>
    mapItemRow(e.row, {
      matchHint: e.scored.matchHint,
      matchTier: e.scored.matchTier,
      score: e.scored.score,
    });

  return {
    directItems: direct.map(toItem),
    indirectItems: indirect.map(toItem),
    items: [...direct, ...indirect].map(toItem),
    hasMore: {
      directItems: directScored.length > directOffset + directLimit,
      indirectItems: indirectScored.length > indirectOffset + indirectLimit,
    },
  };
}

async function fetchItemsFromMatchingLists(
  prisma: PrismaClient,
  q: string,
  take: number
): Promise<ItemRow[]> {
  const matchingLists = await dbQuery(() =>
    prisma.lists.findMany({
      where: buildPublicListSearchWhere(q),
      select: { id: true },
      orderBy: [{ saveCount: 'desc' }, { createdAt: 'desc' }],
      take: 32,
    })
  );

  if (matchingLists.length === 0) return [];

  return dbQuery(() =>
    prisma.items.findMany({
      where: {
        listId: { in: matchingLists.map((l) => l.id) },
        lists: itemListWhere,
        ...itemModerationWhere,
      },
      select: itemSelect,
      orderBy: [{ rating: 'desc' }, { voteCount: 'desc' }, { updatedAt: 'desc' }],
      take: take * 8,
    })
  );
}

const BROAD_TOP_PICKS_LIMIT = 10;
const FAST_TOP_PICKS_POOL = 40;

async function fetchTopPicks(prisma: PrismaClient, q: string, limit: number, fast = false) {
  const poolSize = fast ? FAST_TOP_PICKS_POOL : Math.max(limit * 10, 80);

  const [directRows, listContextRows] = await Promise.all([
    dbQuery(() =>
      prisma.items.findMany({
        where: buildItemSearchWhere(q, itemListWhere),
        select: itemSelect,
        take: poolSize,
      })
    ),
    fetchItemsFromMatchingLists(prisma, q, limit * 4),
  ]);

  const scored = scoreAndRankRows([...directRows, ...listContextRows], q).filter(
    (e) => e.scored.score > 0
  );

  const titleDirect = scored
    .filter((e) => e.scored.matchTier === 'direct' && e.scored.reason === 'title')
    .slice(0, Math.min(4, limit));

  const titleDirectIds = new Set(titleDirect.map((e) => e.row.id));

  const picks = scored
    .filter((e) => !titleDirectIds.has(e.row.id))
    .sort((a, b) => {
      if (b.scored.score !== a.scored.score) return b.scored.score - a.scored.score;
      return (b.row.rating ?? 0) - (a.row.rating ?? 0);
    })
    .slice(0, Math.max(0, limit - titleDirect.length));

  const toItem = (e: (typeof scored)[number]) =>
    mapItemRow(e.row, {
      matchHint: e.scored.matchHint,
      matchTier: e.scored.matchTier,
      score: e.scored.score,
    });

  return {
    titleDirect: titleDirect.map(toItem),
    topPicks: picks.map(toItem),
  };
}

async function fetchPublicItemsFast(
  prisma: PrismaClient,
  q: string,
  directLimit: number,
  directOffset = 0
) {
  const needed = directOffset + directLimit;
  const poolSize = Math.min(Math.max(needed * 3, 16), 36);

  const directRows = await dbQuery(() =>
    prisma.items.findMany({
      where: buildItemTitleSearchWhere(q, itemListWhere),
      select: itemSelect,
      orderBy: [{ voteCount: 'desc' }, { rating: 'desc' }],
      take: poolSize,
    })
  );

  let merged: ItemRow[] = directRows;
  let result = splitScoredItems(
    scoreAndRankRows(merged, q),
    directLimit,
    0,
    directOffset,
    0
  );

  if (result.directItems.length >= Math.min(directLimit, needed - directOffset)) {
    return result;
  }

  const listContextRows = await fetchItemsFromMatchingLists(prisma, q, needed);
  merged = dedupeSearchItems([...merged, ...listContextRows]);
  result = splitScoredItems(scoreAndRankRows(merged, q), directLimit, 0, directOffset, 0);

  if (result.directItems.length >= Math.min(directLimit, needed - directOffset)) {
    return result;
  }

  const fullRows = await dbQuery(() =>
    prisma.items.findMany({
      where: buildItemSearchWhere(q, itemListWhere),
      select: itemSelect,
      take: poolSize,
    })
  );
  merged = dedupeSearchItems([...merged, ...fullRows]);
  return splitScoredItems(scoreAndRankRows(merged, q), directLimit, 0, directOffset, 0);
}

async function fetchPublicItems(
  prisma: PrismaClient,
  q: string,
  directLimit: number,
  indirectLimit: number,
  directOffset = 0,
  indirectOffset = 0
) {
  const neededDirect = directOffset + directLimit;
  const neededIndirect = indirectOffset + indirectLimit;
  const poolSize = Math.max((neededDirect + neededIndirect) * 6, 48);

  const [directRows, listContextRows] = await Promise.all([
    dbQuery(() =>
      prisma.items.findMany({
        where: buildItemSearchWhere(q, itemListWhere),
        select: itemSelect,
        take: poolSize,
      })
    ),
    fetchItemsFromMatchingLists(prisma, q, neededDirect + neededIndirect),
  ]);

  return splitScoredItems(
    scoreAndRankRows([...directRows, ...listContextRows], q),
    directLimit,
    indirectLimit,
    directOffset,
    indirectOffset
  );
}

async function fetchSimilarItemsForAnchor(
  prisma: PrismaClient,
  anchorItemId: string,
  limit: number
): Promise<ItemRow[]> {
  const currentItem = await dbQuery(() =>
    prisma.items.findUnique({
      where: { id: anchorItemId },
      select: {
        id: true,
        metadata: true,
        catalog_items: { select: { metadata: true } },
        lists: { select: { categoryId: true, tags: true } },
      },
    })
  );

  const categoryId = currentItem?.lists?.categoryId ?? null;
  if (!categoryId) return [];

  const currentTags = currentItem?.lists?.tags ?? [];
  const tagSet = new Set(currentTags.map((t) => t.toLowerCase()));

  const meta = {
    ...((currentItem?.catalog_items?.metadata as Record<string, unknown> | null) ?? {}),
    ...((currentItem?.metadata as Record<string, unknown> | null) ?? {}),
  };
  const anchorGenre = typeof meta.genre === 'string' ? meta.genre.trim() : '';

  const candidates = await dbQuery(() =>
    prisma.items.findMany({
      where: {
        id: { not: anchorItemId },
        lists: { AND: [{ categoryId }, itemListWhere] },
        ...itemModerationWhere,
      },
      select: itemSelect,
      take: 24,
    })
  );

  const sharedTagCount = (tags: string[]) =>
    tags.filter((t) => tagSet.has(t.toLowerCase())).length;

  const genreMatch = (row: ItemRow) => {
    if (!anchorGenre) return 0;
    const rowMeta = {
      ...((row.catalog_items?.metadata as Record<string, unknown> | null) ?? {}),
      ...((row.metadata as Record<string, unknown> | null) ?? {}),
    };
    const g = typeof rowMeta.genre === 'string' ? rowMeta.genre.toLowerCase() : '';
    return g && g.includes(anchorGenre.toLowerCase().split(/[,،]/)[0] ?? '') ? 1 : 0;
  };

  return dedupeSearchItems(candidates)
    .sort((a, b) => {
      const aShared = sharedTagCount(a.lists?.tags ?? []);
      const bShared = sharedTagCount(b.lists?.tags ?? []);
      if (bShared !== aShared) return bShared - aShared;
      const aGenre = genreMatch(a);
      const bGenre = genreMatch(b);
      if (bGenre !== aGenre) return bGenre - aGenre;
      return (b.rating ?? 0) - (a.rating ?? 0);
    })
    .slice(0, limit);
}

async function fetchRelatedItems(
  prisma: PrismaClient,
  q: string,
  anchors: UnifiedSearchItem[],
  excludeKeys: Set<string>,
  limit: number
): Promise<UnifiedSearchItem[]> {
  const rows: ItemRow[] = [];
  const anchorIds = anchors
    .filter((a) => a.matchTier === 'direct')
    .slice(0, 3)
    .map((a) => a.id);

  for (const anchorId of anchorIds) {
    const sim = await fetchSimilarItemsForAnchor(prisma, anchorId, 6);
    rows.push(...sim);
  }

  const genrePool = await dbQuery(() =>
    prisma.items.findMany({
      where: buildItemSearchWhere(q, itemListWhere),
      select: itemSelect,
      orderBy: [{ rating: 'desc' }, { voteCount: 'desc' }],
      take: limit * 3,
    })
  );
  rows.push(...genrePool);

  const terms = expandSearchTerms(q);
  const scored = scoreAndRankRows(rows, q)
    .filter((e) => {
      const key = e.row.catalogItemId?.trim() || e.row.title.trim().toLowerCase();
      return !excludeKeys.has(key) && !anchorIds.includes(e.row.id);
    })
    .slice(0, limit);

  return scored.map((e) =>
    mapItemRow(e.row, {
      matchHint: e.scored.matchHint ?? 'پیشنهاد مرتبط',
      matchTier: 'indirect',
      score: e.scored.score,
    })
  );
}

function listDirectlyMatchesQuery(
  list: { title: string; description: string | null; categories: { name: string } | null; tags?: string[] },
  q: string,
  terms: string[]
): boolean {
  const haystack = [
    list.title,
    list.description ?? '',
    list.categories?.name ?? '',
    ...(list.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q.toLowerCase()) || terms.some((t) => haystack.includes(t));
}

async function attachMatchedItemTitles(
  prisma: PrismaClient,
  q: string,
  lists: UnifiedSearchList[]
): Promise<UnifiedSearchList[]> {
  if (lists.length === 0) return lists;

  const terms = expandSearchTerms(q);
  const qLower = q.toLowerCase();

  const needsHint = lists.filter((list) => !listDirectlyMatchesQuery(list, q, terms));
  if (needsHint.length === 0) return lists;

  const itemMatches = await dbQuery(() =>
    prisma.items.findMany({
      where: {
        listId: { in: needsHint.map((l) => l.id) },
        ...buildItemSearchWhere(q, {}),
      },
      select: {
        listId: true,
        title: true,
        description: true,
        metadata: true,
        catalog_items: {
          select: { title: true, description: true, metadata: true },
        },
        lists: {
          select: {
            tags: true,
            categories: { select: { name: true } },
          },
        },
      },
      take: needsHint.length * 4,
    })
  );

  const bestByListId = new Map<string, { title: string; hint: string | null; score: number }>();

  for (const row of itemMatches) {
    const fields: SearchableItemFields = {
      title: row.title,
      description: row.description,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      catalogTitle: row.catalog_items?.title ?? null,
      catalogDescription: row.catalog_items?.description ?? null,
      catalogMetadata: (row.catalog_items?.metadata as Record<string, unknown> | null) ?? null,
      listTags: row.lists?.tags ?? [],
      categoryName: row.lists?.categories?.name ?? null,
    };
    const scored = scoreItemForSearch(fields, q, terms);
    const prev = bestByListId.get(row.listId);
    if (!prev || scored.score > prev.score) {
      bestByListId.set(row.listId, {
        title: row.title,
        hint: scored.matchHint,
        score: scored.score,
      });
    }
  }

  return lists.map((list) => {
    const match = bestByListId.get(list.id);
    if (!match) return list;

    const titleHaystack = match.title.toLowerCase();
    const titleMatches =
      titleHaystack.includes(qLower) || terms.some((t) => titleHaystack.includes(t));

    return {
      ...list,
      matchedItemTitle: titleMatches ? match.title : null,
      matchHint: titleMatches ? match.hint : match.hint ?? `شامل: ${match.title}`,
    };
  });
}

function splitLists(
  lists: UnifiedSearchList[],
  q: string,
  terms: string[]
): { directLists: UnifiedSearchList[]; indirectLists: UnifiedSearchList[]; lists: UnifiedSearchList[] } {
  const withTier = lists.map((list) => ({
    ...list,
    matchTier: (listDirectlyMatchesQuery(list, q, terms) ? 'direct' : 'indirect') as SearchMatchTier,
  }));

  const directLists = withTier.filter((l) => l.matchTier === 'direct');
  const indirectLists = withTier.filter((l) => l.matchTier === 'indirect');

  return {
    directLists,
    indirectLists,
    lists: [...directLists, ...indirectLists],
  };
}

export async function unifiedSearch(
  prisma: PrismaClient,
  rawQuery: string,
  options?: {
    listLimit?: number;
    listOffset?: number;
    itemLimit?: number;
    directItemLimit?: number;
    directItemOffset?: number;
    indirectItemLimit?: number;
    indirectItemOffset?: number;
    similarLimit?: number;
    relatedLimit?: number;
    fast?: boolean;
  }
): Promise<UnifiedSearchResult> {
  const q = normalizeSearchQuery(rawQuery);
  const listLimit = Math.min(Math.max(options?.listLimit ?? 12, 0), 48);
  const listOffset = Math.max(options?.listOffset ?? 0, 0);
  const directItemLimit = Math.min(Math.max(options?.directItemLimit ?? options?.itemLimit ?? 8, 0), 48);
  const directItemOffset = Math.max(options?.directItemOffset ?? 0, 0);
  const indirectItemLimit = Math.min(Math.max(options?.indirectItemLimit ?? 12, 0), 48);
  const indirectItemOffset = Math.max(options?.indirectItemOffset ?? 0, 0);
  const relatedLimit = Math.min(
    Math.max(options?.relatedLimit ?? options?.similarLimit ?? 8, 0),
    16
  );
  const fast =
    options?.fast ??
    (listLimit <= 5 && indirectItemLimit === 0 && relatedLimit === 0 && directItemLimit <= 10);

  const needLists = listLimit > 0;
  const needItemCounts = !fast;

  const emptyHasMore: UnifiedSearchHasMore = {
    directItems: false,
    indirectItems: false,
    lists: false,
  };

  const empty: UnifiedSearchResult = {
    query: q,
    queryIntent: 'specific',
    items: [],
    directItems: [],
    indirectItems: [],
    topPicks: [],
    subThemes: [],
    lists: [],
    directLists: [],
    indirectLists: [],
    relatedItems: [],
    similarItems: [],
    totals: { items: 0, lists: 0 },
    hasMore: emptyHasMore,
  };

  if (q.length < SEARCH_MIN_LENGTH) return empty;

  const broad = detectBroadQuery(rawQuery);
  const queryIntent: SearchQueryIntent = broad.isBroad ? 'broad' : 'specific';
  const isBroad = queryIntent === 'broad';

  const searchWhere = buildPublicListSearchWhere(q);
  const itemWhere = buildItemSearchWhere(q, itemListWhere);

  const skipItemFetch =
    (directItemLimit === 0 && indirectItemLimit === 0 && !isBroad) ||
    (isBroad && (directItemOffset > 0 || indirectItemOffset > 0));

  const needItems = !skipItemFetch;

  const [itemBuckets, broadPicks, listRows, directItemTotal, listContextItemTotal, listTotal] =
    await Promise.all([
      !needItems
        ? Promise.resolve({
            directItems: [] as UnifiedSearchItem[],
            indirectItems: [] as UnifiedSearchItem[],
            items: [] as UnifiedSearchItem[],
            hasMore: { directItems: false, indirectItems: false },
          })
        : isBroad
          ? Promise.resolve(null)
          : fast && indirectItemLimit === 0
            ? fetchPublicItemsFast(
                prisma,
                q,
                directItemLimit,
                directItemOffset
              )
            : fetchPublicItems(
                prisma,
                q,
                directItemLimit,
                indirectItemLimit,
                directItemOffset,
                indirectItemOffset
              ),
      isBroad && needItems
        ? fetchTopPicks(prisma, q, BROAD_TOP_PICKS_LIMIT, fast)
        : Promise.resolve(null),
      needLists
        ? dbQuery(() =>
            prisma.lists.findMany({
              where: searchWhere,
              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                coverImage: true,
                saveCount: true,
                itemCount: true,
                badge: true,
                tags: true,
                categories: { select: { name: true, icon: true, slug: true } },
              },
              orderBy: [{ saveCount: 'desc' }, { createdAt: 'desc' }],
              skip: listOffset,
              take: fast ? listLimit : listLimit * 2,
            })
          )
        : Promise.resolve([]),
      needItemCounts
        ? dbQuery(() => prisma.items.count({ where: itemWhere }))
        : Promise.resolve(0),
      needItemCounts
        ? dbQuery(async () => {
            const matchingListIds = await prisma.lists.findMany({
              where: searchWhere,
              select: { id: true },
              take: 200,
            });
            if (matchingListIds.length === 0) return 0;
            return prisma.items.count({
              where: {
                listId: { in: matchingListIds.map((l) => l.id) },
                lists: itemListWhere,
                ...itemModerationWhere,
              },
            });
          })
        : Promise.resolve(0),
      needLists
        ? needItemCounts
          ? dbQuery(() => prisma.lists.count({ where: searchWhere }))
          : Promise.resolve(0)
        : Promise.resolve(0),
    ]);

  const terms = expandSearchTerms(q);

  const rankedLists = [...listRows]
    .sort((a, b) => {
      const aDirect = listDirectlyMatchesQuery(a, q, terms) ? 1 : 0;
      const bDirect = listDirectlyMatchesQuery(b, q, terms) ? 1 : 0;
      if (bDirect !== aDirect) return bDirect - aDirect;
      return (b.saveCount ?? 0) - (a.saveCount ?? 0);
    })
    .slice(0, listLimit);

  const listsBase = withResolvedListCovers(rankedLists).map((list) => ({
    id: list.id,
    title: list.title,
    slug: list.slug,
    description: list.description,
    coverImage: list.coverImage,
    saveCount: list.saveCount ?? 0,
    itemCount: list.itemCount ?? 0,
    badge: list.badge,
    categories: list.categories,
  }));

  const listsWithHints = fast
    ? listsBase
    : await attachMatchedItemTitles(prisma, q, listsBase);
  const listBuckets = splitLists(listsWithHints, q, terms);

  const resolvedItems = isBroad
    ? {
        directItems: broadPicks?.titleDirect ?? [],
        indirectItems: [] as UnifiedSearchItem[],
        topPicks: broadPicks?.topPicks ?? [],
        items: [
          ...(broadPicks?.titleDirect ?? []),
          ...(broadPicks?.topPicks ?? []),
        ],
        hasMore: { directItems: false, indirectItems: false },
      }
    : {
        directItems: itemBuckets!.directItems,
        indirectItems: itemBuckets!.indirectItems,
        topPicks: [] as UnifiedSearchItem[],
        items: itemBuckets!.items,
        hasMore: itemBuckets!.hasMore,
      };

  const excludeKeys = new Set(
    [...resolvedItems.directItems, ...resolvedItems.indirectItems, ...resolvedItems.topPicks].map(
      (i) => i.title.trim().toLowerCase()
    )
  );

  const relatedItems =
    !isBroad &&
    relatedLimit > 0 &&
    directItemOffset === 0 &&
    indirectItemOffset === 0
      ? await fetchRelatedItems(prisma, q, resolvedItems.directItems, excludeKeys, relatedLimit)
      : [];

  const listsHasMore = needItemCounts
    ? listOffset + listBuckets.lists.length < listTotal
    : listBuckets.lists.length >= listLimit;

  const itemTotal = needItemCounts
    ? Math.max(directItemTotal, listContextItemTotal)
    : Math.max(
        resolvedItems.items.length,
        resolvedItems.hasMore.directItems || resolvedItems.hasMore.indirectItems
          ? directItemLimit + 1
          : resolvedItems.items.length
      );

  const resolvedListTotal = needItemCounts ? listTotal : listBuckets.lists.length;

  return {
    query: q,
    queryIntent,
    items: resolvedItems.items,
    directItems: resolvedItems.directItems,
    indirectItems: resolvedItems.indirectItems,
    topPicks: resolvedItems.topPicks,
    subThemes: isBroad ? broad.subThemes : [],
    lists: listBuckets.lists,
    directLists: listBuckets.directLists,
    indirectLists: listBuckets.indirectLists,
    relatedItems,
    similarItems: relatedItems,
    totals: { items: itemTotal, lists: resolvedListTotal },
    hasMore: {
      directItems: isBroad ? false : resolvedItems.hasMore.directItems,
      indirectItems: isBroad ? false : resolvedItems.hasMore.indirectItems,
      lists: listsHasMore,
    },
  };
}

export { buildItemSearchHaystack };

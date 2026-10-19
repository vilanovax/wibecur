import type { CuratedList } from '@/types/curated';
import { scoreListKeywordMatch } from '@/lib/interest-keywords';
import { filterAndSortLists } from './utils';

const TRENDING_LIMIT = 5;
const FOR_YOU_MIN = 4;
const FOR_YOU_MAX = 9;
const FOR_YOU_PERSONALIZED_EXTRA = 2;
const MORE_LIMIT = 8;

const KEYWORD_SCORE_WEIGHT = 12;
const PREFERRED_CATEGORY_BOOST = 6;
const FEATURED_BOOST = 4;
const TRENDING_BADGE_BOOST = 3;
const HAS_COVER_BOOST = 1.5;

/** کلید پایدار کاور برای جلوگیری از تکرار thumbnail در سکشن‌ها */
export function coverAssetKey(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const raw = url.trim();
  try {
    const path = raw.startsWith('http') ? new URL(raw).pathname : raw.split('?')[0] ?? raw;
    const base = path.split('/').pop()?.toLowerCase();
    return base || null;
  } catch {
    return raw.toLowerCase();
  }
}

type PickCtx = {
  usedIds: Set<string>;
  usedCovers: Set<string>;
};

function claimList(list: CuratedList, ctx: PickCtx): boolean {
  if (ctx.usedIds.has(list.id)) return false;
  const key = coverAssetKey(list.coverUrl);
  // کاور تکراری در ForYou/Trending ممنوع — کوتاه‌تر بهتر از thumbnail یکسان
  if (key && ctx.usedCovers.has(key)) return false;
  ctx.usedIds.add(list.id);
  if (key) ctx.usedCovers.add(key);
  return true;
}

function pickUnique(
  pool: CuratedList[],
  ctx: PickCtx,
  limit: number,
  predicate?: (list: CuratedList) => boolean
): CuratedList[] {
  const result: CuratedList[] = [];

  if (predicate) {
    for (const list of pool) {
      if (result.length >= limit) break;
      if (!predicate(list)) continue;
      if (claimList(list, ctx)) result.push(list);
    }
  }

  if (result.length < limit) {
    for (const list of pool) {
      if (result.length >= limit) break;
      if (claimList(list, ctx)) result.push(list);
    }
  }

  return result;
}

export function scoreListForForYou(
  list: CuratedList,
  preferredKeywords: string[],
  preferredCategories: Set<string>
): number {
  let score = list.trendScore ?? 0;
  score += scoreListKeywordMatch(list, preferredKeywords) * KEYWORD_SCORE_WEIGHT;
  if (preferredCategories.has(list.categoryId)) score += PREFERRED_CATEGORY_BOOST;
  if (list.badges.includes('featured')) score += FEATURED_BOOST;
  if (list.badges.includes('trending')) score += TRENDING_BADGE_BOOST;
  if (list.badges.includes('rising')) score += 2;
  if (list.coverUrl) score += HAS_COVER_BOOST;
  score += Math.log10(Math.max(list.savesCount ?? 0, 1) + 1);
  return score;
}

function activeCategoriesWithLists(pool: CuratedList[], activeCategoryIds: string[]): string[] {
  const poolCategories = new Set(
    pool.map((l) => l.categoryId).filter((id): id is string => Boolean(id && id !== 'unknown'))
  );
  return activeCategoryIds.filter((id) => poolCategories.has(id));
}

function resolveForYouLimit(activeCategoryIds: string[], pool: CuratedList[]): number {
  const withLists = activeCategoriesWithLists(pool, activeCategoryIds);
  const diversityNeed = Math.max(FOR_YOU_MIN, withLists.length);
  return Math.min(FOR_YOU_MAX, diversityNeed + FOR_YOU_PERSONALIZED_EXTRA);
}

function pickBestInCategory(
  pool: CuratedList[],
  categoryId: string,
  ctx: PickCtx,
  preferredKeywords: string[],
  preferredCategories: Set<string>
): CuratedList | null {
  const ranked = pool
    .filter((list) => list.categoryId === categoryId && !ctx.usedIds.has(list.id))
    .map((list) => ({
      list,
      score: scoreListForForYou(list, preferredKeywords, preferredCategories),
    }))
    .sort((a, b) => b.score - a.score);

  for (const { list } of ranked) {
    if (claimList(list, ctx)) return list;
  }
  return null;
}

function pickCategoryDiverseForYou(
  pool: CuratedList[],
  ctx: PickCtx,
  activeCategoryIds: string[],
  preferredKeywords: string[],
  preferredCategories: Set<string>
): CuratedList[] {
  const result: CuratedList[] = [];

  for (const categoryId of activeCategoryIds) {
    const best = pickBestInCategory(pool, categoryId, ctx, preferredKeywords, preferredCategories);
    if (!best) continue;
    result.push(best);
  }

  return result;
}

function pickTopScoredForYou(
  pool: CuratedList[],
  ctx: PickCtx,
  limit: number,
  preferredKeywords: string[],
  preferredCategories: Set<string>
): CuratedList[] {
  if (limit <= 0) return [];

  const ranked = pool
    .filter((list) => !ctx.usedIds.has(list.id))
    .map((list) => ({
      list,
      score: scoreListForForYou(list, preferredKeywords, preferredCategories),
    }))
    .sort((a, b) => b.score - a.score);

  const result: CuratedList[] = [];
  for (const { list } of ranked) {
    if (result.length >= limit) break;
    if (claimList(list, ctx)) result.push(list);
  }
  return result;
}

function buildForYouLists(
  filtered: CuratedList[],
  ctx: PickCtx,
  activeCategoryIds: string[],
  preferredKeywords: string[],
  preferredCategories: Set<string>
): { lists: CuratedList[]; diverseCategories: boolean } {
  const limit = resolveForYouLimit(activeCategoryIds, filtered);
  const categoriesWithLists = activeCategoriesWithLists(filtered, activeCategoryIds);

  let forYou = pickCategoryDiverseForYou(
    filtered,
    ctx,
    activeCategoryIds,
    preferredKeywords,
    preferredCategories
  );

  if (forYou.length < limit) {
    forYou = [
      ...forYou,
      ...pickTopScoredForYou(
        filtered,
        ctx,
        limit - forYou.length,
        preferredKeywords,
        preferredCategories
      ),
    ];
  }

  if (forYou.length < limit) {
    forYou = [
      ...forYou,
      ...pickUnique(
        filtered,
        ctx,
        limit - forYou.length,
        (list) => list.badges.includes('featured')
      ),
    ];
  }

  if (forYou.length < limit) {
    forYou = [...forYou, ...pickUnique(filtered, ctx, limit - forYou.length)];
  }

  const covered = new Set(
    forYou.map((list) => list.categoryId).filter((id): id is string => Boolean(id))
  );
  const diverseCategories =
    categoriesWithLists.length > 0 &&
    categoriesWithLists.every((categoryId) => covered.has(categoryId));

  return { lists: forYou, diverseCategories };
}

export type ExploreSections = {
  filtered: CuratedList[];
  trending: CuratedList[];
  forYou: CuratedList[];
  more: CuratedList[];
  moreTotal: number;
  isSearching: boolean;
  isPersonalized: boolean;
  diverseCategories: boolean;
};

export type ExploreSectionsOptions = {
  /** کلمات کلیدی ترجیحی کاربر */
  preferredKeywordIds?: string[];
  /** fallback دسته‌ای */
  preferredCategoryIds?: string[];
  activeCategoryIds?: string[];
  excludeListIds?: string[];
};

/** تقسیم لیست‌ها بین سکشن‌ها — تنوع دسته + شخصی‌سازی keyword + کاور یکتا */
export function buildExploreSections(
  allLists: CuratedList[],
  searchQuery: string,
  options?: ExploreSectionsOptions
): ExploreSections {
  const exclude = new Set(options?.excludeListIds ?? []);
  const preferredCategories = new Set(options?.preferredCategoryIds ?? []);
  const preferredKeywords = options?.preferredKeywordIds ?? [];
  const activeCategoryIds = options?.activeCategoryIds ?? [];
  const activeCategories = new Set(activeCategoryIds);

  const isInActiveCategory = (list: CuratedList) => {
    if (activeCategories.size === 0) return true;
    if (!list.categoryId || list.categoryId === 'unknown') return true;
    return activeCategories.has(list.categoryId);
  };

  const basePool = allLists.filter(isInActiveCategory);
  const pool = exclude.size > 0 ? basePool.filter((l) => !exclude.has(l.id)) : basePool;

  const filtered = filterAndSortLists(pool, {
    mode: 'trending',
    categoryId: 'all',
    searchQuery,
  });

  const isSearching = searchQuery.trim().length > 0;
  const ctx: PickCtx = { usedIds: new Set(), usedCovers: new Set() };

  const { lists: forYou, diverseCategories } = buildForYouLists(
    filtered,
    ctx,
    activeCategoryIds,
    preferredKeywords,
    preferredCategories
  );

  const trending = pickUnique(
    filtered,
    ctx,
    TRENDING_LIMIT,
    (list) => list.badges.includes('trending') || (list.savesCount ?? 0) >= 20
  );

  const unused = filtered.filter((list) => !ctx.usedIds.has(list.id));
  const more = unused.slice(0, MORE_LIMIT);

  return {
    filtered,
    trending,
    forYou,
    more,
    moreTotal: unused.length,
    isSearching,
    isPersonalized: preferredKeywords.length > 0 || preferredCategories.size > 0,
    diverseCategories,
  };
}

/** لیست‌های سکشن ترند — برای SSR و کلاینت */
export function selectExploreTrendingLists(
  allLists: CuratedList[],
  options?: ExploreSectionsOptions
): CuratedList[] {
  return buildExploreSections(allLists, '', options).trending;
}

export function selectExploreLcpImageUrl(lists: CuratedList[]): string | null {
  const cover = lists[0]?.coverUrl;
  return cover && (cover.startsWith('/') || cover.startsWith('http')) ? cover : null;
}

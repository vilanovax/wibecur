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

function pickUnique(
  pool: CuratedList[],
  used: Set<string>,
  limit: number,
  predicate?: (list: CuratedList) => boolean
): CuratedList[] {
  const result: CuratedList[] = [];

  const tryAdd = (list: CuratedList) => {
    if (used.has(list.id) || result.length >= limit) return;
    result.push(list);
    used.add(list.id);
  };

  if (predicate) {
    for (const list of pool) {
      if (predicate(list)) tryAdd(list);
    }
  }

  if (result.length < limit) {
    for (const list of pool) {
      tryAdd(list);
      if (result.length >= limit) break;
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
  used: Set<string>,
  preferredKeywords: string[],
  preferredCategories: Set<string>
): CuratedList | null {
  const ranked = pool
    .filter((list) => list.categoryId === categoryId && !used.has(list.id))
    .map((list) => ({
      list,
      score: scoreListForForYou(list, preferredKeywords, preferredCategories),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.list ?? null;
}

function pickCategoryDiverseForYou(
  pool: CuratedList[],
  used: Set<string>,
  activeCategoryIds: string[],
  preferredKeywords: string[],
  preferredCategories: Set<string>
): CuratedList[] {
  const result: CuratedList[] = [];

  for (const categoryId of activeCategoryIds) {
    const best = pickBestInCategory(pool, categoryId, used, preferredKeywords, preferredCategories);
    if (!best) continue;
    result.push(best);
    used.add(best.id);
  }

  return result;
}

function pickTopScoredForYou(
  pool: CuratedList[],
  used: Set<string>,
  limit: number,
  preferredKeywords: string[],
  preferredCategories: Set<string>
): CuratedList[] {
  if (limit <= 0) return [];

  const ranked = pool
    .filter((list) => !used.has(list.id))
    .map((list) => ({
      list,
      score: scoreListForForYou(list, preferredKeywords, preferredCategories),
    }))
    .sort((a, b) => b.score - a.score);

  const result: CuratedList[] = [];
  for (const { list } of ranked) {
    if (result.length >= limit) break;
    result.push(list);
    used.add(list.id);
  }
  return result;
}

function buildForYouLists(
  filtered: CuratedList[],
  used: Set<string>,
  activeCategoryIds: string[],
  preferredKeywords: string[],
  preferredCategories: Set<string>
): { lists: CuratedList[]; diverseCategories: boolean } {
  const limit = resolveForYouLimit(activeCategoryIds, filtered);
  const categoriesWithLists = activeCategoriesWithLists(filtered, activeCategoryIds);

  let forYou = pickCategoryDiverseForYou(
    filtered,
    used,
    activeCategoryIds,
    preferredKeywords,
    preferredCategories
  );

  if (forYou.length < limit) {
    forYou = [
      ...forYou,
      ...pickTopScoredForYou(
        filtered,
        used,
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
        used,
        limit - forYou.length,
        (list) => list.badges.includes('featured')
      ),
    ];
  }

  if (forYou.length < limit) {
    forYou = [...forYou, ...pickUnique(filtered, used, limit - forYou.length)];
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

/** تقسیم لیست‌ها بین سکشن‌ها — تنوع دسته + شخصی‌سازی keyword */
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
  const used = new Set<string>();

  const { lists: forYou, diverseCategories } = buildForYouLists(
    filtered,
    used,
    activeCategoryIds,
    preferredKeywords,
    preferredCategories
  );

  const trending = pickUnique(
    filtered,
    used,
    TRENDING_LIMIT,
    (list) => list.badges.includes('trending') || (list.savesCount ?? 0) >= 20
  );

  const unused = filtered.filter((list) => !used.has(list.id));
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

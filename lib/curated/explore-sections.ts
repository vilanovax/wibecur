import type { CuratedList } from '@/types/curated';
import { scoreListKeywordMatch } from '@/lib/interest-keywords';
import { filterAndSortLists } from './utils';

const TRENDING_LIMIT = 5;
const FOR_YOU_LIMIT = 4;
const RISING_LIMIT = 4;
const MORE_LIMIT = 8;

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

function pickByKeywordScore(
  pool: CuratedList[],
  used: Set<string>,
  limit: number,
  keywordIds: string[]
): CuratedList[] {
  if (keywordIds.length === 0 || limit <= 0) return [];

  const ranked = pool
    .map((list) => ({ list, score: scoreListKeywordMatch(list, keywordIds) }))
    .filter(({ list, score }) => score > 0 && !used.has(list.id))
    .sort((a, b) => b.score - a.score);

  const result: CuratedList[] = [];
  for (const { list } of ranked) {
    if (result.length >= limit) break;
    result.push(list);
    used.add(list.id);
  }
  return result;
}

export type ExploreSections = {
  filtered: CuratedList[];
  trending: CuratedList[];
  forYou: CuratedList[];
  rising: CuratedList[];
  more: CuratedList[];
  moreTotal: number;
  isSearching: boolean;
  isPersonalized: boolean;
};

export type ExploreSectionsOptions = {
  /** کلمات کلیدی ترجیحی کاربر */
  preferredKeywordIds?: string[];
  /** fallback دسته‌ای */
  preferredCategoryIds?: string[];
  activeCategoryIds?: string[];
  excludeListIds?: string[];
};

/** تقسیم لیست‌ها بین سکشن‌ها — scoring keyword فقط در حافظه */
export function buildExploreSections(
  allLists: CuratedList[],
  searchQuery: string,
  options?: ExploreSectionsOptions
): ExploreSections {
  const exclude = new Set(options?.excludeListIds ?? []);
  const preferredCategories = new Set(options?.preferredCategoryIds ?? []);
  const preferredKeywords = options?.preferredKeywordIds ?? [];
  const activeCategories = new Set(options?.activeCategoryIds ?? []);

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

  let forYou: CuratedList[] = [];

  if (preferredKeywords.length > 0) {
    forYou = pickByKeywordScore(filtered, used, FOR_YOU_LIMIT, preferredKeywords);
  }

  if (forYou.length < FOR_YOU_LIMIT && preferredCategories.size > 0) {
    forYou = [
      ...forYou,
      ...pickUnique(
        filtered,
        used,
        FOR_YOU_LIMIT - forYou.length,
        (l) =>
          preferredCategories.has(l.categoryId) &&
          (activeCategories.size === 0 || activeCategories.has(l.categoryId))
      ),
    ];
  }

  if (forYou.length < FOR_YOU_LIMIT) {
    forYou = [
      ...forYou,
      ...pickUnique(
        filtered,
        used,
        FOR_YOU_LIMIT - forYou.length,
        (l) => l.badges.includes('featured')
      ),
    ];
  }
  if (forYou.length < FOR_YOU_LIMIT) {
    forYou = [
      ...forYou,
      ...pickUnique(filtered, used, FOR_YOU_LIMIT - forYou.length),
    ];
  }

  const trending = pickUnique(
    filtered,
    used,
    TRENDING_LIMIT,
    (l) => l.badges.includes('trending') || (l.savesCount ?? 0) >= 20
  );

  const rising = pickUnique(
    filtered,
    used,
    RISING_LIMIT,
    (l) => l.badges.includes('rising') || (l.weeklyVelocity ?? 0) > 100
  );

  const unused = filtered.filter((l) => !used.has(l.id));
  const more = unused.slice(0, MORE_LIMIT);

  return {
    filtered,
    trending,
    forYou,
    rising,
    more,
    moreTotal: unused.length,
    isSearching,
    isPersonalized: preferredKeywords.length > 0 || preferredCategories.size > 0,
  };
}

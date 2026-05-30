import type { CuratedList } from '@/types/curated';
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
  /** دسته‌های محبوب کاربر (از بوکمارک‌ها) */
  preferredCategoryIds?: string[];
  /** لیست‌های ذخیره‌شده — از پیشنهاد حذف می‌شوند */
  excludeListIds?: string[];
};

/** تقسیم لیست‌ها بین سکشن‌ها بدون تکرار */
export function buildExploreSections(
  allLists: CuratedList[],
  searchQuery: string,
  options?: ExploreSectionsOptions
): ExploreSections {
  const exclude = new Set(options?.excludeListIds ?? []);
  const preferred = new Set(options?.preferredCategoryIds ?? []);
  const pool = exclude.size > 0 ? allLists.filter((l) => !exclude.has(l.id)) : allLists;

  const filtered = filterAndSortLists(pool, {
    mode: 'trending',
    categoryId: 'all',
    searchQuery,
  });

  const isSearching = searchQuery.trim().length > 0;
  const used = new Set<string>();

  const trending = pickUnique(
    filtered,
    used,
    TRENDING_LIMIT,
    (l) => l.badges.includes('trending') || (l.savesCount ?? 0) >= 20
  );

  let forYou: CuratedList[] = [];
  if (preferred.size > 0) {
    forYou = pickUnique(
      filtered,
      used,
      FOR_YOU_LIMIT,
      (l) => preferred.has(l.categoryId)
    );
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
    isPersonalized: preferred.size > 0,
  };
}

import type { HomeData, HomeListData, RisingListData } from '@/types/home-data';
import { isFilmCategorySlug, isLocationCategorySlug } from '@/lib/category-layout';
import { isPlaceholderCoverPath } from '@/lib/image-url-policy';

export type HomeMoodCollection = {
  id: string;
  icon: string;
  label: string;
  subtitle: string;
  href: string;
  lists: HomeListData[];
};

const QUICK_MAX_ITEMS = 15;
const LISTS_PER_MOOD = 3;

function listCategorySlug(list: HomeListData): string {
  return list.categories?.slug?.toLowerCase() ?? '';
}

function isTravelCategorySlug(slug: string): boolean {
  const s = slug.toLowerCase();
  return s.includes('travel') || s.includes('trip') || s.includes('سفر') || s.includes('گردش');
}

function isWeekendCategorySlug(slug: string): boolean {
  return isLocationCategorySlug(slug) || isFilmCategorySlug(slug) || isTravelCategorySlug(slug);
}

function coverScore(list: HomeListData): number {
  const raw = list.coverImage?.trim() || list.horizontalImage?.trim() || '';
  let score = 0;
  if (raw && !isPlaceholderCoverPath(raw)) score += 3;
  if ((list.saveCount ?? 0) > 0) score += 1;
  if ((list.itemCount ?? 0) > 0) score += 1;
  return score;
}

function sortByCoverQuality(lists: HomeListData[]): HomeListData[] {
  return [...lists].sort((a, b) => coverScore(b) - coverScore(a));
}

function uniqueLists(lists: HomeListData[], max: number, used = new Set<string>()): HomeListData[] {
  const out: HomeListData[] = [];
  for (const list of lists) {
    if (used.has(list.id)) continue;
    used.add(list.id);
    out.push(list);
    if (out.length >= max) break;
  }
  return out;
}

type WeekendBucket = {
  id: string;
  matches: (slug: string) => boolean;
};

const WEEKEND_BUCKETS: WeekendBucket[] = [
  { id: 'outing', matches: isLocationCategorySlug },
  { id: 'film', matches: isFilmCategorySlug },
  { id: 'travel', matches: isTravelCategorySlug },
];

/** یک لیست از هر دستهٔ آخرهفته‌ای — کاورها با «کافه، فیلم، بیرون‌رفتن» هم‌خوان‌تر */
export function pickWeekendMoodLists(
  pool: HomeListData[],
  used: Set<string>,
  max = LISTS_PER_MOOD
): HomeListData[] {
  const weekendPool = sortByCoverQuality(pool.filter((l) => isWeekendCategorySlug(listCategorySlug(l))));
  const picked: HomeListData[] = [];

  for (const bucket of WEEKEND_BUCKETS) {
    if (picked.length >= max) break;
    const match = weekendPool.find(
      (l) => !used.has(l.id) && !picked.some((p) => p.id === l.id) && bucket.matches(listCategorySlug(l))
    );
    if (match) {
      picked.push(match);
      used.add(match.id);
    }
  }

  if (picked.length < max) {
    picked.push(...uniqueLists(weekendPool, max - picked.length, used));
  }

  return picked.slice(0, max);
}

/** لیست‌های کوتاه — آیتم کم، کاور واقعی */
export function pickQuickMoodLists(
  pool: HomeListData[],
  used: Set<string>,
  max = LISTS_PER_MOOD
): HomeListData[] {
  const compact = pool.filter((l) => {
    const count = l.itemCount ?? 0;
    return count > 0 && count <= QUICK_MAX_ITEMS && !used.has(l.id);
  });

  const sorted = [...compact].sort((a, b) => {
    const countDiff = (a.itemCount ?? 0) - (b.itemCount ?? 0);
    if (countDiff !== 0) return countDiff;
    return coverScore(b) - coverScore(a);
  });

  const diverse: HomeListData[] = [];
  const seenCategories = new Set<string>();

  for (const list of sorted) {
    if (diverse.length >= max) break;
    const slug = listCategorySlug(list) || 'other';
    if (seenCategories.has(slug) && diverse.length < max - 1) continue;
    seenCategories.add(slug);
    diverse.push(list);
    used.add(list.id);
  }

  if (diverse.length < max) {
    diverse.push(...uniqueLists(sorted, max - diverse.length, used));
  }

  return diverse.slice(0, max);
}

/** رشد سریع — اول fast-rising */
export function pickFreshMoodLists(
  rising: RisingListData[],
  pool: HomeListData[],
  used: Set<string>,
  max = LISTS_PER_MOOD
): HomeListData[] {
  const fastRising = sortByCoverQuality(
    rising.filter((l) => l.isFastRising && !used.has(l.id))
  );
  const otherRising = sortByCoverQuality(rising.filter((l) => !l.isFastRising && !used.has(l.id)));

  const picked = uniqueLists([...fastRising, ...otherRising], max, used);

  if (picked.length < max) {
    picked.push(...uniqueLists(sortByCoverQuality(pool), max - picked.length, used));
  }

  return picked.slice(0, max);
}

export function buildHomeMoodCollections(data: HomeData | null): HomeMoodCollection[] {
  if (!data) return [];

  const featuredId = data.featured?.id;
  const pool = uniqueLists(
    [...(data.trending ?? []), ...(data.rising ?? []), ...(data.recommendations ?? [])].filter(
      (l) => l.id !== featuredId
    ),
    48
  );

  if (pool.length === 0) return [];

  const used = new Set<string>();
  const rising = data.rising ?? [];

  const weekendLists = pickWeekendMoodLists(pool, used);
  const quickLists = pickQuickMoodLists(pool, used);
  const freshLists = pickFreshMoodLists(rising, pool, used);

  const moods: HomeMoodCollection[] = [
    {
      id: 'weekend',
      icon: '🌙',
      label: 'برای آخر هفته',
      subtitle: 'کافه، فیلم و بیرون‌رفتن',
      href: '/lists?mode=trending',
      lists: weekendLists,
    },
    {
      id: 'quick',
      icon: '⚡',
      label: 'کوتاه و سریع',
      subtitle: `لیست‌های تا ${QUICK_MAX_ITEMS} آیتم`,
      href: '/lists',
      lists: quickLists,
    },
    {
      id: 'fresh',
      icon: '✨',
      label: 'تازه و داغ',
      subtitle: 'رشد سریع این روزها',
      href: '/lists?mode=popular',
      lists: freshLists,
    },
  ];

  return moods.filter((m) => m.lists.length > 0);
}

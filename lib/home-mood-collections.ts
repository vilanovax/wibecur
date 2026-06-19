import type { HomeData, HomeListData } from '@/types/home-data';

export type HomeMoodCollection = {
  id: string;
  icon: string;
  label: string;
  subtitle: string;
  href: string;
  lists: HomeListData[];
};

const WEEKEND_CATEGORY_SLUGS = new Set([
  'cafe',
  'movie',
  'travel',
  'restaurant',
  'food',
  'film',
]);

function uniqueLists(lists: HomeListData[], max: number): HomeListData[] {
  const seen = new Set<string>();
  const out: HomeListData[] = [];
  for (const list of lists) {
    if (seen.has(list.id)) continue;
    seen.add(list.id);
    out.push(list);
    if (out.length >= max) break;
  }
  return out;
}

export function buildHomeMoodCollections(data: HomeData | null): HomeMoodCollection[] {
  if (!data) return [];

  const trending = data.trending ?? [];
  const rising = data.rising ?? [];
  const featuredId = data.featured?.id;
  const pool = uniqueLists(
    [...trending, ...rising, ...(data.recommendations ?? [])].filter(
      (l) => l.id !== featuredId
    ),
    24
  );

  if (pool.length === 0) return [];

  const weekendCandidates = pool.filter((l) =>
    WEEKEND_CATEGORY_SLUGS.has(l.categories?.slug ?? '')
  );
  const weekendLists = uniqueLists(
    weekendCandidates.length >= 2 ? weekendCandidates : trending,
    3
  );

  const quickLists = uniqueLists(
    [...pool].sort((a, b) => a.itemCount - b.itemCount),
    3
  );

  const freshLists = uniqueLists(
    rising.filter((l) => l.isFastRising).length > 0
      ? rising.filter((l) => l.isFastRising)
      : rising,
    3
  );

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
      subtitle: 'لیست‌های جمع‌وجور',
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

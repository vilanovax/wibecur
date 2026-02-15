import type { CuratedList, CuratedMode } from '@/types/curated';

/** Format number to 1.2k style */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return n.toLocaleString('fa-IR');
}

/** Compute trend score: (savesLast7d*2 + likesLast7d + viewsLast7d*0.2) * decayFactor */
export function computeTrendScore(list: {
  savesLast7d?: number;
  likesLast7d?: number;
  viewsLast7d?: number;
  createdAt: string;
}): number {
  const saves = list.savesLast7d ?? 0;
  const likes = list.likesLast7d ?? 0;
  const views = list.viewsLast7d ?? 0;
  const hoursSinceCreated =
    (Date.now() - new Date(list.createdAt).getTime()) / (1000 * 60 * 60);
  const decayFactor = Math.exp(-hoursSinceCreated / 72);
  return (saves * 2 + likes + views * 0.2) * decayFactor;
}

export type FilterAndSortOptions = {
  mode: CuratedMode;
  categoryId: string;
  searchQuery?: string;
};

/** Filter and sort lists by mode and category */
export function filterAndSortLists(
  lists: CuratedList[],
  options: FilterAndSortOptions
): CuratedList[] {
  let result = [...lists];

  if (options.categoryId && options.categoryId !== 'all') {
    result = result.filter((l) => l.categoryId === options.categoryId);
  }

  if (options.searchQuery?.trim()) {
    const q = options.searchQuery.toLowerCase();
    result = result.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.creator.name.toLowerCase().includes(q) ||
        (l.subtitle && l.subtitle.toLowerCase().includes(q))
    );
  }

  switch (options.mode) {
    case 'trending':
      result.sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0));
      break;
    case 'popular':
      result.sort((a, b) => b.savesCount - a.savesCount);
      break;
    case 'new':
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case 'rising':
      result.sort(
        (a, b) => (b.weeklyVelocity ?? 0) - (a.weeklyVelocity ?? 0)
      );
      break;
    case 'top_curators':
      result.sort(
        (a, b) =>
          (b.creator.badges.includes('top') ? 1000 : 0) -
          (a.creator.badges.includes('top') ? 1000 : 0) ||
          b.savesCount - a.savesCount
      );
      break;
    default:
      result.sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0));
  }

  return result;
}

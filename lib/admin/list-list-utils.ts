import type { ListIntelligenceRow } from '@/lib/admin/lists-types';
import type { ListFilterKind } from '@/components/admin/lists/ListSmartFilterBar';
import { isGenericListCover } from '@/lib/image-url-policy';

export const LIST_FILTER_KINDS: ListFilterKind[] = [
  'all',
  'rising',
  'trending_top',
  'low_engagement',
  'suspicious',
  'needs_review',
  'zero_save',
  'featured',
  'no_cover',
];

export function parseListFilterParam(raw?: string | null): ListFilterKind {
  if (raw && LIST_FILTER_KINDS.includes(raw as ListFilterKind)) {
    return raw as ListFilterKind;
  }
  return 'all';
}

export function listHasMissingCover(list: { coverImage: string | null }): boolean {
  return isGenericListCover(list.coverImage);
}

export function searchLists(lists: ListIntelligenceRow[], query: string): ListIntelligenceRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return lists;
  return lists.filter(
    (l) =>
      l.title.toLowerCase().includes(q) ||
      l.slug.toLowerCase().includes(q) ||
      l.categoryName.toLowerCase().includes(q) ||
      l.ownerName.toLowerCase().includes(q) ||
      (l.ownerUsername?.toLowerCase().includes(q) ?? false) ||
      (l.description?.toLowerCase().includes(q) ?? false)
  );
}

export function countListsForFilter(
  lists: ListIntelligenceRow[],
  filter: ListFilterKind
): number {
  switch (filter) {
    case 'all':
      return lists.length;
    case 'rising':
      return lists.filter((l) => l.status === 'rising').length;
    case 'trending_top':
      return lists.filter((l) => l.rank <= 10).length;
    case 'low_engagement':
      return lists.filter((l) => l.lowEngagement).length;
    case 'suspicious':
      return lists.filter((l) => l.riskLevel === 'medium' || l.riskLevel === 'high').length;
    case 'needs_review':
      return lists.filter((l) => l.needsReview).length;
    case 'zero_save':
      return lists.filter((l) => l.saveCount === 0).length;
    case 'featured':
      return lists.filter((l) => l.isFeatured).length;
    case 'no_cover':
      return lists.filter((l) => listHasMissingCover(l)).length;
    default:
      return lists.length;
  }
}

/** Single-pass filter tab counts (js-combine-iterations) */
export function countAllListFilters(
  lists: ListIntelligenceRow[]
): Record<ListFilterKind, number> {
  const counts: Record<ListFilterKind, number> = {
    all: lists.length,
    rising: 0,
    trending_top: 0,
    low_engagement: 0,
    suspicious: 0,
    needs_review: 0,
    zero_save: 0,
    featured: 0,
    no_cover: 0,
  };

  for (const l of lists) {
    if (l.status === 'rising') counts.rising += 1;
    if (l.rank <= 10) counts.trending_top += 1;
    if (l.lowEngagement) counts.low_engagement += 1;
    if (l.riskLevel === 'medium' || l.riskLevel === 'high') counts.suspicious += 1;
    if (l.needsReview) counts.needs_review += 1;
    if (l.saveCount === 0) counts.zero_save += 1;
    if (l.isFeatured) counts.featured += 1;
    if (listHasMissingCover(l)) counts.no_cover += 1;
  }

  return counts;
}

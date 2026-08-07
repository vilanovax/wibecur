import type { ListIntelligenceRow } from '@/lib/admin/lists-intelligence';
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

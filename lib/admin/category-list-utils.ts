import type { CategoryIntelligenceRow } from '@/lib/admin/categories-types';
import type { CategorySortKey } from '@/lib/admin/categories-types';

export function searchCategories(
  categories: CategoryIntelligenceRow[],
  query: string
): CategoryIntelligenceRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return categories;
  return categories.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.description?.toLowerCase().includes(q) ?? false)
  );
}

export function sortCategories(
  categories: CategoryIntelligenceRow[],
  sortKey: CategorySortKey
): CategoryIntelligenceRow[] {
  const copy = [...categories];
  switch (sortKey) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    case 'listCount':
      return copy.sort((a, b) => b.listCount - a.listCount);
    case 'engagement':
      return copy.sort((a, b) => b.engagementRatio - a.engagementRatio);
    case 'growth':
      return copy.sort((a, b) => b.saveGrowthPercent - a.saveGrowthPercent);
    case 'avgSaves':
      return copy.sort((a, b) => b.avgSavesPerList - a.avgSavesPerList);
    case 'weight':
      return copy.sort((a, b) => a.trendingWeight - b.trendingWeight || a.order - b.order);
    case 'order':
    default:
      return copy.sort(
        (a, b) => a.order - b.order || a.name.localeCompare(b.name, 'fa')
      );
  }
}

/** Category Intelligence Panel 3.0 – types */

export type CategorySortKey =
  | 'order'
  | 'name'
  | 'listCount'
  | 'engagement'
  | 'growth'
  | 'avgSaves'
  | 'weight';

export type CategoryViewMode = 'grid' | 'table' | 'reorder';

export type CategoryFilterKind =
  | 'all'
  | 'growing'
  | 'healthy'
  | 'needs_boost'
  | 'declining'
  | 'low_engagement'
  | 'needs_review'
  | 'inactive';

export interface CategoryPulseSummary {
  totalCategories: number;
  fastestGrowingName: string;
  fastestGrowingPercent: number;
  avgSaveGrowthPercent: number;
  monetizableCount: number;
  /** جمله یک‌خطی زیر KPI */
  insightLine: string;
}

export interface CategoryIntelligenceRow {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  order: number;
  isActive: boolean;
  listCount: number;
  /** تعداد موجودیت‌های یکتا (کاتالوگ) در لیست‌های این دسته */
  uniqueItemCount: number;
  saveGrowthPercent: number;
  /** ذخیره‌های bookmark در ۷ روز اخیر */
  saveGrowthRecent: number;
  /** ذخیره‌های ۷ روز قبل از آن */
  saveGrowthPrevious: number;
  engagementRatio: number;
  activeListsPercent: number;
  /** میانگین saveCount به ازای هر لیست */
  avgSavesPerList: number;
  /** ضریب وزن الگوریتمی (۰.۸ | ۱ | ۱.۲ | ۱.۴) */
  trendingWeight: number;
  heroImage: string | null;
  layoutType: string | null;
}

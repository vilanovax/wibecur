/** Category Intelligence Panel 3.0 – types */

export type CategoryFilterKind =
  | 'all'
  | 'healthy'
  | 'needs_boost'
  | 'declining'
  | 'inactive';

export interface CategoryPulseSummary {
  totalCategories: number;
  fastestGrowingName: string;
  fastestGrowingPercent: number;
  avgSaveGrowthPercent: number;
  monetizableCount: number;
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
  saveGrowthPercent: number;
  engagementRatio: number;
  activeListsPercent: number;
  trendingScoreAvg: number;
  /** برای کنترل وزن در آینده */
  weight?: number;
}

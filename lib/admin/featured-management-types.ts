/**
 * Client-safe types for /admin/custom/featured (no Prisma).
 */

export type FeaturedListOption = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  saveCount: number;
  itemCount: number;
  badge: string | null;
  isPublic?: boolean;
  isActive?: boolean;
  deletedAt?: string | null;
  isFeatured?: boolean;
  categories: { name: string; slug: string } | null;
};

export type FeaturedSlotItem = {
  id: string;
  listId: string;
  list: FeaturedListOption;
  startAt: string;
  endAt: string | null;
  orderIndex: number;
  viewListCount: number;
  quickSaveCount: number;
};

export type FeaturedSlotPerformance = {
  impressions: number;
  clicks: number;
  ctr: number;
  savesDuring: number;
  baselineSaves: number | null;
  saveLiftPercent: number | null;
  baselineScore: number | null;
  peakScore: number | null;
  scoreLiftPercent: number | null;
};

export type FeaturedWeeklyReportPayload = {
  weekStart: string;
  weekEnd: string;
  totalSlots: number;
  avgCTR: number;
  avgSaveLift: number | null;
  bestPerformer: {
    listTitle: string;
    listId: string;
    saveLiftPercent: number;
  } | null;
  slots: {
    slotId: string;
    listTitle: string;
    listId: string;
    categoryName: string | null;
    categoryId: string | null;
    ctr: number;
    saveLiftPercent: number | null;
    scoreLiftPercent: number | null;
    impactLabel: string;
  }[];
  recommendations: string[];
};

export type FeaturedManagementData = {
  current: FeaturedSlotItem | null;
  fallbackList: { id: string; title: string; slug: string } | null;
  /** Full list fields for fallback preview (when no current slot) */
  fallbackListDetail: FeaturedListOption | null;
  upcoming: FeaturedSlotItem[];
  past: FeaturedSlotItem[];
  /** Empty on initial SSR — loaded lazily when add-slot wizard opens */
  lists: FeaturedListOption[];
  weeklyReport: FeaturedWeeklyReportPayload | null;
  currentPerformance: FeaturedSlotPerformance | null;
  currentRecommendations: string[];
};

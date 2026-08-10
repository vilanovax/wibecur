/**
 * Types + constants for admin lists intelligence.
 * Safe for client imports (no Prisma / DB).
 */

import type { TrendingStatus } from '@/lib/admin/trending-status';

/** نمونه برای محاسبه پالس KPI (نه محدودیت نمایش) */
export const LISTS_PULSE_SAMPLE = 500;
export const LISTS_PAGE_SIZE = 50;
/** @deprecated use LISTS_PULSE_SAMPLE */
export const LISTS_INTELLIGENCE_CAP = LISTS_PULSE_SAMPLE;

export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

export interface ListPulse {
  totalLists: number;
  risingLists: number;
  lowEngagementLists: number;
  /** لیست‌های با ریسک متوسط/بالا یا spike */
  flaggedLists: number;
  /** isFeatured */
  featuredLists: number;
  /** جمله یک‌خطی زیر KPI */
  insightLine: string;
}

export interface ListIntelligenceRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  horizontalImage: string | null;
  categoryId: string | null;
  categoryName: string;
  categorySlug: string | null;
  categoryIcon: string;
  isFeatured: boolean;
  isActive: boolean;
  saveCount: number;
  viewCount: number;
  likeCount: number;
  itemCount: number;
  createdAt: string;
  rank: number;
  trendingScore: number;
  saves24h: number;
  saves7d: number;
  growth7dRecent: number;
  growth7dPrevious: number;
  status: TrendingStatus;
  engagementRatio: number;
  riskLevel: RiskLevel;
  growth7dPercent: number;
  needsReview: boolean;
  lowEngagement: boolean;
  ownerId: string;
  ownerName: string;
  ownerUsername: string | null;
  deletedAt?: string | null;
  deletedBy?: { id: string; name: string | null; email: string | null } | null;
  deleteReason?: string | null;
}

export interface ListsIntelligencePagination {
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface ListCategoryOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  listCount: number;
}

export interface ListsIntelligenceData {
  pulse: ListPulse;
  lists: ListIntelligenceRow[];
  /** پالس از نمونهٔ برتر است، نه کل دیتاست */
  pulseFromSample: boolean;
  categories: ListCategoryOption[];
  pagination: ListsIntelligencePagination;
}

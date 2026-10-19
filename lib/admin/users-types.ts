/** User Intelligence Panel 3.0 – types + client-safe constants (no Prisma) */

import type { UserFilterKind } from '@/lib/admin/user-filter-utils';

export type UserQualityBadge = 'high_impact' | 'stable' | 'low_engagement';
export type UserRiskLevel = 'clean' | 'spike' | 'bot_risk';

export type UserSortKind =
  | 'created_desc'
  | 'created_asc'
  | 'growth_desc'
  | 'growth_asc'
  | 'bookmarks_desc'
  | 'lists_desc'
  | 'curator_desc';

export const USER_SORT_OPTIONS: { value: UserSortKind; label: string }[] = [
  { value: 'created_desc', label: 'جدیدترین عضویت' },
  { value: 'created_asc', label: 'قدیمی‌ترین عضویت' },
  { value: 'growth_desc', label: 'بیشترین رشد ۷ روزه' },
  { value: 'growth_asc', label: 'کمترین رشد ۷ روزه' },
  { value: 'bookmarks_desc', label: 'بیشترین ذخیره' },
  { value: 'lists_desc', label: 'بیشترین لیست' },
  { value: 'curator_desc', label: 'امتیاز کیوریتور' },
];

export function parseUserSort(value: string | undefined): UserSortKind {
  const valid = new Set(USER_SORT_OPTIONS.map((o) => o.value));
  if (value && valid.has(value as UserSortKind)) return value as UserSortKind;
  return 'created_desc';
}

export interface UserPulseSummary {
  activeUsers7d: number;
  activeUsers7dDelta?: number;
  highGrowthCount: number;
  curatorCandidatesCount: number;
  suspiciousCount: number;
}

export interface UserIntelligenceRow {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  username: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  /** لیست‌ها */
  listsCount: number;
  /** ذخیره‌ها (بوکمارک) */
  bookmarksCount: number;
  listLikesCount: number;
  quality: UserQualityBadge;
  /** رشد فعالیت ۷ روزه (بوکمارک + لیست جدید) نسبت به ۷ روز قبل */
  growthPercent: number;
  growth7dRecent?: number;
  growth7dPrevious?: number;
  risk: UserRiskLevel;
  riskLabel?: string;
  /** برای hover / tooltip */
  avgSavesPerList?: number;
  userViolationsCount: number;
  commentReportsCount: number;
  curatorScore: number;
  curatorLevel: string;
  /** برای نمایش/رفع محدودیت کامنت */
  commentStatus?: import('@/lib/comment-permission').CommentPermissionStatus;
  isBot: boolean;
}

export type UsersIntelligenceQuery = {
  page: number;
  search: string;
  filter: UserFilterKind;
  hideBots: boolean;
  sort: UserSortKind;
  trash?: boolean;
};

export type UsersIntelligenceData = {
  pulse: UserPulseSummary;
  users: UserIntelligenceRow[];
  filterCounts: Record<UserFilterKind, number>;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  filter: UserFilterKind;
  sort: UserSortKind;
  search: string;
  hideBots: boolean;
};

export const USER_GROWTH_7D_LABEL = 'رشد ۷ روزه';

export const USER_QUALITY_LABELS: Record<UserQualityBadge, string> = {
  high_impact: 'اثر بالا',
  stable: 'پایدار',
  low_engagement: 'تعامل کم',
};

export const USER_RISK_LABELS: Record<UserRiskLevel, string> = {
  clean: 'سالم',
  spike: 'اسپایک',
  bot_risk: 'ریسک ربات',
};

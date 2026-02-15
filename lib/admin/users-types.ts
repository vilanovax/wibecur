/** User Intelligence Panel 3.0 – types */

export type UserQualityBadge = 'high_impact' | 'stable' | 'low_engagement';
export type UserRiskLevel = 'clean' | 'spike' | 'bot_risk';

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
  growthPercent: number;
  risk: UserRiskLevel;
  riskLabel?: string;
  /** برای hover / tooltip */
  avgSavesPerList?: number;
  userViolationsCount: number;
  commentReportsCount: number;
  curatorScore: number;
  curatorLevel: string;
}

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

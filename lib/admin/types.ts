/** Admin Dashboard 3.0 – Control Tower types (decision-oriented) */

export interface KpiItem {
  label: string;
  value: number | string;
  delta?: number;
  deltaLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  sparkline?: number[];
}

/** System Pulse Bar – 4 intelligent KPI cards */
export interface SystemPulseCard {
  id: 'save_velocity' | 'trending_momentum' | 'active_lists_ratio' | 'risk_alerts';
  label: string;
  value: number | string;
  deltaPercent: number;
  trend: 'up' | 'down' | 'neutral';
  sparkline: number[];
  semanticColor: 'emerald' | 'blue' | 'amber' | 'red';
  tooltip: string;
}

/** Trending Radar table row */
export interface TrendingRadarRow {
  id: string;
  listName: string;
  listSlug: string;
  category: string;
  categoryId?: string;
  saves24h: number;
  growth7dPercent: number;
  trendingScore: number;
  trend: 'up' | 'down' | 'neutral';
  scoreBreakdown?: { label: string; value: number }[];
}

/** Category Intelligence card */
export interface CategoryIntelligenceCard {
  id: string;
  name: string;
  slug: string;
  saveGrowthPercent: number;
  newListsCount: number;
  engagementRatio: number;
  topRisingList?: { id: string; title: string; slug: string; growthPercent: number };
  accentColor: string;
}

/** Curator Intelligence row */
export interface CuratorIntelligenceRow {
  id: string;
  name: string;
  username: string | null;
  avatarUrl?: string | null;
  growthPercent: number;
  avgSavesPerList: number;
  trustBadge: 'high_growth' | 'stable' | 'risky';
  rank: number;
}

/** Risk & Moderation item */
export interface RiskItem {
  id: string;
  type: 'save_spike' | 'suspicious_growth' | 'flagged_list' | 'anomaly';
  label: string;
  count?: number;
  description?: string;
  severity: 'high' | 'medium' | 'low';
  href?: string;
}

export interface ModerationAlert {
  id: string;
  type: 'reported_items' | 'pending_lists' | 'flagged_curators';
  label: string;
  count: number;
  severity?: 'high' | 'medium' | 'low';
  href: string;
}

export interface TopList {
  id: string;
  title: string;
  slug: string;
  category: string;
  saveCount: number;
  viewCount: number;
  isTrending?: boolean;
}

export interface TopCategory {
  id: string;
  name: string;
  slug: string;
  listCount: number;
  sharePercent: number;
  delta?: number;
}

export interface TopCurator {
  id: string;
  name: string;
  username: string | null;
  followers: number;
  saves: number;
  growthPercent?: number;
  reliability?: 'high' | 'medium' | 'low';
}

export interface ActivityEvent {
  id: string;
  type: 'list_created' | 'item_added' | 'report_submitted' | 'curator_featured' | 'user_joined';
  title: string;
  description: string;
  actor?: string;
  timestamp: Date;
  href?: string;
}

export interface DashboardData {
  /** Legacy / fallback */
  kpis: KpiItem[];
  moderationAlerts: ModerationAlert[];
  topLists: TopList[];
  topCategories: TopCategory[];
  topCurators: TopCurator[];
  activities: ActivityEvent[];
  userGrowthData: { month: string; users: number }[];
  listsByCategory: { category: string; count: number }[];
  itemDistribution: { name: string; value: number; color: string }[];
  engagementData?: { month: string; saves: number; views: number }[];

  /** Control Tower 3.0 – decision-oriented */
  systemPulse: SystemPulseCard[];
  trendingRadar: TrendingRadarRow[];
  categoryIntelligence: CategoryIntelligenceCard[];
  curatorIntelligence: CuratorIntelligenceRow[];
  riskAlerts: RiskItem[];
}

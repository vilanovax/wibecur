/** Badge types for lists */
export type ListBadge = 'trending' | 'rising' | 'featured' | 'ai';

/** Badge types for curators */
export type CuratorBadge = 'top' | 'rising' | 'elite' | 'ai' | 'featured';

/** Curator model for Authority & Growth sections */
export interface Curator {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  levelTitle: string;
  badges: CuratorBadge[];
  followersCount: number;
  totalSaves: number;
  listsCount: number;
  weeklyGrowthPercent?: number;
  savesLast7d?: number;
}

/** Curated list model for Discovery Grid */
export interface CuratedList {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  categoryId: string;
  coverUrl: string | null;
  itemsCount: number;
  savesCount: number;
  likesCount: number;
  badges: ListBadge[];
  creator: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    levelTitle: string;
    badges: CuratorBadge[];
  };
  createdAt: string;
  trendScore: number;
  weeklyVelocity?: number;
  viewsLast7d?: number;
  savesLast7d?: number;
  likesLast7d?: number;
}

/** Category for filter chips */
export interface CuratedCategory {
  id: string;
  title: string;
  icon: string;
}

/** Mode tabs for segmented control */
export type CuratedMode = 'trending' | 'popular' | 'new' | 'top_curators' | 'rising';

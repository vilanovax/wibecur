/**
 * انواع داده‌های صفحه دسته‌بندی 2.0
 */

export type CategoryLayoutType = 'cinematic' | 'locationBased' | 'editorial' | 'minimal';

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  accentColor?: string | null;
  description?: string | null;
  heroImage?: string | null;
  layoutType?: CategoryLayoutType | null;
}

export interface CategoryMetrics {
  totalLists: number;
  totalItems: number;
  weeklySaveCount: number;
  viralCount: number;
}

export interface CategoryListCard {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  saveCount: number;
  likeCount: number;
  itemCount: number;
  badge?: string | null;
  creator: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    curatorLevel: string;
  };
  trendScore?: number;
  isViral?: boolean;
}

export interface CategoryCuratorCard {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  curatorLevel: string;
  listCount: number;
  totalSaves: number;
  totalLikes: number;
  followersCount: number;
}

export interface CategoryPageData {
  category: CategoryInfo;
  metrics: CategoryMetrics;
  trendingLists: CategoryListCard[];
  viralSpotlight: CategoryListCard | null;
  topCurators: CategoryCuratorCard[];
  newLists: CategoryListCard[];
  suggestedLists?: CategoryListCard[];
}

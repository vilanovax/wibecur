/**
 * تایپ‌های مشترک برای آیتم‌ها در سراسر اپ
 */

export interface TrendingItem {
  id: string;
  title: string;
  image: string | null;
  rating: number | null;
  saveCount: number;
  trendScore: number;
}

export interface SimilarItem {
  id: string;
  title: string;
  image: string | null;
  rating: number | null;
  category: { name: string; icon: string | null } | null;
}

export interface AlsoLikedItem {
  id: string;
  title: string;
  image: string | null;
  rating: number | null;
  commonUsersCount: number;
}

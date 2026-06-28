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
  /** تعداد کیوریتورهای فعال در این دسته */
  totalCuratorsCount?: number;
  /** رشد درصدی ذخیره نسبت به هفته قبل (برای Hero) */
  weeklyGrowthPercent?: number;
  /** تعداد ژانرهای فعال (از تگ‌ها) */
  genreCount?: number;
}

export interface CategoryListCard {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  /** بنر افقی (۱۶:۹) — آپلود اختیاری در ادمین */
  horizontalImage?: string | null;
  /** URL نهایی برای نمایش افقی (horizontalImage یا fallback کاور) */
  bannerImage?: string;
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
  tags?: string[];
  cityTag?: string | null;
  saves24h?: number;
  /** ذخیره در ۷ روز گذشته (برای سکشن ترند هفتگی) */
  saves7d?: number;
  /** رشد درصدی ۲۴ ساعته (برای badge Trending) */
  growthPercent?: number;
  /** تعداد نظرات لیست (برای Most Debated) */
  commentCount?: number;
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
  topLists?: CategoryListCard[];
  /** ذخیره‌های این کیوریتور در ۷ روز گذشته */
  savesThisWeek?: number;
}

export const LOCATION_CITIES = ['تهران', 'شیراز', 'مشهد', 'اصفهان', 'تبریز'] as const;

export interface CityBreakdown {
  city: string;
  listCount: number;
  sampleLists: CategoryListCard[];
}

export interface FilmGenreChip {
  slug: string;
  label: string;
  icon: string;
  listCount: number;
}

export interface CategoryPageData {
  category: CategoryInfo;
  metrics: CategoryMetrics;
  trendingLists: CategoryListCard[];
  trendingNow24h?: CategoryListCard[];
  topSavedThisWeek?: CategoryListCard[];
  viralSpotlight: CategoryListCard | null;
  topCurators: CategoryCuratorCard[];
  topCuratorSpotlight?: CategoryCuratorCard | null;
  newLists: CategoryListCard[];
  popularAllTime?: CategoryListCard[];
  cityBreakdown?: CityBreakdown[];
  suggestedLists?: CategoryListCard[];
  /** لیست‌های با بیشترین نظر (Most Debated) */
  mostDebatedLists?: CategoryListCard[];
  /** ژانرها از تگ‌های لیست (صفحه فیلم) */
  filmGenres?: FilmGenreChip[];
  /** آیتم‌های پربذخیره در دسته (برای Most Saved Items) */
  mostSavedItems?: CategoryItemCard[];
  /** تازه‌ترین آیتم‌های اضافه‌شده در این دسته */
  latestItems?: CategoryItemCard[];
}

export interface CategoryItemCard {
  id: string;
  title: string;
  imageUrl?: string | null;
  listSlug: string;
  listTitle: string;
}

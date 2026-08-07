export interface HomeListCreator {
  id: string;
  name: string | null;
  username: string | null;
  image?: string | null;
  curatorLevel?: string | null;
}

export interface HomeListData {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  /** کاور افقی خام از DB */
  horizontalImage?: string | null;
  /** URL نهایی برای بنر/هیرو افقی */
  bannerImage?: string;
  saveCount: number;
  itemCount: number;
  likes: number;
  badge?: 'trending' | 'new' | 'featured';
  categories?: { id: string; name: string; slug: string; icon: string } | null;
  creator?: HomeListCreator | null;
  /** ذخیره در ۷ روز اخیر — برای social proof */
  weeklySaves?: number;
}

export interface FeaturedListData extends HomeListData {
  badge?: 'trending' | 'new' | 'featured';
}

export interface RisingListData extends HomeListData {
  isFastRising?: boolean;
}

export interface HomeData {
  featured: FeaturedListData | null;
  featuredSlotId: string | null;
  trending: HomeListData[];
  rising: RisingListData[];
  recommendations: HomeListData[];
}

export const EMPTY_HOME_DATA: HomeData = {
  featured: null,
  featuredSlotId: null,
  trending: [],
  rising: [],
  recommendations: [],
};

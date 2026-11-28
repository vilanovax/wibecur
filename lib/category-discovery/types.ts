/** موضوعات کشف دسته — میان‌بر پیشنهادی، نه فیلتر کلاسیک */

export type DiscoveryDimension =
  | 'cuisine'
  | 'area'
  | 'space'
  | 'occasion'
  | 'amenity';

export type ListTopicMatchLevel = 'strong' | 'weak' | 'none';

export type DiscoveryTopicDefinition = {
  slug: string;
  label: string;
  aliases: string[];
  dimension: DiscoveryDimension;
  /** ایموجی اختیاری برای چیپ */
  icon?: string;
};

export type DiscoveryTopicChip = {
  slug: string;
  label: string;
  dimension: DiscoveryDimension;
  icon?: string;
  /** تعداد لیست با match قوی */
  listCount: number;
  /** تعداد مکان یکتا */
  placeCount: number;
};

export type DiscoveryPlaceCard = {
  id: string;
  title: string;
  imageUrl?: string | null;
  displayImageUrl?: string;
  listSlug: string;
  listTitle: string;
  /** چند لیست این مکان را دارند (تقریبی در اسکن) */
  listAppearances: number;
  area?: string | null;
  /** محله استخراج‌شده برای فیلتر */
  areaLabel?: string | null;
  cuisine?: string | null;
  /** از لیست موضوعی آمده، نه لزوماً cuisine صریح */
  viaStrongList?: boolean;
};

export type DiscoveryAreaFacet = {
  label: string;
  count: number;
};

export type DiscoveryTopicBrowseResult = {
  topic: DiscoveryTopicChip;
  lists: import('@/types/category-page').CategoryListCard[];
  places: DiscoveryPlaceCard[];
  areaFacets: DiscoveryAreaFacet[];
  listCount: number;
  placeCount: number;
};

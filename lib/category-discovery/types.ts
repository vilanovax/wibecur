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
  cuisine?: string | null;
};

export type DiscoveryTopicBrowseResult = {
  topic: DiscoveryTopicChip;
  lists: import('@/types/category-page').CategoryListCard[];
  places: DiscoveryPlaceCard[];
  listCount: number;
  placeCount: number;
};

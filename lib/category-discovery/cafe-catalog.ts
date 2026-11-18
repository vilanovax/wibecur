import { normalizeDiscoveryText } from '@/lib/category-discovery/normalize';
import type { DiscoveryTopicDefinition } from '@/lib/category-discovery/types';

/**
 * کاتالوگ موضوعات کشف برای کافه/رستوران.
 * ابعاد برای سیستم‌اند؛ تگ‌های داخل‌شان پویا از دیتا تأیید می‌شوند.
 * شهر سطح‌بالا (تهران/شیراز/…) اینجا نیست — ExploreByCity جداست.
 */
export const CAFE_DISCOVERY_TOPICS: DiscoveryTopicDefinition[] = [
  // ——— نوع غذا ———
  {
    slug: 'sokhari',
    label: 'سوخاری',
    aliases: ['سوخاری', 'fried chicken'],
    dimension: 'cuisine',
    icon: '🍗',
  },
  {
    slug: 'burger',
    label: 'برگر',
    aliases: ['برگر', 'همبرگر', 'burger'],
    dimension: 'cuisine',
    icon: '🍔',
  },
  {
    slug: 'pizza',
    label: 'پیتزا',
    aliases: ['پیتزا', 'pizza'],
    dimension: 'cuisine',
    icon: '🍕',
  },
  {
    slug: 'italian',
    label: 'ایتالیایی',
    aliases: ['ایتالیایی', 'ایتالیا', 'italian', 'پاستا'],
    dimension: 'cuisine',
    icon: '🍝',
  },
  {
    slug: 'irani',
    label: 'ایرانی',
    aliases: ['ایرانی', 'سنتی', 'غذای سنتی', 'persian'],
    dimension: 'cuisine',
    icon: '🍲',
  },
  {
    slug: 'sushi',
    label: 'سوشی',
    aliases: ['سوشی', 'ژاپنی', 'sushi'],
    dimension: 'cuisine',
    icon: '🍣',
  },
  {
    slug: 'vegetarian',
    label: 'گیاهی',
    aliases: ['گیاهی', 'وگان', 'وژترین', 'vegetarian', 'vegan'],
    dimension: 'cuisine',
    icon: '🥗',
  },
  {
    slug: 'fastfood',
    label: 'فست‌فود',
    aliases: ['فست‌فود', 'فست فود', 'fast food', 'fastfood'],
    dimension: 'cuisine',
    icon: '🍟',
  },
  {
    slug: 'seafood',
    label: 'دریایی',
    aliases: ['دریایی', 'ماهی', 'میگو', 'seafood'],
    dimension: 'cuisine',
    icon: '🐟',
  },
  {
    slug: 'dessert',
    label: 'شیرینی و دسر',
    aliases: ['دسر', 'شیرینی', 'کیک', 'dessert', 'کافه کیک'],
    dimension: 'cuisine',
    icon: '🍰',
  },

  // ——— منطقه (نه شهر سطح‌بالا) ———
  {
    slug: 'west-tehran',
    label: 'غرب تهران',
    aliases: ['غرب تهران'],
    dimension: 'area',
    icon: '🧭',
  },
  {
    slug: 'east-tehran',
    label: 'شرق تهران',
    aliases: ['شرق تهران'],
    dimension: 'area',
    icon: '🧭',
  },
  {
    slug: 'north-tehran',
    label: 'شمال تهران',
    aliases: ['شمال تهران'],
    dimension: 'area',
    icon: '🧭',
  },
  {
    slug: 'center-tehran',
    label: 'مرکز تهران',
    aliases: ['مرکز تهران', 'downtown'],
    dimension: 'area',
    icon: '🧭',
  },
  {
    slug: 'saadatabad',
    label: 'سعادت‌آباد',
    aliases: ['سعادت‌آباد', 'سعادت اباد', 'saadatabad'],
    dimension: 'area',
  },
  {
    slug: 'vanak',
    label: 'ونک',
    aliases: ['ونک', 'vanak'],
    dimension: 'area',
  },
  {
    slug: 'jordan',
    label: 'جردن',
    aliases: ['جردن', 'jordan'],
    dimension: 'area',
  },
  {
    slug: 'pasdaran',
    label: 'پاسداران',
    aliases: ['پاسداران', 'pasdaran'],
    dimension: 'area',
  },
  {
    slug: 'lavasan',
    label: 'لواسان',
    aliases: ['لواسان', 'lavasan'],
    dimension: 'area',
  },
  {
    slug: 'tajrish',
    label: 'تجریش',
    aliases: ['تجریش', 'tajrish'],
    dimension: 'area',
  },

  // ——— فضا ———
  {
    slug: 'outdoor',
    label: 'روباز',
    aliases: ['روباز', 'فضای باز', 'حیاط‌دار', 'حیاط دار', 'outdoor', 'open air'],
    dimension: 'space',
    icon: '🌿',
  },
  {
    slug: 'cozy',
    label: 'دنج',
    aliases: ['دنج', 'آرام', 'ساکت', 'cozy'],
    dimension: 'space',
    icon: '🛋️',
  },
  {
    slug: 'view',
    label: 'ویو دار',
    aliases: ['ویو', 'چشم‌انداز', 'منظره', 'view'],
    dimension: 'space',
    icon: '🌇',
  },

  // ——— تجربه / مناسب برای ———
  {
    slug: 'breakfast',
    label: 'صبحانه',
    aliases: ['صبحانه', 'brunch', 'برانچ', 'breakfast'],
    dimension: 'occasion',
    icon: '🥐',
  },
  {
    slug: 'work',
    label: 'مناسب کار',
    aliases: ['مناسب کار', 'کار کردن', 'لپتاپ', 'remote work', 'کافه کار'],
    dimension: 'occasion',
    icon: '💻',
  },
  {
    slug: 'date',
    label: 'قرار دونفره',
    aliases: ['قرار', 'دونفره', 'عاشقانه', 'رومانتیک', 'date'],
    dimension: 'occasion',
    icon: '💕',
  },
  {
    slug: 'family',
    label: 'خانوادگی',
    aliases: ['خانوادگی', 'خانواده', 'بچه', 'family'],
    dimension: 'occasion',
    icon: '👨‍👩‍👧',
  },
  {
    slug: 'gathering',
    label: 'دورهمی',
    aliases: ['دورهمی', 'دوستانه', 'گروهی'],
    dimension: 'occasion',
    icon: '🎉',
  },

  // ——— امکانات ———
  {
    slug: 'live-music',
    label: 'موسیقی زنده',
    aliases: ['موسیقی زنده', 'لایو', 'live music'],
    dimension: 'amenity',
    icon: '🎵',
  },
  {
    slug: 'boardgame',
    label: 'بردگیم',
    aliases: ['بردگیم', 'بازی رومیزی', 'board game', 'boardgame'],
    dimension: 'amenity',
    icon: '🎲',
  },
  {
    slug: 'budget',
    label: 'اقتصادی',
    aliases: ['اقتصادی', 'ارزان', 'به‌صرفه', 'budget'],
    dimension: 'amenity',
    icon: '💸',
  },
  {
    slug: 'luxury',
    label: 'لوکس',
    aliases: ['لوکس', 'لاکچری', 'luxury', 'fine dining'],
    dimension: 'amenity',
    icon: '✨',
  },
];

const BY_SLUG = new Map(CAFE_DISCOVERY_TOPICS.map((t) => [t.slug, t]));

export function getCafeTopicBySlug(slug: string): DiscoveryTopicDefinition | null {
  return BY_SLUG.get(slug) ?? null;
}

/** پیدا کردن موضوع از label یا alias (مثلاً از query string) */
export function resolveCafeTopic(raw: string): DiscoveryTopicDefinition | null {
  const q = raw.trim();
  if (!q) return null;
  const bySlug = BY_SLUG.get(q);
  if (bySlug) return bySlug;

  const n = normalizeDiscoveryText(q);
  for (const topic of CAFE_DISCOVERY_TOPICS) {
    if (normalizeDiscoveryText(topic.label) === n) return topic;
    if (topic.aliases.some((a) => normalizeDiscoveryText(a) === n)) return topic;
  }
  for (const topic of CAFE_DISCOVERY_TOPICS) {
    const labelN = normalizeDiscoveryText(topic.label);
    if (labelN.length >= 3 && (n.includes(labelN) || labelN.includes(n))) return topic;
    for (const a of topic.aliases) {
      const an = normalizeDiscoveryText(a);
      if (an.length >= 3 && (n === an || n.includes(an))) return topic;
    }
  }
  return null;
}

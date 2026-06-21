/** کاتالوگ کلمات کلیدی علایق — ثابت در حافظه، بدون کوئری DB */

export type InterestKeywordGroup =
  | 'movie'
  | 'cafe'
  | 'book'
  | 'podcast'
  | 'lifestyle'
  | 'tech'
  | 'city';

export type InterestKeyword = {
  id: string;
  label: string;
  emoji: string;
  group: InterestKeywordGroup;
  /** برای تطبیق با tags/title لیست */
  aliases: string[];
};

export const INTEREST_KEYWORD_GROUP_LABELS: Record<InterestKeywordGroup, string> = {
  movie: 'فیلم و سریال',
  cafe: 'کافه و رستوران',
  book: 'کتاب',
  podcast: 'پادکست',
  lifestyle: 'لایف‌استایل',
  tech: 'ماشین و تکنولوژی',
  city: 'شهر',
};

export const INTEREST_KEYWORDS: InterestKeyword[] = [
  // فیلم
  { id: 'action', label: 'اکشن', emoji: '💥', group: 'movie', aliases: ['action', 'جنگی', 'مبارزه'] },
  { id: 'comedy', label: 'کمدی', emoji: '😂', group: 'movie', aliases: ['comedy', 'خنده'] },
  { id: 'drama', label: 'درام', emoji: '🎭', group: 'movie', aliases: ['drama'] },
  { id: 'horror', label: 'ترسناک', emoji: '👻', group: 'movie', aliases: ['horror', 'وحشت'] },
  { id: 'romance', label: 'عاشقانه', emoji: '💕', group: 'movie', aliases: ['romance', 'عشق', 'romantic'] },
  { id: 'scifi', label: 'علمی‌تخیلی', emoji: '🚀', group: 'movie', aliases: ['sci-fi', 'science fiction', 'فضایی'] },
  { id: 'animation', label: 'انیمیشن', emoji: '🎨', group: 'movie', aliases: ['animation', 'animated'] },
  { id: 'documentary', label: 'مستند', emoji: '📽️', group: 'movie', aliases: ['documentary', 'مستند'] },
  { id: 'mystery', label: 'معمایی', emoji: '🔍', group: 'movie', aliases: ['mystery', 'thriller', 'هیجان'] },
  { id: 'family-film', label: 'خانوادگی', emoji: '👨‍👩‍👧', group: 'movie', aliases: ['family', 'کودک', 'خانواده'] },
  // کافه
  { id: 'coffee', label: 'قهوه', emoji: '☕', group: 'cafe', aliases: ['coffee', 'کافه', 'cafe'] },
  { id: 'dessert', label: 'دسر', emoji: '🍰', group: 'cafe', aliases: ['dessert', 'شیرینی', 'کیک'] },
  { id: 'breakfast', label: 'صبحانه', emoji: '🥐', group: 'cafe', aliases: ['breakfast', 'brunch'] },
  { id: 'restaurant', label: 'رستوران', emoji: '🍽️', group: 'cafe', aliases: ['restaurant', 'غذا'] },
  { id: 'fastfood', label: 'فست‌فود', emoji: '🍔', group: 'cafe', aliases: ['fast food', 'fastfood', 'برگر'] },
  { id: 'outdoor-cafe', label: 'فضای باز', emoji: '🌿', group: 'cafe', aliases: ['rooftop', 'بام', 'تراس'] },
  // کتاب
  { id: 'novel', label: 'رمان', emoji: '📖', group: 'book', aliases: ['novel', 'fiction', 'داستان'] },
  { id: 'nonfiction', label: 'غیرداستانی', emoji: '📘', group: 'book', aliases: ['nonfiction', 'non-fiction'] },
  { id: 'self-help', label: 'خودیاری', emoji: '🌟', group: 'book', aliases: ['self-help', 'self help', 'رشد فردی'] },
  { id: 'history', label: 'تاریخی', emoji: '🏛️', group: 'book', aliases: ['history', 'تاریخ'] },
  { id: 'psychology', label: 'روانشناسی', emoji: '🧠', group: 'book', aliases: ['psychology', 'روان'] },
  // پادکست
  { id: 'true-crime', label: 'جنایی واقعی', emoji: '🕵️', group: 'podcast', aliases: ['true crime', 'crime'] },
  { id: 'interview', label: 'مصاحبه', emoji: '🎙️', group: 'podcast', aliases: ['interview', 'گفتگو'] },
  { id: 'storytelling', label: 'داستان‌گویی', emoji: '📻', group: 'podcast', aliases: ['storytelling', 'روایت'] },
  // لایف‌استایل
  { id: 'travel', label: 'سفر', emoji: '✈️', group: 'lifestyle', aliases: ['travel', 'گردشگری', 'سفر'] },
  { id: 'fitness', label: 'ورزش', emoji: '💪', group: 'lifestyle', aliases: ['fitness', 'sport', 'ورزش'] },
  { id: 'music', label: 'موسیقی', emoji: '🎵', group: 'lifestyle', aliases: ['music', 'آلبوم'] },
  { id: 'gaming', label: 'بازی', emoji: '🎮', group: 'lifestyle', aliases: ['gaming', 'game', 'بازی'] },
  { id: 'wellness', label: 'سلامت', emoji: '🧘', group: 'lifestyle', aliases: ['wellness', 'health', 'سلامت'] },
  // تکنولوژی
  { id: 'cars', label: 'ماشین', emoji: '🚗', group: 'tech', aliases: ['car', 'cars', 'خودرو'] },
  { id: 'gadgets', label: 'گجت', emoji: '📱', group: 'tech', aliases: ['gadget', 'tech', 'موبایل'] },
  { id: 'ai', label: 'هوش مصنوعی', emoji: '🤖', group: 'tech', aliases: ['ai', 'artificial intelligence'] },
  // شهر
  { id: 'tehran', label: 'تهران', emoji: '🏙️', group: 'city', aliases: ['tehran', 'تهران'] },
  { id: 'isfahan', label: 'اصفهان', emoji: '🕌', group: 'city', aliases: ['isfahan', 'esfahan', 'اصفهان'] },
  { id: 'shiraz', label: 'شیراز', emoji: '🌹', group: 'city', aliases: ['shiraz', 'شیراز'] },
  { id: 'mashhad', label: 'مشهد', emoji: '🕋', group: 'city', aliases: ['mashhad', 'مشهد'] },
  { id: 'tabriz', label: 'تبریز', emoji: '🏔️', group: 'city', aliases: ['tabriz', 'تبریز'] },
];

const KEYWORD_BY_ID = new Map(INTEREST_KEYWORDS.map((k) => [k.id, k]));

/** نگاشت دسته → کلمات پیش‌فرض برای بازدید صفحه دسته */
export const CATEGORY_DEFAULT_KEYWORD_IDS: Record<string, string[]> = {
  movie: ['action', 'comedy', 'drama', 'romance'],
  book: ['novel', 'nonfiction', 'self-help'],
  cafe: ['coffee', 'dessert', 'restaurant'],
  podcast: ['interview', 'storytelling', 'true-crime'],
  lifestyle: ['travel', 'fitness', 'music'],
  tech: ['cars', 'gadgets', 'ai'],
};

const ALIAS_TO_ID = new Map<string, string>();
for (const kw of INTEREST_KEYWORDS) {
  ALIAS_TO_ID.set(kw.id.toLowerCase(), kw.id);
  ALIAS_TO_ID.set(kw.label.toLowerCase(), kw.id);
  for (const alias of kw.aliases) {
    ALIAS_TO_ID.set(alias.toLowerCase(), kw.id);
  }
}

export function isValidInterestKeywordId(id: string): boolean {
  return KEYWORD_BY_ID.has(id);
}

/** تبدیل tag/label خام به id کانonical — null اگر در کاتالوگ نباشد */
export function resolveInterestKeywordId(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  return ALIAS_TO_ID.get(trimmed) ?? null;
}

export function getInterestKeyword(id: string): InterestKeyword | undefined {
  return KEYWORD_BY_ID.get(id);
}

export type KeywordMatchableList = {
  title: string;
  subtitle?: string | null;
  tags?: string[];
  category?: { name?: string | null; slug?: string | null } | null;
};

function buildHaystack(list: KeywordMatchableList): string {
  return [
    list.title,
    list.subtitle ?? '',
    list.category?.name ?? '',
    ...(list.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();
}

/** امتیاز تطبیق لیست با مجموعه keyword id — O(keywords × terms) */
export function scoreListKeywordMatch(list: KeywordMatchableList, keywordIds: string[]): number {
  if (keywordIds.length === 0) return 0;
  const haystack = buildHaystack(list);
  let score = 0;

  for (const id of keywordIds) {
    const kw = KEYWORD_BY_ID.get(id);
    if (!kw) continue;
    const terms = [kw.label, kw.id, ...kw.aliases].map((t) => t.toLowerCase());
    if (terms.some((t) => t.length >= 2 && haystack.includes(t))) {
      score += 1;
    }
  }
  return score;
}

export function groupInterestKeywords(): {
  group: InterestKeywordGroup;
  label: string;
  keywords: InterestKeyword[];
}[] {
  const groups = Object.keys(INTEREST_KEYWORD_GROUP_LABELS) as InterestKeywordGroup[];
  return groups.map((group) => ({
    group,
    label: INTEREST_KEYWORD_GROUP_LABELS[group],
    keywords: INTEREST_KEYWORDS.filter((k) => k.group === group),
  }));
}

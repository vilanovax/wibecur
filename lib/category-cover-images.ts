/**
 * تصاویر بنر/کاور متناسب با دسته — نسخهٔ محلی (same-origin)
 * منبع اصلی: Wikimedia Commons — scripts/download-category-banners.mjs
 */

const LOCAL = '/images/banners';

const B = {
  books: `${LOCAL}/books.webp`,
  books2: `${LOCAL}/books-2.webp`,
  books3: `${LOCAL}/books-3.webp`,
  books4: `${LOCAL}/history.webp`,
  personalDevelopment: `${LOCAL}/personal-development.webp`,
  movies: `${LOCAL}/movies.webp`,
  movies2: `${LOCAL}/movies-2.webp`,
  movies3: `${LOCAL}/movies-3.webp`,
  movies4: `${LOCAL}/movies-4.webp`,
  movies5: `${LOCAL}/movies-5.webp`,
  movies6: `${LOCAL}/movies-6.webp`,
  cafe: `${LOCAL}/cafe.webp`,
  cafe2: `${LOCAL}/cafe-2.webp`,
  cafe3: `${LOCAL}/cafe-3.webp`,
  restaurant: `${LOCAL}/restaurant.webp`,
  restaurant2: `${LOCAL}/restaurant-2.webp`,
  restaurant3: `${LOCAL}/restaurant-3.webp`,
  podcast: `${LOCAL}/podcast.webp`,
  travel: `${LOCAL}/travel.webp`,
  lifestyle: `${LOCAL}/lifestyle.webp`,
  car: `${LOCAL}/car.webp`,
  philosophy: `${LOCAL}/philosophy.webp`,
  cozy: `${LOCAL}/cozy.webp`,
  history: `${LOCAL}/history.webp`,
  mystery: `${LOCAL}/mystery.webp`,
  fantasy: `${LOCAL}/fantasy.webp`,
  default: `${LOCAL}/default.webp`,
} as const;

/** مجموعهٔ تصاویر متنوع — فقط فایل‌های موجود در public/images/banners */
export const CATEGORY_COVER_VARIANTS: Record<string, readonly string[]> = {
  movies: [B.movies, B.movies2, B.movies3, B.movies4, B.movies5, B.movies6, B.cozy, B.lifestyle],
  movie: [B.movies, B.movies2, B.movies3, B.movies4, B.movies5, B.movies6, B.cozy, B.lifestyle],
  film: [B.movies, B.movies2, B.movies3, B.movies4, B.movies5, B.movies6, B.cozy, B.lifestyle],
  books: [B.books, B.books2, B.books3, B.books4, B.personalDevelopment, B.philosophy, B.history, B.mystery, B.fantasy, B.cozy],
  book: [B.books, B.books2, B.books3, B.books4, B.personalDevelopment, B.philosophy, B.history, B.mystery, B.fantasy, B.cozy],
  cafe: [B.cafe, B.cafe2, B.cafe3, B.restaurant, B.restaurant2, B.cozy],
  cafes: [B.cafe, B.cafe2, B.cafe3, B.restaurant, B.restaurant2, B.cozy],
  restaurant: [B.restaurant, B.restaurant2, B.restaurant3, B.cafe, B.cafe2],
  restaurants: [B.restaurant, B.restaurant2, B.restaurant3, B.cafe, B.cafe2],
  podcast: [B.podcast, B.lifestyle],
  podcasts: [B.podcast, B.lifestyle],
  lifestyle: [B.lifestyle, B.cozy, B.travel],
  travel: [B.travel, B.lifestyle],
  car: [B.car, B.lifestyle],
  tech: [B.car, B.lifestyle],
  default: [B.default, B.books, B.movies, B.cafe, B.cozy, B.travel],
};

/** کاور پیش‌فرض هر دسته (اولین variant) */
export const CATEGORY_COVER_IMAGES: Record<string, string> = {
  movies: B.movies,
  movie: B.movies,
  film: B.movies,
  books: B.books,
  book: B.books,
  cafe: B.cafe,
  cafes: B.cafe,
  restaurant: B.restaurant,
  restaurants: B.restaurant,
  podcast: B.podcast,
  podcasts: B.podcast,
  lifestyle: B.lifestyle,
  travel: B.travel,
  car: B.car,
  tech: B.car,
};

/** کاور اختصاصی برای slug لیست‌های seed — هر لیست تصویر متفاوت */
export const LIST_TOPIC_COVER_IMAGES: Record<string, string> = {
  // کتاب
  'personal-development-books': B.personalDevelopment,
  'contemporary-persian-literature': B.books4,
  'fascinating-history-books': B.history,
  'mystery-crime-novels': B.mystery,
  'simple-philosophy-books': B.philosophy,
  'business-startup-books': B.books3,
  'epic-fantasy-novels': B.fantasy,
  'applied-psychology-books': B.books2,
  'sleep-inducing-books': B.cozy,
  'top-romance-novels': B.books4,
  // فیلم
  'best-romantic-movies-2025': B.movies3,
  'movies-before-sleep': B.cozy,
  'korean-dramas-must-watch': B.movies2,
  'studio-ghibli-animations': B.movies4,
  'psychological-thrillers': B.movies5,
  'iranian-cinema': B.movies6,
  'inspiring-documentaries': B.movies2,
  '90s-action-movies': B.movies5,
  'top-scifi-series': B.movies4,
  'family-comedy-movies': B.movies6,
  // کافه و رستوران — هر slug کاور یکتا (بدون تکرار cafe-2 روی دو لیست)
  'great-breakfast-cafes': B.cafe2,
  'cozy-cafes-for-studying': B.cozy,
  'instagrammable-cafes': B.cafe,
  'traditional-iranian-restaurants': B.restaurant2,
  'seafood-restaurants': B.restaurant3,
  'vegan-vegetarian-restaurants-tehran': B.restaurant,
  'cafes-with-great-views': B.cafe3,
  'quality-fast-food-restaurants': B.restaurant2,
  'authentic-italian-restaurants': B.restaurant3,
  'best-outdoor-cafes-tehran': B.cafe2,
};

/** نگاشت id دسته در mock explore */
export const CURATED_CATEGORY_SLUGS: Record<string, string> = {
  cat1: 'movies',
  cat2: 'cafe',
  cat3: 'books',
  cat4: 'podcast',
  cat5: 'travel',
};

export const DEFAULT_CATEGORY_COVER = B.default;

export function normalizeCategorySlug(slug?: string | null): string | null {
  if (!slug || typeof slug !== 'string') return null;
  return slug.trim().toLowerCase();
}

/** hash ساده برای انتخاب پایدار variant */
export function hashCoverSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** انتخاب تصویر متنوع از pool دسته بر اساس slug/عنوان */
export function pickCategoryCoverVariant(
  categorySlug: string | null | undefined,
  seed: string | null | undefined
): string {
  const key = normalizeCategorySlug(categorySlug) ?? 'default';
  const pool = CATEGORY_COVER_VARIANTS[key] ?? CATEGORY_COVER_VARIANTS.default;
  const s = (seed ?? key).trim() || key;
  return pool[hashCoverSeed(s) % pool.length];
}

/** basename بنر محلی → دسته‌هایی که آن تصویر برایشان قابل‌اعتماد است */
const BANNER_BASENAME_CATEGORIES: Record<string, readonly string[]> = {
  'car.webp': ['car', 'tech'],
  // نام‌های اشتباه تاریخی (خودرو به‌جای کافه) — فقط car/tech
  'wey_coffee_02': ['car', 'tech'],
  'cafe.webp': ['cafe', 'cafes', 'restaurant', 'restaurants', 'lifestyle', 'default'],
  'cafe-2.webp': ['cafe', 'cafes', 'restaurant', 'restaurants', 'lifestyle', 'default'],
  'cafe-3.webp': ['cafe', 'cafes', 'restaurant', 'restaurants', 'lifestyle', 'default'],
  'restaurant.webp': ['cafe', 'cafes', 'restaurant', 'restaurants', 'lifestyle', 'default'],
  'restaurant-2.webp': ['cafe', 'cafes', 'restaurant', 'restaurants', 'lifestyle', 'default'],
  'restaurant-3.webp': ['cafe', 'cafes', 'restaurant', 'restaurants', 'lifestyle', 'default'],
  'movies.webp': ['movies', 'movie', 'film', 'lifestyle', 'default'],
  'movies-2.webp': ['movies', 'movie', 'film', 'lifestyle', 'default'],
  'movies-3.webp': ['movies', 'movie', 'film', 'lifestyle', 'default'],
  'movies-4.webp': ['movies', 'movie', 'film', 'lifestyle', 'default'],
  'movies-5.webp': ['movies', 'movie', 'film', 'lifestyle', 'default'],
  'movies-6.webp': ['movies', 'movie', 'film', 'lifestyle', 'default'],
  'books.webp': ['books', 'book', 'lifestyle', 'default'],
  'books-2.webp': ['books', 'book', 'lifestyle', 'default'],
  'books-3.webp': ['books', 'book', 'lifestyle', 'default'],
  'history.webp': ['books', 'book', 'lifestyle', 'default'],
  'personal-development.webp': ['books', 'book', 'lifestyle', 'default'],
  'philosophy.webp': ['books', 'book', 'lifestyle', 'default'],
  'mystery.webp': ['books', 'book', 'lifestyle', 'default'],
  'fantasy.webp': ['books', 'book', 'lifestyle', 'default'],
  'podcast.webp': ['podcast', 'podcasts', 'lifestyle', 'default'],
  'travel.webp': ['travel', 'lifestyle', 'cafe', 'cafes', 'default'],
  'lifestyle.webp': ['lifestyle', 'travel', 'cafe', 'cafes', 'restaurant', 'restaurants', 'default'],
  'cozy.webp': [
    'lifestyle',
    'books',
    'book',
    'movies',
    'movie',
    'film',
    'cafe',
    'cafes',
    'default',
  ],
  'default.webp': ['default'],
};

function bannerBasename(url: string): string | null {
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0] ?? url;
    return path.split('/').pop()?.toLowerCase() ?? null;
  } catch {
    return url.split('/').pop()?.toLowerCase() ?? null;
  }
}

/**
 * بنر محلیِ ناسازگار با دسته (مثلاً car.webp روی لیست کافه) را رد می‌کند.
 * کاور آپلودشدهٔ کاربر بدون basename بنر را همیشه می‌پذیرد.
 */
export function isBannerCompatibleWithCategory(
  coverUrl: string | null | undefined,
  categorySlug?: string | null
): boolean {
  if (!coverUrl?.trim()) return true;
  const t = coverUrl.trim().toLowerCase();
  if (!t.includes('/images/banners/')) return true;

  const file = bannerBasename(t);
  if (!file) return true;

  const allowed = BANNER_BASENAME_CATEGORIES[file];
  if (!allowed) return true;

  const cat = normalizeCategorySlug(categorySlug);
  if (!cat) return true;

  return allowed.includes(cat);
}

export function getCategoryCoverUrl(categorySlug?: string | null): string {
  const key = normalizeCategorySlug(categorySlug);
  if (key && CATEGORY_COVER_IMAGES[key]) {
    return CATEGORY_COVER_IMAGES[key];
  }
  return DEFAULT_CATEGORY_COVER;
}

/** نگاشت عنوان فارسی/انگلیسی → تصویر اختصاصی */
function getListTopicCoverFromTitle(
  title?: string | null,
  categorySlug?: string | null
): string | null {
  if (!title?.trim()) return null;
  const t = title.toLowerCase();

  // فیلم
  if (/آرامش|قبل.?خواب|sleep|calm/.test(t)) return pickCategoryCoverVariant('movies', t);
  if (/مستند|documentary|inspir/.test(t)) return B.movies2;
  if (/اکشن|action|۹۰|90/.test(t)) return B.movies5;
  if (/کره|korean|k-drama/.test(t)) return B.movies3;
  if (/انیمیشن|جیبلی|ghibli|animation/.test(t)) return B.movies4;
  if (/تریلر|thriller|روانشناخ/.test(t)) return B.movies5;
  if (/ایران|iranian|سینمای/.test(t)) return B.movies6;
  if (/عاشق|romantic|romance/.test(t)) return B.movies3;
  if (/علمی|sci.?fi|تخیلی/.test(t)) return B.movies4;
  if (/کمدی|comedy|خانوادگ/.test(t)) return B.movies6;
  if (/فیلم|سریال|movie|cinema/.test(t)) {
    return pickCategoryCoverVariant('movies', t);
  }

  // کتاب
  if (/توسعه.?فردی|خودیاری|personal.?development/.test(t)) return B.personalDevelopment;
  if (/تاریخ|history/.test(t)) return B.history;
  if (/معما|جنایی|mystery|crime/.test(t)) return B.mystery;
  if (/فلسف|philosophy/.test(t)) return B.philosophy;
  if (/فانتزی|fantasy|حماس/.test(t)) return B.fantasy;
  if (/روانشناس|psychology/.test(t)) return B.books2;
  if (/شعر|ادبیات|literature|poetry/.test(t)) return B.books4;
  if (/خواب|sleep|آرام/.test(t)) return B.cozy;
  if (/کسب.?و.?کار|startup|business/.test(t)) return B.books3;
  if (/رمان|کتاب|novel|book/.test(t)) {
    return pickCategoryCoverVariant('books', t);
  }

  // کافه و رستوران
  if (/صبحانه|breakfast/.test(t)) return B.cafe2;
  if (/دنج|درس|studying|مطالعه|cozy/.test(t)) return B.cozy;
  if (/اینستاگرام|instagram/.test(t)) return B.cafe;
  if (/سنتی|traditional|ایرانی/.test(t)) return B.restaurant2;
  if (/دریایی|seafood|ماهی/.test(t)) return B.restaurant3;
  if (/ایتالیایی|italian/.test(t)) return B.restaurant3;
  if (/وگان|vegetarian|گیاه/.test(t)) return B.restaurant;
  if (/منظره|view|roof/.test(t)) return B.cafe3;
  if (/فست.?فود|fast.?food/.test(t)) return B.restaurant2;
  if (/کافه|caf[eé]|coffee/.test(t)) return pickCategoryCoverVariant('cafe', t);
  if (/رستوران|restaurant|غذا|food/.test(t)) {
    return pickCategoryCoverVariant('restaurant', t);
  }

  if (categorySlug) {
    return pickCategoryCoverVariant(categorySlug, title);
  }

  return null;
}

/** کاور پین‌شدهٔ seed — همیشه بر DB/آپلود اشتباه اولویت دارد */
export function getPinnedListTopicCover(listSlug?: string | null): string | null {
  const key = normalizeCategorySlug(listSlug);
  if (!key) return null;
  return LIST_TOPIC_COVER_IMAGES[key] ?? null;
}

export function getListTopicCoverUrl(
  listSlug?: string | null,
  categorySlug?: string | null,
  listTitle?: string | null
): string | null {
  const pinned = getPinnedListTopicCover(listSlug);
  if (pinned) return pinned;

  const key = normalizeCategorySlug(listSlug);

  const seed = key ?? listTitle?.trim() ?? '';

  if (
    key &&
    (key.includes('personal-development') ||
      key.includes('psychology') ||
      key.includes('self-help'))
  ) {
    return B.personalDevelopment;
  }
  if (key?.includes('philosophy')) return B.philosophy;
  if (key?.includes('history')) return B.history;
  if (key?.includes('mystery') || key?.includes('crime')) return B.mystery;
  if (key?.includes('fantasy')) return B.fantasy;
  if (key?.includes('romance') || key?.includes('sleep') || key?.includes('cozy')) {
    return key.includes('sleep') || key.includes('cozy') ? B.cozy : pickCategoryCoverVariant('books', seed);
  }
  if (
    key &&
    (key.includes('book') || key.includes('novel') || key.includes('literature'))
  ) {
    return pickCategoryCoverVariant('books', seed);
  }
  if (
    key &&
    (key.includes('movie') ||
      key.includes('film') ||
      key.includes('cinema') ||
      key.includes('drama'))
  ) {
    return pickCategoryCoverVariant('movies', seed);
  }
  if (key?.includes('cafe') || key?.includes('coffee')) {
    return pickCategoryCoverVariant('cafe', seed);
  }
  if (key?.includes('restaurant') || key?.includes('food')) {
    return pickCategoryCoverVariant('restaurant', seed);
  }
  if (key?.includes('podcast')) return pickCategoryCoverVariant('podcast', seed);
  if (key?.includes('travel') || key?.includes('suitcase')) {
    return pickCategoryCoverVariant('travel', seed);
  }

  const fromTitle = getListTopicCoverFromTitle(listTitle, categorySlug);
  if (fromTitle) return fromTitle;

  if (categorySlug) {
    return pickCategoryCoverVariant(categorySlug, seed || listTitle || categorySlug);
  }

  return null;
}

export function getCategoryHeroImageUrl(categorySlug?: string | null): string {
  return getCategoryCoverUrl(categorySlug);
}

/** حدس دسته از عنوان فارسی/انگلیسی */
export function inferCategorySlugFromTitle(title?: string | null): string | null {
  if (!title) return null;
  const t = title.toLowerCase();
  if (/فیلم|سریال|movie|cinema|انیمیشن|کره|documentary|مستند/.test(t)) return 'movies';
  if (/کتاب|رمان|novel|خودیاری|توسعه فردی|فلسف|روانشناس|literature/.test(t)) return 'books';
  if (/کافه|رستوران|caf[eé]|restaurant|صبحانه|غذا|italian|seafood/.test(t)) return 'cafe';
  if (/پادکست|podcast|میکروفون/.test(t)) return 'podcast';
  if (/سفر|travel|هتل|مقصد/.test(t)) return 'travel';
  if (/ماشین|خودرو|car|tech|تکنول/.test(t)) return 'car';
  if (/لایف|lifestyle|سبک زند|yoga/.test(t)) return 'lifestyle';
  return null;
}

export function getCuratedCategoryCoverUrl(categoryId: string): string {
  const slug = CURATED_CATEGORY_SLUGS[categoryId];
  return slug ? getCategoryCoverUrl(slug) : DEFAULT_CATEGORY_COVER;
}

/** گرادیان fallback وقتی تصویر لود نشود — متنوع بر اساس seed */
const CATEGORY_COVER_GRADIENTS: Record<string, readonly string[]> = {
  movies: ['from-amber-500 to-red-800', 'from-rose-500 to-orange-800', 'from-red-500 to-stone-800'],
  movie: ['from-amber-500 to-red-800', 'from-rose-500 to-orange-800', 'from-red-500 to-stone-800'],
  film: ['from-amber-500 to-red-800', 'from-rose-500 to-orange-800', 'from-red-500 to-stone-800'],
  books: ['from-orange-400 to-amber-700', 'from-rose-400 to-orange-600', 'from-amber-500 to-red-700'],
  book: ['from-orange-400 to-amber-700', 'from-rose-400 to-orange-600', 'from-amber-500 to-red-700'],
  cafe: ['from-amber-400 to-orange-600', 'from-yellow-500 to-amber-700', 'from-orange-400 to-red-600'],
  cafes: ['from-amber-400 to-orange-600', 'from-yellow-500 to-amber-700', 'from-orange-400 to-red-600'],
  restaurant: ['from-red-400 to-orange-700', 'from-rose-500 to-red-700', 'from-amber-500 to-orange-700'],
  restaurants: ['from-red-400 to-orange-700', 'from-rose-500 to-red-700', 'from-amber-500 to-orange-700'],
  podcast: ['from-pink-400 to-rose-700', 'from-rose-500 to-red-800', 'from-orange-400 to-rose-700'],
  podcasts: ['from-pink-400 to-rose-700', 'from-rose-500 to-red-800', 'from-orange-400 to-rose-700'],
  travel: ['from-sky-400 to-blue-700', 'from-teal-400 to-sky-700', 'from-blue-400 to-slate-700'],
  lifestyle: ['from-emerald-400 to-teal-700', 'from-green-400 to-teal-700', 'from-lime-500 to-emerald-700'],
  car: ['from-slate-500 to-zinc-800', 'from-stone-500 to-slate-800', 'from-blue-500 to-slate-800'],
  tech: ['from-slate-500 to-zinc-800', 'from-stone-500 to-slate-800', 'from-blue-500 to-slate-800'],
  default: ['from-slate-400 to-slate-700', 'from-stone-400 to-stone-700', 'from-zinc-400 to-zinc-700'],
};

export function pickCategoryCoverGradient(
  categorySlug?: string | null,
  seed?: string | null
): string {
  const key = normalizeCategorySlug(categorySlug) ?? 'default';
  const pool = CATEGORY_COVER_GRADIENTS[key] ?? CATEGORY_COVER_GRADIENTS.default;
  const s = (seed ?? key).trim() || key;
  return pool[hashCoverSeed(s) % pool.length];
}

/** برای slugهای داینامیک seed (list-1764...) */
export function resolveCoverByListMeta(input: {
  slug: string;
  title: string;
  categorySlug?: string | null;
}): string {
  const topic = getListTopicCoverUrl(input.slug, input.categorySlug, input.title);
  if (topic) return topic;
  const inferred = inferCategorySlugFromTitle(input.title);
  if (inferred) return pickCategoryCoverVariant(inferred, input.slug || input.title);
  if (input.categorySlug) return pickCategoryCoverVariant(input.categorySlug, input.slug || input.title);
  return pickCategoryCoverVariant('default', input.slug || input.title);
}

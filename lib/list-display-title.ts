/** عنوان نمایشی فارسی برای لیست‌ها — جایگزین عنوان‌های انگلیسی در UI */

const PERSIAN_CHAR_RE = /[\u0600-\u06FF]/g;
const LATIN_CHAR_RE = /[a-zA-Z]/g;

export function toPersianDigits(input: string): string {
  return input.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)] ?? d);
}

/** عنوان عمدتاً لاتین — در UI فارسی localize شود */
export function isMostlyLatinTitle(title: string): boolean {
  const trimmed = title.trim();
  if (trimmed.length < 3) return false;

  const persian = (trimmed.match(PERSIAN_CHAR_RE) || []).length;
  const latin = (trimmed.match(LATIN_CHAR_RE) || []).length;
  PERSIAN_CHAR_RE.lastIndex = 0;
  LATIN_CHAR_RE.lastIndex = 0;

  return latin >= 4 && persian < 3;
}

/** نگاشت slug → عنوان فارسی (seed + لیست‌های اصلی) */
export const LIST_SLUG_FA_TITLES: Record<string, string> = {
  'movies-before-sleep': 'فیلم‌های قبل خواب',
  'best-romantic-movies-2025': 'بهترین فیلم‌های عاشقانه ۲۰۲۵',
  'korean-dramas-must-watch': 'سریال‌های کره‌ای پیشنهادی',
  'studio-ghibli-animations': 'انیمیشن‌های استودیو جیبلی',
  'psychological-thrillers': 'بهترین تریلرهای روانشناختی',
  'iranian-cinema': 'فیلم‌های سینمای ایران',
  'inspiring-documentaries': 'مستندهای الهام‌بخش',
  '90s-action-movies': 'فیلم‌های اکشن دهه ۹۰',
  'top-scifi-series': 'سریال‌های علمی‌تخیلی برتر',
  'family-comedy-movies': 'فیلم‌های کمدی خانوادگی',
  'personal-development-books': 'کتاب‌های توسعه فردی',
  'contemporary-persian-literature': 'شعر و ادبیات معاصر ایران',
  'fascinating-history-books': 'کتاب‌های تاریخی جذاب',
  'mystery-crime-novels': 'رمان‌های معمایی و جنایی',
  'simple-philosophy-books': 'کتاب‌های فلسفی ساده',
  'business-startup-books': 'کتاب‌های کسب‌وکار و استارتاپ',
  'epic-fantasy-novels': 'رمان‌های فانتزی حماسی',
  'applied-psychology-books': 'کتاب‌های روانشناسی کاربردی',
  'sleep-inducing-books': 'کتاب‌های خواب‌آور',
  'top-romance-novels': 'رمان‌های عاشقانه برتر',
  'seafood-restaurants': 'رستوران‌های دریایی و ماهی',
  'great-breakfast-cafes': 'کافه‌های صبحانه عالی',
  'vegan-vegetarian-restaurants-tehran': 'رستوران‌های گیاهخواری تهران',
  'cafes-with-great-views': 'کافه‌های با منظره زیبا',
  'quality-fast-food-restaurants': 'رستوران‌های فست‌فود کیفیتی',
  'instagrammable-cafes': 'کافه‌های اینستاگرامی',
  'authentic-italian-restaurants': 'رستوران‌های ایتالیایی اصیل',
  'cozy-cafes-for-studying': 'کافه‌های دنج برای مطالعه',
  'traditional-iranian-restaurants': 'رستوران‌های غذای ایرانی سنتی',
  'best-outdoor-cafes-tehran': 'بهترین کافه‌های روباز تهران',
};

const SLUG_TOKEN_FA: Record<string, string> = {
  movies: 'فیلم',
  movie: 'فیلم',
  film: 'فیلم',
  films: 'فیلم',
  books: 'کتاب',
  book: 'کتاب',
  cafe: 'کافه',
  cafes: 'کافه',
  restaurant: 'رستوران',
  restaurants: 'رستوران',
  relaxing: 'آرامش‌بخش',
  calming: 'آرامش‌بخش',
  sleep: 'خواب',
  before: 'قبل',
  best: 'بهترین',
  top: 'برتر',
  great: 'عالی',
  cozy: 'دنج',
  romantic: 'عاشقانه',
  romance: 'عاشقانه',
  comedy: 'کمدی',
  action: 'اکشن',
  thriller: 'تریلر',
  documentary: 'مستند',
  documentaries: 'مستند',
  korean: 'کره‌ای',
  drama: 'درام',
  dramas: 'درام',
  scifi: 'علمی‌تخیلی',
  fantasy: 'فانتزی',
  mystery: 'معما',
  history: 'تاریخ',
  philosophy: 'فلسفه',
  psychology: 'روانشناسی',
  travel: 'سفر',
  podcast: 'پادکست',
  breakfast: 'صبحانه',
  seafood: 'دریایی',
  italian: 'ایتالیایی',
  vegan: 'گیاهخواری',
  vegetarian: 'گیاهخواری',
  traditional: 'سنتی',
  iranian: 'ایرانی',
  outdoor: 'روباز',
  tehran: 'تهران',
  inspiring: 'الهام‌بخش',
  family: 'خانوادگی',
  psychological: 'روانشناختی',
  animations: 'انیمیشن',
  animation: 'انیمیشن',
  ghibli: 'جیبلی',
  studio: 'استودیو',
  personal: 'شخصی',
  development: 'توسعه',
  business: 'کسب‌وکار',
  startup: 'استارتاپ',
  applied: 'کاربردی',
  inducing: 'خواب‌آور',
  crime: 'جنایی',
  novels: 'رمان',
  novel: 'رمان',
  literature: 'ادبیات',
  persian: 'ایرانی',
  contemporary: 'معاصر',
  fascinating: 'جذاب',
  simple: 'ساده',
  epic: 'حماسی',
  must: '',
  watch: '',
  for: '',
  and: 'و',
  with: 'با',
  the: '',
  a: '',
  of: '',
};

type EnPattern = {
  pattern: RegExp;
  format: (match: RegExpMatchArray) => string;
};

const EN_TITLE_PATTERNS: EnPattern[] = [
  {
    pattern: /^relaxing\s+movies?\s*(\d+)?$/i,
    format: (m) =>
      m[1] ? `فیلم‌های آرامش‌بخش ${toPersianDigits(m[1])}` : 'فیلم‌های آرامش‌بخش',
  },
  {
    pattern: /^calming\s+movies?\s*(\d+)?$/i,
    format: (m) =>
      m[1] ? `فیلم‌های آرامش‌بخش ${toPersianDigits(m[1])}` : 'فیلم‌های آرامش‌بخش',
  },
  {
    pattern: /^movies?\s+before\s+sleep$/i,
    format: () => 'فیلم‌های قبل خواب',
  },
  {
    pattern: /^best\s+(.+?)\s+movies?\s*(\d{4})?$/i,
    format: (m) => {
      const topic = translateTokenSequence(m[1]);
      const year = m[2] ? ` ${toPersianDigits(m[2])}` : '';
      return `بهترین فیلم‌های ${topic}${year}`.replace(/\s+/g, ' ').trim();
    },
  },
  {
    pattern: /^top\s+(.+?)\s+(movies?|books?|cafes?|restaurants?)$/i,
    format: (m) => {
      const topic = translateTokenSequence(m[1]);
      const kind = m[2].toLowerCase().startsWith('book')
        ? 'کتاب‌های'
        : m[2].toLowerCase().startsWith('cafe')
          ? 'کافه‌های'
          : m[2].toLowerCase().startsWith('restaurant')
            ? 'رستوران‌های'
            : 'فیلم‌های';
      return `${kind} ${topic}`.replace(/\s+/g, ' ').trim();
    },
  },
  {
    pattern: /^(.+?)\s+(movies?|books?|cafes?|restaurants?)\s*(\d+)?$/i,
    format: (m) => {
      const topic = translateTokenSequence(m[1]);
      const kind = m[2].toLowerCase().startsWith('book')
        ? 'کتاب‌های'
        : m[2].toLowerCase().startsWith('cafe')
          ? 'کافه‌های'
          : m[2].toLowerCase().startsWith('restaurant')
            ? 'رستوران‌های'
            : 'فیلم‌های';
      const suffix = m[3] ? ` ${toPersianDigits(m[3])}` : '';
      return `${kind} ${topic}${suffix}`.replace(/\s+/g, ' ').trim();
    },
  },
];

function translateTokenSequence(raw: string): string {
  return raw
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((token) => SLUG_TOKEN_FA[token.toLowerCase()] ?? token)
    .filter(Boolean)
    .join(' ');
}

function inferTitleFromSlug(slug: string): string | null {
  const key = slug.trim().toLowerCase();
  if (LIST_SLUG_FA_TITLES[key]) return LIST_SLUG_FA_TITLES[key];

  if (/^list-\d+$/.test(key)) return null;

  const tokens = key.split('-').filter(Boolean);
  const translated = tokens
    .map((token) => {
      if (/^\d+$/.test(token)) return toPersianDigits(token);
      if (/^\d+s$/.test(token)) return `دهه ${toPersianDigits(token.replace('s', ''))}`;
      return SLUG_TOKEN_FA[token] ?? null;
    })
    .filter((part): part is string => Boolean(part && part.trim()));

  if (translated.length < 2) return null;

  const joined = translated.join(' ');
  if (/فیلم|کتاب|کافه|رستوران|سریال|مستند|پادکست/.test(joined)) {
    return joined;
  }

  return null;
}

function translateEnglishTitle(title: string): string | null {
  const trimmed = title.trim();
  for (const { pattern, format } of EN_TITLE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return format(match);
  }
  return null;
}

const CATEGORY_FALLBACK_PREFIX: Record<string, string> = {
  movies: 'فیلم',
  movie: 'فیلم',
  film: 'فیلم',
  books: 'کتاب',
  book: 'کتاب',
  cafe: 'کافه',
  cafes: 'کافه',
  restaurant: 'رستوران',
  restaurants: 'رستوران',
  podcast: 'پادکست',
  travel: 'سفر',
};

export function getDisplayListTitle(input: {
  title: string;
  slug?: string | null;
  categorySlug?: string | null;
}): string {
  const title = input.title?.trim() ?? '';
  if (!title || !isMostlyLatinTitle(title)) return title;

  if (input.slug) {
    const fromSlug = inferTitleFromSlug(input.slug);
    if (fromSlug) return fromSlug;
  }

  const fromEnglish = translateEnglishTitle(title);
  if (fromEnglish) return fromEnglish;

  const catKey = input.categorySlug?.trim().toLowerCase();
  if (catKey && CATEGORY_FALLBACK_PREFIX[catKey]) {
    return `${CATEGORY_FALLBACK_PREFIX[catKey]} · ${title}`;
  }

  return title;
}

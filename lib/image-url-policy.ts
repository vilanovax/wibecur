import { isOurStorageUrl } from './object-storage-config';

const TMDB_IMAGE_HOSTS = new Set(['image.tmdb.org', 'www.themoviedb.org', 'themoviedb.org']);

const ALLOWED_EXTERNAL_HOSTS = new Set([
  'upload.wikimedia.org',
  'commons.wikimedia.org',
  'm.media-amazon.com',
  'ia.media-imdb.com',
]);

/** URL تصویر TMDB — در ایران بدون VPN در دسترس نیست */
export function isTmdbImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.includes('image.tmdb.org')) return true;
  try {
    return TMDB_IMAGE_HOSTS.has(new URL(trimmed).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function stripBlockedItemImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || isTmdbImageUrl(trimmed)) return null;
  return trimmed;
}

/** تصاویر poster آیتم — OMDb / Liara / ویکی‌مدیا (بدون TMDB) */
export function isAllowedItemImageUrl(url: string): boolean {
  if (!url || !url.startsWith('http') || isTmdbImageUrl(url)) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ALLOWED_EXTERNAL_HOSTS.has(host);
  } catch {
    return false;
  }
}

export function isAllowedExternalImageUrl(url: string): boolean {
  if (!url || !url.startsWith('http') || isTmdbImageUrl(url)) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ALLOWED_EXTERNAL_HOSTS.has(host);
  } catch {
    return false;
  }
}

export function isPlaceholderCoverPath(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return true;
  const t = url.trim();
  if (!t) return true;
  return (
    t === '/images/placeholder-cover.svg' ||
    t === '/images/placeholder-item.svg' ||
    t.includes('placeholder-cover')
  );
}

/** URLهای بنر عمومی seed — اگر همه لیست‌ها همین را داشته باشند، variant اختصاصی جایگزین می‌شود */
const GENERIC_WIKIMEDIA_COVER_FRAGMENTS = [
  'Sundance_Film_Festival_2024',
  'Bookshelf_Prunksaal_OeNB',
  'A_journal_writing_book',
  'A_small_cup_of_coffee',
  'Good_Food_Display',
  'Microphone_in_SPNN',
  'Cinema_seats',
  'Cinema_in_Amman',
  'Film_Stock',
  'Popcorn_%28Unsplash%29',
  'Clapperboard_1969664',
  'Reading_book',
  'Book_shelf_Stockholm',
  'Open_book_natur',
  'Coffee_with_latte_art',
  'Cafe_in_Graz',
  'Greek_food_%28Unsplash%29',
  'Old_books_%281%29',
  'Book_shelf_%28Unsplash%29',
  'Part_of_a_bookshelf_containing_books_by_Aristotle',
  'Journaling_over_coffee',
  'Yoga_TTC_in_Rishikesh',
  'Suitcase_BW_2025',
  'Abandoned_car_in_Marine_Park',
] as const;

/** بنرهای پیش‌فرض دسته — همه لیست‌ها اگر همین را داشته باشند، variant می‌گیرند */
const DEFAULT_BANNER_BASENAMES = new Set([
  'movies.jpg',
  'books.jpg',
  'cafe.jpg',
  'restaurant.jpg',
  'default.jpg',
]);

function isDefaultLocalBannerPath(url: string): boolean {
  const base = url.split('/').pop()?.toLowerCase();
  return base ? DEFAULT_BANNER_BASENAMES.has(base) : false;
}

/** آیا کاور ذخیره‌شده در DB باید با variant اختصاصی جایگزین شود؟ */
export function isGenericListCover(url: string | null | undefined): boolean {
  if (isPlaceholderCoverPath(url)) return true;
  if (!url || typeof url !== 'string') return true;
  const t = url.trim().toLowerCase();
  if (t.startsWith('/images/banners/')) {
    return isDefaultLocalBannerPath(t);
  }
  if (t.includes('upload.wikimedia.org/wikipedia/commons/')) {
    return true;
  }
  // کاورهای seed روی Liara — اغلب در bucket نیستند؛ بنر محلی جایگزین می‌شود
  if (isOurStorageUrl(t) && t.includes('/covers/')) {
    return true;
  }
  return false;
}

/** آیا URL برای نمایش در <img> معتبر است؟ */
export function isDisplayableCoverPath(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t || isPlaceholderCoverPath(t)) return false;
  if (t.startsWith('/images/banners/')) return true;
  if (t.startsWith('/')) return true;
  if (isOurStorageUrl(t)) return true;
  if (isAllowedItemImageUrl(t)) return true;
  if (isAllowedExternalImageUrl(t)) return true;
  return false;
}

export function resolveImageDisplaySrc(rawUrl: string | null | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const url = rawUrl.trim();
  if (!url) return '';
  if (url.startsWith('/')) return url;
  if (isOurStorageUrl(url)) return url;
  if (isAllowedItemImageUrl(url)) return url;
  if (isAllowedExternalImageUrl(url)) return url;
  return '';
}

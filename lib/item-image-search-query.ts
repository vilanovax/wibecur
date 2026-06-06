import { extractPosterSearchTitles } from '@/lib/tmdb-poster';

const MOVIE_TYPE_LABEL = 'فیلم و سریال';

function cleanWhitespace(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

function stripYearSuffix(s: string): string {
  return s.replace(/\s*\(\d{4}\)\s*$/, '').trim();
}

/** آیا رشته عمدتاً لاتین/انگلیسی است؟ */
export function isMostlyLatinText(s: string): boolean {
  const latin = (s.match(/[A-Za-z]/g) || []).length;
  const persian = (s.match(/[\u0600-\u06FF]/g) || []).length;
  return latin > 0 && latin >= persian;
}

/**
 * نام انگلیسی فیلم برای TMDb / IMDb
 * مثال: «فیلم و سریال Coherence - همبستگی» → Coherence
 */
export function extractEnglishMovieTitle(
  title: string,
  metadata?: Record<string, unknown> | null
): string {
  for (const key of ['originalTitle', 'englishTitle', 'enTitle', 'titleEn']) {
    const val = metadata?.[key];
    if (typeof val === 'string' && val.trim() && isMostlyLatinText(val)) {
      return stripYearSuffix(cleanWhitespace(val));
    }
  }

  for (const alt of extractPosterSearchTitles(title, metadata)) {
    if (isMostlyLatinText(alt)) {
      return stripYearSuffix(cleanWhitespace(alt));
    }
  }

  let t = cleanWhitespace(title);
  t = t.replace(/^(فیلم\s+و\s+سریال|فیلم|سریال)\s+/iu, '').trim();

  for (const sep of [' - ', ' – ', ' — ', ' | ']) {
    if (!t.includes(sep)) continue;
    const parts = t.split(sep).map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      if (isMostlyLatinText(part)) {
        return stripYearSuffix(part);
      }
    }
  }

  const latin = t.match(/[A-Za-z0-9][A-Za-z0-9\s:'.\-&]{1,}/);
  if (latin) return stripYearSuffix(cleanWhitespace(latin[0]));

  return stripYearSuffix(t);
}

/** برچسب نوع آیتم برای جستجوی Google */
export function getGoogleImageTypeLabel(
  categoryName?: string | null,
  categorySlug?: string | null
): string | null {
  const slug = (categorySlug || '').toLowerCase();
  if (
    slug.includes('movie') ||
    slug.includes('film') ||
    slug === 'movies' ||
    slug === 'series'
  ) {
    return MOVIE_TYPE_LABEL;
  }
  if (slug.includes('book')) return 'کتاب';
  if (slug.includes('cafe')) return 'کافه';
  if (slug.includes('restaurant')) return 'رستوران';

  const name = categoryName?.trim();
  if (!name) return null;
  if (/فیلم|سریال|movie|film/i.test(name)) return MOVIE_TYPE_LABEL;
  return name;
}

/**
 * عبارت جستجو برای Google — نوع + عنوان کامل (انگلیسی + فارسی)
 * مثال: فیلم و سریال Coherence - همبستگی
 */
export function buildGoogleImageSearchQuery(input: {
  title: string;
  categoryName?: string | null;
  categorySlug?: string | null;
}): string {
  const rawTitle = cleanWhitespace(input.title);
  if (!rawTitle) {
    return getGoogleImageTypeLabel(input.categoryName, input.categorySlug) || '';
  }

  const typeLabel = getGoogleImageTypeLabel(input.categoryName, input.categorySlug);

  if (/^(فیلم\s+و\s+سریال|فیلم|سریال|کتاب|کافه|رستوران)\s+/u.test(rawTitle)) {
    return rawTitle;
  }

  if (typeLabel) {
    return `${typeLabel} ${rawTitle}`;
  }

  if (input.categoryName?.trim() && !rawTitle.includes(input.categoryName)) {
    return `${input.categoryName.trim()} ${rawTitle}`;
  }

  return rawTitle;
}

/** عبارت پیش‌فرض TMDb / IMDb — فقط نام انگلیسی */
export function buildMoviePosterSearchQuery(
  title: string,
  metadata?: Record<string, unknown> | null
): string {
  return extractEnglishMovieTitle(title, metadata);
}

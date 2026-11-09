/**
 * ژانر لیست فیلم — از metadata.genre / country آیتم‌ها، نه تگ خالی لیست.
 */

import { normalizeSearchQuery } from '@/lib/list-search';

const IRAN_COUNTRY_RE = /ایران|iran|persian|ایرانی/i;

/** ژانرهای شناخته‌شده برای نرمال‌سازی و چیپ */
const CANONICAL_GENRES = [
  'درام',
  'کمدی',
  'اکشن',
  'ترسناک',
  'جنایی',
  'معمایی',
  'عاشقانه',
  'علمی‌تخیلی',
  'فانتزی',
  'تاریخی',
  'جنگی',
  'جاسوسی',
  'انیمیشن',
  'مستند',
  'تریللر',
  'ذهنی',
  'کلاسیک',
  'ایرانی',
  'خارجی',
] as const;

const ALIAS_TO_CANONICAL: Record<string, string> = {
  drama: 'درام',
  comedy: 'کمدی',
  action: 'اکشن',
  horror: 'ترسناک',
  crime: 'جنایی',
  mystery: 'معمایی',
  thriller: 'تریللر',
  تریلر: 'تریللر',
  romance: 'عاشقانه',
  'sci-fi': 'علمی‌تخیلی',
  'علمی-تخیلی': 'علمی‌تخیلی',
  'علمی تخیلی': 'علمی‌تخیلی',
  fantasy: 'فانتزی',
  war: 'جنگی',
  animation: 'انیمیشن',
  documentary: 'مستند',
  historical: 'تاریخی',
  spy: 'جاسوسی',
  ایران: 'ایرانی',
  irani: 'ایرانی',
  iran: 'ایرانی',
  persian: 'ایرانی',
};

export function normalizeFilmGenreLabel(raw: string): string | null {
  const trimmed = normalizeSearchQuery(raw).replace(/^-+|-+$/g, '');
  if (!trimmed || trimmed.length < 2) return null;

  const lower = trimmed.toLowerCase();
  if (ALIAS_TO_CANONICAL[lower]) return ALIAS_TO_CANONICAL[lower];
  if (ALIAS_TO_CANONICAL[trimmed]) return ALIAS_TO_CANONICAL[trimmed];

  for (const canon of CANONICAL_GENRES) {
    if (canon === trimmed) return canon;
    if (trimmed.includes(canon) || canon.includes(trimmed)) return canon;
  }

  // ژانر ترکیبی مثل «درام جنگی» → فقط اگر canonical کامل نباشد همان را نگه دار
  if (/^[\u0600-\u06FFa-zA-Z0-9\s‌\-]+$/.test(trimmed) && trimmed.length <= 24) {
    return trimmed;
  }
  return null;
}

/** جدا کردن ژانرهای ترکیبی: «درام، کمدی» یا «درام جنگی» */
export function splitFilmGenreField(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  const parts = raw
    .split(/[,،/|]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const out = new Set<string>();
  for (const part of parts) {
    const normalized = normalizeFilmGenreLabel(part);
    if (normalized) out.add(normalized);

    // برای «درام جنگی» هر دو بخش را هم ثبت کن اگر canonical باشند
    for (const canon of CANONICAL_GENRES) {
      if (part.includes(canon)) out.add(canon);
    }
  }
  return [...out];
}

export function genresFromItemMeta(meta: Record<string, unknown> | null | undefined): string[] {
  if (!meta) return [];
  const out = new Set<string>(splitFilmGenreField(meta.genre));

  const country = typeof meta.country === 'string' ? meta.country : '';
  if (country && IRAN_COUNTRY_RE.test(country)) {
    out.add('ایرانی');
  }

  return [...out];
}

export function isIranCountry(value: unknown): boolean {
  return typeof value === 'string' && IRAN_COUNTRY_RE.test(value);
}

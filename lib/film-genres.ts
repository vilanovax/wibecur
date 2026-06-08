/**
 * ژانرهای صفحه فیلم — از تگ‌های لیست + fallback ثابت
 */

export type FilmGenreChip = {
  slug: string;
  label: string;
  icon: string;
  listCount: number;
};

export const DEFAULT_FILM_GENRES: Omit<FilmGenreChip, 'listCount'>[] = [
  { slug: 'drama', label: 'درام', icon: '🎭' },
  { slug: 'comedy', label: 'کمدی', icon: '😂' },
  { slug: 'action', label: 'اکشن', icon: '💥' },
  { slug: 'horror', label: 'ترسناک', icon: '😱' },
  { slug: 'mind', label: 'ذهنی', icon: '🧠' },
  { slug: 'classic', label: 'کلاسیک', icon: '🎬' },
  { slug: 'irani', label: 'ایرانی', icon: '🇮🇷' },
  { slug: 'foreign', label: 'خارجی', icon: '🌍' },
];

const GENRE_ICON_BY_LABEL: Record<string, string> = {
  درام: '🎭',
  drama: '🎭',
  کمدی: '😂',
  comedy: '😂',
  اکشن: '💥',
  action: '💥',
  ترسناک: '😱',
  horror: '😱',
  علمی: '🚀',
  'sci-fi': '🚀',
  'علمی-تخیلی': '🚀',
  عاشقانه: '💕',
  romance: '💕',
  مستند: '📽',
  documentary: '📽',
  انیمیشن: '🎨',
  animation: '🎨',
  جنایی: '🔪',
  crime: '🔪',
  هیجان: '⚡',
  thriller: '⚡',
  ذهنی: '🧠',
  mind: '🧠',
  کلاسیک: '🎬',
  classic: '🎬',
  ایرانی: '🇮🇷',
  irani: '🇮🇷',
  خارجی: '🌍',
  foreign: '🌍',
  سریال: '📺',
  series: '📺',
};

function slugifyGenre(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]/g, '');
}

export function genreIconFor(label: string): string {
  const key = label.trim();
  if (GENRE_ICON_BY_LABEL[key]) return GENRE_ICON_BY_LABEL[key];
  const lower = key.toLowerCase();
  if (GENRE_ICON_BY_LABEL[lower]) return GENRE_ICON_BY_LABEL[lower];
  return '🏷';
}

export function buildFilmGenreChips(
  tagCounts: Map<string, number>,
  maxItems = 12
): FilmGenreChip[] {
  const fromDb = [...tagCounts.entries()]
    .filter(([label]) => label.trim().length > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems)
    .map(([label, listCount]) => ({
      slug: slugifyGenre(label),
      label,
      icon: genreIconFor(label),
      listCount,
    }));

  if (fromDb.length >= 4) return fromDb;

  const seen = new Set(fromDb.map((g) => g.label));
  const merged = [...fromDb];

  for (const fallback of DEFAULT_FILM_GENRES) {
    if (merged.length >= maxItems) break;
    if (seen.has(fallback.label)) continue;
    merged.push({
      ...fallback,
      listCount: tagCounts.get(fallback.label) ?? 0,
    });
    seen.add(fallback.label);
  }

  return merged;
}

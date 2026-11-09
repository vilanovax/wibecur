/**
 * ژانرهای صفحه فیلم — از metadata آیتم‌ها (+ تگ همگام‌شده لیست)
 */

import { genresFromItemMeta, normalizeFilmGenreLabel } from '@/lib/film-list-genres';

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
  'علمی‌تخیلی': '🚀',
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
  تریلر: '⚡',
  تریللر: '⚡',
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
  معمایی: '🔍',
  جاسوسی: '🕵️',
  تاریخی: '📜',
  جنگی: '⚔️',
  فانتزی: '🧙',
  ماجراجویی: '🗺️',
  خانوادگی: '👨‍👩‍👧',
};

const PRIORITY_ORDER = [
  'ایرانی',
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
  'تریلر',
  'ذهنی',
  'کلاسیک',
];

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
    .filter(([label, count]) => label.trim().length > 0 && count > 0)
    .sort((a, b) => {
      const ai = PRIORITY_ORDER.indexOf(a[0]);
      const bi = PRIORITY_ORDER.indexOf(b[0]);
      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      }
      return b[1] - a[1] || a[0].localeCompare(b[0], 'fa');
    })
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
    const count = tagCounts.get(fallback.label) ?? 0;
    // فالبک بدون دیتا را نشان نده — فقط اگر واقعاً لیست داریم
    if (count <= 0 && fromDb.length > 0) continue;
    merged.push({
      ...fallback,
      listCount: count,
    });
    seen.add(fallback.label);
  }

  return merged.length > 0 ? merged : DEFAULT_FILM_GENRES.map((g) => ({ ...g, listCount: 0 }));
}

/** شمارش لیست یکتا به‌ازای هر ژانر از metadata آیتم‌ها */
export function countListIdsByGenre(
  items: Array<{ listId: string; metadata: unknown }>
): Map<string, number> {
  const listIdsByGenre = new Map<string, Set<string>>();

  for (const item of items) {
    const meta =
      item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
        ? (item.metadata as Record<string, unknown>)
        : null;
    for (const genre of genresFromItemMeta(meta)) {
      let set = listIdsByGenre.get(genre);
      if (!set) {
        set = new Set();
        listIdsByGenre.set(genre, set);
      }
      set.add(item.listId);
    }
  }

  const counts = new Map<string, number>();
  for (const [genre, listIds] of listIdsByGenre) {
    counts.set(genre, listIds.size);
  }
  return counts;
}

export function listMatchesGenre(
  list: { title?: string | null; description?: string | null; tags?: string[] | null },
  genre: string
): boolean {
  const needle = normalizeFilmGenreLabel(genre) ?? genre.trim();
  if (!needle) return true;

  const tags = list.tags ?? [];
  if (tags.some((t) => (normalizeFilmGenreLabel(t) ?? t.trim()) === needle || t.includes(needle))) {
    return true;
  }

  const title = list.title ?? '';
  const desc = list.description ?? '';
  return title.includes(needle) || desc.includes(needle);
}

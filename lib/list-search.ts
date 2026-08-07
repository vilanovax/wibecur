export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 180;

export const SEARCH_SUGGESTIONS = [
  { id: 'movie', label: '🎬 فیلم', query: 'فیلم' },
  { id: 'book', label: '📚 کتاب', query: 'کتاب' },
  { id: 'cafe', label: '☕ کافه', query: 'کافه' },
  { id: 'sleep', label: '🌙 قبل خواب', query: 'قبل خواب' },
  { id: 'travel', label: '🌍 سفر', query: 'سفر' },
  { id: 'relax', label: '😌 آرامش', query: 'آرامش' },
] as const;

/** لینک‌های دسته — فقط برای deep link (در overlay استفاده نمی‌شود) */
export const SEARCH_CATEGORY_LINKS = [
  { slug: 'movie', label: '🎬 فیلم', href: '/categories/movie' },
  { slug: 'book', label: '📚 کتاب', href: '/categories/book' },
  { slug: 'cafe', label: '☕ کافه', href: '/categories/cafe' },
  { slug: 'travel', label: '🌍 سفر', href: '/categories/travel' },
  { slug: 'trending', label: '🔥 ترند', href: '/lists?mode=trending' },
] as const;

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function suggestionLabelForQuery(query: string): string {
  const q = normalizeSearchQuery(query).toLowerCase();
  const match = SEARCH_SUGGESTIONS.find((s) => s.query.toLowerCase() === q);
  return match?.label ?? query;
}

export function filterListsByQuery<
  T extends {
    title: string;
    description?: string | null;
    categories?: { name?: string | null } | null;
  },
>(lists: T[], query: string): T[] {
  const q = normalizeSearchQuery(query).toLowerCase();
  if (!q) return lists;

  return lists.filter((list) => {
    const title = list.title.toLowerCase();
    const desc = (list.description ?? '').toLowerCase();
    const category = (list.categories?.name ?? '').toLowerCase();
    return title.includes(q) || desc.includes(q) || category.includes(q);
  });
}

const RECENT_KEY = 'wibe_recent_searches';
const RECENT_MAX = 6;

export function readRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string').slice(0, RECENT_MAX)
      : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string): string[] {
  const normalized = normalizeSearchQuery(query);
  if (normalized.length < SEARCH_MIN_LENGTH) return readRecentSearches();

  const prev = readRecentSearches().filter((item) => item !== normalized);
  const next = [normalized, ...prev].slice(0, RECENT_MAX);

  if (typeof window !== 'undefined') {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }

  return next;
}

export function clearRecentSearches(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(RECENT_KEY);
  }
}

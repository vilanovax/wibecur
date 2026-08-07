import type { BookSource } from '@/lib/books/types';

export type DetectedBookUrl =
  | { source: BookSource; mode: 'category'; categoryUrl: string; categorySlug: string }
  | { source: BookSource; mode: 'search'; searchUrl: string; query: string }
  | { source: BookSource; mode: 'book'; bookUrl: string; bookId: string };

function parseHostname(url: string): URL | null {
  try {
    return new URL(url.trim());
  } catch {
    try {
      return new URL(`https://${url.trim()}`);
    } catch {
      return null;
    }
  }
}

export function detectBookSource(hostname: string): BookSource | null {
  const h = hostname.toLowerCase();
  if (h.includes('taaghche.com')) return 'taaghche';
  if (h.includes('fidibo.com')) return 'fidibo';
  if (h.includes('ketabrah.com')) return 'ketabrah';
  return null;
}

/** تشخیص نوع URL دسته/جستجو/کتاب */
export function detectBookUrl(raw: string): DetectedBookUrl | null {
  const parsed = parseHostname(raw);
  if (!parsed) return null;
  const source = detectBookSource(parsed.hostname);
  if (!source) return null;

  const path = decodeURIComponent(parsed.pathname).replace(/\/+$/, '') || '/';

  if (source === 'taaghche') {
    const cat = path.match(/^\/category\/(.+)$/i);
    if (cat?.[1]) {
      return {
        source,
        mode: 'category',
        categoryUrl: parsed.toString(),
        categorySlug: cat[1],
      };
    }
    const term = parsed.searchParams.get('term');
    if (path === '/search' && term) {
      return { source, mode: 'search', searchUrl: parsed.toString(), query: term };
    }
    const book = path.match(/^\/book\/(\d+)/i);
    if (book?.[1]) {
      return { source, mode: 'book', bookUrl: parsed.toString(), bookId: book[1] };
    }
    const filterCat = parsed.searchParams.get('filter-category');
    if (path === '/filter' && filterCat) {
      return {
        source,
        mode: 'category',
        categoryUrl: parsed.toString(),
        categorySlug: filterCat,
      };
    }
  }

  if (source === 'fidibo') {
    if (path === '/contents/list') {
      const listsRaw = parsed.searchParams.get('lists');
      if (listsRaw) {
        try {
          const listIds = JSON.parse(listsRaw) as unknown;
          if (Array.isArray(listIds) && listIds.length > 0) {
            return {
              source,
              mode: 'category',
              categoryUrl: parsed.toString(),
              categorySlug: `lists:${listIds.join(',')}`,
            };
          }
        } catch {
          /* ignore invalid JSON */
        }
      }
    }
    const ebooks = path.match(/^\/ebooks\/(.+)$/i);
    if (ebooks?.[1] && ebooks[1] !== 'categories') {
      return {
        source,
        mode: 'category',
        categoryUrl: parsed.toString(),
        categorySlug: ebooks[1],
      };
    }
    const query = parsed.searchParams.get('query');
    if (path.includes('/search') && query) {
      return { source, mode: 'search', searchUrl: parsed.toString(), query };
    }
    const book = path.match(/^\/book\/(\d+)/i);
    if (book?.[1]) {
      return { source, mode: 'book', bookUrl: parsed.toString(), bookId: book[1] };
    }
  }

  if (source === 'ketabrah') {
    const books = path.match(/^\/books\/(.+)$/i);
    if (books?.[1]) {
      return {
        source,
        mode: 'category',
        categoryUrl: parsed.toString(),
        categorySlug: books[1],
      };
    }
    const q = parsed.searchParams.get('q');
    if (path === '/search' && q) {
      return { source, mode: 'search', searchUrl: parsed.toString(), query: q };
    }
    const book = path.match(/^\/book\/(\d+)/i);
    if (book?.[1]) {
      return { source, mode: 'book', bookUrl: parsed.toString(), bookId: book[1] };
    }
  }

  return null;
}

export function assertCategoryUrlForSource(url: string, source: BookSource): string {
  const detected = detectBookUrl(url);
  if (!detected || detected.mode !== 'category') {
    throw new Error('لینک دسته نامعتبر است');
  }
  if (detected.source !== source) {
    throw new Error(`این لینک مربوط به ${detected.source} است نه ${source}`);
  }
  return detected.categoryUrl;
}

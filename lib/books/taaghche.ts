import type { BookRecord, BookSearchCandidate } from '@/lib/books/types';
import { inferTaaghcheContentType } from '@/lib/books/content-type';
import { extractNextData, fetchHtml } from '@/lib/books/http-client';
import { sanitizeBookText, stripHtmlTags } from '@/lib/books/normalize';

type TaaghcheAuthor = {
  firstName?: string;
  lastName?: string;
};

type TaaghcheBookSummary = {
  id?: number;
  title?: string;
  coverUri?: string;
  publisher?: string;
  authors?: TaaghcheAuthor[];
  rating?: number;
  price?: number;
  types?: { id?: number; name?: string }[];
};

type TaaghcheBookDetail = TaaghcheBookSummary & {
  description?: string;
  isbn?: string;
  subjects?: { name?: string }[];
};

function formatAuthors(authors?: TaaghcheAuthor[]): string[] {
  if (!Array.isArray(authors)) return [];
  return authors
    .map((a) => sanitizeBookText(`${a.firstName ?? ''} ${a.lastName ?? ''}`.trim()))
    .filter(Boolean);
}

function summaryToCandidate(book: TaaghcheBookSummary): BookSearchCandidate | null {
  const id = book.id;
  const title = sanitizeBookText(book.title ?? '');
  if (!id || !title) return null;
  return {
    bookId: String(id),
    contentType: inferTaaghcheContentType(book.types),
    title,
    authors: formatAuthors(book.authors),
    coverUrl: book.coverUri ?? null,
    bookUrl: `https://taaghche.com/book/${id}`,
  };
}

function summaryToRecord(book: TaaghcheBookSummary): BookRecord | null {
  const candidate = summaryToCandidate(book);
  if (!candidate) return null;
  return {
    source: 'taaghche',
    bookId: candidate.bookId,
    contentType: candidate.contentType,
    title: candidate.title,
    authors: candidate.authors,
    genres: (book.types ?? []).map((t) => sanitizeBookText(t.name ?? '')).filter(Boolean),
    description: null,
    isbn: null,
    coverUrl: candidate.coverUrl ?? null,
    bookUrl: candidate.bookUrl,
    publisher: sanitizeBookText(book.publisher ?? '') || null,
    price: typeof book.price === 'number' ? book.price : null,
    rating: typeof book.rating === 'number' ? book.rating : null,
    scrapedAt: new Date().toISOString(),
  };
}

function detailToRecord(book: TaaghcheBookDetail): BookRecord | null {
  const base = summaryToRecord(book);
  if (!base) return null;
  const genresFromSubjects = (book.subjects ?? [])
    .map((s) => sanitizeBookText((s as { name?: string }).name ?? ''))
    .filter(Boolean);
  return {
    ...base,
    description: sanitizeBookText(book.description ?? '') || null,
    isbn: sanitizeBookText(book.isbn ?? '') || null,
    genres: genresFromSubjects.length > 0 ? genresFromSubjects : base.genres,
  };
}

export function parseTaaghcheSearchHtml(html: string): BookSearchCandidate[] {
  const data = extractNextData(html);
  const items =
    (
      data?.props as {
        pageProps?: { searchPageConfig?: { tabItems?: { items?: TaaghcheBookSummary[] } } };
      }
    )?.pageProps?.searchPageConfig?.tabItems?.items ?? [];

  return items.map(summaryToCandidate).filter((x): x is BookSearchCandidate => !!x);
}

export function parseTaaghcheBookHtml(html: string): BookRecord | null {
  const data = extractNextData(html);
  const book = (
    data?.props as { pageProps?: { bookPage?: { book?: TaaghcheBookDetail } } }
  )?.pageProps?.bookPage?.book;
  if (!book) return null;
  return detailToRecord(book);
}

export async function searchTaaghcheByTitle(
  title: string,
  options?: { maxRetries?: number }
): Promise<BookSearchCandidate[]> {
  const url = `https://taaghche.com/search?term=${encodeURIComponent(title)}&tab=book`;
  const html = await fetchHtml(url, { maxRetries: options?.maxRetries });
  return parseTaaghcheSearchHtml(html);
}

export async function fetchTaaghcheBookDetail(
  bookId: string,
  options?: { maxRetries?: number }
): Promise<BookRecord | null> {
  const html = await fetchHtml(`https://taaghche.com/book/${bookId}`, {
    maxRetries: options?.maxRetries,
    timeoutMs: 45000,
  });
  return parseTaaghcheBookHtml(html);
}

export function taaghcheCandidateToRecord(
  candidate: BookSearchCandidate,
  enrich?: Partial<BookRecord>
): BookRecord {
  return {
    source: 'taaghche',
    bookId: candidate.bookId,
    contentType: candidate.contentType ?? enrich?.contentType ?? null,
    title: candidate.title,
    authors: candidate.authors,
    genres: enrich?.genres ?? [],
    description: enrich?.description ?? null,
    isbn: enrich?.isbn ?? null,
    coverUrl: candidate.coverUrl ?? enrich?.coverUrl ?? null,
    bookUrl: candidate.bookUrl,
    publisher: enrich?.publisher ?? null,
    price: enrich?.price ?? null,
    rating: enrich?.rating ?? null,
    scrapedAt: new Date().toISOString(),
  };
}

export function parseTaaghcheListItemTitle(raw: string): string {
  return sanitizeBookText(stripHtmlTags(raw));
}

export function extractTaaghcheFilterCategoryId(html: string): string | null {
  const m = html.match(/filter-category=(\d+)/i);
  if (m?.[1]) return m[1];
  const data = extractNextData(html);
  const slug = (
    data?.props as { pageProps?: { filters?: { slug?: string } } }
  )?.pageProps?.filters?.slug;
  if (slug) return slug.replace(/^category\//, '');
  return null;
}

export function parseTaaghcheFilterHtml(html: string): BookSearchCandidate[] {
  const data = extractNextData(html);
  const list =
    (data?.props as { pageProps?: { filters?: { list?: TaaghcheBookSummary[] } } })?.pageProps
      ?.filters?.list ?? [];
  return list
    .filter((b) => typeof b.id === 'number' && b.title)
    .map(summaryToCandidate)
    .filter((x): x is BookSearchCandidate => !!x);
}

export async function listTaaghcheCategory(
  categoryUrl: string,
  limit: number,
  options?: { maxRetries?: number }
): Promise<BookSearchCandidate[]> {
  const landingHtml = await fetchHtml(categoryUrl, { maxRetries: options?.maxRetries });
  const filterKey = extractTaaghcheFilterCategoryId(landingHtml);
  if (!filterKey) {
    throw new Error('شناسه دسته طاقچه یافت نشد');
  }

  const out: BookSearchCandidate[] = [];
  const pageSize = 12;
  for (let offset = 0; out.length < limit; offset += pageSize) {
    const filterUrl = `https://taaghche.com/filter?filter-category=${encodeURIComponent(filterKey)}&offset=${offset}`;
    const html = await fetchHtml(filterUrl, { maxRetries: options?.maxRetries });
    const batch = parseTaaghcheFilterHtml(html);
    if (batch.length === 0) break;
    for (const item of batch) {
      if (!out.some((x) => x.bookId === item.bookId)) out.push(item);
      if (out.length >= limit) break;
    }
    if (batch.length < pageSize) break;
  }

  if (out.length === 0) {
    throw new Error(
      'لیست کتاب از طاقچه خالی برگشت — ممکن است SSR از این سرور داده ندهد؛ دوباره تلاش کنید'
    );
  }

  return out.slice(0, limit);
}

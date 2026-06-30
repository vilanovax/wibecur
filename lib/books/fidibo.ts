import type { BookRecord, BookSearchCandidate } from '@/lib/books/types';
import { inferFidiboContentType } from '@/lib/books/content-type';
import { extractJsObjectAssignment, fetchHtml, fetchJson } from '@/lib/books/http-client';
import { sanitizeBookText, stripHtmlTags } from '@/lib/books/normalize';

const FIDIBO_ORIGIN = 'https://fidibo.com';

type FidiboSearchItem = {
  id?: number;
  title?: string;
  subtitle?: string;
  narrator?: string;
  content_type?: string;
  format?: string;
  cover?: { image?: string };
  action?: { web_url?: string };
  rate?: { score?: number };
  price?: number;
};

type FidiboSearchResponse = {
  data?: {
    result?: { items?: FidiboSearchItem[] }[];
  };
};

type FidiboBookContextEntry = {
  title?: string;
  subtitle?: string;
  description?: string;
  isbn?: string;
  authors?: { full_name?: string; name?: string; last_name?: string }[];
  categories?: { name?: string }[];
  publisher?: { name?: string };
  cover?: { image?: string };
  rate?: { score?: number };
  price?: number;
  action?: { web_url?: string };
};

function fidiboHeaders(): Record<string, string> {
  return {
    Origin: FIDIBO_ORIGIN,
    Referer: `${FIDIBO_ORIGIN}/`,
    Accept: 'application/json',
  };
}

function cleanTitle(raw?: string): string {
  return sanitizeBookText(stripHtmlTags(raw ?? ''));
}

function itemToCandidate(item: FidiboSearchItem): BookSearchCandidate | null {
  const id = item.id;
  const title = cleanTitle(item.title);
  if (!id || !title) return null;
  const webUrl = item.action?.web_url;
  const bookUrl = webUrl
    ? webUrl.startsWith('http')
      ? webUrl
      : `${FIDIBO_ORIGIN}${webUrl}`
    : `${FIDIBO_ORIGIN}/book/${id}`;
  const authors: string[] = [];
  const subtitle = sanitizeBookText(item.subtitle ?? '');
  if (subtitle) authors.push(subtitle);
  if (item.narrator) authors.push(`راوی: ${sanitizeBookText(item.narrator)}`);

  return {
    bookId: String(id),
    contentType: inferFidiboContentType(item),
    title,
    authors,
    coverUrl: item.cover?.image ?? null,
    bookUrl,
    subtitle: subtitle || null,
  };
}

function contextEntryToRecord(
  bookId: string,
  entry: FidiboBookContextEntry,
  fallbackUrl: string
): BookRecord {
  const title = cleanTitle(entry.title) || `کتاب ${bookId}`;
  const authors = (entry.authors ?? [])
    .map((a) => sanitizeBookText(a.full_name || `${a.name ?? ''} ${a.last_name ?? ''}`.trim()))
    .filter(Boolean);
  const genres = (entry.categories ?? [])
    .map((c) => sanitizeBookText(c.name ?? ''))
    .filter(Boolean);
  const webUrl = entry.action?.web_url;
  const bookUrl = webUrl
    ? webUrl.startsWith('http')
      ? webUrl
      : `${FIDIBO_ORIGIN}${webUrl}`
    : fallbackUrl;

  return {
    source: 'fidibo',
    bookId,
    contentType: enrich?.contentType ?? null,
    title,
    authors,
    genres,
    description: sanitizeBookText(entry.description ?? '') || null,
    isbn: sanitizeBookText(entry.isbn ?? '') || null,
    coverUrl: entry.cover?.image ?? null,
    bookUrl,
    publisher: sanitizeBookText(entry.publisher?.name ?? '') || null,
    price: typeof entry.price === 'number' ? entry.price : null,
    rating: entry.rate?.score ?? null,
    scrapedAt: new Date().toISOString(),
  };
}

export function parseFidiboSearchResponse(data: FidiboSearchResponse): BookSearchCandidate[] {
  const out: BookSearchCandidate[] = [];
  for (const block of data?.data?.result ?? []) {
    for (const item of block?.items ?? []) {
      const candidate = itemToCandidate(item);
      if (candidate) out.push(candidate);
    }
  }
  return out;
}

export function parseFidiboBookHtml(html: string, bookId: string): BookRecord | null {
  const ctx = extractJsObjectAssignment(html, 'window.bookContext');
  if (!ctx) return null;

  const entries = Object.values(ctx) as FidiboBookContextEntry[];
  const entry = entries[0];
  if (!entry) return null;

  return contextEntryToRecord(bookId, entry, `${FIDIBO_ORIGIN}/book/${bookId}`);
}

export async function searchFidiboByTitle(
  title: string,
  options?: { maxRetries?: number; page?: number }
): Promise<BookSearchCandidate[]> {
  const page = options?.page ?? 1;
  const url = `https://api.fidibo.com/flex/search/list/content?query=${encodeURIComponent(title)}&types=${encodeURIComponent('[1,6,3]')}&page=${page}`;
  const data = await fetchJson<FidiboSearchResponse>(url, {
    headers: fidiboHeaders(),
    maxRetries: options?.maxRetries,
    timeoutMs: 25000,
  });
  return parseFidiboSearchResponse(data);
}

export async function fetchFidiboBookDetail(
  bookId: string,
  options?: { maxRetries?: number }
): Promise<BookRecord | null> {
  const html = await fetchHtml(`${FIDIBO_ORIGIN}/book/${bookId}`, {
    headers: { Referer: `${FIDIBO_ORIGIN}/` },
    maxRetries: options?.maxRetries,
    timeoutMs: 45000,
  });
  return parseFidiboBookHtml(html, bookId);
}

export function fidiboCandidateToRecord(
  candidate: BookSearchCandidate,
  enrich?: Partial<BookRecord>
): BookRecord {
  return {
    source: 'fidibo',
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

type FidiboListResponse = {
  data?: {
    items?: FidiboSearchItem[];
    result?: { items?: FidiboSearchItem[] }[];
  };
};

export function parseFidiboCategoryContext(html: string): number | null {
  const ctx = extractJsObjectAssignment(html, 'window.categoryContext');
  if (!ctx) return null;
  for (const value of Object.values(ctx)) {
    if (value && typeof value === 'object') {
      const id = (value as { categoryId?: number; id?: number }).categoryId ??
        (value as { id?: number }).id;
      if (typeof id === 'number' && id > 0) return id;
    }
  }
  const slugMatch = html.match(/categoryId["\s:]+(\d+)/i);
  if (slugMatch?.[1]) return parseInt(slugMatch[1], 10);
  return null;
}

export function parseFidiboListResponse(data: FidiboListResponse): BookSearchCandidate[] {
  const direct = data?.data?.items ?? [];
  if (direct.length > 0) {
    return direct.map(itemToCandidate).filter((x): x is BookSearchCandidate => !!x);
  }
  return parseFidiboSearchResponse(data as FidiboSearchResponse);
}

export async function listFidiboCategory(
  categoryUrl: string,
  limit: number,
  options?: { maxRetries?: number }
): Promise<BookSearchCandidate[]> {
  const html = await fetchHtml(categoryUrl, {
    headers: { Referer: `${FIDIBO_ORIGIN}/` },
    maxRetries: options?.maxRetries,
    timeoutMs: 45000,
  });
  const categoryId = parseFidiboCategoryContext(html);
  if (!categoryId) {
    throw new Error('categoryId فیدیبو از صفحه استخراج نشد');
  }

  const pageSize = Math.min(30, limit);
  const out: BookSearchCandidate[] = [];
  let page = 1;

  while (out.length < limit) {
    const data = await fetchJson<FidiboListResponse>('https://api.fidibo.com/flex/list/book', {
      method: 'POST',
      headers: { ...fidiboHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId,
        page,
        limit: pageSize,
        sort: 'bestseller',
      }),
      maxRetries: options?.maxRetries,
      timeoutMs: 25000,
    });
    const batch = parseFidiboListResponse(data);
    if (batch.length === 0) break;
    out.push(...batch);
    if (batch.length < pageSize) break;
    page++;
  }

  return out.slice(0, limit);
}

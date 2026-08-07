import type { BookRecord, BookSearchCandidate } from '@/lib/books/types';
import { inferFidiboContentType } from '@/lib/books/content-type';
import { extractJsObjectAssignment, fetchHtml, fetchJson } from '@/lib/books/http-client';
import { sanitizeBookText, sleep, stripHtmlTags } from '@/lib/books/normalize';

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
  content_type?: string;
  format?: string;
  isbn?: string;
  authors?: { full_name?: string; name?: string; last_name?: string }[];
  categories?: { name?: string }[];
  publisher?: { name?: string };
  publishers?: { name?: string }[];
  cover?: { image?: string };
  rate?: { score?: number };
  price?: number;
  action?: { web_url?: string };
  content?: {
    list?: {
      component?: string;
      items?: {
        introduction?: {
          description?: string;
          short_description?: string;
        };
        categories?: { name?: string }[];
      }[];
    }[];
  };
};

function htmlToBookText(html: string): string {
  const paragraphs = html
    .split(/<\/p>/i)
    .map((chunk) => sanitizeBookText(stripHtmlTags(chunk)))
    .filter((p) => p.length > 20);
  if (paragraphs.length > 0) return paragraphs.join('\n\n');
  return sanitizeBookText(stripHtmlTags(html));
}

function parseFidiboGenres(entry: FidiboBookContextEntry): string[] {
  const genres: string[] = [];
  const seen = new Set<string>();

  const push = (name?: string) => {
    const text = sanitizeBookText(name ?? '');
    if (!text || seen.has(text)) return;
    seen.add(text);
    genres.push(text);
  };

  for (const category of entry.categories ?? []) push(category.name);
  for (const block of entry.content?.list ?? []) {
    for (const item of block.items ?? []) {
      for (const category of item.categories ?? []) push(category.name);
    }
  }
  return genres;
}

function parseFidiboPublisher(entry: FidiboBookContextEntry): string | null {
  const fromSingle = sanitizeBookText(entry.publisher?.name ?? '');
  if (fromSingle) return fromSingle;
  const fromList = sanitizeBookText(entry.publishers?.[0]?.name ?? '');
  return fromList || null;
}

function parseFidiboDescription(entry: FidiboBookContextEntry): {
  description: string | null;
  excerpt: string | null;
} {
  const introParts: string[] = [];
  const shortParts: string[] = [];

  for (const block of entry.content?.list ?? []) {
    if (block.component !== 'BOOK_INTRODUCTION') continue;
    for (const item of block.items ?? []) {
      const intro = item.introduction;
      if (!intro) continue;
      if (intro.description) {
        const text = htmlToBookText(intro.description);
        if (text.length > 40) introParts.push(text);
      }
      if (intro.short_description) {
        const short = sanitizeBookText(stripHtmlTags(intro.short_description)).replace(
          /\.{3,}$/,
          ''
        );
        if (short.length > 30) shortParts.push(short);
      }
    }
  }

  if (introParts.length > 0) {
    return {
      description: introParts.join('\n\n'),
      excerpt: shortParts[0] ?? (sanitizeBookText(entry.subtitle ?? '') || null),
    };
  }

  const legacy = sanitizeBookText(stripHtmlTags(entry.description ?? ''));
  if (legacy.length > 40) {
    return { description: legacy, excerpt: sanitizeBookText(entry.subtitle ?? '') || null };
  }

  const subtitle = sanitizeBookText(entry.subtitle ?? '');
  if (subtitle.length > 40) {
    return { description: subtitle, excerpt: shortParts[0] ?? null };
  }

  return { description: null, excerpt: shortParts[0] ?? (subtitle || null) };
}

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
  const genres = parseFidiboGenres(entry);
  const { description, excerpt } = parseFidiboDescription(entry);
  const webUrl = entry.action?.web_url;
  const bookUrl = webUrl
    ? webUrl.startsWith('http')
      ? webUrl
      : `${FIDIBO_ORIGIN}${webUrl}`
    : fallbackUrl;

  return {
    source: 'fidibo',
    bookId,
    contentType: inferFidiboContentType(entry),
    title,
    authors,
    subtitle: sanitizeBookText(entry.subtitle ?? '') || null,
    excerpt,
    genres,
    description,
    isbn: sanitizeBookText(entry.isbn ?? '') || null,
    coverUrl: entry.cover?.image ?? null,
    bookUrl,
    publisher: parseFidiboPublisher(entry),
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
    result?: FidiboSearchItem[] | { items?: FidiboSearchItem[] }[];
    per_page?: number;
  };
};

export type FidiboListRequest =
  | { kind: 'category'; categoryId: number; sort: string }
  | { kind: 'listIds'; listIds: number[]; sort: string };

/** پارامترهای لیست از URL دسته فیدیبو */
export function parseFidiboListRequest(categoryUrl: string): FidiboListRequest | null {
  try {
    const parsed = new URL(categoryUrl.trim());
    if (!parsed.hostname.toLowerCase().includes('fidibo.com')) return null;

    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    if (path === '/contents/list') {
      const listsRaw = parsed.searchParams.get('lists');
      if (!listsRaw) return null;
      const listIds = JSON.parse(listsRaw) as unknown;
      if (!Array.isArray(listIds) || listIds.length === 0) return null;
      const ids = listIds
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (ids.length === 0) return null;
      return {
        kind: 'listIds',
        listIds: ids,
        sort: parsed.searchParams.get('sort')?.trim() || 'WEEK_BESTSELLER',
      };
    }
  } catch {
    return null;
  }
  return null;
}

function isFidiboSearchItem(value: unknown): value is FidiboSearchItem {
  return (
    !!value &&
    typeof value === 'object' &&
    'id' in value &&
    typeof (value as FidiboSearchItem).id === 'number'
  );
}

export function parseFidiboSortFromUrl(categoryUrl: string): string {
  try {
    const parsed = new URL(categoryUrl.trim());
    return parsed.searchParams.get('sort')?.trim() || 'BESTSELLER';
  } catch {
    return 'BESTSELLER';
  }
}

function parseFidiboEbooksSlugFromUrl(categoryUrl: string): string | null {
  try {
    const parsed = new URL(categoryUrl.trim());
    const match = parsed.pathname.replace(/\/+$/, '').match(/^\/ebooks\/(.+)$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

type FidiboCategoryActionEntry = {
  action?: {
    inputs?: { key?: string; value?: string | number }[];
    web_url?: string;
  };
  long_slug?: string;
  slug?: string;
  children?: unknown[];
};

function categoryIdFromActionEntry(entry: FidiboCategoryActionEntry): number | null {
  for (const input of entry.action?.inputs ?? []) {
    if (input.key === 'categoryId' && input.value != null) {
      const id = Number(input.value);
      if (Number.isFinite(id) && id > 0) return id;
    }
  }
  return null;
}

function walkCategoryTree(node: unknown, ebooksSlug: string | null): FidiboCategoryActionEntry | null {
  if (!node || typeof node !== 'object') return null;

  const entry = node as FidiboCategoryActionEntry;
  const entryWeb = entry.action?.web_url?.replace(/\/+$/, '');
  const matchesSlug =
    !!ebooksSlug &&
    (entry.long_slug === ebooksSlug ||
      entry.slug === ebooksSlug ||
      entryWeb === `/ebooks/${ebooksSlug}`);

  if (matchesSlug) return entry;

  for (const child of entry.children ?? []) {
    const found = walkCategoryTree(child, ebooksSlug);
    if (found) return found;
  }
  return null;
}

/** categoryId و sort از صفحه دسته فیدیبو (ساختار جدید action.inputs) */
export function parseFidiboCategoryListMeta(
  html: string,
  categoryUrl: string
): { categoryId: number; sort: string } | null {
  const sort = parseFidiboSortFromUrl(categoryUrl);
  const ebooksSlug = parseFidiboEbooksSlugFromUrl(categoryUrl);

  const ctx = extractJsObjectAssignment(html, 'window.categoryContext');
  if (ctx) {
    const directKey = ebooksSlug ? `ebooks${ebooksSlug}` : null;
    if (directKey && ctx[directKey]) {
      const id = categoryIdFromActionEntry(ctx[directKey] as FidiboCategoryActionEntry);
      if (id) return { categoryId: id, sort };
    }

    for (const value of Object.values(ctx)) {
      const found = walkCategoryTree(value, ebooksSlug);
      if (found) {
        const id = categoryIdFromActionEntry(found);
        if (id) return { categoryId: id, sort };
      }

      if (!ebooksSlug && value && typeof value === 'object') {
        const legacyId =
          (value as { categoryId?: number }).categoryId ??
          (value as { id?: number }).id;
        if (typeof legacyId === 'number' && legacyId > 0) {
          return { categoryId: legacyId, sort };
        }
      }
    }
  }

  const inputMatch = html.match(/"key"\s*:\s*"categoryId"\s*,\s*"value"\s*:\s*"?(\d+)"?/i);
  if (inputMatch?.[1]) {
    return { categoryId: parseInt(inputMatch[1], 10), sort };
  }

  const slugMatch = html.match(/categoryId["\s:]+(\d+)/i);
  if (slugMatch?.[1]) {
    return { categoryId: parseInt(slugMatch[1], 10), sort };
  }

  return null;
}

export function parseFidiboCategoryContext(html: string, categoryUrl?: string): number | null {
  if (categoryUrl) {
    return parseFidiboCategoryListMeta(html, categoryUrl)?.categoryId ?? null;
  }

  const ctx = extractJsObjectAssignment(html, 'window.categoryContext');
  if (!ctx) return null;
  for (const value of Object.values(ctx)) {
    const fromAction = categoryIdFromActionEntry(value as FidiboCategoryActionEntry);
    if (fromAction) return fromAction;
    if (value && typeof value === 'object') {
      const id =
        (value as { categoryId?: number }).categoryId ?? (value as { id?: number }).id;
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

  const flatResult = data?.data?.result;
  if (Array.isArray(flatResult) && flatResult.length > 0 && isFidiboSearchItem(flatResult[0])) {
    return flatResult
      .filter(isFidiboSearchItem)
      .map(itemToCandidate)
      .filter((x): x is BookSearchCandidate => !!x);
  }

  return parseFidiboSearchResponse(data as FidiboSearchResponse);
}

export function buildFidiboListRequestBody(
  filters: Record<string, unknown>,
  sort: string
): Record<string, unknown> {
  const body: Record<string, unknown> = { order: sort, ...filters };
  delete body.page;
  delete body.limit;
  delete body.sort;
  return body;
}

async function fetchFidiboListPage(
  page: number,
  limit: number,
  body: Record<string, unknown>,
  options?: { maxRetries?: number }
): Promise<BookSearchCandidate[]> {
  const data = await fetchJson<FidiboListResponse>(
    `https://api.fidibo.com/flex/list/book?page=${page}&limit=${limit}`,
    {
      method: 'POST',
      headers: { ...fidiboHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      maxRetries: options?.maxRetries,
      timeoutMs: 25000,
    }
  );
  return parseFidiboListResponse(data);
}

async function collectFidiboListPages(
  limit: number,
  body: Record<string, unknown>,
  options?: { maxRetries?: number; delayMs?: number }
): Promise<BookSearchCandidate[]> {
  const requestLimit = Math.min(30, limit);
  const out: BookSearchCandidate[] = [];
  const seen = new Set<string>();
  let page = 1;

  while (out.length < limit) {
    const batch = await fetchFidiboListPage(page, requestLimit, body, options);
    if (batch.length === 0) break;

    let added = 0;
    for (const candidate of batch) {
      if (seen.has(candidate.bookId)) continue;
      seen.add(candidate.bookId);
      out.push(candidate);
      added++;
      if (out.length >= limit) break;
    }

    if (out.length >= limit) break;
    if (added === 0) break;
    page++;
    const delayMs = options?.delayMs ?? 0;
    if (delayMs > 0) await sleep(delayMs);
  }

  return out.slice(0, limit);
}

export async function listFidiboCategory(
  categoryUrl: string,
  limit: number,
  options?: { maxRetries?: number; delayMs?: number }
): Promise<BookSearchCandidate[]> {
  const listRequest = parseFidiboListRequest(categoryUrl);

  if (listRequest?.kind === 'listIds') {
    const listBody = buildFidiboListRequestBody(
      { proposedListId: listRequest.listIds },
      listRequest.sort
    );
    return collectFidiboListPages(limit, listBody, options);
  }

  const html = await fetchHtml(categoryUrl, {
    headers: { Referer: `${FIDIBO_ORIGIN}/` },
    maxRetries: options?.maxRetries,
    timeoutMs: 45000,
  });
  const categoryMeta = parseFidiboCategoryListMeta(html, categoryUrl);
  if (!categoryMeta) {
    throw new Error('categoryId فیدیبو از صفحه استخراج نشد');
  }

  const categoryBody = buildFidiboListRequestBody(
    { categoryId: categoryMeta.categoryId },
    categoryMeta.sort
  );
  return collectFidiboListPages(limit, categoryBody, options);
}

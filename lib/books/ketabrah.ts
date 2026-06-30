import type { BookRecord, BookSearchCandidate } from '@/lib/books/types';
import { inferKetabrahContentType } from '@/lib/books/content-type';
import { extractJsObjectAssignment, fetchHtml } from '@/lib/books/http-client';
import { sanitizeBookText, stripHtmlTags } from '@/lib/books/normalize';

const KETABRAH_ORIGIN = 'https://ketabrah.com';

function absUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${KETABRAH_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** استخراج لینک‌های کتاب از HTML جستجو/دسته کتابراه */
export function parseKetabrahListHtml(html: string): BookSearchCandidate[] {
  const seen = new Set<string>();
  const out: BookSearchCandidate[] = [];

  const linkRe =
    /href="((?:https:\/\/ketabrah\.com)?\/(?:book|audiobook)\/(\d+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(html)) !== null) {
    const href = absUrl(match[1]!);
    const bookId = match[2]!;
    if (seen.has(bookId)) continue;
    seen.add(bookId);

    const anchorText = stripHtmlTags(match[3] ?? '');
    const titleFromAnchor = sanitizeBookText(
      anchorText.replace(/^(کتاب صوتی|کتاب|خلاصه کتاب صوتی|خلاصه کتاب)\s*/i, '')
    );

    const contextStart = Math.max(0, match.index - 400);
    const contextEnd = Math.min(html.length, match.index + 800);
    const context = html.slice(contextStart, contextEnd);
    const h3 = context.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    const titleFromH3 = h3 ? sanitizeBookText(stripHtmlTags(h3[1]!)) : '';
    const title = titleFromH3 || titleFromAnchor || `کتاب ${bookId}`;

    const authorMatch = context.match(/class="[^"]*author[^"]*"[^>]*>([^<]+)/i);
    const authors = authorMatch?.[1]
      ? [sanitizeBookText(authorMatch[1])]
      : [];

    const imgMatch = context.match(/<img[^>]+src="([^"]+)"/i);
    const coverUrl = imgMatch?.[1] ? absUrl(imgMatch[1]) : null;

    const bookUrl = href.split('?')[0]!;

    out.push({
      bookId,
      contentType: inferKetabrahContentType(bookUrl, title),
      title,
      authors,
      coverUrl,
      bookUrl: bookUrl,
    });
  }

  return out;
}

export function parseKetabrahBookHtml(html: string, bookId: string): BookRecord | null {
  const ogTitle = html.match(/property="og:title"[^>]+content="([^"]+)"/i)?.[1];
  const ogImage = html.match(/property="og:image"[^>]+content="([^"]+)"/i)?.[1];
  const ogDesc = html.match(/property="og:description"[^>]+content="([^"]+)"/i)?.[1];
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];

  const title = sanitizeBookText(ogTitle ?? '') || `کتاب ${bookId}`;
  if (!ogTitle && !html.includes('book')) return null;

  const authorMeta = html.match(/نویسنده[^<]*<[^>]+>([^<]+)/i)?.[1];
  const authors = authorMeta ? [sanitizeBookText(authorMeta)] : [];

  const bookUrl = canonical ? absUrl(canonical) : `${KETABRAH_ORIGIN}/book/${bookId}`;

  return {
    source: 'ketabrah',
    bookId,
    contentType: inferKetabrahContentType(bookUrl, title),
    title: title.replace(/\s*\|\s*کتابراه.*$/i, '').trim(),
    authors,
    genres: [],
    description: sanitizeBookText(ogDesc ?? '') || null,
    isbn: null,
    coverUrl: ogImage ? absUrl(ogImage) : null,
    bookUrl,
    publisher: null,
    price: null,
    rating: null,
    scrapedAt: new Date().toISOString(),
  };
}

export async function searchKetabrahByTitle(
  title: string,
  options?: { maxRetries?: number }
): Promise<BookSearchCandidate[]> {
  const url = `${KETABRAH_ORIGIN}/search?q=${encodeURIComponent(title)}`;
  const html = await fetchHtml(url, {
    maxRetries: options?.maxRetries,
    timeoutMs: 45000,
  });
  return parseKetabrahListHtml(html);
}

export async function listKetabrahCategory(
  categoryUrl: string,
  limit: number,
  options?: { maxRetries?: number }
): Promise<BookSearchCandidate[]> {
  const html = await fetchHtml(categoryUrl, {
    maxRetries: options?.maxRetries,
    timeoutMs: 45000,
  });
  return parseKetabrahListHtml(html).slice(0, limit);
}

export async function fetchKetabrahBookDetail(
  bookId: string,
  options?: { maxRetries?: number }
): Promise<BookRecord | null> {
  const html = await fetchHtml(`${KETABRAH_ORIGIN}/book/${bookId}`, {
    maxRetries: options?.maxRetries,
    timeoutMs: 45000,
  });
  return parseKetabrahBookHtml(html, bookId);
}

export function ketabrahCandidateToRecord(candidate: BookSearchCandidate): BookRecord {
  return {
    source: 'ketabrah',
    bookId: candidate.bookId,
    contentType: candidate.contentType ?? inferKetabrahContentType(candidate.bookUrl, candidate.title),
    title: candidate.title,
    authors: candidate.authors,
    genres: [],
    description: null,
    isbn: null,
    coverUrl: candidate.coverUrl ?? null,
    bookUrl: candidate.bookUrl,
    publisher: null,
    price: null,
    rating: null,
    scrapedAt: new Date().toISOString(),
  };
}

/** برای تست — bookContext-style اگر وجود داشت */
export function parseKetabrahPageContext(html: string): Record<string, unknown> | null {
  return extractJsObjectAssignment(html, 'window.pageContext');
}

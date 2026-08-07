import type { BookRecord, BookSearchCandidate } from '@/lib/books/types';
import { inferKetabrahContentType } from '@/lib/books/content-type';
import { extractJsObjectAssignment, fetchHtml } from '@/lib/books/http-client';
import {
  normalizeIsbn,
  sanitizeBookText,
  shortBookDisplayTitle,
  stripHtmlTags,
} from '@/lib/books/normalize';

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
    const title = shortBookDisplayTitle(titleFromH3 || titleFromAnchor || `کتاب ${bookId}`);

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

function parseKetabrahCanonical(html: string, bookId: string): string {
  const canonical =
    html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1] ??
    html.match(/property="canonical"[^>]+content="([^"]+)"/i)?.[1];
  return canonical ? absUrl(canonical) : `${KETABRAH_ORIGIN}/book/${bookId}`;
}

function parseKetabrahTitle(html: string, bookId: string): string {
  const h1 = html.match(/class="book-page-title"[^>]*>\s*<h1>([^<]+)<\/h1>/i)?.[1];
  const ogTitle = html.match(/property="og:title"[^>]+content="([^"]+)"/i)?.[1];
  const raw = h1 ?? ogTitle ?? '';
  const cleaned = sanitizeBookText(raw)
    .replace(/\s*\|\s*کتابراه.*$/i, '')
    .replace(/\s*\|\s*[^|]+?\s*\|\s*نشر.*$/i, '')
    .trim();
  return shortBookDisplayTitle(cleaned) || `کتاب ${bookId}`;
}

function parseKetabrahCredits(html: string): {
  authors: string[];
  translator: string | null;
  publisher: string | null;
} {
  const authors: string[] = [];
  let translator: string | null = null;
  let publisher: string | null = null;

  const infoBlock =
    html.match(/class="book-main-info-authors"[\s\S]*?<\/ul>/i)?.[0] ??
    html.match(/id="BookDetails"[\s\S]*?<\/table>/i)?.[0] ??
    '';

  for (const match of infoBlock.matchAll(/<li>([^<:]+):\s*<a[^>]*>([^<]+)<\/a>/gi)) {
    const role = match[1]!.trim();
    const name = sanitizeBookText(match[2]!);
    if (!name) continue;
    if (role.includes('نویسنده')) authors.push(name);
    else if (role.includes('مترجم')) translator = name;
    else if (role.includes('راوی')) authors.push(`راوی: ${name}`);
    else if (role.includes('ناشر')) publisher = name;
  }

  if (authors.length === 0) {
    for (const match of infoBlock.matchAll(
      /<td>نویسنده<\/td>\s*<td[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/gi
    )) {
      const name = sanitizeBookText(match[1]!);
      if (name) authors.push(name);
    }
  }

  if (!translator) {
    const tr = infoBlock.match(
      /<td>مترجم<\/td>\s*<td[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i
    )?.[1];
    if (tr) translator = sanitizeBookText(tr);
  }

  if (!publisher) {
    const pub = infoBlock.match(
      /<td>ناشر[^<]*<\/td>\s*<td[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i
    )?.[1];
    if (pub) publisher = sanitizeBookText(pub);
  }

  return { authors, translator, publisher };
}

function parseKetabrahIntroduction(html: string): string | null {
  const sectionMatch = html.match(
    /id="BookIntroduction"[^>]*>([\s\S]*?)(?=<div[^>]+id="(?:TableOfContents|BookDetails)"|<button[^>]+id="btnExpandBookDescription)/i
  );
  if (!sectionMatch?.[1]) return null;

  const paragraphs = [...sectionMatch[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => sanitizeBookText(stripHtmlTags(m[1]!)))
    .filter(
      (p) =>
        p.length > 30 &&
        !p.includes('اپلیکیشن کتابراه') &&
        !p.startsWith('برای دانلود قانونی')
    );

  return paragraphs.length > 0 ? paragraphs.join('\n\n') : null;
}

function parseKetabrahMetaDescription(html: string): string | null {
  const meta =
    html.match(/name="description"[^>]+content="([^"]+)"/i)?.[1] ??
    html.match(/property="og:description"[^>]+content="([^"]+)"/i)?.[1];
  const text = sanitizeBookText(meta ?? '');
  return text.length > 20 ? text.replace(/\.{3,}$/, '').trim() : null;
}

function parseKetabrahIsbn(html: string): string | null {
  const tableMatch = html.match(/<td>شابک<\/td>\s*<td[^>]*>[\s\S]*?([\d][\d\-]+)/i)?.[1];
  const jsonMatch = html.match(/"isbn"\s*:\s*"([^"]+)"/i)?.[1];
  return normalizeIsbn(tableMatch ?? jsonMatch);
}

function parseKetabrahGenres(html: string): string[] {
  const genres: string[] = [];
  const subjectMatch = html.match(
    /<td>موضوع کتاب<\/td>\s*<td[^>]*>[\s\S]*?title="([^"]+)"/i
  )?.[1];
  if (subjectMatch) {
    genres.push(
      sanitizeBookText(subjectMatch.replace(/^کتاب‌های\s+/, '').replace(/^کتاب\s+/, ''))
    );
  }

  const breadcrumbNames = [
    ...html.matchAll(
      /class="breadcrumb"[\s\S]*?<span itemprop="name">([^<]+)<\/span>/gi
    ),
  ]
    .map((m) => sanitizeBookText(m[1]!))
    .filter((name) => name && name !== 'خانه' && !name.includes('کتاب‌ متنی') && !name.includes('کتاب متنی'));

  const lastCrumb = breadcrumbNames[breadcrumbNames.length - 1];
  if (lastCrumb && !genres.includes(lastCrumb)) {
    genres.push(lastCrumb);
  }

  return genres.filter(Boolean);
}

function parseKetabrahRating(html: string): number | null {
  const raw =
    html.match(/itemprop="ratingValue"[^>]+content="([^"]+)"/i)?.[1] ??
    html.match(/"ratingValue"\s*:\s*"([^"]+)"/i)?.[1];
  if (!raw) return null;
  const n = Number.parseFloat(raw.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))));
  return Number.isFinite(n) ? n : null;
}

function parseKetabrahCover(html: string): string | null {
  const ogImage = html.match(/property="og:image"[^>]+content="([^"]+)"/i)?.[1];
  if (ogImage) return absUrl(ogImage);
  const img = html.match(/class="book-cover"[\s\S]*?<img[^>]+src="([^"]+)"/i)?.[1];
  return img ? absUrl(img) : null;
}

export function parseKetabrahBookHtml(html: string, bookId: string): BookRecord | null {
  if (!html.includes('book') && !html.includes('BookIntroduction')) return null;

  const title = parseKetabrahTitle(html, bookId);
  const { authors, translator, publisher } = parseKetabrahCredits(html);
  const description =
    parseKetabrahIntroduction(html) ?? parseKetabrahMetaDescription(html);
  const bookUrl = parseKetabrahCanonical(html, bookId);

  return {
    source: 'ketabrah',
    bookId,
    contentType: inferKetabrahContentType(bookUrl, title),
    title,
    authors,
    translator,
    genres: parseKetabrahGenres(html),
    description,
    isbn: parseKetabrahIsbn(html),
    coverUrl: parseKetabrahCover(html),
    bookUrl,
    publisher,
    price: null,
    rating: parseKetabrahRating(html),
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
  options?: { maxRetries?: number; bookUrl?: string }
): Promise<BookRecord | null> {
  const path = options?.bookUrl?.trim() || `/book/${bookId}`;
  const url = path.startsWith('http') ? path : absUrl(path);
  const html = await fetchHtml(url, {
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
    title: shortBookDisplayTitle(candidate.title),
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

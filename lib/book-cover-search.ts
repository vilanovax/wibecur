import type { BookSearchCandidate, BookSource } from '@/lib/books/types';
import { searchFidiboByTitle } from '@/lib/books/fidibo';
import { searchKetabrahByTitle } from '@/lib/books/ketabrah';
import { searchTaaghcheByTitle } from '@/lib/books/taaghche';

export type BookCoverSearchSource = BookSource;

export type BookCoverSearchResult = {
  id: string;
  source: BookCoverSearchSource;
  title: string;
  coverUrl: string;
  bookUrl: string;
  author?: string | null;
  rating?: number | null;
};

export type BookCoverSearchOptions = {
  limit?: number;
  maxRetries?: number;
};

export function isBookCategorySlug(slug?: string | null): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return s.includes('book') || s.includes('literature') || s.includes('podcast');
}

export const BOOK_COVER_SOURCE_LABELS: Record<BookCoverSearchSource, string> = {
  fidibo: 'فیدیبو',
  ketabrah: 'کتابراه',
  taaghche: 'طاقچه',
};

function formatAuthor(authors: string[]): string | null {
  const names = authors.filter((a) => a && !a.startsWith('راوی:'));
  return names.length > 0 ? names.join('، ') : null;
}

function candidateToResult(
  candidate: BookSearchCandidate,
  source: BookCoverSearchSource
): BookCoverSearchResult | null {
  const coverUrl = candidate.coverUrl?.trim();
  if (!coverUrl) return null;

  return {
    id: `${source}-${candidate.bookId}`,
    source,
    title: candidate.title,
    coverUrl,
    bookUrl: candidate.bookUrl,
    author: formatAuthor(candidate.authors),
  };
}

async function searchBySource(
  title: string,
  source: BookCoverSearchSource,
  options?: BookCoverSearchOptions
): Promise<BookCoverSearchResult[]> {
  const limit = options?.limit ?? 12;
  const maxRetries = options?.maxRetries ?? 2;

  let candidates: BookSearchCandidate[] = [];
  if (source === 'fidibo') {
    candidates = await searchFidiboByTitle(title, { maxRetries });
  } else if (source === 'ketabrah') {
    candidates = await searchKetabrahByTitle(title, { maxRetries });
  } else {
    candidates = await searchTaaghcheByTitle(title, { maxRetries });
  }

  return candidates
    .map((c) => candidateToResult(c, source))
    .filter((r): r is BookCoverSearchResult => r !== null)
    .slice(0, limit);
}

export async function searchBookCovers(
  title: string,
  source: BookCoverSearchSource,
  options?: BookCoverSearchOptions
): Promise<BookCoverSearchResult[]> {
  const trimmed = title.trim();
  if (!trimmed) return [];
  return searchBySource(trimmed, source, options);
}

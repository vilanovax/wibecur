import type { BookExtractOptions, BookRecord, BookSearchCandidate, BookSource } from '@/lib/books/types';
import { DEFAULT_BOOK_EXTRACT_OPTIONS } from '@/lib/books/types';
import { matchesContentFilter } from '@/lib/books/content-type';
import { sleep } from '@/lib/books/normalize';
import { assertCategoryUrlForSource } from '@/lib/books/url-detect';
import {
  fetchFidiboBookDetail,
  fidiboCandidateToRecord,
  listFidiboCategory,
} from '@/lib/books/fidibo';
import {
  fetchKetabrahBookDetail,
  ketabrahCandidateToRecord,
  listKetabrahCategory,
} from '@/lib/books/ketabrah';
import {
  fetchTaaghcheBookDetail,
  listTaaghcheCategory,
  taaghcheCandidateToRecord,
} from '@/lib/books/taaghche';

function resolveOptions(options?: BookExtractOptions): Required<BookExtractOptions> {
  return { ...DEFAULT_BOOK_EXTRACT_OPTIONS, ...options };
}

async function listCategoryCandidates(
  source: BookSource,
  categoryUrl: string,
  limit: number,
  maxRetries: number,
  delayMs: number
): Promise<BookSearchCandidate[]> {
  const url = assertCategoryUrlForSource(categoryUrl, source);
  if (source === 'fidibo') {
    return listFidiboCategory(url, limit, { maxRetries, delayMs: Math.min(delayMs, 500) });
  }
  if (source === 'ketabrah') return listKetabrahCategory(url, limit, { maxRetries });
  return listTaaghcheCategory(url, limit, { maxRetries });
}

async function enrichCandidate(
  source: BookSource,
  candidate: BookSearchCandidate,
  maxRetries: number
): Promise<BookRecord> {
  if (source === 'fidibo') {
    const detail = await fetchFidiboBookDetail(candidate.bookId, { maxRetries });
    if (detail) {
      return { ...detail, contentType: detail.contentType ?? candidate.contentType ?? null };
    }
    return fidiboCandidateToRecord(candidate);
  }
  if (source === 'ketabrah') {
    const detail = await fetchKetabrahBookDetail(candidate.bookId, {
      maxRetries,
      bookUrl: candidate.bookUrl,
    });
    if (detail) {
      return { ...detail, contentType: detail.contentType ?? candidate.contentType ?? null };
    }
    return ketabrahCandidateToRecord(candidate);
  }
  const detail = await fetchTaaghcheBookDetail(candidate.bookId, { maxRetries });
  if (detail) {
    return { ...detail, contentType: detail.contentType ?? candidate.contentType ?? null };
  }
  return taaghcheCandidateToRecord(candidate);
}

export async function extractCategoryList(
  source: BookSource,
  categoryUrl: string,
  options?: BookExtractOptions,
  onProgress?: (
    done: number,
    total: number,
    currentTitle: string | null,
    state?: { errors: { title: string; message: string }[] }
  ) => void | Promise<void>
): Promise<{
  records: BookRecord[];
  errors: { title: string; message: string }[];
}> {
  const opts = resolveOptions(options);
  const limit = Math.min(Math.max(1, opts.limit), 100);
  const errors: { title: string; message: string }[] = [];
  const records: BookRecord[] = [];

  await onProgress?.(0, limit, null);
  let candidates = await listCategoryCandidates(
    source,
    categoryUrl,
    limit,
    opts.maxRetries,
    opts.delayMs
  );
  if (opts.contentTypeFilter !== 'all') {
    candidates = candidates.filter((c) =>
      matchesContentFilter(c.contentType, opts.contentTypeFilter)
    );
  }
  const total = candidates.length;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]!;
    await onProgress?.(i, total, candidate.title);
    try {
      let record: BookRecord;
      if (opts.fastMode || !opts.enrichDetails) {
        record =
          source === 'fidibo'
            ? fidiboCandidateToRecord(candidate)
            : source === 'ketabrah'
              ? ketabrahCandidateToRecord(candidate)
              : taaghcheCandidateToRecord(candidate);
      } else {
        record = await enrichCandidate(source, candidate, opts.maxRetries);
      }
      records.push(record);
    } catch (err) {
      errors.push({
        title: candidate.title,
        message: err instanceof Error ? err.message : 'خطا',
      });
    }
    await onProgress?.(i + 1, total, null, { errors });
    if (i < candidates.length - 1 && opts.delayMs > 0) await sleep(opts.delayMs);
  }

  await onProgress?.(total, total, null);
  return { records, errors };
}

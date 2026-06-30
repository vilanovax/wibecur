import type {
  BookExtractOptions,
  BookRecord,
  BookSearchCandidate,
  BookSource,
} from '@/lib/books/types';
import { DEFAULT_BOOK_EXTRACT_OPTIONS } from '@/lib/books/types';
import { matchesContentFilter } from '@/lib/books/content-type';
import { formatBookFetchError, getBookSourceLabel } from '@/lib/books/fetch-errors';
import { sleep } from '@/lib/books/normalize';
import { pickBestTitleMatch } from '@/lib/books/title-match';
import {
  fetchFidiboBookDetail,
  fidiboCandidateToRecord,
  searchFidiboByTitle,
} from '@/lib/books/fidibo';
import {
  fetchKetabrahBookDetail,
  ketabrahCandidateToRecord,
  searchKetabrahByTitle,
} from '@/lib/books/ketabrah';
import {
  fetchTaaghcheBookDetail,
  searchTaaghcheByTitle,
  taaghcheCandidateToRecord,
} from '@/lib/books/taaghche';

export type TitleExtractRowResult =
  | { status: 'found'; query: string; record: BookRecord; matchScore: number }
  | { status: 'not_found'; query: string }
  | { status: 'error'; query: string; message: string };

export type TitleExtractProgressState = {
  notFound: string[];
  errors: { title: string; message: string }[];
  currentStep?: string | null;
};

function resolveOptions(options?: BookExtractOptions): Required<BookExtractOptions> {
  return { ...DEFAULT_BOOK_EXTRACT_OPTIONS, ...options };
}

function filterByContentType(
  candidates: BookSearchCandidate[],
  filter: Required<BookExtractOptions>['contentTypeFilter']
): BookSearchCandidate[] {
  if (filter === 'all') return candidates;
  return candidates.filter((c) => matchesContentFilter(c.contentType, filter));
}

async function searchBySource(
  source: BookSource,
  title: string,
  maxRetries: number
): Promise<BookSearchCandidate[]> {
  if (source === 'fidibo') return searchFidiboByTitle(title, { maxRetries });
  if (source === 'ketabrah') return searchKetabrahByTitle(title, { maxRetries });
  return searchTaaghcheByTitle(title, { maxRetries });
}

async function enrichRecord(
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

export async function extractSingleTitle(
  source: BookSource,
  title: string,
  options?: BookExtractOptions,
  onStep?: (step: string | null) => void | Promise<void>
): Promise<TitleExtractRowResult> {
  const opts = resolveOptions(options);
  const query = title.trim();
  const sourceLabel = getBookSourceLabel(source);
  if (!query) return { status: 'error', query: title, message: 'عنوان خالی' };

  try {
    await onStep?.(`جستجو در ${sourceLabel}…`);
    const candidates = filterByContentType(
      await searchBySource(source, query, opts.maxRetries),
      opts.contentTypeFilter
    );
    const best = pickBestTitleMatch(query, candidates, opts.fuzzyMinScore);
    if (!best) {
      await onStep?.(null);
      return { status: 'not_found', query };
    }

    let record: BookRecord;
    if (opts.fastMode || !opts.enrichDetails) {
      record =
        source === 'fidibo'
          ? fidiboCandidateToRecord(best)
          : source === 'ketabrah'
            ? ketabrahCandidateToRecord(best)
            : taaghcheCandidateToRecord(best);
    } else {
      await onStep?.(`دریافت جزئیات «${best.title}» از ${sourceLabel}…`);
      record = await enrichRecord(source, best, opts.maxRetries);
    }

    await onStep?.(null);
    return { status: 'found', query, record, matchScore: best.matchScore };
  } catch (err) {
    await onStep?.(null);
    const message = formatBookFetchError(err, `خطا در ${sourceLabel}`);
    return { status: 'error', query, message };
  }
}

export async function extractTitlesList(
  source: BookSource,
  titles: string[],
  options?: BookExtractOptions,
  onProgress?: (
    done: number,
    total: number,
    currentTitle: string | null,
    state?: TitleExtractProgressState
  ) => void | Promise<void>,
  resumeFrom?: {
    records: BookRecord[];
    notFound: string[];
    errors: { title: string; message: string }[];
    processedTitles: string[];
  }
): Promise<{
  records: BookRecord[];
  notFound: string[];
  errors: { title: string; message: string }[];
  processedTitles: string[];
}> {
  const opts = resolveOptions(options);
  const cleaned = titles.map((t) => t.trim()).filter(Boolean);
  const processed = new Set(resumeFrom?.processedTitles ?? []);
  const pending = cleaned.filter((t) => !processed.has(t));
  const total = cleaned.length;
  const records: BookRecord[] = [...(resumeFrom?.records ?? [])];
  const notFound: string[] = [...(resumeFrom?.notFound ?? [])];
  const errors: { title: string; message: string }[] = [...(resumeFrom?.errors ?? [])];
  let done = processed.size;
  let currentStep: string | null = null;

  const report = async (title: string | null) => {
    await onProgress?.(done, total, title, { notFound, errors, currentStep });
  };

  for (let i = 0; i < pending.length; i++) {
    const query = pending[i]!;
    await report(query);
    const result = await extractSingleTitle(source, query, opts, async (step) => {
      currentStep = step;
      await report(query);
    });
    processed.add(query);
    done++;
    currentStep = null;
    if (result.status === 'found') records.push(result.record);
    else if (result.status === 'not_found') notFound.push(query);
    else errors.push({ title: query, message: result.message });
    await report(null);
    if (i < pending.length - 1 && opts.delayMs > 0) await sleep(opts.delayMs);
  }

  await onProgress?.(total, total, null, { notFound, errors, currentStep: null });
  return { records, notFound, errors, processedTitles: [...processed] };
}

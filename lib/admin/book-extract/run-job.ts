import { prisma } from '@/lib/prisma';
import type { BookExtractMode, BookExtractSource } from '@prisma/client';
import type {
  BookExtractCategoryInput,
  BookExtractOptions,
  BookExtractProgressMeta,
  BookExtractTitlesInput,
  WibeBookImportItem,
} from '@/lib/books/types';
import { DEFAULT_BOOK_EXTRACT_OPTIONS } from '@/lib/books/types';
import { autoImportBookExtractResults } from '@/lib/admin/book-extract/auto-import';
import { bookRecordsToImportPayload } from '@/lib/books/map-to-wibe';
import { resolveExistingBooksByTitles } from '@/lib/books/find-existing-in-db';
import { extractCategoryList } from '@/lib/books/extract-category';
import { extractTitlesList } from '@/lib/books/extract-titles';
import type { BookRecord, BookSource } from '@/lib/books/types';

function parseTitlesInput(input: unknown): string[] {
  if (!input || typeof input !== 'object') return [];
  const titles = (input as BookExtractTitlesInput).titles;
  if (!Array.isArray(titles)) return [];
  return titles.map((t) => String(t).trim()).filter(Boolean);
}

function parseCategoryInput(input: unknown): BookExtractCategoryInput | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as BookExtractCategoryInput;
  if (typeof o.categoryUrl !== 'string' || !o.categoryUrl.trim()) return null;
  const limit = typeof o.limit === 'number' ? o.limit : DEFAULT_BOOK_EXTRACT_OPTIONS.limit;
  return { categoryUrl: o.categoryUrl.trim(), limit };
}

function parseOptions(raw: unknown): BookExtractOptions {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, unknown>;
  return {
    enrichDetails: typeof o.enrichDetails === 'boolean' ? o.enrichDetails : undefined,
    fastMode: typeof o.fastMode === 'boolean' ? o.fastMode : undefined,
    fuzzyMinScore: typeof o.fuzzyMinScore === 'number' ? o.fuzzyMinScore : undefined,
    delayMs: typeof o.delayMs === 'number' ? o.delayMs : undefined,
    maxRetries: typeof o.maxRetries === 'number' ? o.maxRetries : undefined,
    limit: typeof o.limit === 'number' ? o.limit : undefined,
    contentTypeFilter:
      o.contentTypeFilter === 'ebook' || o.contentTypeFilter === 'audiobook' || o.contentTypeFilter === 'all'
        ? o.contentTypeFilter
        : undefined,
    autoImport: typeof o.autoImport === 'boolean' ? o.autoImport : undefined,
  };
}

function buildJobSummary(
  records: BookRecord[],
  notFound: string[],
  errors: { title: string; message: string }[],
  fromDatabase: string[] = []
): string {
  const parts: string[] = [];
  if (records.length > 0) parts.push(`${records.length} کتاب`);
  if (fromDatabase.length > 0) parts.push(`${fromDatabase.length} از دیتابیس`);
  if (notFound.length > 0) parts.push(`${notFound.length} پیدا نشد`);
  if (errors.length > 0) parts.push(`${errors.length} خطا`);
  if (parts.length === 0) return 'نتیجه‌ای ثبت نشد';
  return parts.join(' · ');
}

function calcProgressPercent(
  done: number,
  total: number,
  currentTitle: string | null,
  currentStep: string | null
): number {
  if (total <= 0) return 0;
  if (currentTitle && currentStep && done < total) {
    return Math.min(99, Math.round(((done + 0.35) / total) * 100));
  }
  if (currentTitle && done < total) {
    return Math.min(99, Math.round(((done + 0.15) / total) * 100));
  }
  return Math.min(99, Math.round((done / total) * 100));
}

function wibeItemsToRecords(items: WibeBookImportItem[], source: BookSource): BookRecord[] {
  return items.map((item) => ({
    source: (item.metadata?.source as BookSource) ?? source,
    bookId: item.metadata?.sourceId ?? '',
    title: item.title,
    authors: item.metadata?.author ? item.metadata.author.split('، ') : [],
    genres: item.metadata?.genre ? item.metadata.genre.split('، ') : [],
    description: item.description ?? null,
    isbn: item.metadata?.isbn ?? null,
    coverUrl: item.imageUrl ?? null,
    bookUrl: item.externalUrl,
    publisher: item.metadata?.publisher ?? null,
    price: item.metadata?.price ?? null,
    rating: item.metadata?.rating ?? null,
    scrapedAt: new Date().toISOString(),
  }));
}

async function runTitlesJob(
  jobId: string,
  source: BookExtractSource,
  titles: string[],
  options: Required<BookExtractOptions>,
  targetListId: string | null,
  resumeMeta?: BookExtractProgressMeta | null,
  resumeItems?: unknown
): Promise<void> {
  const progressMeta: BookExtractProgressMeta = {
    done: resumeMeta?.done ?? 0,
    total: titles.length,
    currentTitle: null,
    currentStep: null,
    notFound: [...(resumeMeta?.notFound ?? [])],
    errors: [...(resumeMeta?.errors ?? [])],
    processedTitles: [...(resumeMeta?.processedTitles ?? [])],
    fromDatabase: [...(resumeMeta?.fromDatabase ?? [])],
  };

  const existingRecords =
    resumeItems && typeof resumeItems === 'object' && 'items' in (resumeItems as object)
      ? wibeItemsToRecords((resumeItems as { items: WibeBookImportItem[] }).items, source)
      : [];

  const processedSet = new Set(progressMeta.processedTitles ?? []);
  const pendingTitles = titles.filter((title) => !processedSet.has(title));

  let dbRecords: BookRecord[] = [];
  let fromDatabase = [...(progressMeta.fromDatabase ?? [])];

  if (pendingTitles.length > 0) {
    progressMeta.currentStep = 'بررسی دیتابیس…';
    await prisma.book_extract_jobs.update({
      where: { id: jobId },
      data: { progressMeta: { ...progressMeta } },
    });

    const resolved = await resolveExistingBooksByTitles(pendingTitles);
    dbRecords = resolved.matches.map((match) => match.record);
    fromDatabase = [...fromDatabase, ...resolved.matches.map((match) => match.queryTitle)];

    const dbProcessedTitles = resolved.matches.map((match) => match.queryTitle);
    progressMeta.processedTitles = [...(progressMeta.processedTitles ?? []), ...dbProcessedTitles];
    progressMeta.fromDatabase = fromDatabase;
    progressMeta.done = progressMeta.processedTitles.length;
    progressMeta.currentStep = null;

    await prisma.book_extract_jobs.update({
      where: { id: jobId },
      data: {
        progress: calcProgressPercent(progressMeta.done, titles.length, null, null),
        progressMeta: { ...progressMeta },
      },
    });
  }

  const resumeFrom = {
    records: [...existingRecords, ...dbRecords],
    notFound: progressMeta.notFound,
    errors: progressMeta.errors,
    processedTitles: progressMeta.processedTitles ?? [],
  };

  const { records, notFound, errors, processedTitles } = await extractTitlesList(
    source,
    titles,
    options,
    async (done, _total, currentTitle, state) => {
      progressMeta.done = done;
      progressMeta.total = titles.length;
      progressMeta.currentTitle = currentTitle;
      if (state) {
        progressMeta.notFound = state.notFound;
        progressMeta.errors = state.errors;
        progressMeta.currentStep = state.currentStep ?? null;
      }
      const pct = calcProgressPercent(
        done,
        titles.length,
        currentTitle,
        progressMeta.currentStep ?? null
      );
      await prisma.book_extract_jobs.update({
        where: { id: jobId },
        data: {
          progress: pct,
          progressMeta: { ...progressMeta },
        },
      });
    },
    resumeFrom
  );

  progressMeta.notFound = notFound;
  progressMeta.errors = errors;
  progressMeta.done = titles.length;
  progressMeta.currentTitle = null;
  progressMeta.currentStep = null;
  progressMeta.processedTitles = processedTitles;
  progressMeta.fromDatabase = fromDatabase;
  progressMeta.summary = buildJobSummary(records, notFound, errors, fromDatabase);

  await finalizeJob(jobId, progressMeta, records, options, targetListId);
}

async function finalizeJob(
  jobId: string,
  progressMeta: BookExtractProgressMeta,
  records: BookRecord[],
  options: Required<BookExtractOptions>,
  targetListId: string | null
): Promise<void> {
  let listTitle: string | null = null;
  if (targetListId) {
    const list = await prisma.lists.findUnique({
      where: { id: targetListId },
      select: { title: true },
    });
    listTitle = list?.title ?? null;
  }

  const resultItems = bookRecordsToImportPayload(records, {
    listTitle,
    fastMode: options.fastMode,
  });
  const items = resultItems.items;

  if (options.autoImport && targetListId && items.length > 0) {
    progressMeta.importResult = await autoImportBookExtractResults(targetListId, items);
  }

  await prisma.book_extract_jobs.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      progress: 100,
      progressMeta,
      resultItems,
      itemCount: records.length,
      completedAt: new Date(),
    },
  });
}

async function runCategoryJob(
  jobId: string,
  source: BookExtractSource,
  categoryInput: BookExtractCategoryInput,
  options: Required<BookExtractOptions>,
  targetListId: string | null
): Promise<void> {
  const limit = Math.min(Math.max(1, categoryInput.limit), 100);
  const progressMeta: BookExtractProgressMeta = {
    done: 0,
    total: limit,
    currentTitle: null,
    currentStep: null,
    notFound: [],
    errors: [],
  };

  let records: BookRecord[] = [];

  const { records: extracted, errors } = await extractCategoryList(
    source,
    categoryInput.categoryUrl,
    { ...options, limit },
    async (done, total, currentTitle, state) => {
      progressMeta.done = done;
      progressMeta.total = total;
      progressMeta.currentTitle = currentTitle;
      if (state) progressMeta.errors = state.errors;
      const pct = calcProgressPercent(done, total, currentTitle, null);
      await prisma.book_extract_jobs.update({
        where: { id: jobId },
        data: { progress: pct, progressMeta: { ...progressMeta } },
      });
    }
  );

  records = extracted;
  progressMeta.errors = errors;
  progressMeta.done = records.length;
  progressMeta.total = records.length;
  progressMeta.currentTitle = null;
  progressMeta.currentStep = null;
  progressMeta.summary = buildJobSummary(records, [], errors);

  await finalizeJob(jobId, progressMeta, records, options, targetListId);
}

export async function runBookExtractJob(jobId: string, resume = false): Promise<void> {
  const job = await prisma.book_extract_jobs.findUnique({ where: { id: jobId } });
  if (!job) return;

  const options = { ...DEFAULT_BOOK_EXTRACT_OPTIONS, ...parseOptions(job.options) };
  const source = job.source as BookExtractSource;
  const mode = job.mode as BookExtractMode;

  try {
    await prisma.book_extract_jobs.update({
      where: { id: jobId },
      data: { status: 'RUNNING', errorMessage: null },
    });

    if (mode === 'category') {
      const categoryInput = parseCategoryInput(job.input);
      if (!categoryInput) {
        throw new Error('ورودی دسته نامعتبر است');
      }
      await runCategoryJob(jobId, source, categoryInput, options, job.targetListId);
      return;
    }

    const titles = parseTitlesInput(job.input);
    if (titles.length === 0) {
      throw new Error('لیست عناوین خالی است');
    }

    await runTitlesJob(
      jobId,
      source,
      titles,
      options,
      job.targetListId,
      resume ? (job.progressMeta as BookExtractProgressMeta | null) : null,
      resume ? job.resultItems : undefined
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطا در استخراج';
    await prisma.book_extract_jobs.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage: message,
        completedAt: new Date(),
      },
    });
  }
}

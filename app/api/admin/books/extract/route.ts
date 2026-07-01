import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensurePrismaConnection } from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/auth';
import { serializeBookExtractJob } from '@/lib/admin/book-extract/serialize-job';
import { runBookExtractJob } from '@/lib/admin/book-extract/run-job';
import type { BookExtractMode, BookExtractSource } from '@prisma/client';
import { DEFAULT_BOOK_EXTRACT_OPTIONS } from '@/lib/books/types';
import { assertCategoryUrlForSource } from '@/lib/books/url-detect';

const SOURCES: BookExtractSource[] = ['taaghche', 'fidibo', 'ketabrah'];
const MODES: BookExtractMode[] = ['titles', 'category'];

function parseTitles(body: Record<string, unknown>): string[] {
  if (Array.isArray(body.titles)) {
    return body.titles.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof body.titlesText === 'string') {
    return body.titlesText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }
  return [];
}

function parseOptions(body: Record<string, unknown>) {
  return {
    enrichDetails:
      typeof body.enrichDetails === 'boolean'
        ? body.enrichDetails
        : DEFAULT_BOOK_EXTRACT_OPTIONS.enrichDetails,
    fastMode:
      typeof body.fastMode === 'boolean' ? body.fastMode : DEFAULT_BOOK_EXTRACT_OPTIONS.fastMode,
    fuzzyMinScore:
      typeof body.fuzzyMinScore === 'number'
        ? body.fuzzyMinScore
        : DEFAULT_BOOK_EXTRACT_OPTIONS.fuzzyMinScore,
    delayMs:
      typeof body.delayMs === 'number' ? body.delayMs : DEFAULT_BOOK_EXTRACT_OPTIONS.delayMs,
    maxRetries:
      typeof body.maxRetries === 'number'
        ? body.maxRetries
        : DEFAULT_BOOK_EXTRACT_OPTIONS.maxRetries,
    limit:
      typeof body.limit === 'number' ? body.limit : DEFAULT_BOOK_EXTRACT_OPTIONS.limit,
    contentTypeFilter:
      body.contentTypeFilter === 'ebook' ||
      body.contentTypeFilter === 'audiobook' ||
      body.contentTypeFilter === 'all'
        ? body.contentTypeFilter
        : DEFAULT_BOOK_EXTRACT_OPTIONS.contentTypeFilter,
    autoImport:
      typeof body.autoImport === 'boolean'
        ? body.autoImport
        : DEFAULT_BOOK_EXTRACT_OPTIONS.autoImport,
  };
}

/** GET /api/admin/books/extract — تاریخچه jobs (صفحه‌بندی) */
export async function GET(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    await ensurePrismaConnection();

    if (!('book_extract_jobs' in prisma)) {
      return NextResponse.json(
        { error: 'جدول استخراج کتاب آماده نیست — prisma generate و migrate را اجرا کنید' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 5));
    const offset = Math.max(0, Number(searchParams.get('offset')) || 0);
    const listOnly = searchParams.get('listOnly') === '1';

    const [jobs, total] = await Promise.all([
      prisma.book_extract_jobs.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          status: true,
          mode: true,
          source: true,
          input: true,
          options: true,
          targetListId: true,
          progress: true,
          progressMeta: true,
          itemCount: true,
          errorMessage: true,
          createdAt: true,
          completedAt: true,
          createdBy: { select: { id: true, name: true, email: true } },
          ...(listOnly ? {} : { resultItems: true }),
        },
      }),
      prisma.book_extract_jobs.count(),
    ]);

    return NextResponse.json({ data: jobs.map(serializeBookExtractJob), total });
  } catch (err) {
    console.error('[book-extract] list error:', err);
    return NextResponse.json({ error: 'خطا در دریافت تاریخچه' }, { status: 500 });
  }
}

/** POST /api/admin/books/extract — شروع job جدید */
export async function POST(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    await ensurePrismaConnection();

    if (!('book_extract_jobs' in prisma)) {
      return NextResponse.json(
        { error: 'جدول استخراج کتاب آماده نیست — prisma generate و migrate را اجرا کنید' },
        { status: 503 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const source = body.source as BookExtractSource;
    if (!SOURCES.includes(source)) {
      return NextResponse.json(
        { error: 'منبع نامعتبر — taaghche، fidibo یا ketabrah' },
        { status: 400 }
      );
    }

    const mode = (body.mode as BookExtractMode) || 'titles';
    if (!MODES.includes(mode)) {
      return NextResponse.json({ error: 'mode نامعتبر' }, { status: 400 });
    }

    const running = await prisma.book_extract_jobs.findFirst({
      where: { status: { in: ['PENDING', 'RUNNING'] } },
    });
    if (running) {
      return NextResponse.json(
        { error: 'یک job استخراج در حال اجراست. لطفاً صبر کنید یا از تاریخچه آن را ببینید.' },
        { status: 409 }
      );
    }

    const options = parseOptions(body);
    const targetListId =
      typeof body.targetListId === 'string' && body.targetListId.trim()
        ? body.targetListId.trim()
        : null;

    let input: object;
    let progressTotal = 0;

    if (mode === 'category') {
      const categoryUrl = typeof body.categoryUrl === 'string' ? body.categoryUrl.trim() : '';
      if (!categoryUrl) {
        return NextResponse.json({ error: 'لینک دسته الزامی است' }, { status: 400 });
      }
      try {
        assertCategoryUrlForSource(categoryUrl, source);
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'لینک دسته نامعتبر' },
          { status: 400 }
        );
      }
      const limit = Math.min(Math.max(1, options.limit), 100);
      input = { categoryUrl, limit };
      progressTotal = limit;
    } else {
      const titles = parseTitles(body);
      if (titles.length === 0) {
        return NextResponse.json({ error: 'حداقل یک عنوان لازم است' }, { status: 400 });
      }
      if (titles.length > 100) {
        return NextResponse.json({ error: 'حداکثر ۱۰۰ عنوان در هر job' }, { status: 400 });
      }
      input = { titles };
      progressTotal = titles.length;
    }

    const job = await prisma.book_extract_jobs.create({
      data: {
        createdById: session.user.id,
        status: 'PENDING',
        mode,
        source,
        input,
        options,
        targetListId,
        progress: 0,
        progressMeta: {
          done: 0,
          total: progressTotal,
          currentTitle: null,
          notFound: [],
          errors: [],
          processedTitles: [],
        },
      },
    });

    void runBookExtractJob(job.id).catch((err) => {
      console.error('[book-extract] background job failed:', job.id, err);
    });

    return NextResponse.json(
      {
        data: {
          id: job.id,
          status: job.status,
          mode: job.mode,
          message: 'استخراج شروع شد',
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[book-extract] create error:', err);
    return NextResponse.json({ error: 'خطا در ایجاد job استخراج' }, { status: 500 });
  }
}

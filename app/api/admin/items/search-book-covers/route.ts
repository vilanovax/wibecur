import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { formatBookFetchError } from '@/lib/books/fetch-errors';
import {
  BOOK_COVER_SOURCE_LABELS,
  searchBookCovers,
  type BookCoverSearchSource,
} from '@/lib/book-cover-search';

/** POST /api/admin/items/search-book-covers — جستجوی کاور از فیدیبو، کتابراه یا طاقچه */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const source = body.source as BookCoverSearchSource;

    if (!title) {
      return NextResponse.json({ error: 'عنوان الزامی است' }, { status: 400 });
    }

    if (source !== 'fidibo' && source !== 'ketabrah' && source !== 'taaghche') {
      return NextResponse.json({ error: 'منبع نامعتبر است' }, { status: 400 });
    }

    const results = await searchBookCovers(title, source, { limit: 12, maxRetries: 2 });
    const label = BOOK_COVER_SOURCE_LABELS[source];

    return NextResponse.json({
      results,
      message:
        results.length === 0
          ? `هیچ کاوری در ${label} یافت نشد — عنوان کتاب را دقیق‌تر وارد کنید`
          : undefined,
    });
  } catch (error: unknown) {
    console.error('search-book-covers error:', error);
    const msg = formatBookFetchError(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

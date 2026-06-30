import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { fetchItemBookCover } from '@/lib/fetch-item-book-cover';
import type { BookSource } from '@/lib/books/types';

/** POST /api/admin/items/[id]/fetch-book-cover — استخراج کاور از فیدیبو/کتابراه/طاقچه و آپلود به ParsPack */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const source = body.source as BookSource;

    if (source !== 'fidibo' && source !== 'ketabrah' && source !== 'taaghche') {
      return NextResponse.json({ error: 'منبع نامعتبر است' }, { status: 400 });
    }

    const result = await dbQuery(() => fetchItemBookCover(id, source));

    if (result.status === 'failed') {
      const status =
        result.error === 'آیتم یافت نشد'
          ? 404
          : result.errorCode === 'storage_not_configured'
            ? 503
            : 500;
      return NextResponse.json(
        { error: result.error || 'خطا در استخراج کاور', ...result },
        { status }
      );
    }

    if (result.status === 'no_match' || result.status === 'no_cover') {
      return NextResponse.json(
        { error: result.error, ...result },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('fetch-book-cover error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'خطا در استخراج کاور' },
      { status: 500 }
    );
  }
}

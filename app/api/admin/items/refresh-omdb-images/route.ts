import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  assertMovieScope,
  previewProxyItemsOmdbRefresh,
  refreshProxyItemsFromOmdb,
} from '@/lib/admin/refresh-proxy-images-from-omdb';

function parseScope(searchParams: URLSearchParams, body?: Record<string, unknown>) {
  const listId =
    (body?.listId as string | undefined)?.trim() ||
    searchParams.get('listId')?.trim() ||
    undefined;
  const categoryId =
    (body?.categoryId as string | undefined)?.trim() ||
    searchParams.get('categoryId')?.trim() ||
    undefined;
  return { listId, categoryId };
}

/** GET — پیش‌نمایش آیتم‌های پراکسی با imdbId */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const scope = parseScope(request.nextUrl.searchParams);

    const gate = await assertMovieScope(prisma, scope);
    if (!gate.ok) {
      return NextResponse.json({ success: false, error: gate.error }, { status: 400 });
    }

    const preview = await previewProxyItemsOmdbRefresh(prisma, scope);
    return NextResponse.json({ success: true, ...preview });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در پیش‌نمایش OMDb';
    console.error('refresh-omdb-images preview:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** POST — جایگزینی تصاویر پراکسی با پوستر OMDb (ParsPack) */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const scope = parseScope(request.nextUrl.searchParams, body);

    const result = await refreshProxyItemsFromOmdb(prisma, scope);

    if (result.errors.length > 0 && result.processed === 0) {
      return NextResponse.json(
        { success: false, error: result.errors[0], ...result },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در به‌روزرسانی OMDb';
    console.error('refresh-omdb-images:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

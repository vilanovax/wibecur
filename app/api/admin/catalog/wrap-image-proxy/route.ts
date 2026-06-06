import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  previewCatalogItemsCastandoProxy,
  wrapCatalogItemsWithCastandoProxy,
} from '@/lib/admin/wrap-images-castando-proxy';

function parseScope(searchParams: URLSearchParams, body?: Record<string, unknown>) {
  const categorySlug =
    (body?.categorySlug as string | undefined)?.trim() ||
    searchParams.get('categorySlug')?.trim() ||
    undefined;
  const listId =
    (body?.listId as string | undefined)?.trim() ||
    searchParams.get('listId')?.trim() ||
    undefined;
  const multiListOnly =
    body?.multiListOnly === true ||
    searchParams.get('multiListOnly') === '1' ||
    searchParams.get('multiList') === '1';
  return { categorySlug, listId, multiListOnly };
}

/** GET /api/admin/catalog/wrap-image-proxy — پیش‌نمایش تعداد */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const scope = parseScope(request.nextUrl.searchParams);
    const preview = await previewCatalogItemsCastandoProxy(prisma, scope);
    return NextResponse.json({ success: true, ...preview });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در پیش‌نمایش پراکسی';
    console.error('wrap-image-proxy preview catalog:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** POST /api/admin/catalog/wrap-image-proxy */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const scope = parseScope(request.nextUrl.searchParams, body);

    const result = await wrapCatalogItemsWithCastandoProxy(prisma, scope);

    if (result.errors.length > 0 && result.processed === 0) {
      return NextResponse.json(
        { success: false, error: result.errors[0], ...result },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در اعمال پراکسی';
    console.error('wrap-image-proxy catalog:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

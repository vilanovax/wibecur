import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  previewListItemsCastandoProxy,
  wrapListItemsWithCastandoProxy,
} from '@/lib/admin/wrap-images-castando-proxy';

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

/** GET /api/admin/items/wrap-image-proxy?listId= — پیش‌نمایش تعداد */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { listId, categoryId } = parseScope(request.nextUrl.searchParams);

    if (!listId && !categoryId) {
      return NextResponse.json(
        { success: false, error: 'listId یا categoryId الزامی است' },
        { status: 400 }
      );
    }

    const preview = await previewListItemsCastandoProxy(prisma, { listId, categoryId });
    return NextResponse.json({ success: true, ...preview });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در پیش‌نمایش پراکسی';
    console.error('wrap-image-proxy preview items:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** POST /api/admin/items/wrap-image-proxy — اعمال پراکسی در DB */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { listId, categoryId } = parseScope(request.nextUrl.searchParams, body);

    if (!listId && !categoryId) {
      return NextResponse.json(
        { success: false, error: 'listId یا categoryId الزامی است' },
        { status: 400 }
      );
    }

    if (listId) {
      const list = await prisma.lists.findUnique({
        where: { id: listId },
        select: { id: true },
      });
      if (!list) {
        return NextResponse.json({ success: false, error: 'لیست یافت نشد' }, { status: 404 });
      }
    }

    const result = await wrapListItemsWithCastandoProxy(prisma, { listId, categoryId });

    if (result.errors.length > 0 && result.processed === 0) {
      return NextResponse.json(
        { success: false, error: result.errors[0], ...result },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در اعمال پراکسی';
    console.error('wrap-image-proxy items:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

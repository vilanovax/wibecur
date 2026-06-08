import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveBulkImportMatchesBatch } from '@/lib/admin/bulk-import-resolve';
import type { BulkImportPayloadItem } from '@/lib/admin/bulk-import';

/** POST /api/admin/items/bulk-import/preview — تطبیق با کاتالوگ قبل از import */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { listId, items } = body as {
      listId?: string;
      items?: BulkImportPayloadItem[];
    };

    if (!listId?.trim()) {
      return NextResponse.json({ error: 'لیست الزامی است' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'حداقل یک آیتم لازم است' }, { status: 400 });
    }
    if (items.length > 100) {
      return NextResponse.json({ error: 'حداکثر ۱۰۰ آیتم' }, { status: 400 });
    }

    const list = await prisma.lists.findUnique({
      where: { id: listId },
      include: { categories: true },
    });

    if (!list?.categories) {
      return NextResponse.json({ error: 'لیست یافت نشد' }, { status: 404 });
    }

    const categorySlug = list.categories.slug;
    const matches = await resolveBulkImportMatchesBatch(prisma, categorySlug, listId, items);

    const summary = {
      new: matches.filter((m) => m.kind === 'new').length,
      existing_catalog: matches.filter((m) => m.kind === 'existing_catalog').length,
      already_in_list: matches.filter((m) => m.kind === 'already_in_list').length,
      lightweight: matches.filter((m) => m.kind === 'lightweight').length,
    };

    return NextResponse.json({ matches, summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

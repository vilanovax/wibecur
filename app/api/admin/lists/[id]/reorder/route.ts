import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  ReorderListItemsError,
  reorderListItems,
} from '@/lib/admin/reorder-list-items';

/** PUT /api/admin/lists/[id]/reorder — ذخیرهٔ اتمیک ترتیب آیتم‌ها */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: listId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'بدنهٔ درخواست نامعتبر است' }, { status: 400 });
    }

    const orderedIds = Array.isArray((body as { orderedIds?: unknown })?.orderedIds)
      ? ((body as { orderedIds: unknown[] }).orderedIds as unknown[])
      : null;

    if (!orderedIds) {
      return NextResponse.json(
        { error: 'فیلد orderedIds (آرایهٔ شناسه) الزامی است' },
        { status: 400 }
      );
    }

    const result = await reorderListItems(
      prisma,
      listId,
      orderedIds.map((id) => String(id))
    );

    return NextResponse.json({
      success: true,
      message: 'ترتیب ذخیره شد',
      ...result,
    });
  } catch (error: unknown) {
    if (error instanceof ReorderListItemsError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'خطا در ذخیره ترتیب';
    console.error('lists reorder:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  RemoveFromListError,
  removeItemFromList,
} from '@/lib/admin/remove-item-from-list';

/** DELETE /api/admin/lists/[id]/items/[itemId] — حذف جایگاه از این لیست (بدون زباله‌دان / بدون دست زدن به کاتالوگ) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    await requireAdmin();
    const { id: listId, itemId } = await params;

    const result = await removeItemFromList(prisma, listId, itemId);

    return NextResponse.json({
      success: true,
      message: 'آیتم از این لیست حذف شد',
      ...result,
    });
  } catch (error: unknown) {
    if (error instanceof RemoveFromListError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'خطا در حذف از لیست';
    console.error('remove-from-list:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

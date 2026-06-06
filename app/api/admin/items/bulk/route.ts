import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  type ItemBulkAction,
  executeItemBulkAction,
} from '@/lib/admin/item-bulk-actions';

const VALID_ACTIONS: ItemBulkAction[] = [
  'delete',
  'hide',
  'show',
  'disable-comments',
  'enable-comments',
];

/** POST /api/admin/items/bulk */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { itemIds, action } = body as {
      itemIds?: string[];
      action?: ItemBulkAction;
    };

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'حداقل یک آیتم انتخاب کنید' },
        { status: 400 }
      );
    }

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'عملیات نامعتبر است' },
        { status: 400 }
      );
    }

    const result = await executeItemBulkAction(prisma, {
      itemIds: itemIds.filter((id): id is string => typeof id === 'string'),
      action,
    });

    if (result.errors.length > 0 && result.processed === 0) {
      return NextResponse.json(
        { success: false, error: result.errors[0], ...result },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در عملیات گروهی';
    console.error('items bulk:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

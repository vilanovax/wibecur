import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  type CatalogBulkAction,
  executeCatalogBulkAction,
} from '@/lib/admin/catalog-bulk-actions';

const VALID_ACTIONS: CatalogBulkAction[] = [
  'remove-from-list',
  'delete-catalog',
  'disable-comments',
  'enable-comments',
  'hide',
  'show',
  'move-to-list',
  'add-to-list',
];

/** POST /api/admin/catalog-items/bulk */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      catalogIds,
      action,
      listId,
      targetListId,
    } = body as {
      catalogIds?: string[];
      action?: CatalogBulkAction;
      listId?: string;
      targetListId?: string;
    };

    if (!Array.isArray(catalogIds) || catalogIds.length === 0) {
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

    const result = await executeCatalogBulkAction(prisma, {
      catalogIds,
      action,
      listId: typeof listId === 'string' ? listId.trim() || undefined : undefined,
      targetListId:
        typeof targetListId === 'string' ? targetListId.trim() || undefined : undefined,
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
    console.error('catalog bulk:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

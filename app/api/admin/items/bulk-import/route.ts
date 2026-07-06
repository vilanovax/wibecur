import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { executeBulkImportForList } from '@/lib/admin/bulk-import-execute';
import type { BulkImportPayloadItem } from '@/lib/admin/bulk-import';

/** POST /api/admin/items/bulk-import — یک موجودیت کاتالوگ، چند جایگاه لیست */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { listId, items, overwriteExistingData } = body as {
      listId?: string;
      items?: BulkImportPayloadItem[];
      overwriteExistingData?: boolean;
    };

    const result = await executeBulkImportForList(listId ?? '', items ?? [], {
      overwriteExistingData: overwriteExistingData === true,
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در import';
    const status =
      message === 'لیست الزامی است' ||
      message === 'حداقل یک آیتم لازم است' ||
      message === 'حداکثر ۱۰۰ آیتم در هر import'
        ? 400
        : message === 'لیست یافت نشد'
          ? 404
          : message === 'دستهٔ لیست یافت نشد'
            ? 400
            : 500;
    if (status === 500) console.error('bulk-import:', error);
    return NextResponse.json({ error: message }, { status });
  }
}

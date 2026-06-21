import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import {
  getTrashCategories,
  getTrashCounts,
  getTrashItems,
  getTrashLists,
  type TrashEntity,
} from '@/lib/admin/trash-hub';

const VALID_TABS = new Set<TrashEntity>(['lists', 'categories', 'items']);

/** GET: تعداد و لیست موجودیت‌های زباله‌دان */
export async function GET(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tab = request.nextUrl.searchParams.get('tab') as TrashEntity | null;
    const countsOnly = request.nextUrl.searchParams.get('countsOnly') === '1';

    const counts = await getTrashCounts();

    if (countsOnly) {
      return NextResponse.json({ success: true, counts });
    }

    if (!tab || !VALID_TABS.has(tab)) {
      return NextResponse.json({ success: true, counts });
    }

    let items: unknown[] = [];
    switch (tab) {
      case 'lists':
        items = await getTrashLists();
        break;
      case 'categories':
        items = await getTrashCategories();
        break;
      case 'items':
        items = await getTrashItems();
        break;
    }

    return NextResponse.json({ success: true, counts, tab, items });
  } catch (error: unknown) {
    console.error('admin trash GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  optimizeListCoverSlot,
  type ListCoverField,
} from '@/lib/admin/list-cover-audit';

function parseSlots(raw: unknown): { listId: string; field: ListCoverField }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const listId = typeof (entry as { listId?: unknown }).listId === 'string' ? (entry as { listId: string }).listId : '';
      const field = (entry as { field?: unknown }).field;
      if (!listId) return null;
      if (field !== 'coverImage' && field !== 'horizontalImage') return null;
      return { listId, field };
    })
    .filter((x): x is { listId: string; field: ListCoverField } => x != null);
}

/** POST — بهینه‌سازی گروهی کاورهای لیست در استوریج */
export async function POST(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await request.json();
    const slots = parseSlots(body.slots);

    if (slots.length === 0) {
      return NextResponse.json({ error: 'حداقل یک تصویر انتخاب کنید' }, { status: 400 });
    }

    if (slots.length > 40) {
      return NextResponse.json({ error: 'حداکثر ۴۰ تصویر در هر عملیات' }, { status: 400 });
    }

    const results = [];
    let optimized = 0;
    let skipped = 0;
    let failed = 0;

    for (const slot of slots) {
      const result = await optimizeListCoverSlot(slot.listId, slot.field);
      results.push(result);
      if (result.status === 'optimized') optimized++;
      else if (result.status === 'skipped') skipped++;
      else failed++;
    }

    return NextResponse.json({
      success: true,
      optimized,
      skipped,
      failed,
      results,
      message: `${optimized.toLocaleString('fa-IR')} بهینه · ${skipped.toLocaleString('fa-IR')} رد · ${failed.toLocaleString('fa-IR')} خطا`,
    });
  } catch (error: unknown) {
    console.error('cover-audit optimize:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در بهینه‌سازی' },
      { status: 500 }
    );
  }
}

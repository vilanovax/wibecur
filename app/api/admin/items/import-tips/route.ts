import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseItemTipImportPayload } from '@/lib/admin/item-tip-import';
import { updateItemTip } from '@/lib/admin/item-tips-server';

/** POST /api/admin/items/import-tips — ورود JSON tip از هوش مصنوعی خارجی */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const payload = parseItemTipImportPayload(body);

    const ids = payload.items.map((item) => item.id.trim());
    const existing = await prisma.items.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, title: true },
    });
    const byId = new Map(existing.map((item) => [item.id, item]));

    let updated = 0;
    const errors: string[] = [];

    for (const item of payload.items) {
      const row = byId.get(item.id.trim());
      if (!row) {
        errors.push(`${item.id}: آیتم یافت نشد`);
        continue;
      }

      try {
        await updateItemTip(prisma, row.id, item.tip);
        updated += 1;
      } catch (err: unknown) {
        errors.push(
          `${row.title}: ${err instanceof Error ? err.message : 'خطا در به‌روزرسانی'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        updated,
        skipped: payload.items.length - updated - errors.length,
        failed: errors.length,
        errors: errors.slice(0, 15),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در ورود JSON';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

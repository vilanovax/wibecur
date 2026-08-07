import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { inspectListCoverAudits } from '@/lib/admin/list-cover-audit';

/** POST — بررسی کاورهای لیست از استوریج (حجم، ابعاد، فوریت) */
export async function POST(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await request.json();
    const listIds = Array.isArray(body.listIds)
      ? body.listIds.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
      : [];

    if (listIds.length === 0) {
      return NextResponse.json({ error: 'listIds الزامی است' }, { status: 400 });
    }

    if (listIds.length > 100) {
      return NextResponse.json({ error: 'حداکثر ۱۰۰ لیست در هر درخواست' }, { status: 400 });
    }

    const data = await inspectListCoverAudits(listIds);
    return NextResponse.json({ success: true, ...data });
  } catch (error: unknown) {
    console.error('cover-audit inspect:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در بررسی تصاویر' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { getSponsoredPerformance } from '@/lib/sponsored-placements';

/** GET /api/admin/custom/sponsored/[id]/performance */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id } = await params;
    const performance = await getSponsoredPerformance(prisma, id);
    if (!performance) {
      return NextResponse.json({ error: 'تبلیغ یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: performance });
  } catch (err: unknown) {
    console.error('Admin sponsored performance error:', err);
    return NextResponse.json({ error: 'خطا در دریافت گزارش' }, { status: 500 });
  }
}

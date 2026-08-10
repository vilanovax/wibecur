import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { getFeaturedListsForPicker } from '@/lib/admin/featured-management-data';

/**
 * GET /api/admin/custom/featured/lists
 * فقط لیست لیست‌ها برای دراپ‌داون ویزارد — lazy روی باز شدن مودال.
 */
export async function GET() {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const lists = await getFeaturedListsForPicker();

    const response = NextResponse.json({ lists });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (err: unknown) {
    console.error('Admin featured lists GET error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست‌ها', lists: [] },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { prisma } from '@/lib/prisma';
import { getFeaturedSuggestions } from '@/lib/featured-suggestions';

/**
 * GET /api/admin/custom/featured/suggestions
 * پیشنهاد هوشمند لیست‌ها برای Featured (rule-based، قابل توضیح).
 */
export async function GET() {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const result = await getFeaturedSuggestions(prisma);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Featured suggestions error:', err);
    return NextResponse.json(
      { error: 'خطا در تولید پیشنهادات' },
      { status: 500 }
    );
  }
}

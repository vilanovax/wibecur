import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getListRuntimeDebugData } from '@/lib/admin/trending-debug-runtime';

/**
 * GET /api/admin/lists/[id]/debug
 * Query: ?bypass=1 → recalculate without using any cache (cacheStatus: BYPASS)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const bypass = request.nextUrl.searchParams.get('bypass') === '1';

    const data = await getListRuntimeDebugData(prisma, id, {
      bypassCache: bypass,
    });

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Admin list debug error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'خطا' },
      { status: 500 }
    );
  }
}

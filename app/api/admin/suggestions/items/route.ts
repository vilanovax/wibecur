import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { fetchUnifiedItemSuggestions } from '@/lib/admin/unified-item-suggestions';
import type { ItemSuggestionSource } from '@/lib/admin/unified-item-suggestions';

// GET /api/admin/suggestions/items - پیشنهادات آیتم (فرم + منوی سه‌نقطه)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const sort = (searchParams.get('sort') || 'newest') as 'newest' | 'oldest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const source = (searchParams.get('source') || 'all') as ItemSuggestionSource | 'all';

    const result = await dbQuery(() =>
      fetchUnifiedItemSuggestions({ status, sort, page, limit, source })
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error('Error fetching suggested items:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در دریافت پیشنهادات' },
      { status: 500 }
    );
  }
}

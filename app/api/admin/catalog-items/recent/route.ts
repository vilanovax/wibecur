import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRecentCatalogItems } from '@/lib/catalog-items';

/** GET /api/admin/catalog-items/recent?listId=&categorySlug= */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId')?.trim() || undefined;
    const categorySlug = searchParams.get('categorySlug')?.trim() || undefined;
    const rows = await getRecentCatalogItems(prisma, 12, { listId, categorySlug });
    return NextResponse.json({ items: rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

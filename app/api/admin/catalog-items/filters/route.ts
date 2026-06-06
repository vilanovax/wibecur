import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { countMultiListCatalogItems, getCatalogListFilters } from '@/lib/catalog-items';

/** GET /api/admin/catalog-items/filters?categorySlug= */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('categorySlug')?.trim() || undefined;
    const listId = searchParams.get('listId')?.trim() || undefined;

    const [listFilters, multiListCount] = await Promise.all([
      getCatalogListFilters(prisma, { categorySlug }),
      countMultiListCatalogItems(prisma, { categorySlug, listId }),
    ]);

    return NextResponse.json({ listFilters, multiListCount });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { listCatalogItems } from '@/lib/catalog-items';

/** GET /api/admin/catalog-items?page=&perPage=&q=&categorySlug= */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '24', 10);
    const q = searchParams.get('q') ?? undefined;
    const categorySlug = searchParams.get('categorySlug') ?? undefined;
    const listId = searchParams.get('listId') ?? undefined;
    const multiListOnly = searchParams.get('multiList') === '1';

    const { rows, total } = await listCatalogItems(prisma, {
      page,
      perPage,
      q,
      categorySlug,
      listId,
      multiListOnly,
    });

    return NextResponse.json({
      rows,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 1,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

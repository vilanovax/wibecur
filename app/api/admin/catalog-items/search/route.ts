import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchCatalogItems } from '@/lib/catalog-items';

/** GET /api/admin/catalog-items/search?q=&listId=&categorySlug= */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const listId = searchParams.get('listId')?.trim() || undefined;
    const categorySlug = searchParams.get('categorySlug')?.trim() || undefined;

    if (q.length < 2) {
      return NextResponse.json({ items: [] });
    }

    const items = await searchCatalogItems(prisma, q, {
      limit: 15,
      listId,
      categorySlug,
    });

    return NextResponse.json({ items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در جستجو';
    console.error('catalog-items search:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

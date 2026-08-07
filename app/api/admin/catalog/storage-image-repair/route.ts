import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { listStorageImageRepairItems } from '@/lib/admin/storage-image-repair';
import { checkObjectStorageReady } from '@/lib/object-storage-readiness';
import { catalogCategoryLabel } from '@/lib/catalog-display';

/** GET /api/admin/catalog/storage-image-repair?categorySlug=&status=&q= */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const categorySlug = request.nextUrl.searchParams.get('categorySlug')?.trim() || undefined;
    const statusParam = request.nextUrl.searchParams.get('status')?.trim();
    const q = request.nextUrl.searchParams.get('q')?.trim() || undefined;

    const status =
      statusParam === 'missing' || statusParam === 'external' ? statusParam : 'all';

    const [items, storage] = await dbQuery(() =>
      Promise.all([
        listStorageImageRepairItems(prisma, { categorySlug, status, q }),
        checkObjectStorageReady(),
      ])
    );

    const missingCount = items.filter((item) => item.status === 'missing').length;
    const externalCount = items.filter((item) => item.status === 'external').length;

    return NextResponse.json({
      items,
      total: items.length,
      missingCount,
      externalCount,
      filters: {
        categorySlug: categorySlug || null,
        categoryLabel: categorySlug
          ? catalogCategoryLabel(categorySlug === '__none__' ? null : categorySlug)
          : 'همه دسته‌ها',
        status,
        q: q || '',
      },
      storage,
    });
  } catch (error: unknown) {
    console.error('storage-image-repair list error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'خطا در دریافت لیست' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mergeCatalogItems } from '@/lib/catalog-items';

/** POST /api/admin/catalog-items/merge */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { targetCatalogId, sourceCatalogIds } = body as {
      targetCatalogId?: string;
      sourceCatalogIds?: string[];
    };

    if (!targetCatalogId || !Array.isArray(sourceCatalogIds) || sourceCatalogIds.length === 0) {
      return NextResponse.json(
        { error: 'مقصد و حداقل یک مبدأ الزامی است' },
        { status: 400 }
      );
    }

    const result = await mergeCatalogItems(prisma, targetCatalogId, sourceCatalogIds);

    return NextResponse.json({
      success: true,
      ...result,
      message: `${result.deletedCatalogs} کاتالوگ ادغام شد؛ ${result.mergedPlacements} جایگاه منتقل و ${result.removedDuplicatePlacements} تکرار در لیست حذف شد.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در ادغام';
    console.error('catalog merge:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

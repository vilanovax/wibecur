import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { findSimilarCatalogItems } from '@/lib/catalog-items';

/** GET /api/admin/catalog-items/similar?catalogId=... | ?q=...&categorySlug=... */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const catalogId = searchParams.get('catalogId')?.trim() || undefined;
    const q = searchParams.get('q')?.trim() || undefined;
    const categorySlug = searchParams.get('categorySlug')?.trim() || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!catalogId && (!q || q.length < 2)) {
      return NextResponse.json(
        { error: 'catalogId یا عبارت جستجو (حداقل ۲ حرف) لازم است' },
        { status: 400 }
      );
    }

    const result = await findSimilarCatalogItems(prisma, {
      catalogId,
      q,
      categorySlug,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در جستجوی مشابه';
    console.error('catalog-items similar:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

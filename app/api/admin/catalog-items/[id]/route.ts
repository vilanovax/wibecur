import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCatalogItemDetail, updateCatalogItem } from '@/lib/catalog-items';
import { ensureImageInLiara } from '@/lib/object-storage';

/** GET /api/admin/catalog-items/[id] */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const detail = await getCatalogItemDetail(prisma, id);
    if (!detail) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PUT /api/admin/catalog-items/[id] — ویرایش موجودیت مشترک */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { title, description, imageUrl, externalUrl, categorySlug, metadata } = body as {
      title?: string;
      description?: string;
      imageUrl?: string;
      externalUrl?: string;
      categorySlug?: string | null;
      metadata?: Record<string, unknown> | null;
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: 'عنوان الزامی است' }, { status: 400 });
    }
    if (!categorySlug?.trim()) {
      return NextResponse.json({ error: 'دستهٔ اصلی الزامی است' }, { status: 400 });
    }

    const finalImage =
      imageUrl !== undefined ? await ensureImageInLiara(imageUrl, 'items') : undefined;

    const updated = await updateCatalogItem(prisma, id, {
      title: title.trim(),
      description,
      externalUrl,
      categorySlug: categorySlug.trim(),
      ...(metadata !== undefined && {
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      }),
      ...(finalImage !== undefined && { imageUrl: finalImage }),
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

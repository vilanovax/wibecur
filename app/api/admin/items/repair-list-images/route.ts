import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  createBulkImportImageContext,
  resolveBulkImportImageForStorage,
} from '@/lib/admin/bulk-import-image';
import {
  isCorruptImageUrl,
  isValidHttpImageUrl,
  normalizeImageUrlForStorage,
} from '@/lib/image-url-sanitize';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { syncPlacementsFromCatalog } from '@/lib/catalog-items';

type RepairResult = {
  itemId: string;
  title: string;
  status: 'fixed' | 'already_ok' | 'skipped' | 'failed';
  previousUrl?: string | null;
  newUrl?: string | null;
  message?: string;
};

/** POST /api/admin/items/repair-list-images — تعمیر URLهای تصویر خراب در یک لیست */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { listId } = body as { listId?: string };

    if (!listId?.trim()) {
      return NextResponse.json({ error: 'listId الزامی است' }, { status: 400 });
    }

    const list = await prisma.lists.findUnique({
      where: { id: listId },
      include: { categories: true },
    });

    if (!list?.categories) {
      return NextResponse.json({ error: 'لیست یافت نشد' }, { status: 404 });
    }

    const placements = await prisma.items.findMany({
      where: { listId },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        externalUrl: true,
        metadata: true,
        catalogItemId: true,
        catalog_items: { select: { id: true, imageUrl: true } },
      },
    });

    const imageCtx = await createBulkImportImageContext();
    const results: RepairResult[] = [];
    let fixed = 0;

    for (const item of placements) {
      const catalogUrl = item.catalog_items?.imageUrl ?? null;
      const effectiveUrl = catalogUrl || item.imageUrl;
      const meta = (item.metadata ?? {}) as Record<string, unknown>;

      if (effectiveUrl && isOurStorageUrl(effectiveUrl)) {
        results.push({
          itemId: item.id,
          title: item.title,
          status: 'already_ok',
          previousUrl: effectiveUrl,
          newUrl: effectiveUrl,
        });
        continue;
      }

      const rawCandidate =
        isCorruptImageUrl(effectiveUrl) || isCorruptImageUrl(item.imageUrl)
          ? item.imageUrl || effectiveUrl
          : effectiveUrl;

      const normalized = normalizeImageUrlForStorage(rawCandidate);
      if (!normalized && !isCorruptImageUrl(effectiveUrl)) {
        results.push({
          itemId: item.id,
          title: item.title,
          status: 'skipped',
          previousUrl: effectiveUrl,
          message: 'بدون تصویر',
        });
        continue;
      }

      const sourceForUpload =
        normalized ||
        normalizeImageUrlForStorage(item.imageUrl) ||
        (typeof meta.posterUrl === 'string' ? normalizeImageUrlForStorage(meta.posterUrl) : '');

      if (!sourceForUpload || !isValidHttpImageUrl(sourceForUpload)) {
        results.push({
          itemId: item.id,
          title: item.title,
          status: 'failed',
          previousUrl: effectiveUrl,
          message: 'URL تصویر قابل تعمیر نیست',
        });
        continue;
      }

      const stored = await resolveBulkImportImageForStorage(
        sourceForUpload,
        meta,
        'items',
        imageCtx
      );

      if (!stored) {
        results.push({
          itemId: item.id,
          title: item.title,
          status: 'failed',
          previousUrl: effectiveUrl,
          message: 'آپلود تصویر ناموفق — OMDb/ParsPack را بررسی کنید',
        });
        continue;
      }

      if (item.catalogItemId) {
        await prisma.catalog_items.update({
          where: { id: item.catalogItemId },
          data: { imageUrl: stored, updatedAt: new Date() },
        });
        await syncPlacementsFromCatalog(prisma, item.catalogItemId);
      } else {
        await prisma.items.update({
          where: { id: item.id },
          data: { imageUrl: stored, updatedAt: new Date() },
        });
      }

      fixed++;
      results.push({
        itemId: item.id,
        title: item.title,
        status: 'fixed',
        previousUrl: effectiveUrl,
        newUrl: stored,
        message: 'تصویر تعمیر و آپلود شد',
      });
    }

    return NextResponse.json({
      success: true,
      fixed,
      total: placements.length,
      results,
      message: `${fixed.toLocaleString('fa-IR')} تصویر از ${placements.length.toLocaleString('fa-IR')} آیتم تعمیر شد`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در تعمیر تصاویر';
    console.error('repair-list-images:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

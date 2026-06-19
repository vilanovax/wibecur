import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkActionRateLimit } from '@/lib/rate-limit';
import { enrichCatalogSearchProfilesBulk } from '@/lib/catalog-search-profile';

const MAX_BATCH = 25;

/** POST /api/admin/catalog-items/enrich-search — تولید searchProfile با AI */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

    const { success } = await checkActionRateLimit(
      `catalog-enrich-search:${session.user?.id ?? session.user?.email ?? 'admin'}`,
      30,
      '1 m'
    );
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'درخواست‌های زیاد — کمی صبر کنید.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { catalogIds, force } = body as {
      catalogIds?: string[];
      force?: boolean;
    };

    if (!Array.isArray(catalogIds) || catalogIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'حداقل یک آیتم انتخاب کنید' },
        { status: 400 }
      );
    }

    if (catalogIds.length > MAX_BATCH) {
      return NextResponse.json(
        {
          success: false,
          error: `حداکثر ${MAX_BATCH.toLocaleString('fa-IR')} آیتم در هر درخواست`,
        },
        { status: 400 }
      );
    }

    const uniqueIds = [...new Set(catalogIds.map((id) => String(id).trim()).filter(Boolean))];
    const { results, updated, skipped, failed } = await enrichCatalogSearchProfilesBulk(
      prisma,
      uniqueIds,
      { force: !!force }
    );

    const message =
      failed > 0
        ? `${updated.toLocaleString('fa-IR')} به‌روز، ${skipped.toLocaleString('fa-IR')} رد شده، ${failed.toLocaleString('fa-IR')} خطا`
        : `${updated.toLocaleString('fa-IR')} پروفایل جستجو ساخته شد${skipped > 0 ? ` (${skipped.toLocaleString('fa-IR')} از قبل داشت)` : ''}`;

    return NextResponse.json({
      success: failed === 0 || updated > 0,
      message,
      updated,
      skipped,
      failed,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در غنی‌سازی جستجو';
    console.error('catalog enrich-search:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

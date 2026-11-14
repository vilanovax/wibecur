import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runIngestWrite } from '@/lib/content/ingest-write';
import {
  ReorderListItemsError,
  reorderListItems,
} from '@/lib/admin/reorder-list-items';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PUT /api/ingest/lists/:id/order
 * بدنه: { "orderedIds": ["placementId", ...] } — مجموعه باید دقیقاً همهٔ ردیف‌های زنده باشد.
 * سرور order را ۰..n−۱ فشرده می‌کند. Idempotency-Key اجباری است.
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const { id: listId } = await params;
  const path = `/api/ingest/lists/${listId}/order`;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON نامعتبر است' }, { status: 400 });
  }

  return runIngestWrite(request, path, raw, async () => {
    const orderedIds = Array.isArray((raw as { orderedIds?: unknown })?.orderedIds)
      ? ((raw as { orderedIds: unknown[] }).orderedIds as unknown[]).map((id) => String(id))
      : null;

    if (!orderedIds) {
      return {
        status: 400,
        body: {
          ok: false,
          code: 'bad_request',
          error: 'فیلد orderedIds (آرایهٔ شناسه) الزامی است',
        },
      };
    }

    try {
      const result = await reorderListItems(prisma, listId, orderedIds);
      return {
        status: 200,
        body: {
          ok: true,
          data: {
            listId: result.listId,
            orderedIds: result.orderedIds,
            itemCount: result.itemCount,
            orders: result.orderedIds.map((_, index) => index),
          },
        },
      };
    } catch (error) {
      if (error instanceof ReorderListItemsError) {
        const code =
          error.status === 404
            ? 'not_found'
            : error.status === 409
              ? 'order_set_mismatch'
              : 'order_set_mismatch';
        return {
          status: error.status === 409 ? 422 : error.status,
          body: { ok: false, code, error: error.message },
        };
      }
      throw error;
    }
  });
}

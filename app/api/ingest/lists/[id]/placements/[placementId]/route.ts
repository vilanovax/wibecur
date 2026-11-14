import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireIngestAuth, runIngestWrite } from '@/lib/content/ingest-write';
import { removeIngestPlacement } from '@/lib/content/ingest-placement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string; placementId: string }> };

function readDeleteBody(raw: unknown): { dryRun: boolean } | { error: string } {
  if (raw == null || (typeof raw === 'object' && !Array.isArray(raw) && Object.keys(raw as object).length === 0)) {
    return { dryRun: false };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { error: 'بدنه باید یک شیء JSON باشد' };
  }
  const record = raw as Record<string, unknown>;
  if (record.dryRun !== undefined && typeof record.dryRun !== 'boolean') {
    return { error: 'dryRun باید boolean باشد' };
  }
  return { dryRun: record.dryRun === true };
}

/**
 * DELETE /api/ingest/lists/:id/placements/:placementId
 * فقط از همین لیست برمی‌دارد؛ کاتالوگ دست نمی‌خورد.
 * dryRun:true → پیش‌نمایش با itemCountBefore/After (بدون Idempotency-Key).
 * dryRun:false → نوشتن واقعی؛ Idempotency-Key اجباری است.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id: listId, placementId } = await params;
  const path = `/api/ingest/lists/${listId}/placements/${placementId}`;

  let raw: unknown = {};
  const text = await request.text();
  if (text.trim()) {
    try {
      raw = JSON.parse(text);
    } catch {
      return NextResponse.json({ ok: false, error: 'JSON نامعتبر است' }, { status: 400 });
    }
  }

  const parsed = readDeleteBody(raw);
  if ('error' in parsed) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  if (parsed.dryRun) {
    const denied = await requireIngestAuth(request);
    if (denied) return denied;

    const result = await removeIngestPlacement(prisma, placementId, {
      listId,
      dryRun: true,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, code: result.code, error: result.error },
        { status: result.status }
      );
    }
    return NextResponse.json({ ok: true, data: result });
  }

  return runIngestWrite(request, path, raw, async () => {
    const result = await removeIngestPlacement(prisma, placementId, {
      listId,
      dryRun: false,
    });
    if (!result.ok) {
      return {
        status: result.status,
        body: { ok: false, code: result.code, error: result.error },
      };
    }
    return { status: 200, body: { ok: true, data: result } };
  });
}

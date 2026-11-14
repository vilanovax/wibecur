import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireIngestAuth, runIngestWrite } from '@/lib/content/ingest-write';
import {
  getIngestPlacement,
  patchIngestPlacement,
  removeIngestPlacement,
  type IngestPlacementPatch,
} from '@/lib/content/ingest-placement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ placementId: string }> };

/** GET /api/ingest/placements/:placementId */
export async function GET(request: Request, { params }: RouteParams) {
  const denied = await requireIngestAuth(request);
  if (denied) return denied;

  const { placementId } = await params;
  const result = await getIngestPlacement(prisma, placementId);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: result.code, error: result.error },
      { status: result.status }
    );
  }
  return NextResponse.json({ ok: true, data: result });
}

/**
 * PATCH /api/ingest/placements/:placementId
 * فقط scope:placement — کاتالوگ و لیست‌های دیگر دست نمی‌خورند.
 * هدر Idempotency-Key اجباری است.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { placementId } = await params;
  const path = `/api/ingest/placements/${placementId}`;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON نامعتبر است' }, { status: 400 });
  }

  return runIngestWrite(request, path, raw, async () => {
    const body =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as IngestPlacementPatch)
        : {};
    const result = await patchIngestPlacement(prisma, placementId, body);
    if (!result.ok) {
      return {
        status: result.status,
        body: { ok: false, code: result.code, error: result.error },
      };
    }
    return { status: 200, body: { ok: true, data: result } };
  });
}

/**
 * DELETE /api/ingest/placements/:placementId
 * فقط از همین لیست برمی‌دارد؛ کاتالوگ دست نمی‌خورد.
 * هدر Idempotency-Key اجباری است.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { placementId } = await params;
  const path = `/api/ingest/placements/${placementId}`;

  let raw: unknown = {};
  const text = await request.text();
  if (text.trim()) {
    try {
      raw = JSON.parse(text);
    } catch {
      return NextResponse.json({ ok: false, error: 'JSON نامعتبر است' }, { status: 400 });
    }
  }

  return runIngestWrite(request, path, raw, async () => {
    const result = await removeIngestPlacement(prisma, placementId);
    if (!result.ok) {
      return {
        status: result.status,
        body: { ok: false, code: result.code, error: result.error },
      };
    }
    return { status: 200, body: { ok: true, data: result } };
  });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireIngestAuth } from '@/lib/content/ingest-write';
import { getIngestList } from '@/lib/content/ingest-list-read';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/ingest/lists/:id
 * خواندن مستقیم لیست برای بات — بدون کش عمومی.
 * حتی لیست غیرفعال یا خصوصی برمی‌گردد (زباله‌دان نه).
 * :id می‌تواند شناسه یا slug باشد.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const denied = await requireIngestAuth(request);
  if (denied) return denied;

  const { id } = await params;
  const result = await getIngestList(prisma, id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: result.code, error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(
    { ok: true, data: { list: result.list, placements: result.placements } },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

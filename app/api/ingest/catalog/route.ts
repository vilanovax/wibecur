import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireIngestAuth } from '@/lib/content/ingest-write';
import { searchIngestCatalog } from '@/lib/content/ingest-catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/ingest/catalog?id=&q=&imdbId=&mediaType=&limit=
 * جست‌وجوی کاتالوگ برای جلوگیری از تکرار — بدون کش.
 * با id می‌توان یک موجودیت مشخص را گرفت. listCount فقط جایگاه‌های زنده است.
 */
export async function GET(request: Request) {
  const denied = await requireIngestAuth(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const result = await searchIngestCatalog(prisma, {
    id: url.searchParams.get('id'),
    q: url.searchParams.get('q'),
    imdbId: url.searchParams.get('imdbId'),
    mediaType: url.searchParams.get('mediaType'),
    limit: url.searchParams.get('limit')
      ? Number(url.searchParams.get('limit'))
      : undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: result.code, error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: {
        items: result.items,
        query: result.query,
        mediaTypeFilters: result.mediaTypeFilters,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

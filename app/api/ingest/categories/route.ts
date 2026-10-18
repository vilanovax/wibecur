import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeIngest } from '@/lib/content/ingest-auth';
import { ingestKindForSlug } from '@/lib/content/ingest-models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/ingest/categories — فهرست دسته‌ها برای بات. */
export async function GET(request: Request) {
  const authResult = authorizeIngest(request);
  if (!authResult.ok) {
    return NextResponse.json({ ok: false, error: authResult.error }, { status: authResult.status });
  }

  const categories = await prisma.categories.findMany({
    where: { deletedAt: null },
    orderBy: { order: 'asc' },
    select: { slug: true, name: true, isActive: true },
  });

  return NextResponse.json({
    ok: true,
    categories: categories.map((category) => ({
      ...category,
      kind: ingestKindForSlug(category.slug),
    })),
  });
}

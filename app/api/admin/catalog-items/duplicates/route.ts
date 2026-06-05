import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { findDuplicateCatalogGroups } from '@/lib/catalog-items';

/** GET /api/admin/catalog-items/duplicates */
export async function GET() {
  try {
    await requireAdmin();
    const groups = await findDuplicateCatalogGroups(prisma, { limit: 50 });
    return NextResponse.json({ groups, count: groups.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isPersonRole } from '@/lib/people';
import { listPersonImageCandidates } from '@/lib/person-image-storage';

/** GET /api/admin/people/images/queue?role=&limit=&action=fetch_tmdb */
export async function GET(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roleRaw = searchParams.get('role');
    const role = roleRaw && isPersonRole(roleRaw) ? roleRaw : undefined;
    const limit = searchParams.get('limit') != null ? Number(searchParams.get('limit')) : 25;
    const action =
      searchParams.get('action') === 'migrate_storage' ? 'migrate_storage' : 'fetch_tmdb';

    const result = await listPersonImageCandidates(prisma, action, {
      role,
      limit,
      onlyMissing: true,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

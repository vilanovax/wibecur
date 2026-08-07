import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkActionRateLimit } from '@/lib/rate-limit';
import { isPersonRole } from '@/lib/people';
import { bulkProcessPersonImages } from '@/lib/person-image-storage';

/** POST /api/admin/people/images/bulk */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const action = body.action === 'migrate_storage' ? 'migrate_storage' : 'fetch_tmdb';
    const roleRaw = typeof body.role === 'string' ? body.role : undefined;
    const role = roleRaw && isPersonRole(roleRaw) ? roleRaw : undefined;
    const limit = body.limit != null ? Number(body.limit) : 20;
    const onlyMissing = body.onlyMissing !== false;

    const { success } = await checkActionRateLimit(
      `person-images-bulk:${session.user?.id ?? 'admin'}`,
      5,
      '1 m'
    );
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'درخواست‌های زیاد — کمی صبر کنید.' },
        { status: 429 }
      );
    }

    const result = await bulkProcessPersonImages(prisma, action, { role, limit, onlyMissing });
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در پردازش تصاویر';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

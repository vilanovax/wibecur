import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isPersonRole } from '@/lib/people';
import { fetchPersonImageFromTmdb } from '@/lib/person-image-storage';

type RouteParams = { role: string; slug: string };

/** POST /api/admin/people/[role]/[slug]/fetch-image — TMDB + آپلود ParsPack */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    await requireAdmin();
    const { role: roleRaw, slug } = await params;
    if (!isPersonRole(roleRaw)) {
      return NextResponse.json({ success: false, error: 'نقش نامعتبر' }, { status: 400 });
    }

    const result = await fetchPersonImageFromTmdb(prisma, roleRaw, slug);
    if (result.status === 'failed') {
      return NextResponse.json({ success: false, error: result.error || 'خطا' }, { status: 500 });
    }
    if (result.status === 'no_image') {
      return NextResponse.json({ success: false, error: result.error || 'تصویر یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در دریافت تصویر';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

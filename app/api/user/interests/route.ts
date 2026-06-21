import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { dbQuery } from '@/lib/db';
import { shouldGracefulDbFallback } from '@/lib/db-errors';
import { getUserInterests, updateUserInterests } from '@/lib/user-interests';

/** GET /api/user/interests */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const interests = await dbQuery(() => getUserInterests(session.user.id));
    return NextResponse.json({ success: true, data: { interests } });
  } catch (error: unknown) {
    if (shouldGracefulDbFallback(error)) {
      return NextResponse.json({ success: true, data: { interests: [] } });
    }
    console.error('Error fetching user interests:', error);
    return NextResponse.json({ success: false, error: 'خطا در دریافت علایق' }, { status: 500 });
  }
}

/** PUT /api/user/interests — { pinnedKeywordIds?: string[], hiddenKeywordIds?: string[] } */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const pinnedKeywordIds = Array.isArray(body.pinnedKeywordIds)
      ? body.pinnedKeywordIds.filter((s: unknown) => typeof s === 'string')
      : Array.isArray(body.pinnedSlugs)
        ? body.pinnedSlugs.filter((s: unknown) => typeof s === 'string')
        : undefined;
    const hiddenKeywordIds = Array.isArray(body.hiddenKeywordIds)
      ? body.hiddenKeywordIds.filter((s: unknown) => typeof s === 'string')
      : undefined;

    const interests = await dbQuery(() =>
      updateUserInterests(session.user.id, { pinnedKeywordIds, hiddenKeywordIds })
    );

    return NextResponse.json({ success: true, data: { interests } });
  } catch (error: unknown) {
    console.error('Error updating user interests:', error);
    return NextResponse.json({ success: false, error: 'خطا در ذخیره علایق' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { resolveSessionUserId } from '@/lib/api-db';
import { dbQuery } from '@/lib/db';
import { reorderProfilePicks, ProfilePickError } from '@/lib/profile-picks';

/** PATCH /api/user/profile-picks/reorder */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const categorySlug =
      typeof body.categorySlug === 'string' ? body.categorySlug.trim() : '';
    const orderedIds = Array.isArray(body.orderedIds)
      ? body.orderedIds.filter((id: unknown) => typeof id === 'string')
      : [];

    if (!categorySlug || orderedIds.length === 0) {
      return NextResponse.json({ success: false, error: 'داده نامعتبر' }, { status: 400 });
    }

    await dbQuery(() => reorderProfilePicks(userId, categorySlug, orderedIds));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ProfilePickError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('profile-picks reorder:', error);
    return NextResponse.json({ success: false, error: 'خطا در مرتب‌سازی' }, { status: 500 });
  }
}

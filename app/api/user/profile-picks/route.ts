import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { resolveSessionUserId } from '@/lib/api-db';
import { dbQuery } from '@/lib/db';
import {
  addProfilePick,
  getProfilePicksForUser,
  ProfilePickError,
} from '@/lib/profile-picks';

/** GET /api/user/profile-picks */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = await dbQuery(() => getProfilePicksForUser(userId));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('profile-picks GET:', error);
    return NextResponse.json({ success: false, error: 'خطا در بارگذاری منتخب‌ها' }, { status: 500 });
  }
}

/** POST /api/user/profile-picks */
export async function POST(request: NextRequest) {
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
    const catalogItemId = typeof body.catalogItemId === 'string' ? body.catalogItemId.trim() : '';
    if (!catalogItemId) {
      return NextResponse.json({ success: false, error: 'شناسه آیتم الزامی است' }, { status: 400 });
    }

    const pick = await dbQuery(() => addProfilePick(userId, catalogItemId));
    return NextResponse.json({ success: true, data: { pick } });
  } catch (error) {
    if (error instanceof ProfilePickError) {
      const status =
        error.code === 'NOT_FOUND' ? 404 : error.code === 'DUPLICATE' ? 409 : error.code === 'LIMIT' ? 409 : 400;
      return NextResponse.json({ success: false, error: error.message }, { status });
    }
    console.error('profile-picks POST:', error);
    return NextResponse.json({ success: false, error: 'خطا در افزودن منتخب' }, { status: 500 });
  }
}

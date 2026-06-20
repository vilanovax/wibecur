import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { resolveSessionUserId } from '@/lib/api-db';
import { dbQuery } from '@/lib/db';
import {
  removeProfilePick,
  updateProfilePickNote,
  ProfilePickError,
} from '@/lib/profile-picks';

/** DELETE /api/user/profile-picks/[id] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbQuery(() => removeProfilePick(userId, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ProfilePickError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    console.error('profile-picks DELETE:', error);
    return NextResponse.json({ success: false, error: 'خطا در حذف منتخب' }, { status: 500 });
  }
}

/** PATCH /api/user/profile-picks/[id] — update note */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const note = body.note === null || body.note === undefined ? null : String(body.note);

    const updated = await dbQuery(() => updateProfilePickNote(userId, id, note));
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ProfilePickError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    console.error('profile-picks PATCH:', error);
    return NextResponse.json({ success: false, error: 'خطا در به‌روزرسانی' }, { status: 500 });
  }
}

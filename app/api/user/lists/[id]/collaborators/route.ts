import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { dbQuery } from '@/lib/db';
import { resolveSessionUserId } from '@/lib/api-db';
import {
  collaborationErrorMessage,
  fetchCollaboratorsForList,
  inviteCollaboratorByUsername,
  requestListCollaboration,
} from '@/lib/list-collaboration';
import { prisma } from '@/lib/prisma';

/** GET /api/user/lists/[id]/collaborators */
export async function GET(
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

    const { id: listId } = await params;
    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
        select: { id: true, userId: true, collaborationEnabled: true, isPublic: true },
      })
    );
    if (!list) {
      return NextResponse.json({ success: false, error: 'لیست یافت نشد' }, { status: 404 });
    }
    if (list.userId !== userId) {
      return NextResponse.json({ success: false, error: 'دسترسی مجاز نیست' }, { status: 403 });
    }

    const members = await dbQuery(() => fetchCollaboratorsForList(listId));
    return NextResponse.json({
      success: true,
      data: {
        collaborationEnabled: list.collaborationEnabled,
        members,
      },
    });
  } catch (error) {
    console.error('GET collaborators:', error);
    return NextResponse.json({ success: false, error: 'خطا در دریافت همکاران' }, { status: 500 });
  }
}

/** POST /api/user/lists/[id]/collaborators — invite { username } or request { request: true } */
export async function POST(
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

    const { id: listId } = await params;
    const body = await request.json().catch(() => ({}));
    const username = typeof body.username === 'string' ? body.username : '';
    const isRequest = body.request === true;

    if (isRequest) {
      await dbQuery(() => requestListCollaboration(userId, listId));
      return NextResponse.json({ success: true, message: 'درخواست همکاری ارسال شد' });
    }

    if (!username.trim()) {
      return NextResponse.json({ success: false, error: 'نام کاربری الزامی است' }, { status: 400 });
    }

    const record = await dbQuery(() => inviteCollaboratorByUsername(userId, listId, username));
    return NextResponse.json({
      success: true,
      data: record,
      message: 'دعوت همکاری ارسال شد',
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN';
    const status =
      code === 'FORBIDDEN' ? 403 : code === 'LIST_NOT_FOUND' || code === 'NOT_FOUND' ? 404 : 400;
    return NextResponse.json(
      { success: false, error: collaborationErrorMessage(code) },
      { status }
    );
  }
}

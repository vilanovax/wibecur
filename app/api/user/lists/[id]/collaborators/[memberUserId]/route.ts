import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { dbQuery } from '@/lib/db';
import { resolveSessionUserId } from '@/lib/api-db';
import {
  collaborationErrorMessage,
  ownerRespondToCollaborationRequest,
  respondToCollaborationInvite,
  revokeCollaborator,
} from '@/lib/list-collaboration';
import { prisma } from '@/lib/prisma';

/** PATCH /api/user/lists/[id]/collaborators/[memberUserId] — { action: accept|reject|revoke } */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberUserId: string }> }
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

    const { id: listId, memberUserId } = await params;
    const body = await request.json();
    const action = body.action as 'accept' | 'reject' | 'revoke';

    if (!['accept', 'reject', 'revoke'].includes(action)) {
      return NextResponse.json({ success: false, error: 'عملیات نامعتبر' }, { status: 400 });
    }

    if (action === 'revoke') {
      await dbQuery(() => revokeCollaborator(userId, listId, memberUserId));
      return NextResponse.json({ success: true, message: 'دسترسی همکار لغو شد' });
    }

    const list = await dbQuery(() =>
      prisma.lists.findUnique({ where: { id: listId }, select: { userId: true } })
    );
    if (!list) {
      return NextResponse.json({ success: false, error: 'لیست یافت نشد' }, { status: 404 });
    }

    if (list.userId === userId && memberUserId !== userId) {
      await dbQuery(() => ownerRespondToCollaborationRequest(userId, listId, memberUserId, action));
    } else if (memberUserId === userId) {
      await dbQuery(() => respondToCollaborationInvite(userId, listId, action));
    } else {
      return NextResponse.json({ success: false, error: 'دسترسی مجاز نیست' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: action === 'accept' ? 'همکاری پذیرفته شد' : 'درخواست رد شد',
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN';
    const status =
      code === 'FORBIDDEN' ? 403 : code === 'NOT_FOUND' || code === 'LIST_NOT_FOUND' ? 404 : 400;
    return NextResponse.json(
      { success: false, error: collaborationErrorMessage(code) },
      { status }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

type BulkAction = 'approve' | 'reject';

export async function POST(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ids } = body as { action: BulkAction; ids: string[] };

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'action and ids[] are required' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { success: false, error: 'action must be approve or reject' },
        { status: 400 }
      );
    }

    const validIds = ids.filter((id: unknown) => typeof id === 'string');

    if (action === 'approve') {
      await dbQuery(() =>
        prisma.$transaction([
          prisma.comments.updateMany({
            where: { id: { in: validIds } },
            data: { isApproved: true, isFiltered: false },
          }),
          prisma.comment_reports.updateMany({
            where: { commentId: { in: validIds }, resolved: false },
            data: { resolved: true },
          }),
        ])
      );
    } else {
      await dbQuery(() =>
        prisma.comments.updateMany({
          where: { id: { in: validIds } },
          data: { isApproved: false },
        })
      );
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'کامنت‌ها تایید شدند' : 'کامنت‌ها رد شدند',
      count: validIds.length,
    });
  } catch (error: any) {
    console.error('Error bulk action:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

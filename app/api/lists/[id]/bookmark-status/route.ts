import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/lists/[id]/bookmark-status - بررسی وضعیت بوک‌مارک
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const { id: listId } = await params;

    // Check if bookmark exists
    const bookmark = await dbQuery(() =>
      prisma.bookmarks.findFirst({
        where: {
          userId,
          listId,
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        isBookmarked: !!bookmark,
      },
    });
  } catch (error: any) {
    console.error('Error checking bookmark status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در بررسی وضعیت بوک‌مارک' },
      { status: 500 }
    );
  }
}


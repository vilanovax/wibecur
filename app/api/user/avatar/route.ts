import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { isDbUnavailableError } from '@/lib/db-errors';
import { ensureImageInLiara } from '@/lib/object-storage';

// POST /api/user/avatar - آپلود آواتار کاربر
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'آدرس تصویر الزامی است' },
        { status: 400 }
      );
    }

    const finalImageUrl = await ensureImageInLiara(imageUrl, 'avatars');

    const updatedUser = await dbQuery(() =>
      prisma.users.update({
        where: { id: userId },
        data: {
          image: finalImageUrl,
          avatarType: 'UPLOADED',
          avatarStatus: 'PENDING',
          avatarId: null,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          avatarType: true,
          avatarStatus: true,
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error: unknown) {
    console.error('Error updating avatar:', error);
    if (isDbUnavailableError(error)) {
      return NextResponse.json(
        { success: false, error: 'اتصال به دیتابیس برقرار نیست. چند ثانیه بعد دوباره تلاش کنید.' },
        { status: 503 }
      );
    }
    const message = getClientErrorMessage(error, 'Internal server error');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
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

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        image: finalImageUrl,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error: any) {
    console.error('Error updating avatar:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


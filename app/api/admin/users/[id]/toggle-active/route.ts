import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { auth } from '@/lib/auth-config';


// PUT /api/admin/users/[id]/toggle-active - فعال/غیرفعال کردن کاربر
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'مقدار isActive باید boolean باشد' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await dbQuery(() =>
      prisma.users.findUnique({
        where: { id },
      })
    );

    if (!existingUser) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Prevent deactivating yourself
    const session = await auth();
    if (session?.user?.email === existingUser.email && !isActive) {
      return NextResponse.json(
        { error: 'شما نمی‌توانید خود را غیرفعال کنید' },
        { status: 403 }
      );
    }

    // Update user
    const updatedUser = await dbQuery(() =>
      prisma.users.update({
        where: { id },
        data: { isActive },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          isActive: true,
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: isActive ? 'کاربر فعال شد' : 'کاربر غیرفعال شد',
    });
  } catch (error: any) {
    console.error('Error toggling user active status:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در تغییر وضعیت کاربر' },
      { status: 500 }
    );
  }
}


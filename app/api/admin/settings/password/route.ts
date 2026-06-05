import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateAuthPassword } from '@/lib/phone-auth';

export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { password: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      hasPassword: !!user.password,
      role: user.role,
    });
  } catch (error: unknown) {
    console.error('GET password settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = String(body?.currentPassword ?? '');
    const newPassword = String(body?.newPassword ?? '');
    const confirmPassword = String(body?.confirmPassword ?? '');

    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: 'رمز فعلی را وارد کنید' },
        { status: 400 }
      );
    }

    const passwordError = validateAuthPassword(newPassword);
    if (passwordError) {
      return NextResponse.json({ success: false, error: passwordError }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'رمز جدید و تکرار آن یکسان نیستند' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: 'رمز جدید باید با رمز فعلی متفاوت باشد' },
        { status: 400 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'کاربر یافت نشد' }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'این حساب رمز تنظیم‌شده ندارد. با مدیر سیستم تماس بگیرید.',
        },
        { status: 400 }
      );
    }

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return NextResponse.json(
        { success: false, error: 'رمز فعلی اشتباه است' },
        { status: 400 }
      );
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashed, updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'رمز عبور با موفقیت تغییر کرد',
    });
  } catch (error: unknown) {
    console.error('PUT password settings:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}

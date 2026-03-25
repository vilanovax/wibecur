import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const PHONE_REGEX = /^09\d{9}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, name } = body;

    // Validation
    if (!phone || typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim())) {
      return NextResponse.json(
        { error: 'شماره موبایل معتبر نیست (مثال: 09123456789)' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'نام نمایشی باید حداقل ۲ کاراکتر باشد' },
        { status: 400 }
      );
    }

    const trimmedPhone = phone.trim();
    const trimmedName = name.trim();

    // Check duplicate phone
    const existingUser = await prisma.users.findFirst({
      where: { phone: trimmedPhone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'این شماره موبایل قبلاً ثبت‌نام کرده است' },
        { status: 409 }
      );
    }

    // Create user
    const id = crypto.randomBytes(12).toString('base64url');
    const hashedPassword = bcrypt.hashSync(password, 10);
    const email = `${trimmedPhone}@wibecur.local`; // placeholder email for compatibility
    const username = `user_${trimmedPhone.slice(-8)}`;

    const user = await prisma.users.create({
      data: {
        id,
        name: trimmedName,
        email,
        phone: trimmedPhone,
        password: hashedPassword,
        username,
        role: 'USER',
        avatarType: 'DEFAULT',
        avatarId: 'vibe', // آواتار پیش‌فرض Vibe 💜
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error: unknown) {
    console.error('Register error:', error);

    // Handle unique constraint violations
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json(
        { error: 'این شماره موبایل قبلاً ثبت‌نام کرده است' },
        { status: 409 }
      );
    }

    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `خطا در ثبت‌نام: ${msg}` },
      { status: 500 }
    );
  }
}

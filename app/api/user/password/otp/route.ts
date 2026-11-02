import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { resolveSessionUserId } from '@/lib/api-db';
import { authEmailToPhone } from '@/lib/phone-auth';
import { checkActionRateLimit } from '@/lib/rate-limit';
import { sendPhoneOtp } from '@/lib/send-otp-sms';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

/** POST /api/user/password/otp — ارسال کد برای تعیین/بازنشانی رمز (فقط کاربر لاگین) */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'ابتدا وارد حساب شو' }, { status: 401 });
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'ابتدا وارد حساب شو' }, { status: 401 });
    }

    const userLimit = await checkActionRateLimit(`otp-password:${userId}`, 8, '1 h');
    if (!userLimit.success) {
      return NextResponse.json(
        { success: false, error: 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره امتحان کن.' },
        { status: 429 }
      );
    }

    const user = await dbQuery(() =>
      prisma.users.findUnique({
        where: { id: userId },
        select: { email: true, isActive: true, deletedAt: true },
      })
    );

    if (!user || !user.isActive || user.deletedAt) {
      return NextResponse.json({ success: false, error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const phone = authEmailToPhone(user.email);
    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'این حساب شماره موبایل معتبری ندارد.' },
        { status: 400 }
      );
    }

    const result = await sendPhoneOtp({
      normalizedPhone: phone,
      purpose: 'set-password',
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          ...(result.code ? { code: result.code } : {}),
          ...(result.retryAfterSeconds
            ? { data: { retryAfterSeconds: result.retryAfterSeconds } }
            : {}),
        },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        expiresAt: result.expiresAt,
        resendAt: result.resendAt,
        retryAfterSeconds: result.retryAfterSeconds,
        ...(result.devCode ? { devCode: result.devCode } : {}),
      },
    });
  } catch (error) {
    console.error('[user/password/otp]', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ارسال کد. دوباره تلاش کن.' },
      { status: 500 }
    );
  }
}

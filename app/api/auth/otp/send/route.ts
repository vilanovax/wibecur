import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/client-ip';
import type { OtpPurpose } from '@/lib/otp-shared';
import { normalizeIranPhone, validatePhoneInput } from '@/lib/phone-auth';
import { checkActionRateLimit } from '@/lib/rate-limit';
import { sendPhoneOtp } from '@/lib/send-otp-sms';
import { DEFAULT_PACK_AVATARS, resolveVibeAvatarId } from '@/lib/vibe-avatars';

const DEFAULT_AVATAR_IDS = new Set(DEFAULT_PACK_AVATARS.map((a) => a.id));

function parsePurpose(raw: unknown): OtpPurpose | null {
  if (raw === 'login' || raw === 'register' || raw === 'set-password') return raw;
  return null;
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers);
    const ipLimit = await checkActionRateLimit(`otp-send-ip:${ip}`, 10, '1 h');
    if (!ipLimit.success) {
      return NextResponse.json(
        { success: false, error: 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره امتحان کن.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const phoneRaw = String(body?.phone ?? '');
    const purpose = parsePurpose(body?.purpose) ?? 'login';
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : undefined;
    const avatarRaw = typeof body?.avatarId === 'string' ? body.avatarId.trim() : 'vibe';
    const resolvedAvatarId = resolveVibeAvatarId(avatarRaw) ?? 'vibe';
    const avatarId = DEFAULT_AVATAR_IDS.has(resolvedAvatarId) ? resolvedAvatarId : 'vibe';

    // set-password فقط از مسیر authenticated پروفایل مجاز است
    if (purpose === 'set-password') {
      return NextResponse.json(
        { success: false, error: 'برای تنظیم رمز از بخش پروفایل اقدام کن.' },
        { status: 400 }
      );
    }

    const phoneError = validatePhoneInput(phoneRaw);
    if (phoneError) {
      return NextResponse.json({ success: false, error: phoneError }, { status: 400 });
    }

    const normalizedPhone = normalizeIranPhone(phoneRaw)!;
    const result = await sendPhoneOtp({
      normalizedPhone,
      purpose,
      name,
      avatarId,
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
    console.error('[otp/send]', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ارسال کد. دوباره تلاش کن.' },
      { status: 500 }
    );
  }
}

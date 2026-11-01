import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/client-ip';
import {
  generateOtpCode,
  getOtpResendRemainingMs,
  OTP_RESEND_COOLDOWN_MS,
  saveOtp,
  type OtpPurpose,
} from '@/lib/otp';
import { normalizeIranPhone, validatePhoneInput } from '@/lib/phone-auth';
import { checkActionRateLimit } from '@/lib/rate-limit';
import { getSmsIrConfig, sendOtpSms, toSmsIrMobile } from '@/lib/sms-ir';
import { DEFAULT_PACK_AVATARS, resolveVibeAvatarId } from '@/lib/vibe-avatars';
import { fa } from '@/lib/utils';

const DEFAULT_AVATAR_IDS = new Set(DEFAULT_PACK_AVATARS.map((a) => a.id));

function parsePurpose(raw: unknown): OtpPurpose | null {
  if (raw === 'login' || raw === 'register') return raw;
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

    const phoneError = validatePhoneInput(phoneRaw);
    if (phoneError) {
      return NextResponse.json({ success: false, error: phoneError }, { status: 400 });
    }

    const normalizedPhone = normalizeIranPhone(phoneRaw)!;

    const phoneLimit = await checkActionRateLimit(`otp-send-phone:${normalizedPhone}`, 5, '1 h');
    if (!phoneLimit.success) {
      return NextResponse.json(
        { success: false, error: 'برای این شماره فعلاً نمی‌توانی کد بگیری. کمی بعد دوباره تلاش کن.' },
        { status: 429 }
      );
    }

    const remainingMs = getOtpResendRemainingMs(normalizedPhone);
    if (remainingMs > 0) {
      const seconds = Math.ceil(remainingMs / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `برای ارسال دوباره ${fa(seconds)} ثانیه صبر کن`,
          data: { retryAfterSeconds: seconds },
        },
        { status: 429 }
      );
    }

    const code = generateOtpCode();
    const mobile = toSmsIrMobile(normalizedPhone);
    const sms = await sendOtpSms(mobile, code);

    if (!sms.ok) {
      return NextResponse.json(
        { success: false, error: 'ارسال پیامک ناموفق بود. کمی بعد دوباره تلاش کن.' },
        { status: 502 }
      );
    }

    const { expiresAt, resendAt } = saveOtp({
      phone: normalizedPhone,
      code,
      purpose,
      name: purpose === 'register' ? name : undefined,
      avatarId: purpose === 'register' ? avatarId : undefined,
    });

    const config = getSmsIrConfig();
    const retryAfterSeconds = Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000);

    return NextResponse.json({
      success: true,
      data: {
        expiresAt,
        resendAt,
        retryAfterSeconds,
        // فقط در dry-run برای توسعهٔ لوکال؛ در production هرگز برنمی‌گردد
        ...(config.dryRun ? { devCode: code } : {}),
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

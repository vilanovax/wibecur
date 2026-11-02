/**
 * ارسال OTP مشترک برای مسیرهای auth و پروفایل.
 */

import {
  generateOtpCode,
  getOtpResendRemainingMs,
  OTP_RESEND_COOLDOWN_MS,
  saveOtp,
  type OtpPurpose,
} from '@/lib/otp';
import { getSmsIrConfig, sendOtpSms, toSmsIrMobile } from '@/lib/sms-ir';
import { checkActionRateLimit } from '@/lib/rate-limit';
import { fa } from '@/lib/utils';

export type SendPhoneOtpResult =
  | {
      ok: true;
      expiresAt: number;
      resendAt: number;
      retryAfterSeconds: number;
      devCode?: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
      code?: string;
      retryAfterSeconds?: number;
    };

export async function sendPhoneOtp(options: {
  normalizedPhone: string;
  purpose: OtpPurpose;
  name?: string;
  avatarId?: string;
}): Promise<SendPhoneOtpResult> {
  const { normalizedPhone, purpose, name, avatarId } = options;

  // اول cooldown — تا لمس‌های «ارسال دوباره» داخل ۶۰ثانیه سهمیهٔ ساعتی را نسوزانند.
  const remainingMs = await getOtpResendRemainingMs(normalizedPhone);
  if (remainingMs > 0) {
    const seconds = Math.ceil(remainingMs / 1000);
    return {
      ok: false,
      status: 429,
      error: `برای ارسال دوباره ${fa(seconds)} ثانیه صبر کن`,
      retryAfterSeconds: seconds,
    };
  }

  const phoneLimit = await checkActionRateLimit(`otp-send-phone:${normalizedPhone}`, 5, '1 h');
  if (!phoneLimit.success) {
    return {
      ok: false,
      status: 429,
      error: 'برای این شماره فعلاً نمی‌توانی کد بگیری. کمی بعد دوباره تلاش کن.',
    };
  }

  const code = generateOtpCode();
  const mobile = toSmsIrMobile(normalizedPhone);
  const smsConfig = getSmsIrConfig();
  if (!smsConfig.apiKey && !smsConfig.dryRun) {
    console.error('[otp/send] SMS_IR_API_KEY is not set in this environment');
    return {
      ok: false,
      status: 503,
      error: 'سرویس پیامک روی سرور تنظیم نشده است. کمی بعد دوباره تلاش کن.',
      code: 'SMS_CONFIG_MISSING',
    };
  }

  const sms = await sendOtpSms(mobile, code);
  if (!sms.ok) {
    console.error('[otp/send] sms.ir failed', {
      status: 'status' in sms ? sms.status : undefined,
      message: sms.message,
    });
    return {
      ok: false,
      status: 502,
      error: 'ارسال پیامک ناموفق بود. کمی بعد دوباره تلاش کن.',
      code: 'SMS_PROVIDER_ERROR',
    };
  }

  const { expiresAt, resendAt } = await saveOtp({
    phone: normalizedPhone,
    code,
    purpose,
    name: purpose === 'register' ? name : undefined,
    avatarId: purpose === 'register' ? avatarId : undefined,
  });

  const retryAfterSeconds = Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000);
  // هرگز در production کد را در JSON برنگردان — حتی اگر dry-run اشتباه ست شده باشد.
  const mayExposeDevCode =
    smsConfig.dryRun && process.env.NODE_ENV !== 'production';
  return {
    ok: true,
    expiresAt,
    resendAt,
    retryAfterSeconds,
    ...(mayExposeDevCode ? { devCode: code } : {}),
  };
}

/**
 * ثابت‌ها و اعتبارسنجی OTP — امن برای کلاینت و سرور.
 */

import { persianToEnglish } from '@/lib/utils/number-converter';
import { fa } from '@/lib/utils';

export const OTP_LENGTH = 5;
export const OTP_TTL_MS = 5 * 60_000;
export const OTP_RESEND_COOLDOWN_MS = 60_000;
export const OTP_MAX_ATTEMPTS = 5;

export type OtpPurpose = 'login' | 'register' | 'set-password';

export function normalizeOtpInput(input: string): string {
  return persianToEnglish(input).replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export function validateOtpInput(input: string): string | null {
  const code = normalizeOtpInput(input);
  if (code.length !== OTP_LENGTH) {
    return `کد تأیید باید ${fa(OTP_LENGTH)} رقم باشد`;
  }
  return null;
}

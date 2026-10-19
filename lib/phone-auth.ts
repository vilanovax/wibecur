/** نرمال‌سازی و اعتبارسنجی شماره موبایل ایران برای احراز هویت */

import { persianToEnglish } from '@/lib/utils/number-converter';

const PHONE_EMAIL_DOMAIN = 'phone.wibe';

/** 989XXXXXXXXX */
export function normalizeIranPhone(input: string): string | null {
  const digits = persianToEnglish(input).replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('09')) {
    return `98${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith('9')) {
    return `98${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('98')) {
    return digits;
  }
  if (digits.length === 13 && digits.startsWith('0098')) {
    return digits.slice(2);
  }

  return null;
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function toPersianDigits(value: string): string {
  return value.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

/** گروه‌بندی ۱۱ رقم محلی: ۰۹۱۲ ۱۲۳ ۴۵۶۷ */
function groupLocalPhone(digits: string): string {
  const local = digits.replace(/\D/g, '').slice(0, 11);
  const parts = [local.slice(0, 4), local.slice(4, 7), local.slice(7, 11)].filter(Boolean);
  return toPersianDigits(parts.join(' '));
}

/** رقم‌های لاتین ذخیره‌شده؛ حداکثر ۱۱ رقم موبایل */
export function digitsFromPhoneInput(input: string): string {
  return persianToEnglish(input).replace(/\D/g, '').slice(0, 11);
}

/** نمایش زندهٔ ورودی، با ارقام فارسی و فاصله */
export function formatPhoneDigitsForDisplay(digits: string): string {
  return groupLocalPhone(digits);
}

/** نمایش فارسی از شمارهٔ نرمال‌شده (۹۸…) */
export function formatIranPhoneDisplay(normalized: string): string {
  const local = normalized.startsWith('98') ? `0${normalized.slice(2)}` : normalized;
  return groupLocalPhone(local);
}

export function phoneToAuthEmail(normalizedPhone: string): string {
  return `${normalizedPhone}@${PHONE_EMAIL_DOMAIN}`;
}

export function isPhoneAuthEmail(email: string): boolean {
  return email.endsWith(`@${PHONE_EMAIL_DOMAIN}`);
}

export function validateAuthPassword(password: string): string | null {
  if (!password || password.length < 6) {
    return 'رمز عبور باید حداقل ۶ کاراکتر باشد';
  }
  // bcrypt ورودی بیش از ۷۲ بایت را بی‌صدا کوتاه می‌کند؛ صریحاً محدود می‌کنیم.
  if (password.length > 64) {
    return 'رمز عبور نباید بیش از ۶۴ کاراکتر باشد';
  }
  return null;
}

export function validatePhoneInput(input: string): string | null {
  if (!input.trim()) return 'شماره موبایل را وارد کن';
  if (!normalizeIranPhone(input)) return 'شماره موبایل معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷)';
  return null;
}

export function resolveLoginEmail(identifier: string): string | null {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  const phone = normalizeIranPhone(trimmed);
  if (!phone) return null;
  return phoneToAuthEmail(phone);
}

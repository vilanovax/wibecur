/**
 * تولید، ذخیره و تأیید کد OTP موبایل (در حافظهٔ پروسه — فقط سرور).
 */

import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  type OtpPurpose,
} from '@/lib/otp-shared';

export {
  OTP_LENGTH,
  OTP_TTL_MS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_ATTEMPTS,
  normalizeOtpInput,
  validateOtpInput,
  type OtpPurpose,
} from '@/lib/otp-shared';

const MAX_ENTRIES = 10_000;

type OtpRecord = {
  hash: string;
  purpose: OtpPurpose;
  expiresAt: number;
  resendAt: number;
  attempts: number;
  name?: string;
  avatarId?: string;
};

const store = new Map<string, OtpRecord>();

function hashOtp(phone: string, code: string): string {
  const pepper = process.env.NEXTAUTH_SECRET || 'wibecur-dev-secret';
  return createHash('sha256').update(`${pepper}:${phone}:${code}`).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function remember(phone: string, record: OtpRecord) {
  store.delete(phone);
  store.set(phone, record);
  if (store.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, value] of store) {
    if (value.expiresAt <= now) store.delete(key);
  }
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

export function generateOtpCode(length = OTP_LENGTH): string {
  const max = 10 ** length;
  const min = 10 ** (length - 1);
  return String(randomInt(min, max));
}

export function clearOtpsForTests(): void {
  store.clear();
}

type SaveOtpInput = {
  phone: string;
  code: string;
  purpose: OtpPurpose;
  name?: string;
  avatarId?: string;
  now?: number;
};

export function saveOtp(input: SaveOtpInput): { expiresAt: number; resendAt: number } {
  const now = input.now ?? Date.now();
  const record: OtpRecord = {
    hash: hashOtp(input.phone, input.code),
    purpose: input.purpose,
    expiresAt: now + OTP_TTL_MS,
    resendAt: now + OTP_RESEND_COOLDOWN_MS,
    attempts: 0,
    name: input.name,
    avatarId: input.avatarId,
  };
  remember(input.phone, record);
  return { expiresAt: record.expiresAt, resendAt: record.resendAt };
}

export function getOtpResendRemainingMs(phone: string, now = Date.now()): number {
  const record = store.get(phone);
  if (!record) return 0;
  if (record.expiresAt <= now) return 0;
  return Math.max(0, record.resendAt - now);
}

export type ConsumeOtpResult =
  | {
      ok: true;
      purpose: OtpPurpose;
      name?: string;
      avatarId?: string;
    }
  | {
      ok: false;
      reason: 'missing' | 'expired' | 'mismatch' | 'locked';
    };

export function consumeOtp(
  phone: string,
  code: string,
  options?: { purpose?: OtpPurpose; now?: number }
): ConsumeOtpResult {
  const now = options?.now ?? Date.now();
  const record = store.get(phone);

  if (!record) return { ok: false, reason: 'missing' };
  if (record.expiresAt <= now) {
    store.delete(phone);
    return { ok: false, reason: 'expired' };
  }
  if (options?.purpose && record.purpose !== options.purpose) {
    return { ok: false, reason: 'mismatch' };
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: 'locked' };
  }

  const nextAttempts = record.attempts + 1;
  const matches = safeEqualHex(record.hash, hashOtp(phone, code));

  if (!matches) {
    remember(phone, { ...record, attempts: nextAttempts });
    if (nextAttempts >= OTP_MAX_ATTEMPTS) {
      return { ok: false, reason: 'locked' };
    }
    return { ok: false, reason: 'mismatch' };
  }

  store.delete(phone);
  return {
    ok: true,
    purpose: record.purpose,
    name: record.name,
    avatarId: record.avatarId,
  };
}

/** فقط برای تست */
export function __setOtpForTests(
  phone: string,
  code: string,
  purpose: OtpPurpose = 'login'
): void {
  saveOtp({ phone, code, purpose });
}

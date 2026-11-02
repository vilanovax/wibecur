/**
 * تولید، ذخیره و تأیید کد OTP موبایل.
 * اگر REDIS_URL ست باشد بین پروسه‌ها مشترک است؛ وگرنه حافظهٔ همین پروسه.
 */

import { getRedis } from '@/lib/redis';
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
const REDIS_PREFIX = 'wibe:otp:';

type OtpRecord = {
  hash: string;
  purpose: OtpPurpose;
  expiresAt: number;
  resendAt: number;
  attempts: number;
  name?: string;
  avatarId?: string;
};

const memoryStore = new Map<string, OtpRecord>();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hashOtp(phone: string, code: string): Promise<string> {
  const pepper = process.env.NEXTAUTH_SECRET || 'wibecur-dev-secret';
  const data = new TextEncoder().encode(`${pepper}:${phone}:${code}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i)! ^ b.charCodeAt(i)!;
  }
  return diff === 0;
}

function rememberMemory(phone: string, record: OtpRecord) {
  memoryStore.delete(phone);
  memoryStore.set(phone, record);
  if (memoryStore.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, value] of memoryStore) {
    if (value.expiresAt <= now) memoryStore.delete(key);
  }
  while (memoryStore.size > MAX_ENTRIES) {
    const oldest = memoryStore.keys().next().value;
    if (oldest === undefined) break;
    memoryStore.delete(oldest);
  }
}

async function writeRecord(phone: string, record: OtpRecord): Promise<void> {
  const redis = await getRedis();
  if (!redis) {
    rememberMemory(phone, record);
    return;
  }
  const ttlMs = Math.max(1, record.expiresAt - Date.now());
  await redis.set(`${REDIS_PREFIX}${phone}`, JSON.stringify(record), {
    PX: ttlMs,
  });
}

async function readRecord(phone: string): Promise<OtpRecord | null> {
  const redis = await getRedis();
  if (!redis) {
    return memoryStore.get(phone) ?? null;
  }
  const raw = await redis.get(`${REDIS_PREFIX}${phone}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OtpRecord;
  } catch {
    await redis.del(`${REDIS_PREFIX}${phone}`);
    return null;
  }
}

async function deleteRecord(phone: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) {
    memoryStore.delete(phone);
    return;
  }
  await redis.del(`${REDIS_PREFIX}${phone}`);
}

export function generateOtpCode(length = OTP_LENGTH): string {
  const max = 10 ** length;
  const min = 10 ** (length - 1);
  const range = max - min;
  const limit = Math.floor(0x1_0000_0000 / range) * range;
  const buf = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buf);
    value = buf[0]!;
  } while (value >= limit);
  return String(min + (value % range));
}

export function clearOtpsForTests(): void {
  memoryStore.clear();
}

type SaveOtpInput = {
  phone: string;
  code: string;
  purpose: OtpPurpose;
  name?: string;
  avatarId?: string;
  now?: number;
};

export async function saveOtp(input: SaveOtpInput): Promise<{ expiresAt: number; resendAt: number }> {
  const now = input.now ?? Date.now();
  const record: OtpRecord = {
    hash: await hashOtp(input.phone, input.code),
    purpose: input.purpose,
    expiresAt: now + OTP_TTL_MS,
    resendAt: now + OTP_RESEND_COOLDOWN_MS,
    attempts: 0,
    name: input.name,
    avatarId: input.avatarId,
  };
  await writeRecord(input.phone, record);
  return { expiresAt: record.expiresAt, resendAt: record.resendAt };
}

export async function getOtpResendRemainingMs(phone: string, now = Date.now()): Promise<number> {
  const record = await readRecord(phone);
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

export async function consumeOtp(
  phone: string,
  code: string,
  options?: { purpose?: OtpPurpose; now?: number }
): Promise<ConsumeOtpResult> {
  const now = options?.now ?? Date.now();
  const record = await readRecord(phone);

  if (!record) return { ok: false, reason: 'missing' };
  if (record.expiresAt <= now) {
    await deleteRecord(phone);
    return { ok: false, reason: 'expired' };
  }
  if (options?.purpose && record.purpose !== options.purpose) {
    return { ok: false, reason: 'mismatch' };
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: 'locked' };
  }

  const nextAttempts = record.attempts + 1;
  const matches = safeEqualHex(record.hash, await hashOtp(phone, code));

  if (!matches) {
    await writeRecord(phone, { ...record, attempts: nextAttempts });
    if (nextAttempts >= OTP_MAX_ATTEMPTS) {
      return { ok: false, reason: 'locked' };
    }
    return { ok: false, reason: 'mismatch' };
  }

  await deleteRecord(phone);
  return {
    ok: true,
    purpose: record.purpose,
    name: record.name,
    avatarId: record.avatarId,
  };
}

/** فقط برای تست */
export async function __setOtpForTests(
  phone: string,
  code: string,
  purpose: OtpPurpose = 'login'
): Promise<void> {
  await saveOtp({ phone, code, purpose });
}

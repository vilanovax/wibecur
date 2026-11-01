/**
 * ورود/ثبت‌نام با OTP پس از تأیید کد.
 */

import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { normalizeAdminPermissions } from '@/lib/auth/has-permission';
import { phoneToAuthEmail } from '@/lib/phone-auth';
import { DEFAULT_PACK_AVATARS, resolveVibeAvatarId } from '@/lib/vibe-avatars';
import type { OtpPurpose } from '@/lib/otp-shared';
import type { AppRole } from '@/types/next-auth';

const DEFAULT_AVATAR_IDS = new Set(DEFAULT_PACK_AVATARS.map((a) => a.id));

export type OtpAuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  isActive: boolean;
  adminPermissions: ReturnType<typeof normalizeAdminPermissions>;
};

async function allocateUsername(normalizedPhone: string): Promise<string> {
  const baseUsername = `u${normalizedPhone.slice(-8)}`;
  let username = baseUsername;
  for (let i = 0; i < 5; i++) {
    const taken = await dbQuery(() =>
      prisma.users.findUnique({ where: { username }, select: { id: true } })
    );
    if (!taken) return username;
    username = `${baseUsername}${nanoid(4).toLowerCase()}`;
  }
  return `${baseUsername}${nanoid(6).toLowerCase()}`;
}

function resolveAvatarId(raw?: string): string {
  const resolved = resolveVibeAvatarId(raw ?? 'vibe') ?? 'vibe';
  return DEFAULT_AVATAR_IDS.has(resolved) ? resolved : 'vibe';
}

/** رمز تصادفی غیرقابل‌استفاده — حساب‌های OTP-only رمز ورود ندارند */
function unusablePasswordHash(): string {
  return bcrypt.hashSync(`otp:${nanoid(32)}`, 12);
}

export async function resolveUserAfterOtp(options: {
  normalizedPhone: string;
  purpose: OtpPurpose;
  name?: string;
  avatarId?: string;
}): Promise<OtpAuthUser | null> {
  const email = phoneToAuthEmail(options.normalizedPhone);

  const existing = await dbQuery(() =>
    prisma.users.findUnique({
      where: { email },
    })
  );

  if (existing) {
    if (!existing.isActive || existing.deletedAt) return null;
    return {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      role: existing.role as AppRole,
      isActive: existing.isActive,
      adminPermissions: normalizeAdminPermissions(existing.adminPermissions),
    };
  }

  // ورود برای شمارهٔ ناشناس: حساب سبک می‌سازیم
  // ثبت‌نام: همین مسیر با name/avatar ذخیره‌شده در چالش OTP
  if (options.purpose !== 'login' && options.purpose !== 'register') {
    return null;
  }

  const username = await allocateUsername(options.normalizedPhone);
  const avatarId = resolveAvatarId(options.avatarId);
  const name = options.name?.trim() || null;

  const created = await dbQuery(() =>
    prisma.users.create({
      data: {
        id: nanoid(),
        name,
        email,
        username,
        password: unusablePasswordHash(),
        role: 'USER',
        avatarType: 'DEFAULT',
        avatarId,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  );

  return {
    id: created.id,
    email: created.email,
    name: created.name,
    role: created.role as AppRole,
    isActive: created.isActive,
    adminPermissions: normalizeAdminPermissions(created.adminPermissions),
  };
}

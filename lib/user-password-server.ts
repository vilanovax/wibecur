import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { validateAuthPassword } from '@/lib/phone-auth';
import { consumeOtp, normalizeOtpInput, validateOtpInput } from '@/lib/otp';

export type ChangeUserPasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type SetUserPasswordWithOtpInput = {
  otp: string;
  newPassword: string;
  confirmPassword: string;
  phone: string;
};

export type ChangeUserPasswordResult =
  | { ok: true; message: string }
  | { ok: false; error: string; status: number };

export async function userHasPassword(
  userId: string,
  client: PrismaClient = prisma
): Promise<boolean> {
  const user = await client.users.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  return Boolean(user?.password);
}

function validateNewPasswordPair(
  newPassword: string,
  confirmPassword: string
): ChangeUserPasswordResult | null {
  const passwordError = validateAuthPassword(newPassword);
  if (passwordError) {
    return { ok: false, error: passwordError, status: 400 };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: 'رمز جدید و تکرار آن یکسان نیستند', status: 400 };
  }
  return null;
}

export async function changeUserPassword(
  userId: string,
  input: ChangeUserPasswordInput,
  client: PrismaClient = prisma
): Promise<ChangeUserPasswordResult> {
  const currentPassword = String(input.currentPassword ?? '');
  const newPassword = String(input.newPassword ?? '');
  const confirmPassword = String(input.confirmPassword ?? '');

  if (!currentPassword) {
    return { ok: false, error: 'رمز فعلی را وارد کنید', status: 400 };
  }

  const pairError = validateNewPasswordPair(newPassword, confirmPassword);
  if (pairError) return pairError;

  if (currentPassword === newPassword) {
    return { ok: false, error: 'رمز جدید باید با رمز فعلی متفاوت باشد', status: 400 };
  }

  const user = await client.users.findUnique({
    where: { id: userId },
    select: { id: true, password: true, isActive: true, deletedAt: true },
  });

  if (!user || !user.isActive || user.deletedAt) {
    return { ok: false, error: 'کاربر یافت نشد', status: 404 };
  }

  if (!user.password) {
    return {
      ok: false,
      error: 'برای این حساب هنوز رمزی تنظیم نشده. با کد پیامک رمز بگذار.',
      status: 400,
    };
  }

  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return { ok: false, error: 'رمز فعلی اشتباه است', status: 400 };
  }

  const hashed = bcrypt.hashSync(newPassword, 12);
  await client.users.update({
    where: { id: user.id },
    data: { password: hashed, updatedAt: new Date() },
  });

  return { ok: true, message: 'رمز عبور با موفقیت تغییر کرد' };
}

/** تعیین یا بازنشانی رمز با تأیید OTP موبایل */
export async function setUserPasswordWithOtp(
  userId: string,
  input: SetUserPasswordWithOtpInput,
  client: PrismaClient = prisma
): Promise<ChangeUserPasswordResult> {
  const newPassword = String(input.newPassword ?? '');
  const confirmPassword = String(input.confirmPassword ?? '');
  const otpRaw = String(input.otp ?? '');

  const otpError = validateOtpInput(otpRaw);
  if (otpError) {
    return { ok: false, error: otpError, status: 400 };
  }

  const pairError = validateNewPasswordPair(newPassword, confirmPassword);
  if (pairError) return pairError;

  const user = await client.users.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true, deletedAt: true },
  });

  if (!user || !user.isActive || user.deletedAt) {
    return { ok: false, error: 'کاربر یافت نشد', status: 404 };
  }

  const consumed = await consumeOtp(input.phone, normalizeOtpInput(otpRaw), {
    purpose: 'set-password',
  });
  if (!consumed.ok) {
    const message =
      consumed.reason === 'expired'
        ? 'کد تأیید منقضی شده. دوباره درخواست کن.'
        : consumed.reason === 'locked'
          ? 'تعداد تلاش زیاد بود. کمی بعد دوباره درخواست کن.'
          : 'کد تأیید نادرست است';
    return { ok: false, error: message, status: 400 };
  }

  const hashed = bcrypt.hashSync(newPassword, 12);
  await client.users.update({
    where: { id: user.id },
    data: { password: hashed, updatedAt: new Date() },
  });

  return { ok: true, message: 'رمز عبور ذخیره شد. از این به بعد می‌توانی با رمز هم وارد شوی.' };
}

/** تعیین یا تغییر رمز کاربر توسط ادمین — بدون نیاز به رمز فعلی */
export async function adminSetUserPassword(
  userId: string,
  input: { newPassword: string; confirmPassword: string },
  client: PrismaClient = prisma
): Promise<ChangeUserPasswordResult & { hadPassword?: boolean }> {
  const newPassword = String(input.newPassword ?? '');
  const confirmPassword = String(input.confirmPassword ?? '');

  const pairError = validateNewPasswordPair(newPassword, confirmPassword);
  if (pairError) return pairError;

  const user = await client.users.findUnique({
    where: { id: userId },
    select: { id: true, password: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    return { ok: false, error: 'کاربر یافت نشد', status: 404 };
  }

  const hadPassword = Boolean(user.password);
  const hashed = bcrypt.hashSync(newPassword, 12);
  await client.users.update({
    where: { id: user.id },
    data: { password: hashed, updatedAt: new Date() },
  });

  return {
    ok: true,
    message: hadPassword
      ? 'رمز عبور کاربر تغییر کرد'
      : 'رمز عبور برای کاربر تنظیم شد',
    hadPassword,
  };
}

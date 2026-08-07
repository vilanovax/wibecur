import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { validateAuthPassword } from '@/lib/phone-auth';

export type ChangeUserPasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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

  const passwordError = validateAuthPassword(newPassword);
  if (passwordError) {
    return { ok: false, error: passwordError, status: 400 };
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, error: 'رمز جدید و تکرار آن یکسان نیستند', status: 400 };
  }

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
      error: 'برای این حساب رمز تنظیم نشده است. با پشتیبانی تماس بگیرید.',
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

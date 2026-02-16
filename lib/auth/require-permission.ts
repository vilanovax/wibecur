/**
 * برای API routes: خواندن کاربر فعلی و بررسی permission؛ در صورت عدم دسترسی 403
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { isAdminRole } from './roles';
import { hasPermission } from './has-permission';
import type { Permission } from './permissions';

export interface AdminUser {
  id: string;
  role: string;
}

/**
 * اگر کاربر لاگین نکرده یا ادمین نباشد → null
 * در API می‌توان بعدش 401 برگرداند.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await auth();
  if (!session?.user?.id || !isAdminRole(session.user.role)) return null;
  return {
    id: session.user.id,
    role: session.user.role,
  };
}

/**
 * کاربر باید ادمین باشد؛ وگرنه NextResponse 401 برمی‌گرداند.
 * در API: const user = await requireAdminUser(); if (user instanceof NextResponse) return user;
 */
export async function requireAdminUser(): Promise<AdminUser | NextResponse> {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }
  return user;
}

/**
 * کاربر باید ادمین باشد و permission را داشته باشد؛ وگرنه NextResponse 403.
 * در API: const user = await requirePermission('manage_lists'); if (user instanceof NextResponse) return user;
 */
export async function requirePermission(permission: Permission): Promise<AdminUser | NextResponse> {
  const maybeUser = await requireAdminUser();
  if (maybeUser instanceof NextResponse) return maybeUser;
  if (!hasPermission(maybeUser.role, permission)) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN', permission },
      { status: 403 }
    );
  }
  return maybeUser;
}

/**
 * برای API routes: خواندن کاربر فعلی و بررسی permission؛ در صورت عدم دسترسی 403
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { isAdminRole } from './roles';
import { hasPermission, normalizeAdminPermissions } from './has-permission';
import type { Permission } from './permissions';
import { prisma } from '@/lib/prisma';

export interface AdminUser {
  id: string;
  role: string;
  adminPermissions: Permission[];
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await auth();
  if (!session?.user?.id || !isAdminRole(session.user.role)) return null;

  const row = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      isActive: true,
      deletedAt: true,
      adminPermissions: true,
    },
  });

  if (!row || !row.isActive || row.deletedAt || !isAdminRole(row.role)) {
    return null;
  }

  return {
    id: row.id,
    role: row.role,
    adminPermissions: normalizeAdminPermissions(row.adminPermissions),
  };
}

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

export async function requirePermission(permission: Permission): Promise<AdminUser | NextResponse> {
  const maybeUser = await requireAdminUser();
  if (maybeUser instanceof NextResponse) return maybeUser;
  if (!hasPermission(maybeUser.role, permission, maybeUser.adminPermissions)) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN', permission },
      { status: 403 }
    );
  }
  return maybeUser;
}

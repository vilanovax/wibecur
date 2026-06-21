'use client';

import { useSession } from 'next-auth/react';
import { hasPermission, getEffectivePermissions } from '@/lib/auth/has-permission';
import { isAdminRole } from '@/lib/auth/roles';
import type { Permission } from '@/lib/auth/permissions';

export function usePermissions() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const isAdmin = isAdminRole(role);
  const adminPermissions = session?.user?.adminPermissions ?? [];
  const isActive = session?.user?.isActive !== false;

  const can = (permission: Permission): boolean => {
    if (!isActive) return false;
    return hasPermission(role, permission, adminPermissions);
  };

  const permissions: Permission[] =
    isAdmin && role ? getEffectivePermissions(role, adminPermissions) : [];

  return {
    role: role ?? null,
    isAdmin: isAdmin && isActive,
    isActive,
    can,
    permissions,
    adminPermissions,
    isLoading: status === 'loading',
  };
}

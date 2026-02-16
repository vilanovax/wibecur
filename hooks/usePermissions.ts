'use client';

import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/auth/has-permission';
import { getPermissionsForRole } from '@/lib/auth/permission-map';
import { isAdminRole } from '@/lib/auth/roles';
import type { Permission } from '@/lib/auth/permissions';
import type { AdminRole } from '@/lib/auth/roles';

export function usePermissions() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const isAdmin = isAdminRole(role);

  const can = (permission: Permission): boolean => {
    return hasPermission(role, permission);
  };

  const permissions: Permission[] = isAdmin && role
    ? Array.from(getPermissionsForRole(role as AdminRole))
    : [];

  return {
    role: role ?? null,
    isAdmin,
    can,
    permissions,
    isLoading: status === 'loading',
  };
}

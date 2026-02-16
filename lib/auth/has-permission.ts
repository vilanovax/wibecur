/**
 * (role, permission) → boolean
 * فقط رول‌های ادمین؛ بقیه false.
 */

import { isAdminRole } from './roles';
import type { Permission } from './permissions';
import { ROLE_PERMISSIONS } from './permission-map';
import type { AdminRole } from './roles';

export function hasPermission(
  role: string | undefined,
  permission: Permission
): boolean {
  if (!role || !isAdminRole(role)) return false;
  const list = ROLE_PERMISSIONS[role as AdminRole];
  return list?.includes(permission) ?? false;
}

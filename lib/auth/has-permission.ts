/**
 * (role, permission) → boolean
 * اگر adminPermissions تعریف شده باشد، جایگزین نقش می‌شود.
 */

import { isAdminRole } from './roles';
import type { Permission } from './permissions';
import { isPermission } from './permissions';
import { resolveEffectivePermissions } from './permission-map';
import type { AdminRole } from './roles';

export function normalizeAdminPermissions(raw: string[] | null | undefined): Permission[] {
  if (!raw?.length) return [];
  return raw.filter(isPermission);
}

export function hasPermission(
  role: string | undefined,
  permission: Permission,
  customPermissions?: Permission[] | null
): boolean {
  if (!role || !isAdminRole(role)) return false;
  const effective = resolveEffectivePermissions(role as AdminRole, customPermissions);
  return effective.includes(permission);
}

export function getEffectivePermissions(
  role: string | undefined,
  customPermissions?: Permission[] | null
): Permission[] {
  if (!role || !isAdminRole(role)) return [];
  return resolveEffectivePermissions(role as AdminRole, customPermissions);
}

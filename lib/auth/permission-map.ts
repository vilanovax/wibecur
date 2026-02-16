/**
 * نقش → مجموعهٔ دسترسی‌ها
 * فقط رول‌های ادمین اینجا تعریف می‌شوند.
 */

import type { AdminRole } from './roles';
import type { Permission } from './permissions';

const SUPER_ADMIN: Permission[] = [
  'view_dashboard',
  'view_pulse',
  'view_analytics',
  'view_trending_debug',
  'manage_lists',
  'delete_list',
  'soft_delete_list',
  'manage_categories',
  'set_category_weight',
  'manage_users',
  'suspend_user',
  'shadow_ban_user',
  'moderate_comments',
  'view_reports',
  'resolve_reports',
  'manage_roles',
  'view_audit',
  'view_moderation',
  'assign_moderation',
];

const ADMIN: Permission[] = [
  'view_dashboard',
  'view_pulse',
  'view_analytics',
  'view_trending_debug',
  'manage_lists',
  'delete_list',
  'soft_delete_list',
  'manage_categories',
  'set_category_weight',
  'manage_users',
  'suspend_user',
  'shadow_ban_user',
  'moderate_comments',
  'view_reports',
  'resolve_reports',
  'view_audit',
  'view_moderation',
  'assign_moderation',
];

const MODERATOR: Permission[] = [
  'view_dashboard',
  'view_pulse',
  'moderate_comments',
  'view_reports',
  'resolve_reports',
  'view_audit',
  'view_moderation',
  'assign_moderation',
  'soft_delete_list',
];

const ANALYST: Permission[] = [
  'view_dashboard',
  'view_pulse',
  'view_analytics',
  'view_trending_debug',
  'view_reports',
  'view_audit',
  'view_moderation',
];

/**
 * ماتریس نقش → دسترسی‌ها (ثابت در کد، منبع حقیقت)
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN,
  ADMIN,
  MODERATOR,
  ANALYST,
};

const CACHE = new Map<string, Set<Permission>>();

function getSet(role: AdminRole): Set<Permission> {
  let set = CACHE.get(role);
  if (!set) {
    set = new Set(ROLE_PERMISSIONS[role] ?? []);
    CACHE.set(role, set);
  }
  return set;
}

export function getPermissionsForRole(role: AdminRole): Set<Permission> {
  return getSet(role);
}

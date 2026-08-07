/**
 * permission-map.ts — به‌روزرسانی نقش‌ها
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
  'manage_suggestions',
  'edit_item_metadata',
  'edit_list_media',
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
  'manage_backup',
  'manage_settings',
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
  'manage_suggestions',
  'edit_item_metadata',
  'edit_list_media',
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
  'manage_backup',
  'manage_settings',
];

const MODERATOR: Permission[] = [
  'view_dashboard',
  'view_pulse',
  'moderate_comments',
  'view_reports',
  'resolve_reports',
  'manage_users',
  'suspend_user',
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

const EDITOR: Permission[] = [
  'view_dashboard',
  'view_pulse',
  'manage_lists',
  'manage_categories',
  'manage_suggestions',
  'edit_item_metadata',
  'edit_list_media',
  'soft_delete_list',
];

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN,
  ADMIN,
  MODERATOR,
  ANALYST,
  EDITOR,
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

export function resolveEffectivePermissions(
  role: AdminRole,
  customPermissions?: Permission[] | null
): Permission[] {
  if (customPermissions && customPermissions.length > 0) {
    return [...new Set(customPermissions)];
  }
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

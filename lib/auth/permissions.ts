/**
 * Permissions — ثابت در کد (Type-safe).
 * منبع حقیقت برای دسترسی‌ها؛ بدون جدول داینامیک یا UI مدیریت رول.
 */

export const PERMISSIONS = [
  'view_dashboard',
  'view_pulse',
  'view_analytics',
  'view_trending_debug',
  'manage_lists',
  'delete_list',
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
  'soft_delete_list',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function isPermission(s: string): s is Permission {
  return (PERMISSIONS as readonly string[]).includes(s);
}

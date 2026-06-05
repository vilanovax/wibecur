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
  'manage_backup',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function isPermission(s: string): s is Permission {
  return (PERMISSIONS as readonly string[]).includes(s);
}

/** برچسب فارسی دسترسی‌ها — برای پیام خطا و UI */
export const PERMISSION_LABELS: Record<Permission, string> = {
  view_dashboard: 'مشاهده داشبورد',
  view_pulse: 'مشاهده پالس',
  view_analytics: 'مشاهده آنالیتیکس',
  view_trending_debug: 'دیباگ ترند',
  manage_lists: 'مدیریت لیست‌ها',
  delete_list: 'حذف لیست',
  soft_delete_list: 'حذف نرم لیست',
  manage_categories: 'مدیریت دسته‌بندی‌ها',
  set_category_weight: 'تنظیم وزن دسته',
  manage_users: 'مدیریت کاربران',
  suspend_user: 'تعلیق کاربر',
  shadow_ban_user: 'سایه‌بن کاربر',
  moderate_comments: 'مدیریت کامنت‌ها',
  view_reports: 'مشاهده گزارش‌ها',
  resolve_reports: 'رسیدگی به گزارش‌ها',
  manage_roles: 'مدیریت نقش‌ها',
  view_audit: 'مشاهده لاگ تغییرات',
  view_moderation: 'صف بررسی',
  assign_moderation: 'تخصیص بررسی',
  manage_backup: 'پشتیبان‌گیری و بازیابی',
};

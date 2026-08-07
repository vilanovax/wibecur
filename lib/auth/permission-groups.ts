/**
 * گروه‌بندی دسترسی‌ها برای UI مدیریت ادمین
 */

import type { Permission } from './permissions';

export type PermissionGroup = {
  id: string;
  label: string;
  description: string;
  permissions: Permission[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'content',
    label: 'محتوا',
    description: 'دسته‌بندی، لیست، آیتم، پیشنهادها، متادیتا و کاور',
    permissions: [
      'manage_categories',
      'manage_lists',
      'manage_suggestions',
      'edit_item_metadata',
      'edit_list_media',
      'soft_delete_list',
      'delete_list',
      'set_category_weight',
    ],
  },
  {
    id: 'moderation',
    label: 'کامنت و پشتیبانی',
    description: 'رسیدگی به کامنت‌ها، گزارش‌ها و صف بررسی',
    permissions: [
      'moderate_comments',
      'view_reports',
      'resolve_reports',
      'view_moderation',
      'assign_moderation',
    ],
  },
  {
    id: 'users',
    label: 'کاربران',
    description: 'مدیریت و تعلیق کاربران',
    permissions: ['manage_users', 'suspend_user', 'shadow_ban_user'],
  },
  {
    id: 'insights',
    label: 'تحلیل و گزارش',
    description: 'داشبورد، پالس و آنالیتیکس',
    permissions: ['view_dashboard', 'view_pulse', 'view_analytics', 'view_trending_debug'],
  },
  {
    id: 'system',
    label: 'سیستم',
    description: 'تنظیمات، پشتیبان، لاگ و مدیریت ادمین‌ها',
    permissions: ['manage_settings', 'manage_backup', 'view_audit', 'manage_roles'],
  },
];

export function permissionsFromGroups(selected: Permission[]): Permission[] {
  return [...new Set(selected.filter(Boolean))];
}

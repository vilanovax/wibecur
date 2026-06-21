/**
 * قالب‌های نقش ادمین — برای انتخاب سریع در UI
 */

import type { AdminRole } from './roles';
import type { Permission } from './permissions';
import { ROLE_PERMISSIONS } from './permission-map';

export type AdminRoleTemplate = {
  role: AdminRole;
  label: string;
  description: string;
  permissions: Permission[];
};

export const ADMIN_ROLE_TEMPLATES: AdminRoleTemplate[] = [
  {
    role: 'SUPER_ADMIN',
    label: 'مدیرکل',
    description: 'دسترسی کامل + تعریف و مدیریت ادمین‌ها',
    permissions: [...ROLE_PERMISSIONS.SUPER_ADMIN],
  },
  {
    role: 'ADMIN',
    label: 'مدیر',
    description: 'دسترسی گسترده به محتوا، کاربران، کامنت‌ها و تنظیمات',
    permissions: [...ROLE_PERMISSIONS.ADMIN],
  },
  {
    role: 'EDITOR',
    label: 'مدیر محتوا',
    description: 'دسته، لیست، آیتم، پیشنهادها، متادیتا و کاور',
    permissions: [...ROLE_PERMISSIONS.EDITOR],
  },
  {
    role: 'MODERATOR',
    label: 'پشتیبانی و نظارت',
    description: 'کامنت‌ها، گزارش‌ها، کاربران و صف بررسی',
    permissions: [...ROLE_PERMISSIONS.MODERATOR],
  },
  {
    role: 'ANALYST',
    label: 'تحلیل‌گر',
    description: 'فقط مشاهده داشبورد، پالس و آنالیتیکس',
    permissions: [...ROLE_PERMISSIONS.ANALYST],
  },
];

export function getRoleTemplate(role: AdminRole): AdminRoleTemplate | undefined {
  return ADMIN_ROLE_TEMPLATES.find((t) => t.role === role);
}

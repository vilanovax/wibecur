/**
 * Admin roles — RBAC
 * منبع حقیقت: role در دیتابیس و session
 */

export const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'ANALYST',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

/** برچسب فارسی نقش‌ها — منبع واحد برای کل اپ */
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'مدیرکل',
  ADMIN: 'مدیر',
  MODERATOR: 'ناظر',
  ANALYST: 'تحلیل‌گر',
  EDITOR: 'ویرایشگر',
  USER: 'کاربر',
};

export function getRoleLabel(role: string | undefined | null): string {
  if (!role) return '—';
  return ROLE_LABELS[role] ?? role;
}

/** هر رولی که بتواند به /admin وارد شود */
export function isAdminRole(role: string | undefined): role is AdminRole {
  return role != null && ADMIN_ROLES.includes(role as AdminRole);
}

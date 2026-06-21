/**
 * مسیر صفحه ادمین → permission لازم برای مشاهده
 */

import type { Permission } from './permissions';

const PATH_PERMISSION: Record<string, Permission> = {
  '/admin/dashboard': 'view_dashboard',
  '/admin/pulse': 'view_pulse',
  '/admin/kpi': 'view_analytics',
  '/admin/analytics': 'view_analytics',
  '/admin/categories': 'manage_categories',
  '/admin/lists': 'manage_lists',
  '/admin/lists/user-created': 'manage_lists',
  '/admin/items': 'manage_lists',
  '/admin/catalog': 'manage_lists',
  '/admin/users': 'manage_users',
  '/admin/admins': 'manage_roles',
  '/admin/trash': 'view_dashboard',
  '/admin/comments/all': 'moderate_comments',
  '/admin/comments': 'view_reports',
  '/admin/comments/reports': 'view_reports',
  '/admin/comments/item-reports': 'view_reports',
  '/admin/comments/bad-words': 'moderate_comments',
  '/admin/comments/violations': 'moderate_comments',
  '/admin/suggestions': 'manage_suggestions',
  '/admin/settings': 'manage_settings',
  '/admin/audit': 'view_audit',
  '/admin/moderation': 'view_moderation',
  '/admin/system/backup': 'manage_backup',
};

/**
 * برای مسیر داده‌شده permission لازم را برمی‌گرداند.
 * دقیق‌ترین match (طولانی‌ترین path) استفاده می‌شود.
 */
export function getPageRequiredPermission(pathname: string): Permission | null {
  if (pathname === '/admin/access-denied') return null;

  let best: Permission | null = null;
  let bestLen = 0;
  for (const [path, perm] of Object.entries(PATH_PERMISSION)) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      if (path.length >= bestLen) {
        bestLen = path.length;
        best = perm;
      }
    }
  }
  return best;
}

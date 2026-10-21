import type { Permission } from '@/lib/auth/permissions';

export type AdminMenuGroupId = 'main' | 'intelligence' | 'moderation' | 'system';

export type AdminMenuChild = {
  href: string;
  label: string;
  permission: Permission;
};

export type AdminMenuEntry = {
  href: string;
  label: string;
  permission: Permission;
  group: AdminMenuGroupId;
  matchPrefixes?: string[];
  badgeKey?: 'commentsAction' | 'suggestionsPending' | 'trashTotal';
  badgeTone?: 'alert' | 'muted';
  children?: AdminMenuChild[];
};

export const ADMIN_MENU_GROUP_LABELS: Record<AdminMenuGroupId, string> = {
  main: 'اصلی',
  intelligence: 'هوش و داده',
  moderation: 'نظارت',
  system: 'سیستم',
};

/** منبع واحد آیتم‌های منوی ساید ادمین */
export const ADMIN_MENU: AdminMenuEntry[] = [
  { group: 'main', href: '/admin/dashboard', label: 'داشبورد', permission: 'view_dashboard' },
  { group: 'main', href: '/admin/pulse', label: 'پالس وایب', permission: 'view_pulse' },
  { group: 'main', href: '/admin/kpi', label: 'داشبورد رشد (KPI)', permission: 'view_analytics' },
  { group: 'main', href: '/admin/categories', label: 'دسته‌بندی‌ها', permission: 'manage_categories' },
  {
    group: 'main',
    href: '/admin/lists',
    label: 'لیست‌ها',
    permission: 'manage_lists',
    matchPrefixes: ['/admin/lists', '/admin/catalog', '/admin/items', '/admin/books', '/admin/media'],
  },
  {
    group: 'main',
    href: '/admin/users',
    label: 'کاربران',
    permission: 'manage_users',
    matchPrefixes: ['/admin/users', '/admin/admins'],
    children: [
      { href: '/admin/users', label: 'کاربران', permission: 'manage_users' },
      { href: '/admin/admins', label: 'ادمین‌ها', permission: 'manage_roles' },
    ],
  },
  { group: 'intelligence', href: '/admin/analytics', label: 'آنالیتیکس', permission: 'view_analytics' },
  {
    group: 'intelligence',
    href: '/admin/suggestions',
    label: 'پیشنهادها',
    permission: 'manage_suggestions',
    badgeKey: 'suggestionsPending',
  },
  { group: 'intelligence', href: '/admin/custom/featured', label: 'منتخب هوم', permission: 'manage_lists' },
  {
    group: 'intelligence',
    href: '/admin/custom/sponsored',
    label: 'تبلیغات اسپانسری',
    permission: 'manage_lists',
  },
  { group: 'moderation', href: '/admin/moderation', label: 'صف بررسی', permission: 'view_moderation' },
  {
    group: 'moderation',
    href: '/admin/trash',
    label: 'زباله‌دان',
    permission: 'view_dashboard',
    badgeKey: 'trashTotal',
    badgeTone: 'muted',
  },
  {
    group: 'moderation',
    href: '/admin/comments',
    label: 'کامنت‌ها',
    permission: 'view_reports',
    badgeKey: 'commentsAction',
  },
  { group: 'system', href: '/admin/audit', label: 'لاگ تغییرات', permission: 'view_audit' },
  { group: 'system', href: '/admin/system/backup', label: 'پشتیبان‌گیری', permission: 'manage_backup' },
  { group: 'system', href: '/admin/settings', label: 'تنظیمات', permission: 'manage_settings' },
];

export type VisibleAdminMenuGroup = {
  id: AdminMenuGroupId;
  label: string;
  links: { href: string; label: string }[];
};

const GROUP_ORDER: AdminMenuGroupId[] = ['main', 'intelligence', 'moderation', 'system'];

/** آیتم‌هایی از ساید که با این دسترسی‌ها دیده می‌شوند */
export function visibleAdminMenu(permissions: readonly string[]): VisibleAdminMenuGroup[] {
  const allowed = new Set(permissions);
  const can = (permission: Permission) => allowed.has(permission);

  return GROUP_ORDER.map((id) => {
    const links: { href: string; label: string }[] = [];
    for (const entry of ADMIN_MENU) {
      if (entry.group !== id) continue;
      if (entry.children?.length) {
        for (const child of entry.children) {
          if (can(child.permission)) links.push({ href: child.href, label: child.label });
        }
      } else if (can(entry.permission)) {
        links.push({ href: entry.href, label: entry.label });
      }
    }
    return { id, label: ADMIN_MENU_GROUP_LABELS[id], links };
  }).filter((group) => group.links.length > 0);
}

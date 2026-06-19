export type MaintenancePageConfig = {
  enabled: boolean;
  title: string;
  subtitle: string | null;
  message: string | null;
  showLogo: boolean;
  accentColor: string;
  allowAdminBrowse: boolean;
  logoUrl: string | null;
};

export type MaintenanceModeSettings = {
  enabled: boolean;
  title: string;
  subtitle: string;
  message: string;
  showLogo: boolean;
  accentColor: string;
  allowAdminBrowse: boolean;
};

export const DEFAULT_MAINTENANCE_TITLE = 'در حال به‌روزرسانی';
export const DEFAULT_MAINTENANCE_MESSAGE =
  'در حال اعمال تغییرات هستیم. لطفاً چند لحظه دیگر سر بزنید.';
export const DEFAULT_MAINTENANCE_ACCENT = '#6366F1';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'ANALYST', 'EDITOR'];

export function isAdminRole(role: string | undefined | null): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

export function isMaintenanceBypassPath(pathname: string): boolean {
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/maintenance' ||
    pathname === '/api/site/maintenance-status'
  ) {
    return true;
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/manifest.json' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return true;
  }

  return /\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|css|js)$/i.test(pathname);
}

export function normalizeAccentColor(value: string | null | undefined): string {
  const raw = value?.trim();
  if (!raw) return DEFAULT_MAINTENANCE_ACCENT;
  return /^#[0-9A-Fa-f]{6}$/.test(raw) ? raw : DEFAULT_MAINTENANCE_ACCENT;
}

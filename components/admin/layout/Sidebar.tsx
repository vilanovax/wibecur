'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  List,
  Users,
  Tag,
  BarChart3,
  Settings,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  Activity,
  TrendingUp,
  ClipboardList,
  Database,
  Star,
  Trash2,
  Shield,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  X,
} from 'lucide-react';
import SidebarNavSection, { type NavItem } from './SidebarNavSection';
import MiniUserPanel from './MiniUserPanel';
import { useSidebar } from './SidebarContext';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import clsx from 'clsx';
import SiteLogo from '@/components/shared/SiteLogo';
import { useSiteBranding } from '@/contexts/SiteBrandingContext';

const PRIMARY: NavItem[] = [
  { href: '/admin/dashboard', label: 'داشبورد', icon: LayoutDashboard, permission: 'view_dashboard' },
  { href: '/admin/pulse', label: 'پالس وایب', icon: Activity, permission: 'view_pulse' },
  { href: '/admin/kpi', label: 'داشبورد رشد (KPI)', icon: TrendingUp, permission: 'view_analytics' },
  { href: '/admin/categories', label: 'دسته‌بندی‌ها', icon: Tag, permission: 'manage_categories' },
  {
    href: '/admin/lists',
    label: 'لیست‌ها',
    icon: List,
    permission: 'manage_lists',
    matchPrefixes: ['/admin/lists', '/admin/catalog', '/admin/items'],
  },
  { href: '/admin/users', label: 'کاربران', icon: Users, permission: 'manage_users' },
  { href: '/admin/admins', label: 'ادمین‌ها', icon: Shield, permission: 'manage_roles' },
];

const INTELLIGENCE: NavItem[] = [
  { href: '/admin/analytics', label: 'آنالیتیکس', icon: BarChart3, permission: 'view_analytics' },
  {
    href: '/admin/suggestions',
    label: 'پیشنهادها',
    icon: Lightbulb,
    permission: 'manage_suggestions',
    badgeKey: 'suggestionsPending',
  },
  { href: '/admin/custom/featured', label: 'منتخب هوم', icon: Star, permission: 'manage_lists' },
];

const MODERATION: NavItem[] = [
  { href: '/admin/moderation', label: 'صف بررسی', icon: AlertTriangle, permission: 'view_moderation' },
  {
    href: '/admin/trash',
    label: 'زباله‌دان',
    icon: Trash2,
    permission: 'view_dashboard',
    badgeKey: 'trashTotal',
    badgeTone: 'muted',
  },
  {
    href: '/admin/comments',
    label: 'کامنت‌ها',
    icon: MessageSquare,
    permission: 'view_reports',
    badgeKey: 'commentsAction',
  },
];

const SYSTEM: NavItem[] = [
  { href: '/admin/audit', label: 'لاگ تغییرات', icon: ClipboardList, permission: 'view_audit' },
  { href: '/admin/system/backup', label: 'پشتیبان‌گیری', icon: Database, permission: 'manage_backup' },
  { href: '/admin/settings', label: 'تنظیمات', icon: Settings, permission: 'manage_settings' },
];

type SidebarContentProps = {
  collapsed: boolean;
  onClose?: () => void;
  showToggle?: boolean;
  isMobileDrawer?: boolean;
};

function SidebarBrand({
  collapsed,
  isMobileDrawer,
  onClose,
}: {
  collapsed: boolean;
  isMobileDrawer?: boolean;
  onClose?: () => void;
}) {
  const showText = !collapsed || isMobileDrawer;
  const { logoDisplayUrl } = useSiteBranding();

  return (
    <Link
      href="/admin/dashboard"
      onClick={isMobileDrawer ? onClose : undefined}
      className={clsx(
        'flex items-center min-w-0 rounded-xl transition-opacity hover:opacity-90',
        showText ? 'gap-2 flex-1' : 'justify-center'
      )}
    >
      {logoDisplayUrl ? (
        <SiteLogo
          variant={showText ? 'admin' : 'adminCompact'}
          linked={false}
          showFallbackText={false}
          fallbackText="WibeCur"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm shadow-violet-600/20">
          <Sparkles className="h-4 w-4" />
        </div>
      )}
      {showText && (
        <div className="min-w-0 text-right leading-tight">
          {!logoDisplayUrl && (
            <h2 className="text-sm font-bold text-[var(--color-text)] dark:text-white truncate">
              WibeCur
            </h2>
          )}
          <p className="text-[10px] text-[var(--color-text-muted)] dark:text-gray-400 truncate">
            پنل مدیریت
          </p>
        </div>
      )}
    </Link>
  );
}

function SidebarToggle({ className }: { className?: string }) {
  const { collapsed, setCollapsed } = useSidebar();
  return (
    <button
      type="button"
      onClick={() => setCollapsed(!collapsed)}
      className={clsx(
        'p-1.5 rounded-lg border border-[var(--color-border)] dark:border-gray-600',
        'hover:bg-[var(--color-bg)] dark:hover:bg-gray-700 text-[var(--color-text-muted)]',
        'transition-colors shrink-0',
        className
      )}
      aria-label={collapsed ? 'باز کردن منو' : 'جمع کردن منو'}
    >
      {collapsed ? (
        <PanelRightOpen className="h-5 w-5" />
      ) : (
        <PanelRightClose className="h-5 w-5" />
      )}
    </button>
  );
}

function SidebarContent({
  collapsed,
  onClose,
  showToggle = true,
  isMobileDrawer = false,
}: SidebarContentProps) {
  const { data: session } = useSession();
  const badges = useSidebarBadges(!!session);
  const user = {
    name: session?.user?.name ?? '',
    email: session?.user?.email ?? null,
    role: session?.user?.role as string | undefined,
    image: session?.user?.image ?? null,
    online: true,
  };

  const expanded = !collapsed || isMobileDrawer;

  return (
    <div className="flex flex-col h-full">
      <div
        className={clsx(
          'flex-shrink-0 border-b border-[var(--color-border)] dark:border-gray-600',
          expanded ? 'flex items-center gap-1.5 px-2 py-2' : 'flex flex-col items-center gap-1.5 px-1.5 py-2'
        )}
      >
        {isMobileDrawer && (
          <div className="flex w-full items-center justify-between gap-2 mb-1">
            <SidebarBrand collapsed={false} isMobileDrawer onClose={onClose} />
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[var(--color-bg)] dark:hover:bg-gray-700 text-[var(--color-text-muted)]"
              aria-label="بستن منو"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {!isMobileDrawer && (
          <>
            {expanded ? (
              <>
                <SidebarBrand collapsed={false} />
                {showToggle && <SidebarToggle />}
              </>
            ) : (
              <>
                <SidebarBrand collapsed />
                {showToggle && <SidebarToggle />}
              </>
            )}
          </>
        )}
      </div>

      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-1.5 space-y-2 min-h-0 scrollbar-thin"
        aria-label="منوی اصلی"
      >
        <Suspense fallback={<div className="px-2 py-6 text-xs text-center text-[var(--color-text-muted)] animate-pulse">…</div>}>
          <SidebarNavSection title="اصلی" items={PRIMARY} collapsed={collapsed && !isMobileDrawer} badges={badges} />
          <SidebarNavSection title="هوش و داده" items={INTELLIGENCE} collapsed={collapsed && !isMobileDrawer} badges={badges} />
          <SidebarNavSection title="نظارت" items={MODERATION} collapsed={collapsed && !isMobileDrawer} badges={badges} />
          <SidebarNavSection title="سیستم" items={SYSTEM} collapsed={collapsed && !isMobileDrawer} badges={badges} />
        </Suspense>
      </nav>

      <MiniUserPanel collapsed={collapsed && !isMobileDrawer} user={user} />
    </div>
  );
}

export default function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      <aside
        className={clsx(
          'hidden lg:flex flex-col flex-shrink-0',
          'border-s border-[var(--color-border)] dark:border-gray-600',
          'bg-[var(--color-surface)] dark:bg-gray-800 min-h-screen',
          'transition-[width] duration-300 ease-in-out shadow-sm',
          collapsed ? 'w-14' : 'w-[13.25rem]'
        )}
        dir="rtl"
      >
        <SidebarContent collapsed={collapsed} showToggle />
      </aside>

      <div
        className={clsx(
          'lg:hidden fixed inset-0 z-40 transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <button
          type="button"
          aria-label="بستن"
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={clsx(
            'absolute top-0 inset-s-0 h-full w-[13.25rem] max-w-[85vw] flex flex-col',
            'bg-[var(--color-surface)] dark:bg-gray-800 border-s border-[var(--color-border)]',
            'shadow-2xl transition-transform duration-300 ease-out',
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          )}
          dir="rtl"
        >
          <SidebarContent
            collapsed={false}
            onClose={() => setMobileOpen(false)}
            showToggle={false}
            isMobileDrawer
          />
        </aside>
      </div>
    </>
  );
}

export { SidebarToggle };

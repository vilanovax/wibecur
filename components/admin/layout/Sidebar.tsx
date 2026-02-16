'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  List,
  Package,
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
  Star,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  X,
} from 'lucide-react';
import SidebarNavSection, { type NavItem } from './SidebarNavSection';
import MiniUserPanel from './MiniUserPanel';
import { useSidebar } from './SidebarContext';
import clsx from 'clsx';

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
    submenu: [
      { href: '/admin/lists', label: 'همه لیست‌ها', icon: List },
      { href: '/admin/lists/user-created', label: 'لیست‌های کاربران', icon: Users },
    ],
  },
  { href: '/admin/users', label: 'کاربران', icon: Users, permission: 'manage_users' },
];

const INTELLIGENCE: NavItem[] = [
  { href: '/admin/analytics', label: 'آنالیتیکس', icon: BarChart3, permission: 'view_analytics' },
  {
    href: '/admin/suggestions',
    label: 'پیشنهادها',
    icon: Lightbulb,
    permission: 'manage_lists',
    submenu: [
      { href: '/admin/suggestions?tab=lists', label: 'پیشنهادات لیست', icon: List },
      { href: '/admin/suggestions?tab=items', label: 'پیشنهادات آیتم', icon: Package },
    ],
  },
  {
    href: '/admin/custom',
    label: 'منتخب‌ها',
    icon: Star,
    permission: 'manage_lists',
    submenu: [{ href: '/admin/custom/featured', label: 'مدیریت Featured', icon: Star }],
  },
];

const MODERATION: NavItem[] = [
  { href: '/admin/moderation', label: 'صف بررسی', icon: AlertTriangle, permission: 'view_moderation' },
  {
    href: '/admin/comments',
    label: 'کامنت‌ها',
    icon: MessageSquare,
    permission: 'view_reports',
    submenu: [
      { href: '/admin/comments', label: 'همه کامنت‌ها', icon: MessageSquare },
      { href: '/admin/comments/reports', label: 'ریپورت کامنت‌ها', icon: AlertTriangle },
      { href: '/admin/comments/item-reports', label: 'ریپورت آیتم‌ها', icon: Package },
    ],
  },
];

const SYSTEM: NavItem[] = [
  { href: '/admin/audit', label: 'لاگ تغییرات', icon: ClipboardList, permission: 'view_audit' },
  { href: '/admin/settings', label: 'تنظیمات', icon: Settings, permission: 'manage_roles' },
];

type SidebarContentProps = {
  collapsed: boolean;
  onClose?: () => void;
  showToggle?: boolean;
  isMobileDrawer?: boolean;
};

function SidebarContent({ collapsed, onClose, showToggle = true, isMobileDrawer = false }: SidebarContentProps) {
  const { data: session } = useSession();
  const user = {
    name: session?.user?.name ?? undefined,
    email: session?.user?.email ?? undefined,
    role: session?.user?.role as string | undefined,
    image: session?.user?.image ?? undefined,
    online: true,
  };

  return (
    <div className="flex flex-col h-full">
      <div
        className={clsx(
          'flex items-center border-b border-admin-border dark:border-gray-600 flex-shrink-0',
          collapsed && !isMobileDrawer ? 'grid grid-cols-[1fr_auto_1fr] gap-2 px-2 py-4' : 'justify-between p-4'
        )}
      >
        <div className={clsx('flex items-center gap-1', collapsed && !isMobileDrawer && 'justify-start')}>
          {isMobileDrawer && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-admin-muted dark:hover:bg-gray-700 text-admin-text-secondary dark:text-gray-400"
              aria-label="بستن منو"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {showToggle && !isMobileDrawer && <SidebarToggle />}
        </div>
        <Link
          href="/admin/dashboard"
          onClick={isMobileDrawer ? onClose : undefined}
          className={clsx(
            'flex items-center min-w-0',
            collapsed && !isMobileDrawer && 'justify-center'
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          {(!collapsed || isMobileDrawer) && (
            <div className="mr-3 min-w-0">
              <h2 className="text-base font-bold text-admin-text-primary dark:text-white truncate">WibeCur</h2>
              <p className="text-[11px] text-admin-text-tertiary dark:text-gray-400">پنل مدیریت</p>
            </div>
          )}
        </Link>
        <div className={collapsed && !isMobileDrawer ? 'block' : 'hidden'} aria-hidden />
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
        <SidebarNavSection title="اصلی" items={PRIMARY} collapsed={collapsed} />
        <div className="border-t border-admin-border dark:border-gray-600" />
        <SidebarNavSection title="هوش و داده" items={INTELLIGENCE} collapsed={collapsed} />
        <div className="border-t border-admin-border dark:border-gray-600" />
        <SidebarNavSection title="نظارت" items={MODERATION} collapsed={collapsed} />
        <div className="border-t border-admin-border dark:border-gray-600" />
        <SidebarNavSection title="سیستم" items={SYSTEM} collapsed={collapsed} />
      </nav>

      <MiniUserPanel collapsed={collapsed && !isMobileDrawer} user={user} />

      {(!collapsed || isMobileDrawer) && (
        <div className="p-3 border-t border-admin-border dark:border-gray-600 flex-shrink-0">
          <p className="text-[10px] text-admin-text-tertiary dark:text-gray-500 text-center">Admin 2.0</p>
        </div>
      )}
    </div>
  );
}

function SidebarToggle() {
  const { collapsed, setCollapsed } = useSidebar();
  return (
    <button
      type="button"
      onClick={() => setCollapsed(!collapsed)}
      className="p-1.5 rounded-xl hover:bg-admin-muted dark:hover:bg-gray-700 text-admin-text-secondary dark:text-gray-400 transition-colors"
      aria-label={collapsed ? 'باز کردن منو' : 'جمع کردن منو'}
    >
      {collapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
  );
}

export default function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col flex-shrink-0 border-l border-admin-border dark:border-gray-600',
          'bg-admin-card dark:bg-gray-800 min-h-screen transition-[width] duration-300 ease-in-out',
          'rounded-l-xl shadow-admin',
          collapsed ? 'w-20' : 'w-72'
        )}
        dir="rtl"
      >
        <SidebarContent collapsed={collapsed} showToggle />
      </aside>

      {/* Mobile overlay + drawer */}
      <div
        className={clsx(
          'lg:hidden fixed inset-0 z-40 transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <button
          type="button"
          aria-label="بستن"
          className="absolute inset-0 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={clsx(
            'absolute top-0 right-0 h-full w-72 max-w-[85vw] flex flex-col',
            'bg-admin-card dark:bg-gray-800 border-l border-admin-border dark:border-gray-600',
            'rounded-l-xl shadow-xl transition-transform duration-300 ease-out',
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

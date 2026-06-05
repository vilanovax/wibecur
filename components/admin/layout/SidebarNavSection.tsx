'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/lib/auth/permissions';
import clsx from 'clsx';
import Tooltip from './Tooltip';
import type { SidebarBadges } from '@/hooks/useSidebarBadges';

export type NavSubItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
};

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: Permission;
  submenu?: NavSubItem[];
  /** مسیرهای اضافی برای فعال/باز بودن گروه (مثلاً catalog + items) */
  matchPrefixes?: string[];
  /** کلید برای نمایش badge از useSidebarBadges */
  badgeKey?: keyof SidebarBadges;
};

function isNavGroupActive(
  pathname: string | null,
  search: string,
  item: NavItem
): boolean {
  if (item.matchPrefixes?.length) {
    return item.matchPrefixes.some(
      (p) => pathname === p || (pathname?.startsWith(`${p}/`) ?? false)
    );
  }
  if (matchHref(pathname, search, item.href)) return true;
  return item.submenu?.some((sub) => matchHref(pathname, search, sub.href)) ?? false;
}

export interface SidebarSectionProps {
  title?: string;
  items: NavItem[];
  collapsed?: boolean;
  badges?: SidebarBadges;
}

function matchHref(pathname: string | null, search: string, href: string): boolean {
  if (!pathname) return false;
  if (href.includes('?')) {
    const [path, query] = href.split('?');
    if (pathname !== path && !pathname.startsWith(path + '/')) return false;
    const params = new URLSearchParams(query);
    const current = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    for (const [k, v] of params.entries()) {
      if (current.get(k) !== v) return false;
    }
    return true;
  }
  if (href === '/admin/comments') {
    return pathname === '/admin/comments' || pathname.startsWith('/admin/comments/');
  }
  return pathname === href || pathname.startsWith(href + '/');
}

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="min-w-[1.1rem] h-[1.1rem] px-0.5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-bold tabular-nums shrink-0">
      {count > 99 ? '۹۹+' : count.toLocaleString('fa-IR')}
    </span>
  );
}

const linkBase =
  'group flex items-center rounded-xl transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40';

function activeStyles(active: boolean) {
  return active
    ? 'bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-300 shadow-sm border-s-2 border-violet-600 dark:border-violet-500'
    : 'text-[var(--color-text)] dark:text-gray-300 hover:bg-[var(--color-bg)] dark:hover:bg-gray-700/50 border-s-2 border-transparent';
}

export function NavItemLink({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  collapsed?: boolean;
  badge?: number;
}) {
  const link = (
    <Link
      href={href}
      className={clsx(
        linkBase,
        activeStyles(isActive),
        collapsed ? 'justify-center px-1.5 py-2 w-full' : 'gap-2 px-2 py-1.5'
      )}
    >
      <span
        className={clsx(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
          isActive
            ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400'
            : 'bg-[var(--color-bg)] dark:bg-gray-700/50 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]'
        )}
      >
        <Icon className={clsx('h-4 w-4', isActive && 'stroke-[2.25]')} />
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 font-medium text-[13px] leading-tight truncate text-right">{label}</span>
          <NavBadge count={badge ?? 0} />
        </>
      )}
    </Link>
  );

  if (collapsed) {
    const tip =
      badge && badge > 0 ? (
        <span>
          {label}
          <span className="block text-rose-400 text-xs mt-0.5 tabular-nums">
            {badge.toLocaleString('fa-IR')} مورد
          </span>
        </span>
      ) : (
        label
      );
    return (
      <Tooltip content={tip} side="left">
        {link}
      </Tooltip>
    );
  }
  return link;
}

export default function SidebarNavSection({
  title,
  items,
  collapsed,
  badges,
}: SidebarSectionProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const { can } = usePermissions();

  const visible = items.filter((item) => {
    if (item.submenu?.length) {
      return item.submenu.some((sub) => can(sub.permission ?? item.permission));
    }
    return can(item.permission);
  });

  const [expandedHref, setExpandedHref] = React.useState<string | null>(null);

  React.useEffect(() => {
    const current = visible.find((i) => isNavGroupActive(pathname, search, i));
    if (current?.submenu) setExpandedHref(current.href);
  }, [pathname, search, visible]);

  if (visible.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {title && !collapsed && (
        <p className="px-2 pt-0.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] dark:text-gray-500">
          {title}
        </p>
      )}
      {title && collapsed && (
        <div className="flex justify-center py-0.5" aria-hidden>
          <span className="w-5 h-px bg-[var(--color-border)] dark:bg-gray-600" />
        </div>
      )}
      {visible.map((item) => {
        const Icon = item.icon;
        const allowedSubmenu =
          item.submenu?.filter((sub) => can(sub.permission ?? item.permission)) ?? [];
        const parentHref = allowedSubmenu[0]?.href ?? item.href;
        const isParentActive = isNavGroupActive(pathname, search, item);
        const hasSub = allowedSubmenu.length > 0;
        const isExpanded = expandedHref === item.href;
        const badge = item.badgeKey && badges ? badges[item.badgeKey] : 0;

        if (hasSub) {
          return (
            <div key={item.href}>
              <div
                className={clsx(
                  'flex items-center rounded-xl',
                  collapsed ? 'justify-center' : 'gap-0.5 pr-0.5'
                )}
              >
                {collapsed ? (
                  <Tooltip content={item.label} side="left">
                    <Link
                      href={parentHref}
                      className={clsx(
                        linkBase,
                        activeStyles(isParentActive),
                        'justify-center px-1.5 py-2 w-full'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                    </Link>
                  </Tooltip>
                ) : (
                  <>
                    <Link
                      href={parentHref}
                      className={clsx(
                        linkBase,
                        activeStyles(isParentActive),
                        'flex-1 gap-2 px-2 py-1.5'
                      )}
                    >
                      <span
                        className={clsx(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                          isParentActive
                            ? 'bg-violet-100 text-violet-600'
                            : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 font-medium text-[13px] leading-tight truncate text-right">
                        {item.label}
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedHref(isExpanded ? null : item.href)
                      }
                      className="p-1.5 rounded-md hover:bg-[var(--color-bg)] dark:hover:bg-gray-600 text-[var(--color-text-muted)] shrink-0"
                      aria-label={isExpanded ? 'بستن زیرمنو' : 'باز کردن زیرمنو'}
                    >
                      <ChevronDown
                        className={clsx(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </button>
                  </>
                )}
              </div>
              {!collapsed && isExpanded && (
                <div className="me-2 mt-0.5 space-y-0.5 border-s border-[var(--color-border)] dark:border-gray-600 ps-1.5 pe-0.5">
                  {allowedSubmenu.map((sub) => {
                    const SubIcon = sub.icon;
                    const subActive = matchHref(pathname, search, sub.href);
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={clsx(
                          'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40',
                          subActive
                            ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] dark:hover:bg-gray-700/50'
                        )}
                      >
                        <SubIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <NavItemLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={Icon}
            isActive={isParentActive}
            collapsed={collapsed}
            badge={badge}
          />
        );
      })}
    </div>
  );
}

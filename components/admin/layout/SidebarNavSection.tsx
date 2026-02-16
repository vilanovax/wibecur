'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/lib/auth/permissions';
import clsx from 'clsx';
import Tooltip from './Tooltip';

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: Permission;
  submenu?: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
};

export interface SidebarSectionProps {
  title?: string;
  items: NavItem[];
  collapsed?: boolean;
}

export function NavItemLink({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  collapsed?: boolean;
}) {
  const link = (
    <Link
      href={href}
      className={clsx(
        'group flex items-center rounded-xl transition-all duration-150',
        collapsed ? 'justify-center px-0 py-2.5 w-full' : 'gap-3 px-3 py-2.5',
        'hover:bg-admin-hover dark:hover:bg-gray-700/50',
        isActive
          ? 'relative bg-admin-muted dark:bg-gray-700/70 text-violet-700 dark:text-violet-300 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-r before:bg-violet-600 dark:before:bg-violet-500'
          : 'text-gray-700 dark:text-gray-300'
      )}
    >
      <div
        className={clsx(
          'flex shrink-0 items-center justify-center rounded-lg transition-colors',
          isActive ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      {!collapsed && <span className="font-medium text-sm truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip content={label} side="left">
        {link}
      </Tooltip>
    );
  }
  return link;
}

export default function SidebarNavSection({ title, items, collapsed }: SidebarSectionProps) {
  const pathname = usePathname();
  const { can } = usePermissions();
  const visible = items.filter((item) => can(item.permission));

  const [expandedHref, setExpandedHref] = React.useState<string | null>(() => {
    const current = visible.find((i) => i.href === pathname || pathname?.startsWith(i.href + '/'));
    return current?.submenu ? current.href : null;
  });

  React.useEffect(() => {
    const current = visible.find((i) => i.href === pathname || pathname?.startsWith(i.href + '/'));
    if (current?.submenu) setExpandedHref(current.href);
  }, [pathname, visible]);

  if (visible.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {title && !collapsed && (
        <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </p>
      )}
      {visible.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        const hasSub = item.submenu && item.submenu.length > 0;
        const isExpanded = expandedHref === item.href;

        if (hasSub) {
          const parentLink = (
            <Link
              href={item.href}
              className={clsx(
                'flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150',
                collapsed && 'justify-center px-0 w-full',
                'hover:bg-admin-hover dark:hover:bg-gray-700/50',
                (pathname === item.href || pathname?.startsWith(item.href + '/'))
                  ? 'relative bg-admin-muted dark:bg-gray-700/70 text-violet-700 dark:text-violet-300 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-r before:bg-violet-600'
                  : 'text-gray-700 dark:text-gray-300'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="font-medium text-sm truncate flex-1">{item.label}</span>}
            </Link>
          );

          return (
            <div key={item.href}>
              <div className={clsx('flex items-center gap-1 rounded-xl', collapsed ? 'justify-center px-0' : 'px-1')}>
                {collapsed ? (
                  <Tooltip content={item.label} side="left">
                    {parentLink}
                  </Tooltip>
                ) : (
                  parentLink
                )}
                {!collapsed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setExpandedHref(isExpanded ? null : item.href);
                    }}
                    className="p-1 rounded-lg hover:bg-admin-muted dark:hover:bg-gray-600"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </button>
                )}
              </div>
              {!collapsed && isExpanded && item.submenu && (
                <div className="mr-2 mt-0.5 space-y-0.5 border-r-2 border-admin-border dark:border-gray-600 pr-2">
                  {item.submenu.map((sub) => {
                    const SubIcon = sub.icon;
                    const subActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={clsx(
                          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                          subActive
                            ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-r-2 border-violet-600 -mr-0.5'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-admin-hover dark:hover:bg-gray-700/50'
                        )}
                      >
                        <SubIcon className="h-4 w-4 shrink-0" />
                        <span>{sub.label}</span>
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
            isActive={isActive}
            collapsed={collapsed}
          />
        );
      })}
    </div>
  );
}
